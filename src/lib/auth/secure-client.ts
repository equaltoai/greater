/**
 * Secure authentication client that uses Cloudflare Workers for token storage
 */

import type { OAuthToken, OAuthApp } from '@/types/auth';

export class SecureAuthClient {
  private static instance: SecureAuthClient;
  private tokenCache: Map<string, { token: OAuthToken; expires: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): SecureAuthClient {
    if (!SecureAuthClient.instance) {
      SecureAuthClient.instance = new SecureAuthClient();
    }
    return SecureAuthClient.instance;
  }

  /**
   * Store OAuth app credentials securely in Cloudflare Worker
   */
  async storeApp(instance: string, app: OAuthApp): Promise<void> {
    const response = await fetch('/auth/register-app', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ instance, app }),
      credentials: 'include', // Important for cookies
    });

    if (!response.ok) {
      throw new Error('Failed to store app credentials');
    }
  }

  /**
   * Store OAuth token securely in Cloudflare Worker
   */
  async storeToken(instance: string, token: OAuthToken): Promise<void> {
    const response = await fetch('/auth/store-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ instance, token }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to store token');
    }

    // Clear cache for this instance
    this.tokenCache.delete(instance);
  }

  /**
   * Get OAuth token from Cloudflare Worker
   */
  async getToken(instance: string): Promise<OAuthToken | null> {
    // Check cache first
    const cached = this.tokenCache.get(instance);
    if (cached && cached.expires > Date.now()) {
      return cached.token;
    }

    const response = await fetch('/auth/get-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ instance }),
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to get token');
    }

    const data = await response.json();
    const token = data.token as OAuthToken;

    // Cache the token
    this.tokenCache.set(instance, {
      token,
      expires: Date.now() + this.CACHE_TTL,
    });

    return token;
  }

  /**
   * Revoke OAuth token
   */
  async revokeToken(instance: string): Promise<void> {
    const response = await fetch('/auth/revoke-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ instance }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to revoke token');
    }

    // Clear cache
    this.tokenCache.delete(instance);
  }

  /**
   * Clear all cached tokens
   */
  clearCache(): void {
    this.tokenCache.clear();
  }

  /**
   * Check if user has valid session
   */
  async hasValidSession(): Promise<boolean> {
    try {
      const response = await fetch('/auth/check-session', {
        method: 'GET',
        credentials: 'include',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const secureAuthClient = SecureAuthClient.getInstance();