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
  SearchParams,
  UpdateCredentialsParams,
  Announcement,
  Marker,
  Markers,
  FeaturedTag,
  Filter,
  MediaAttachment
} from '@/types/mastodon';
import { getAccessToken } from '@/lib/stores/auth';
import { secureAuthClient } from '@/lib/auth/secure-client';
import { globalRateLimiter } from './rate-limiter';
import {
  validateResponse,
  AccountSchema,
  StatusSchema,
  TimelineResponseSchema,
  InstanceSchema,
  NotificationSchema,
  SearchResultsSchema,
  RelationshipSchema,
  ListSchema,
  ContextSchema,
  PreferencesSchema,
  MediaAttachmentSchema
} from './schemas';

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
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
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
          url.searchParams.append(key, String(value));
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
      'Content-Type': 'application/json',
      ...options.headers
    };

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
    
    try {
      const response = await fetch(url.toString(), {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
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
      if (error.name === 'AbortError') {
        throw new APIError(0, 'Request timeout', error);
      }
      throw new APIError(0, 'Network error', error);
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

  // Instance information
  async getInstance(): Promise<Instance> {
    const data = await this.request<unknown>('GET', '/api/v1/instance', { skipAuth: true });
    return validateResponse(InstanceSchema, data, 'getInstance');
  }

  async getInstanceActivity(): Promise<Array<{ week: string; statuses: string; logins: string; registrations: string }>> {
    return this.request<Array<{ week: string; statuses: string; logins: string; registrations: string }>>('GET', '/api/v1/instance/activity');
  }

  async getInstancePeers(): Promise<string[]> {
    return this.request<string[]>('GET', '/api/v1/instance/peers');
  }

  // Timelines
  async getHomeTimeline(params?: TimelineParams): Promise<Status[]> {
    const data = await this.request<unknown>('GET', '/api/v1/timelines/home', { params });
    return validateResponse(TimelineResponseSchema, data, 'getHomeTimeline');
  }

  async getPublicTimeline(params?: TimelineParams): Promise<Status[]> {
    const data = await this.request<unknown>('GET', '/api/v1/timelines/public', { params });
    return validateResponse(TimelineResponseSchema, data, 'getPublicTimeline');
  }

  async getLocalTimeline(params?: TimelineParams): Promise<Status[]> {
    return this.request<Status[]>('GET', '/api/v1/timelines/public', {
      params: { ...params, local: true }
    });
  }

  async getTagTimeline(tag: string, params?: TimelineParams): Promise<Status[]> {
    return this.request<Status[]>(`GET`, `/api/v1/timelines/tag/${tag}`, { params });
  }

  async getListTimeline(listId: string, params?: PaginationParams): Promise<Status[]> {
    return this.request<Status[]>(`GET`, `/api/v1/timelines/list/${listId}`, { params });
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

  async reblogStatus(id: string): Promise<Status> {
    return this.request<Status>('POST', `/api/v1/statuses/${id}/reblog`);
  }

  async unreblogStatus(id: string): Promise<Status> {
    return this.request<Status>('POST', `/api/v1/statuses/${id}/unreblog`);
  }

  async favouriteStatus(id: string): Promise<Status> {
    return this.request<Status>('POST', `/api/v1/statuses/${id}/favourite`);
  }

  async unfavouriteStatus(id: string): Promise<Status> {
    return this.request<Status>('POST', `/api/v1/statuses/${id}/unfavourite`);
  }

  async bookmarkStatus(id: string): Promise<Status> {
    return this.request<Status>('POST', `/api/v1/statuses/${id}/bookmark`);
  }

  async unbookmarkStatus(id: string): Promise<Status> {
    return this.request<Status>('POST', `/api/v1/statuses/${id}/unbookmark`);
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
    return validateResponse(AccountSchema, data, 'verifyCredentials');
  }

  async updateCredentials(params: UpdateCredentialsParams): Promise<Account> {
    const formData = new FormData();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (value instanceof File) {
          formData.append(key, value);
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            Object.entries(item).forEach(([fieldKey, fieldValue]) => {
              formData.append(`${key}[${index}][${fieldKey}]`, fieldValue);
            });
          });
        } else {
          formData.append(key, String(value));
        }
      }
    });

    return this.request<Account>('PATCH', '/api/v1/accounts/update_credentials', {
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    });
  }

  async getAccount(id: string): Promise<Account> {
    const data = await this.request<unknown>('GET', `/api/v1/accounts/${id}`);
    return validateResponse(AccountSchema, data, 'getAccount');
  }

  async getAccountStatuses(id: string, params?: AccountStatusesParams): Promise<Status[]> {
    return this.request<Status[]>('GET', `/api/v1/accounts/${id}/statuses`, { params });
  }

  async getAccountFollowers(id: string, params?: PaginationParams): Promise<Account[]> {
    return this.request<Account[]>('GET', `/api/v1/accounts/${id}/followers`, { params });
  }

  async getAccountFollowing(id: string, params?: PaginationParams): Promise<Account[]> {
    return this.request<Account[]>('GET', `/api/v1/accounts/${id}/following`, { params });
  }

  async getAccountFeaturedTags(id: string): Promise<FeaturedTag[]> {
    return this.request<FeaturedTag[]>('GET', `/api/v1/accounts/${id}/featured_tags`);
  }

  async getAccountLists(id: string): Promise<List[]> {
    return this.request<List[]>('GET', `/api/v1/accounts/${id}/lists`);
  }

  async followAccount(id: string, params?: { reblogs?: boolean; notify?: boolean }): Promise<Relationship> {
    return this.request<Relationship>('POST', `/api/v1/accounts/${id}/follow`, { body: params });
  }

  async unfollowAccount(id: string): Promise<Relationship> {
    return this.request<Relationship>('POST', `/api/v1/accounts/${id}/unfollow`);
  }

  async blockAccount(id: string): Promise<Relationship> {
    return this.request<Relationship>('POST', `/api/v1/accounts/${id}/block`);
  }

  async unblockAccount(id: string): Promise<Relationship> {
    return this.request<Relationship>('POST', `/api/v1/accounts/${id}/unblock`);
  }

  async muteAccount(id: string, params?: { notifications?: boolean; duration?: number }): Promise<Relationship> {
    return this.request<Relationship>('POST', `/api/v1/accounts/${id}/mute`, { body: params });
  }

  async unmuteAccount(id: string): Promise<Relationship> {
    return this.request<Relationship>('POST', `/api/v1/accounts/${id}/unmute`);
  }

  async getRelationships(ids: string[]): Promise<Relationship[]> {
    return this.request<Relationship[]>('GET', '/api/v1/accounts/relationships', {
      params: { id: ids }
    });
  }

  // Search
  async search(params: SearchParams): Promise<SearchResults> {
    const data = await this.request<unknown>('GET', '/api/v2/search', { params });
    return validateResponse(SearchResultsSchema, data, 'search');
  }

  // Notifications
  async getNotifications(params?: PaginationParams & { types?: string[]; exclude_types?: string[] }): Promise<Notification[]> {
    return this.request<Notification[]>('GET', '/api/v1/notifications', { params });
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
    return this.request<Account[]>('GET', `/api/v1/lists/${id}/accounts`, { params });
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
}

// Global client instance
let globalClient: MastodonClient | null = null;

export function getClient(instance?: string): MastodonClient {
  const currentInstance = instance || localStorage.getItem('currentInstance') || 'mastodon.social';
  
  if (!globalClient || globalClient['instance'] !== currentInstance) {
    globalClient = new MastodonClient(currentInstance);
  }
  return globalClient;
}

export function setClientInstance(instance: string): void {
  globalClient = new MastodonClient(instance);
}