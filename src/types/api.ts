/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * API-related types for HTTP requests and responses
 */

/**
 * API Response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  headers?: Record<string, string>;
  status: number;
}

/**
 * API Error response
 */
export interface ApiError {
  error: string;
  error_description?: string;
  status?: number;
}

/**
 * Pagination information from Link headers
 */
export interface PaginationInfo {
  next?: string;
  prev?: string;
  first?: string;
  last?: string;
}

/**
 * API request configuration
 */
export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  params?: Record<string, any>;
  signal?: AbortSignal;
}

/**
 * API client configuration
 */
export interface ApiClientConfig {
  instance: string;
  accessToken?: string;
  timeout?: number;
  retries?: number;
}

/**
 * Rate limit information
 */
export interface RateLimit {
  limit: number;
  remaining: number;
  reset: Date;
}

/**
 * Streaming API event types
 */
export type StreamingEventType =
  | 'update'
  | 'delete'
  | 'notification'
  | 'filters_changed'
  | 'conversation'
  | 'announcement'
  | 'announcement.reaction'
  | 'announcement.delete'
  | 'status.update'
  | 'encrypted_message';

/**
 * Streaming API event
 */
export interface StreamingEvent {
  event: StreamingEventType;
  payload: string;
  stream?: string[];
}

/**
 * API endpoints enum
 */
export enum ApiEndpoint {
  // Account endpoints
  VERIFY_CREDENTIALS = '/api/v1/accounts/verify_credentials',
  UPDATE_CREDENTIALS = '/api/v1/accounts/update_credentials',
  ACCOUNT = '/api/v1/accounts/:id',
  ACCOUNT_STATUSES = '/api/v1/accounts/:id/statuses',
  ACCOUNT_FOLLOWERS = '/api/v1/accounts/:id/followers',
  ACCOUNT_FOLLOWING = '/api/v1/accounts/:id/following',

  // Timeline endpoints
  HOME_TIMELINE = '/api/v1/timelines/home',
  PUBLIC_TIMELINE = '/api/v1/timelines/public',
  TAG_TIMELINE = '/api/v1/timelines/tag/:hashtag',
  LIST_TIMELINE = '/api/v1/timelines/list/:list_id',

  // Status endpoints
  STATUS = '/api/v1/statuses/:id',
  CREATE_STATUS = '/api/v1/statuses',
  REBLOG_STATUS = '/api/v1/statuses/:id/reblog',
  UNREBLOG_STATUS = '/api/v1/statuses/:id/unreblog',
  FAVOURITE_STATUS = '/api/v1/statuses/:id/favourite',
  UNFAVOURITE_STATUS = '/api/v1/statuses/:id/unfavourite',
  BOOKMARK_STATUS = '/api/v1/statuses/:id/bookmark',
  UNBOOKMARK_STATUS = '/api/v1/statuses/:id/unbookmark',

  // Notification endpoints
  NOTIFICATIONS = '/api/v1/notifications',
  NOTIFICATION = '/api/v1/notifications/:id',
  CLEAR_NOTIFICATIONS = '/api/v1/notifications/clear',

  // Search endpoint
  SEARCH = '/api/v2/search',

  // Instance endpoints
  INSTANCE = '/api/v1/instance',
  INSTANCE_PEERS = '/api/v1/instance/peers',
  INSTANCE_ACTIVITY = '/api/v1/instance/activity',

  // Media endpoints
  UPLOAD_MEDIA = '/api/v2/media',
  UPDATE_MEDIA = '/api/v1/media/:id',
}

/**
 * HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Request interceptor
 */
export type RequestInterceptor = (
  config: ApiRequestConfig
) => ApiRequestConfig | Promise<ApiRequestConfig>;

/**
 * Response interceptor
 */
export type ResponseInterceptor<T = any> = (
  response: ApiResponse<T>
) => ApiResponse<T> | Promise<ApiResponse<T>>;

/**
 * Error interceptor
 */
export type ErrorInterceptor = (error: ApiError) => ApiError | Promise<ApiError>;
