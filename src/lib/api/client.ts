/**
 * Mastodon API client implementation
 * Type-safe wrapper for all Mastodon API endpoints
 */

import type {
  Status,
  Account,
  Notification,
  SearchResults,
  Instance,
  Relationship,
  Context,
  List,
  Preferences,
  TimelineParams,
  PaginationParams,
  CreateStatusParams,
  AccountStatusesParams,
  UpdateCredentialsParams,
  Announcement,
  FeaturedTag,
  Filter,
  MediaAttachment,
  Markers
} from '@/types/mastodon';
import type { SearchParams } from './schemas';
import { secureAuthClient } from '@/lib/auth/secure-client';
import { globalRateLimiter } from './rate-limiter';
import {
  validateResponse,
  AccountSchema,
  StatusSchema,
  TimelineResponseSchema,
  InstanceSchema,
  ContextSchema,
  PreferencesSchema
} from './schemas';
import { WebSocketStream } from './websocket-stream';

export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }

  static isAPIError(error: unknown): error is APIError {
    return error instanceof APIError;
  }
}

interface RequestOptions {
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, unknown>;
  skipAuth?: boolean;
  signal?: AbortSignal;
}

// Lesser-specific cost tracking
export interface CostMetrics {
  totalMicros: number;
  dynamoDBReads: number;
  dynamoDBWrites: number;
}

// Response with cost metrics
export interface ResponseWithCost<T> {
  data: T;
  cost?: CostMetrics;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  etag?: string;
}

export class MastodonClient {
  private baseURL: string;
  private instance: string;
  private cache = new Map<string, CacheEntry<unknown>>();
  private defaultCacheTTL = 60000; // 1 minute
  private instanceInfo: Instance | null = null;
  private instanceInfoPromise: Promise<Instance> | null = null;

  constructor(instance: string) {
    this.instance = instance;
    this.baseURL = instance.startsWith('http') ? instance : `https://${instance}`;
  }

  // Get access token from secure storage
  private async getAccessToken(): Promise<string | null> {
    const token = await secureAuthClient.getToken(this.instance);
    return token?.access_token || null;
  }

