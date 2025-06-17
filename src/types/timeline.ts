/**
 * Timeline-related types for Mastodon
 */

import type { Status, PaginationParams } from './mastodon';

/**
 * Timeline types
 */
export type TimelineType = 
  | 'home'
  | 'public'
  | 'local'
  | 'tag'
  | 'list'
  | 'bookmarks'
  | 'favourites';

/**
 * Timeline configuration
 */
export interface TimelineConfig {
  type: TimelineType;
  params?: TimelineParams;
  listId?: string;
  hashtag?: string;
}

/**
 * Timeline parameters
 */
export interface TimelineParams extends PaginationParams {
  local?: boolean;
  remote?: boolean;
  only_media?: boolean;
}

/**
 * Timeline state
 */
export interface TimelineState {
  items: Status[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  error?: string;
  lastFetch?: number;
  newestId?: string;
  oldestId?: string;
}

/**
 * Timeline update
 */
export interface TimelineUpdate {
  type: 'prepend' | 'append' | 'update' | 'delete';
  statuses?: Status[];
  statusId?: string;
  status?: Status;
}

/**
 * Timeline filter
 */
export interface TimelineFilter {
  showReplies: boolean;
  showReblogs: boolean;
  showBots: boolean;
  mediaOnly: boolean;
  languages?: string[];
}

/**
 * Timeline gap
 */
export interface TimelineGap {
  sinceId: string;
  maxId: string;
}

/**
 * Timeline marker
 */
export interface TimelineMarker {
  last_read_id: string;
  version: number;
  updated_at: string;
  unread_count?: number;
}

/**
 * Timeline markers object
 */
export interface TimelineMarkers {
  home?: TimelineMarker;
  notifications?: TimelineMarker;
  [key: string]: TimelineMarker | undefined;
}

/**
 * Timeline position
 */
export interface TimelinePosition {
  statusId: string;
  offset: number;
  timestamp: number;
}

/**
 * Timeline cache entry
 */
export interface TimelineCacheEntry {
  statuses: Status[];
  position?: TimelinePosition;
  filters?: TimelineFilter;
  expiresAt: number;
}

/**
 * Timeline event types for real-time updates
 */
export type TimelineEventType = 
  | 'status.new'
  | 'status.update'
  | 'status.delete'
  | 'refresh'
  | 'loadMore'
  | 'clear';

/**
 * Timeline event
 */
export interface TimelineEvent {
  type: TimelineEventType;
  timeline: TimelineType;
  payload?: any;
}

/**
 * Timeline subscription
 */
export interface TimelineSubscription {
  id: string;
  timeline: TimelineType;
  params?: TimelineParams;
  callback: (event: TimelineEvent) => void;
}

/**
 * Load more direction
 */
export type LoadDirection = 'newer' | 'older';

/**
 * Timeline metadata
 */
export interface TimelineMetadata {
  type: TimelineType;
  title: string;
  icon?: string;
  isLocal?: boolean;
  isRemote?: boolean;
  hashtag?: string;
  listId?: string;
  listTitle?: string;
}