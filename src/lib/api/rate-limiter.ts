/**
 * Rate limiting implementation for API calls
 * Prevents abuse and protects against instance blocking
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  backoffMultiplier?: number;
  maxBackoffMs?: number;
}

export interface RateLimitState {
  requests: number;
  windowStart: number;
  backoffUntil?: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 300, // Mastodon default is 300 requests per 5 minutes
  windowMs: 5 * 60 * 1000, // 5 minutes
  backoffMultiplier: 2,
  maxBackoffMs: 60 * 1000 // 1 minute max backoff
};

export class RateLimiter {
  private limits = new Map<string, RateLimitState>();
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Check if a request can be made
   */
  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const state = this.limits.get(key) || { requests: 0, windowStart: now };

    // Check if in backoff period
    if (state.backoffUntil && now < state.backoffUntil) {
      return false;
    }

    // Reset window if expired
    if (now - state.windowStart >= this.config.windowMs) {
      state.requests = 0;
      state.windowStart = now;
      delete state.backoffUntil;
    }

    // Check rate limit
    return state.requests < this.config.maxRequests;
  }

  /**
   * Record a request
   */
  recordRequest(key: string): void {
    const now = Date.now();
    let state = this.limits.get(key);

    if (!state) {
      state = { requests: 0, windowStart: now };
      this.limits.set(key, state);
    }

    // Reset window if expired
    if (now - state.windowStart >= this.config.windowMs) {
      state.requests = 0;
      state.windowStart = now;
      delete state.backoffUntil;
    }

    state.requests++;
  }

  /**
   * Record a rate limit error and calculate backoff
   */
  recordRateLimitError(key: string, retryAfterMs?: number): void {
    const now = Date.now();
    const state = this.limits.get(key) || { requests: 0, windowStart: now };

    // Use retry-after header if provided, otherwise exponential backoff
    if (retryAfterMs) {
      state.backoffUntil = now + retryAfterMs;
    } else {
      const currentBackoff = state.backoffUntil ? state.backoffUntil - now : 1000;
      const nextBackoff = Math.min(
        currentBackoff * (this.config.backoffMultiplier || 2),
        this.config.maxBackoffMs || 60000
      );
      state.backoffUntil = now + nextBackoff;
    }

    this.limits.set(key, state);
  }

  /**
   * Get remaining requests in current window
   */
  getRemainingRequests(key: string): number {
    const now = Date.now();
    const state = this.limits.get(key);

    if (!state) {
      return this.config.maxRequests;
    }

    // Reset window if expired
    if (now - state.windowStart >= this.config.windowMs) {
      return this.config.maxRequests;
    }

    return Math.max(0, this.config.maxRequests - state.requests);
  }

  /**
   * Get time until rate limit resets
   */
  getResetTime(key: string): number {
    const state = this.limits.get(key);
    if (!state) return 0;

    const now = Date.now();
    
    // If in backoff, return backoff time
    if (state.backoffUntil && now < state.backoffUntil) {
      return state.backoffUntil - now;
    }

    // Otherwise return window reset time
    const windowEnd = state.windowStart + this.config.windowMs;
    return Math.max(0, windowEnd - now);
  }

  /**
   * Clear rate limit state for a key
   */
  clearLimit(key: string): void {
    this.limits.delete(key);
  }

  /**
   * Clear all rate limit states
   */
  clearAll(): void {
    this.limits.clear();
  }
}

// Global rate limiter instance
export const globalRateLimiter = new RateLimiter();

/**
 * Rate limit decorator for async functions
 */
type RateLimitErrorLike = {
  status?: number;
  headers?: {
    get(name: string): string | null;
  };
};

function isRateLimitError(error: unknown): error is RateLimitErrorLike {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as RateLimitErrorLike).status === 'number'
  );
}

export function rateLimited<TArgs extends unknown[], TResult>(
  keyFn: (...args: TArgs) => string,
  limiter: RateLimiter = globalRateLimiter
) {
  return function <
    This,
    Method extends (...args: TArgs) => Promise<TResult> | TResult
  >(
    target: This,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<Method>
  ): TypedPropertyDescriptor<Method> {
    const originalMethod = descriptor.value;

    if (!originalMethod) {
      return descriptor;
    }

    descriptor.value = (async function (this: This, ...args: TArgs) {
      const key = keyFn.apply(this, args);

      if (!limiter.canMakeRequest(key)) {
        const resetTime = limiter.getResetTime(key);
        throw new Error(
          `Rate limit exceeded. Please wait ${Math.ceil(resetTime / 1000)} seconds.`
        );
      }

      try {
        limiter.recordRequest(key);
        return await originalMethod.apply(this, args);
      } catch (error) {
        if (isRateLimitError(error) && error.status === 429) {
          const retryAfter = error.headers?.get('Retry-After');
          const retryAfterMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined;
          limiter.recordRateLimitError(key, retryAfterMs);
        }
        throw error;
      }
    }) as Method;

    return descriptor;
  };
}