  // Set instance
  setInstance(instance: string): void {
    this.instance = instance;
    this.baseURL = instance.startsWith('http') ? instance : `https://${instance}`;
    this.clearCache();
    // Clear instance info cache
    this.instanceInfo = null;
    this.instanceInfoPromise = null;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Extract username from various account ID formats
   * Supports:
   * - Username: "aron" -> "aron"
   * - Full URL: "https://lesser.host/users/aron" -> "aron"
   * - Numeric ID: Falls back to original ID
   */
  private extractUsername(accountId: string): string {
    // If it's a URL format, extract the username
    if (accountId.startsWith('http')) {
      const match = accountId.match(/\/users\/([^\/]+)$/);
      if (match) {
        return match[1];
      }
    }
    // Otherwise return as-is (could be username or numeric ID)
    return accountId;
  }

  /**
   * Encode account ID for use in URL paths
   * For Lesser compatibility, we prefer to use usernames
   */
  private encodeAccountId(id: string): string {
    // Extract username if it's a URL format
    const username = this.extractUsername(id);
    
    // If the ID contains special characters that need encoding,
    // encode it. Otherwise, return as-is (for simple usernames)
    if (username.includes('/') || username.includes(':') || username.includes('@')) {
      return encodeURIComponent(username);
    }
    return username;
  }

  // Track last request cost metrics
  private lastRequestCost: CostMetrics | null = null;

  // Get last request cost metrics
  getLastRequestCost(): CostMetrics | null {
    return this.lastRequestCost;
  }

  // Generic request method with rate limiting
  private async request<T>(
    method: string,
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    // Check rate limit
    const rateLimitKey = `${this.instance}:${method}:${path}`;
    if (!globalRateLimiter.canMakeRequest(rateLimitKey)) {
      const resetTime = globalRateLimiter.getResetTime(rateLimitKey);
      throw new APIError(
        429,
        `Rate limit exceeded. Please wait ${Math.ceil(resetTime / 1000)} seconds.`
      );
    }
    
    const url = new URL(path, this.baseURL);
    
    // Add query parameters
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            // Handle array parameters (e.g., id[] for relationships)
            value.forEach(v => url.searchParams.append(key, String(v)));
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      });
    }

    // Check cache for GET requests
    const cacheKey = `${method}:${url.toString()}`;
    if (method === 'GET' && !options.skipAuth) {
      const cached = this.cache.get(cacheKey) as CacheEntry<T> | undefined;
      if (cached && Date.now() - cached.timestamp < this.defaultCacheTTL) {
        return cached.data;
      }
    }

    // Build headers
    const headers: Record<string, string> = {
      ...options.headers
    };
    
    // Only set Content-Type if not already set (FormData needs to set its own boundary)
    if (!headers['Content-Type'] && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (!options.skipAuth) {
      const accessToken = await this.getAccessToken();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }

    // Record request for rate limiting
    globalRateLimiter.recordRequest(rateLimitKey);
    
    // Make request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    // Prepare body
    let body: any = undefined;
    if (options.body) {
      if (options.body instanceof FormData) {
        body = options.body;
        // Remove Content-Type header for FormData - browser will set it with boundary
        delete headers['Content-Type'];
      } else {
        body = JSON.stringify(options.body);
      }
    }
    
    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body,
        signal: options.signal || controller.signal
      });
      
      clearTimeout(timeoutId);

      // Handle errors
      if (!response.ok) {
        // Check for rate limit error
        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const retryAfterMs = retryAfter ? parseInt(retryAfter) * 1000 : undefined;
          globalRateLimiter.recordRateLimitError(rateLimitKey, retryAfterMs);
        }
        
        let errorMessage = `API request failed: ${response.status}`;
        let errorData;
        try {
          errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Ignore JSON parse errors
        }
        throw new APIError(response.status, errorMessage, errorData);
      }

      // Extract Lesser cost headers if present
      const costHeaders = {
        totalMicros: response.headers.get('X-Cost-Total-Micros'),
        dynamoDBReads: response.headers.get('X-Cost-DynamoDB-Reads'),
        dynamoDBWrites: response.headers.get('X-Cost-DynamoDB-Writes')
      };
      
      if (costHeaders.totalMicros) {
        this.lastRequestCost = {
          totalMicros: parseInt(costHeaders.totalMicros),
          dynamoDBReads: parseInt(costHeaders.dynamoDBReads || '0'),
          dynamoDBWrites: parseInt(costHeaders.dynamoDBWrites || '0')
        };
      } else {
        this.lastRequestCost = null;
      }

      // Parse response
      const data = await response.json() as T;

      // Cache successful GET requests
      if (method === 'GET') {
        this.cache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          etag: response.headers.get('ETag') || undefined
        });
      }

      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof APIError) {
        throw error;
      }
      if (error instanceof Error && error.name === 'AbortError') {
        throw new APIError(0, 'Request timeout', error);
      }
      throw new APIError(0, 'Network error', error instanceof Error ? error : new Error(String(error)));
    }
  }

  // Pagination helper
  private extractPaginationLinks(linkHeader: string | null): {
    next?: string;
    prev?: string;
  } {
    if (!linkHeader) return {};

    const links: Record<string, string> = {};
    const parts = linkHeader.split(',');

    parts.forEach(part => {
      const match = part.match(/<([^>]+)>;\s*rel="([^"]+)"/);
      if (match) {
        links[match[2]] = match[1];
      }
    });

    return {
      next: links.next,
      prev: links.prev
    };
  }

  // Instance information with caching
  async getInstance(): Promise<Instance> {
    // Return cached instance if available
    if (this.instanceInfo) {
      return this.instanceInfo;
    }
    
    // If already fetching, wait for that request
    if (this.instanceInfoPromise) {
      return this.instanceInfoPromise;
    }
    
    // Fetch instance info
    this.instanceInfoPromise = this.request<unknown>('GET', '/api/v1/instance', { skipAuth: true })
      .then(data => {
        const instance = validateResponse(InstanceSchema, data, 'getInstance') as Instance;
        this.instanceInfo = instance;
        this.instanceInfoPromise = null;
        return instance;
      })
      .catch(error => {
        this.instanceInfoPromise = null;
        throw error;
      });
    
    return this.instanceInfoPromise;
  }

  // Check if instance is a Lesser server
  async isLesserInstance(): Promise<boolean> {
    try {
      const instance = await this.getInstance();
      if (!instance) return false;
      // Lesser instances include "Lesser" in their version string
      return instance.version.toLowerCase().includes('lesser');
    } catch {
      return false;
    }
  }

  async getInstanceActivity(): Promise<Array<{ week: string; statuses: string; logins: string; registrations: string }>> {
    return this.request<Array<{ week: string; statuses: string; logins: string; registrations: string }>>('GET', '/api/v1/instance/activity');
  }

  async getInstancePeers(): Promise<string[]> {
    return this.request<string[]>('GET', '/api/v1/instance/peers');
  }

  // Timelines
  async getHomeTimeline(params?: TimelineParams): Promise<Status[]> {
    const data = await this.request<unknown>('GET', '/api/v1/timelines/home', { params: params as Record<string, unknown> });
    return validateResponse(TimelineResponseSchema, data, 'getHomeTimeline');
  }

  async getPublicTimeline(params?: TimelineParams): Promise<Status[]> {
    const data = await this.request<unknown>('GET', '/api/v1/timelines/public', { params: params as Record<string, unknown> });
    return validateResponse(TimelineResponseSchema, data, 'getPublicTimeline');
  }

  async getLocalTimeline(params?: TimelineParams): Promise<Status[]> {
    const data = await this.request<unknown>('GET', '/api/v1/timelines/public', {
      params: { ...params, local: true } as Record<string, unknown>
    });
    return validateResponse(TimelineResponseSchema, data, 'getLocalTimeline');
  }

  async getTagTimeline(tag: string, params?: TimelineParams): Promise<Status[]> {
    return this.request<Status[]>(`GET`, `/api/v1/timelines/tag/${tag}`, { params: params as Record<string, unknown> });
  }

  async getListTimeline(listId: string, params?: PaginationParams): Promise<Status[]> {
    return this.request<Status[]>(`GET`, `/api/v1/timelines/list/${listId}`, { params: params as Record<string, unknown> });
  }

  // Statuses
  async getStatus(id: string): Promise<Status> {
    const data = await this.request<unknown>('GET', `/api/v1/statuses/${id}`);
    return validateResponse(StatusSchema, data, 'getStatus');
  }

  async getStatusContext(id: string): Promise<Context> {
    const data = await this.request<unknown>('GET', `/api/v1/statuses/${id}/context`);
    return validateResponse(ContextSchema, data, 'getStatusContext');
  }

  async createStatus(params: CreateStatusParams): Promise<Status> {
    return this.request<Status>('POST', '/api/v1/statuses', { body: params });
  }

  async deleteStatus(id: string): Promise<Status> {
    return this.request<Status>('DELETE', `/api/v1/statuses/${id}`);
  }

  /**
   * Extract status ID from various formats
   * Supports:
   * - Direct ID: "12345" -> "12345"
   * - Full URL: "https://lesser.host/statuses/12345" -> "12345"
   */
  private extractStatusId(statusId: string): string {
    // If it's a URL format, extract the ID
    if (statusId.startsWith('http')) {
      const match = statusId.match(/\/statuses\/([^\/]+)$/);
      if (match) {
        return match[1];
      }
    }
    // Otherwise return as-is
    return statusId;
  }

  async reblogStatus(id: string, params?: { comment?: string; visibility?: string }): Promise<Status> {
    const statusId = this.extractStatusId(id);
    return this.request<Status>('POST', `/api/v1/statuses/${statusId}/reblog`, { body: params });
  }

  async unreblogStatus(id: string): Promise<Status> {
    const statusId = this.extractStatusId(id);
    return this.request<Status>('POST', `/api/v1/statuses/${statusId}/unreblog`);
  }

  async favouriteStatus(id: string): Promise<Status> {
    const result = await this.request<Status>('POST', `/api/v1/statuses/${id}/favourite`);
    console.log('[API Client] Favourite response:', { 
      id: result.id, 
      bookmarked: result.bookmarked, 
      favourited: result.favourited,
      content: result.content?.substring(0, 50)
    });
    return result;
  }

  async unfavouriteStatus(id: string): Promise<Status> {
    const result = await this.request<Status>('POST', `/api/v1/statuses/${id}/unfavourite`);
    console.log('[API Client] Unfavourite response:', { 
      id: result.id, 
      bookmarked: result.bookmarked, 
      favourited: result.favourited,
      content: result.content?.substring(0, 50)
    });
    return result;
  }

  async bookmarkStatus(id: string): Promise<Status> {
    const result = await this.request<Status>('POST', `/api/v1/statuses/${id}/bookmark`);
    console.log('[API Client] Bookmark response:', { 
      id: result.id, 
      bookmarked: result.bookmarked, 
      favourited: result.favourited,
      content: result.content?.substring(0, 50)
    });
    return result;
  }

  async unbookmarkStatus(id: string): Promise<Status> {
    const result = await this.request<Status>('POST', `/api/v1/statuses/${id}/unbookmark`);
    console.log('[API Client] Unbookmark response:', { 
      id: result.id, 
      bookmarked: result.bookmarked, 
      favourited: result.favourited,
      content: result.content?.substring(0, 50)
    });
    return result;
  }

  async muteStatus(id: string): Promise<Status> {
    return this.request<Status>('POST', `/api/v1/statuses/${id}/mute`);
  }

  async unmuteStatus(id: string): Promise<Status> {
    return this.request<Status>('POST', `/api/v1/statuses/${id}/unmute`);
  }

  async pinStatus(id: string): Promise<Status> {
    return this.request<Status>('POST', `/api/v1/statuses/${id}/pin`);
  }

  async unpinStatus(id: string): Promise<Status> {
    return this.request<Status>('POST', `/api/v1/statuses/${id}/unpin`);
  }

  // Accounts
  async verifyCredentials(): Promise<Account> {
    const data = await this.request<unknown>('GET', '/api/v1/accounts/verify_credentials');
    return validateResponse(AccountSchema, data, 'verifyCredentials') as Account;
  }

  async updateCredentials(params: UpdateCredentialsParams): Promise<Account> {
    const formData = new FormData();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (value instanceof File) {
          formData.append(key, value, value.name);
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            Object.entries(item).forEach(([fieldKey, fieldValue]) => {
              formData.append(`${key}[${index}][${fieldKey}]`, String(fieldValue));
            });
          });
        } else {
          formData.append(key, String(value));
        }
      }
    });

    const result = await this.request<Account>('PATCH', '/api/v1/accounts/update_credentials', {
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
    return result;
  }

  async getAccount(id: string): Promise<Account> {
    const data = await this.request<unknown>('GET', `/api/v1/accounts/${this.encodeAccountId(id)}`);
    return validateResponse(AccountSchema, data, 'getAccount') as Account;
  }

  async lookupAccount(acct: string): Promise<Account> {
    const data = await this.request<unknown>('GET', '/api/v1/accounts/lookup', {
      params: { acct }
    });
    return validateResponse(AccountSchema, data, 'lookupAccount') as Account;
  }

  async getAccountStatuses(id: string, params?: AccountStatusesParams): Promise<Status[]> {
    return this.request<Status[]>('GET', `/api/v1/accounts/${this.encodeAccountId(id)}/statuses`, { params: params as Record<string, unknown> });
  }

  async getAccountFollowers(id: string, params?: PaginationParams): Promise<Account[]> {
    return this.request<Account[]>('GET', `/api/v1/accounts/${this.encodeAccountId(id)}/followers`, { params: params as Record<string, unknown> });
  }

  async getAccountFollowing(id: string, params?: PaginationParams): Promise<Account[]> {
    return this.request<Account[]>('GET', `/api/v1/accounts/${this.encodeAccountId(id)}/following`, { params: params as Record<string, unknown> });
  }

  async getAccountFeaturedTags(id: string): Promise<FeaturedTag[]> {
    return this.request<FeaturedTag[]>('GET', `/api/v1/accounts/${this.encodeAccountId(id)}/featured_tags`);
  }

  async getAccountLists(id: string): Promise<List[]> {
    return this.request<List[]>('GET', `/api/v1/accounts/${this.encodeAccountId(id)}/lists`);
  }

  async followAccount(id: string, params?: { reblogs?: boolean; notify?: boolean }): Promise<Relationship> {
    return this.request<Relationship>('POST', `/api/v1/accounts/${this.encodeAccountId(id)}/follow`, { body: params });
  }

  async unfollowAccount(id: string): Promise<Relationship> {
    return this.request<Relationship>('POST', `/api/v1/accounts/${this.encodeAccountId(id)}/unfollow`);
  }

  async blockAccount(id: string): Promise<Relationship> {
    return this.request<Relationship>('POST', `/api/v1/accounts/${this.encodeAccountId(id)}/block`);
  }

  async unblockAccount(id: string): Promise<Relationship> {
    return this.request<Relationship>('POST', `/api/v1/accounts/${this.encodeAccountId(id)}/unblock`);
  }

  async muteAccount(id: string, params?: { notifications?: boolean; duration?: number }): Promise<Relationship> {
    return this.request<Relationship>('POST', `/api/v1/accounts/${this.encodeAccountId(id)}/mute`, { body: params });
  }

  async unmuteAccount(id: string): Promise<Relationship> {
    return this.request<Relationship>('POST', `/api/v1/accounts/${this.encodeAccountId(id)}/unmute`);
  }

  async getRelationships(ids: string[]): Promise<Relationship[]> {
    // Mastodon API expects multiple id[] parameters
    return this.request<Relationship[]>('GET', '/api/v1/accounts/relationships', {
      params: { 'id[]': ids }
    });
  }

  // Search with Lesser semantic search support
  async search(params: SearchParams): Promise<SearchResults> {
    // Include Lesser-specific parameters if provided
    const searchParams: Record<string, unknown> = { ...params };
    
    // Skip validation for search to handle different Mastodon instance formats
    const data = await this.request<SearchResults>('GET', '/api/v2/search', { params: searchParams });
    return data;
  }

  // Notifications
  async getNotifications(params?: PaginationParams & { types?: string[]; exclude_types?: string[] }): Promise<Notification[]> {
    return this.request<Notification[]>('GET', '/api/v1/notifications', { params: params as Record<string, unknown> });
  }

  async getNotification(id: string): Promise<Notification> {
    return this.request<Notification>('GET', `/api/v1/notifications/${id}`);
  }

  async clearNotifications(): Promise<void> {
    await this.request<void>('POST', '/api/v1/notifications/clear');
  }

  async dismissNotification(id: string): Promise<void> {
    await this.request<void>('POST', `/api/v1/notifications/${id}/dismiss`);
  }

  // Lists
  async getLists(): Promise<List[]> {
    return this.request<List[]>('GET', '/api/v1/lists');
  }

  async getList(id: string): Promise<List> {
    return this.request<List>('GET', `/api/v1/lists/${id}`);
  }

  async createList(title: string, params?: { replies_policy?: string }): Promise<List> {
    return this.request<List>('POST', '/api/v1/lists', {
      body: { title, ...params }
    });
  }

  async updateList(id: string, title: string, params?: { replies_policy?: string }): Promise<List> {
    return this.request<List>('PUT', `/api/v1/lists/${id}`, {
      body: { title, ...params }
    });
  }

  async deleteList(id: string): Promise<void> {
    await this.request<void>('DELETE', `/api/v1/lists/${id}`);
  }

  async getListAccounts(id: string, params?: PaginationParams): Promise<Account[]> {
    return this.request<Account[]>('GET', `/api/v1/lists/${id}/accounts`, { params: params as Record<string, unknown> });
  }

  async addAccountsToList(id: string, accountIds: string[]): Promise<void> {
    await this.request<void>('POST', `/api/v1/lists/${id}/accounts`, {
      body: { account_ids: accountIds }
    });
  }

  async removeAccountsFromList(id: string, accountIds: string[]): Promise<void> {
    await this.request<void>('DELETE', `/api/v1/lists/${id}/accounts`, {
      body: { account_ids: accountIds }
    });
  }

  // Media
  async uploadMedia(file: File, params?: { description?: string; focus?: string }): Promise<MediaAttachment> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (params?.description) {
      formData.append('description', params.description);
    }
    if (params?.focus) {
      formData.append('focus', params.focus);
    }

    return this.request<MediaAttachment>('POST', '/api/v2/media', {
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  }

  async updateMedia(id: string, params: { description?: string; focus?: string }): Promise<MediaAttachment> {
    return this.request<MediaAttachment>('PUT', `/api/v1/media/${id}`, { body: params });
  }

  // Preferences
  async getPreferences(): Promise<Preferences> {
    const data = await this.request<unknown>('GET', '/api/v1/preferences');
    return validateResponse(PreferencesSchema, data, 'getPreferences');
  }

  // Markers
  async getMarkers(timelines: string[]): Promise<Markers> {
    return this.request<Markers>('GET', '/api/v1/markers', {
      params: { timeline: timelines }
    });
  }

  async updateMarkers(markers: Partial<Record<'home' | 'notifications', { last_read_id: string }>>): Promise<Markers> {
    return this.request<Markers>('POST', '/api/v1/markers', { body: markers });
  }

  // Announcements
  async getAnnouncements(): Promise<Announcement[]> {
    return this.request<Announcement[]>('GET', '/api/v1/announcements');
  }

  async dismissAnnouncement(id: string): Promise<void> {
    await this.request<void>('POST', `/api/v1/announcements/${id}/dismiss`);
  }

  async addAnnouncementReaction(id: string, name: string): Promise<void> {
    await this.request<void>('PUT', `/api/v1/announcements/${id}/reactions/${name}`);
  }

  async removeAnnouncementReaction(id: string, name: string): Promise<void> {
    await this.request<void>('DELETE', `/api/v1/announcements/${id}/reactions/${name}`);
  }

  // Filters
  async getFilters(): Promise<Filter[]> {
    return this.request<Filter[]>('GET', '/api/v2/filters');
  }

  async getFilter(id: string): Promise<Filter> {
    return this.request<Filter>('GET', `/api/v2/filters/${id}`);
  }

  async createFilter(params: Partial<Filter>): Promise<Filter> {
    return this.request<Filter>('POST', '/api/v2/filters', { body: params });
  }

  async updateFilter(id: string, params: Partial<Filter>): Promise<Filter> {
    return this.request<Filter>('PUT', `/api/v2/filters/${id}`, { body: params });
  }

  async deleteFilter(id: string): Promise<void> {
    await this.request<void>('DELETE', `/api/v2/filters/${id}`);
  }

  // Streaming API helper
  async streamUser(): Promise<EventSource> {
    const url = new URL('/api/v1/streaming/user', this.baseURL);
    const accessToken = await this.getAccessToken();
    if (accessToken) {
      url.searchParams.append('access_token', accessToken);
    }
    return new EventSource(url.toString());
  }

  async streamPublic(params?: { local?: boolean; only_media?: boolean }): Promise<EventSource> {
    const url = new URL('/api/v1/streaming/public', this.baseURL);
    const accessToken = await this.getAccessToken();
    if (accessToken) {
      url.searchParams.append('access_token', accessToken);
    }
    if (params?.local) {
      url.searchParams.append('local', 'true');
    }
    if (params?.only_media) {
      url.searchParams.append('only_media', 'true');
    }
    return new EventSource(url.toString());
  }

  async streamHashtag(tag: string, params?: { local?: boolean }): Promise<EventSource> {
    const url = new URL(`/api/v1/streaming/hashtag`, this.baseURL);
    url.searchParams.append('tag', tag);
    const accessToken = await this.getAccessToken();
    if (accessToken) {
      url.searchParams.append('access_token', accessToken);
    }
    if (params?.local) {
      url.searchParams.append('local', 'true');
    }
    return new EventSource(url.toString());
  }

  async streamList(listId: string): Promise<EventSource> {
    const url = new URL(`/api/v1/streaming/list`, this.baseURL);
    url.searchParams.append('list', listId);
    const accessToken = await this.getAccessToken();
    if (accessToken) {
      url.searchParams.append('access_token', accessToken);
    }
    return new EventSource(url.toString());
  }

  // Universal streaming method that supports both SSE and WebSocket
  async createStream(
    stream: 'user' | 'public' | 'hashtag' | 'list',
    params?: Record<string, string>,
    handlers?: {
      onMessage: (event: MessageEvent) => void;
      onError?: (error: Event | Error) => void;
      onClose?: () => void;
      onOpen?: () => void;
    }
  ): Promise<{ close: () => void }> {
    // First check if instance info has WebSocket URL
    const instanceInfo = await this.getInstance();
    const wsUrl = instanceInfo.urls?.streaming_api;
    
    if (wsUrl) {
      // Instance explicitly provides WebSocket URL, use it
      console.log('[Streaming] Using WebSocket URL from instance:', wsUrl);
      
      // Get access token
      const accessToken = await this.getAccessToken();
      if (!accessToken) {
        throw new Error('No access token available for streaming');
      }
      
      // Build WebSocket URL with parameters
      const url = new URL(wsUrl);
      url.searchParams.append('stream', stream);
      url.searchParams.append('access_token', accessToken);
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }
      
      const ws = new WebSocketStream({
        instance: this.instance,
        stream,
        params,
        onMessage: handlers?.onMessage || (() => {}),
        onError: handlers?.onError,
        onClose: handlers?.onClose,
        onOpen: handlers?.onOpen
      });
      
      await ws.connect(url.toString());
      
      return {
        close: () => ws.disconnect()
      };
    } else {
      // Use SSE streaming
      let eventSource: EventSource;
      
      switch (stream) {
        case 'user':
          eventSource = await this.streamUser();
          break;
        case 'public':
          eventSource = await this.streamPublic(params as any);
          break;
        case 'hashtag':
          if (!params?.tag) throw new Error('Hashtag stream requires tag parameter');
          eventSource = await this.streamHashtag(params.tag, params as any);
          break;
        case 'list':
          if (!params?.list) throw new Error('List stream requires list parameter');
          eventSource = await this.streamList(params.list);
          break;
        default:
          throw new Error(`Unknown stream type: ${stream}`);
      }
      
      // Add event listeners for SSE
      eventSource.addEventListener('update', (event) => {
        // Create a synthetic event with type property for consistency
        const syntheticEvent = new MessageEvent('message', {
          data: event.data
        });
        (syntheticEvent as any).type = 'update';
        handlers?.onMessage?.(syntheticEvent);
      });
      
      eventSource.addEventListener('delete', (event) => {
        const syntheticEvent = new MessageEvent('message', {
          data: event.data
        });
        (syntheticEvent as any).type = 'delete';
        handlers?.onMessage?.(syntheticEvent);
      });
      
      eventSource.addEventListener('notification', (event) => {
        const syntheticEvent = new MessageEvent('message', {
          data: event.data
        });
        (syntheticEvent as any).type = 'notification';
        handlers?.onMessage?.(syntheticEvent);
      });
      
      if (handlers?.onError) {
        eventSource.onerror = handlers.onError;
      }
      if (handlers?.onOpen) {
        eventSource.onopen = handlers.onOpen;
      }
      
      return {
        close: () => {
          eventSource.close();
          handlers?.onClose?.();
        }
      };
    }
  }
}

// Global client instance
let globalClient: MastodonClient | null = null;

export function getClient(instance?: string): MastodonClient {
  // Only access localStorage on client side
  let currentInstance = instance;
  
  if (!currentInstance && typeof window !== 'undefined') {
    // Try to get instance from auth store in localStorage
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        currentInstance = parsed.state?.currentInstance;
      } catch (e) {
        console.error('[API Client] Failed to parse auth storage:', e);
      }
    }
  }
  
  // Fallback to a default if still no instance
  currentInstance = currentInstance || 'mastodon.social';
  
  console.log('[API Client] Using instance:', currentInstance);
  
  if (!globalClient || globalClient['instance'] !== currentInstance) {
    console.log('[API Client] Creating new client for instance:', currentInstance);
    globalClient = new MastodonClient(currentInstance);
  }
  return globalClient;
}

export function setClientInstance(instance: string): void {
  globalClient = new MastodonClient(instance);
}