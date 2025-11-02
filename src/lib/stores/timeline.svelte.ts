/**
 * Timeline state management with Svelte 5 - GraphQL Edition
 * Handles home, local, and federated timelines using Lesser GraphQL API
 */

import type { Status, TimelineParams } from '@/types/mastodon';
import { getGraphQLAdapter } from '@/lib/api/graphql-client';
import { mapGraphQLMediaToAttachment } from '@/lib/mappers/media';
import { logDebug } from '@/lib/utils/logger';
import { authStore } from './auth.svelte';

// Subscription type from Apollo Client (provided via greater-components)
type Subscription = {
  unsubscribe: () => void;
};

export interface TimelineData {
  statuses: Status[];
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  lastFetch: number;
  stream: Subscription | null;
  gaps: TimelineGap[];
  endCursor: string | null;
}

export interface TimelineGap {
  above: string; // Status ID above the gap
  below: string; // Status ID below the gap
}

export type TimelineType = 'home' | 'local' | 'federated';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const DEFAULT_PAGE_SIZE = 20;

const initialTimelineData: TimelineData = {
  statuses: [],
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  lastFetch: 0,
  stream: null,
  gaps: [],
  endCursor: null,
};

/**
 * Map GraphQL timeline response to Mastodon-compatible Status objects
 */
function mapGraphQLToStatus(node: any): Status {
  // Extract the object from the GraphQL structure
  const obj = node.object || node;
  
  return {
    id: obj.id,
    uri: obj.id,
    url: obj.id,
    created_at: obj.published || obj.createdAt || new Date().toISOString(),
    account: mapGraphQLToAccount(obj.attributedTo || obj.author),
    content: obj.content || '',
    visibility: (obj.visibility?.toLowerCase() || 'public') as any,
    sensitive: obj.sensitive ?? false,
    spoiler_text: obj.summary ?? obj.spoilerText ?? '',
    media_attachments: (obj.attachments || []).map(mapGraphQLToMedia),
    mentions: (obj.mentions || obj.tag?.filter((t: any) => t.type === 'Mention') || []).map(mapGraphQLToMention),
    tags: (obj.hashtags || obj.tag?.filter((t: any) => t.type === 'Hashtag') || []).map(mapGraphQLToTag),
    emojis: [],
    reblogs_count: obj.shares?.totalCount || obj.sharesCount || 0,
    favourites_count: obj.likes?.totalCount || obj.likesCount || 0,
    replies_count: obj.replies?.totalCount || obj.repliesCount || 0,
    reblogged: obj.userInteractions?.shared || false,
    favourited: obj.userInteractions?.liked || false,
    bookmarked: obj.userInteractions?.bookmarked || false,
    pinned: obj.userInteractions?.pinned || false,
    reblog: obj.shareOf ? mapGraphQLToStatus(obj.shareOf) : null,
    in_reply_to_id: obj.inReplyTo?.id || null,
    in_reply_to_account_id: null,
    application: null as any,
    language: obj.language || null,
    muted: false,
    poll: obj.poll ? mapGraphQLToPoll(obj.poll) : null,
    card: null,
    edited_at: obj.updated || null,
  };
}

function mapGraphQLToAccount(actor: any): any {
  if (!actor) {
    return {
      id: 'unknown',
      username: 'unknown',
      acct: 'unknown',
      display_name: 'Unknown',
      avatar: '',
      header: '',
    };
  }

  return {
    id: actor.id,
    username: actor.preferredUsername || actor.username,
    acct: actor.webfinger || `${actor.preferredUsername}@${new URL(actor.id).hostname}`,
    display_name: actor.name || actor.preferredUsername,
    locked: actor.manuallyApprovesFollowers || false,
    bot: actor.type === 'Service',
    created_at: actor.published || new Date().toISOString(),
    note: actor.summary || '',
    url: actor.url || actor.id,
    avatar: actor.icon?.url || '',
    avatar_static: actor.icon?.url || '',
    header: actor.image?.url || '',
    header_static: actor.image?.url || '',
    followers_count: actor.followers?.totalCount || 0,
    following_count: actor.following?.totalCount || 0,
    statuses_count: actor.outbox?.totalCount || 0,
    last_status_at: null,
    emojis: [],
    fields: (actor.attachment || [])
      .filter((a: any) => a.type === 'PropertyValue')
      .map((a: any) => ({
        name: a.name,
        value: a.value,
        verified_at: null,
      })),
  };
}

function mapGraphQLToMedia(attachment: any) {
  return mapGraphQLMediaToAttachment(attachment);
}

function mapGraphQLToMention(mention: any): any {
  return {
    id: mention.href || mention.id,
    username: mention.name?.replace('@', '') || '',
    url: mention.href || mention.id,
    acct: mention.name?.replace('@', '') || '',
  };
}

function mapGraphQLToTag(tag: any): any {
  return {
    name: tag.name?.replace('#', '') || '',
    url: tag.href || '',
  };
}

function mapGraphQLToPoll(poll: any): any {
  return {
    id: poll.id,
    expires_at: poll.endTime,
    expired: new Date(poll.endTime) < new Date(),
    multiple: poll.anyOf !== undefined, // anyOf = multiple choice
    votes_count: poll.votersCount || 0,
    voters_count: poll.votersCount || 0,
    voted: poll.voted || false,
    own_votes: poll.ownVotes || [],
    options: (poll.oneOf || poll.anyOf || []).map((opt: any) => ({
      title: opt.name,
      votes_count: opt.replies?.totalCount || 0,
    })),
    emojis: [],
  };
}

// Timeline state management with Svelte 5 runes
class TimelineStore {
  timelines = $state<Record<string, TimelineData>>({});
  isLoading = $state(false);
  error = $state<string | null>(null);

  private _initialized = false;
  private _previousInstance: string | null = null;
  
  constructor() {
    // Constructor is empty to avoid SSR issues
  }
  
  /**
   * Initialize the timeline store - must be called from client-side code
   */
  initialize() {
    if (typeof window === 'undefined' || this._initialized) return;
    this._initialized = true;
    
    // Initialize auth store if needed
    authStore.initialize();
    
    // Set initial instance value
    this._previousInstance = authStore.currentInstance;
    
    // Set up a timer to check for instance changes
    setInterval(() => {
      if (authStore.currentInstance !== this._previousInstance) {
        // Clear all timelines when switching instances
        if (this._previousInstance !== null) {
          Object.keys(this.timelines).forEach(type => {
            this.disconnectStream(type);
            this.clearTimeline(type);
          });
        }
        this._previousInstance = authStore.currentInstance;
      }
    }, 1000); // Check every second
  }

  async loadTimeline(type: string, params?: TimelineParams): Promise<void> {
    const timeline = this.timelines[type] || { ...initialTimelineData };
    const now = Date.now();
    
    // Skip if recently fetched and not forcing refresh
    if (!params?.since_id && timeline.lastFetch && now - timeline.lastFetch < CACHE_DURATION && timeline.statuses.length > 0) {
      return;
    }
    
    this.isLoading = true;
    this.error = null;
    
    // Initialize timeline if doesn't exist
    if (!this.timelines[type]) {
      this.timelines[type] = { ...initialTimelineData };
    }
    
    this.timelines[type] = { ...this.timelines[type], isLoading: true, error: null };
    
    try {
      logDebug('[Timeline Store] Loading timeline:', {
        type,
        currentInstance: authStore.currentInstance,
        isAuthenticated: authStore.isAuthenticated,
        currentUser: authStore.currentUser?.username
      });
      
      const adapter = await getGraphQLAdapter(authStore.currentInstance || undefined);
      let timelineResponse: any;
      
      // Determine pagination based on params
      const pagination = {
        first: params?.limit || DEFAULT_PAGE_SIZE,
        after: params?.since_id ? undefined : timeline.endCursor,
      };
      
      if (type.startsWith('list:')) {
        const listId = type.replace('list:', '');
        timelineResponse = await adapter.fetchListTimeline(listId, pagination);
      } else {
        switch (type) {
          case 'home':
            timelineResponse = await adapter.fetchHomeTimeline(pagination);
            break;
          case 'local':
            timelineResponse = await adapter.fetchPublicTimeline(pagination, 'LOCAL');
            break;
          case 'federated':
            timelineResponse = await adapter.fetchPublicTimeline(pagination, 'PUBLIC');
            break;
          default:
            throw new Error(`Unknown timeline type: ${type}`);
        }
      }
      
      // Map GraphQL response to Status objects
      const statuses: Status[] = (timelineResponse?.edges || [])
        .map((edge: any) => mapGraphQLToStatus(edge.node));
      
      const pageInfo = timelineResponse?.pageInfo;
      
      logDebug('[Timeline Store] Loaded statuses:', statuses.length);
      logDebug('[Timeline Store] First status:', statuses[0]);
      logDebug('[Timeline Store] PageInfo:', pageInfo);
      
      const updatedTimeline = {
        ...this.timelines[type],
        statuses: params?.since_id 
          ? [...statuses, ...this.timelines[type].statuses]
          : statuses,
        hasMore: pageInfo?.hasNextPage || false,
        endCursor: pageInfo?.endCursor || null,
        isLoading: false,
        lastFetch: now,
        error: null
      };
      
      logDebug('[Timeline Store] Setting timeline state:', {
        type,
        statusCount: updatedTimeline.statuses.length,
        isLoading: updatedTimeline.isLoading,
        error: updatedTimeline.error,
        hasMore: updatedTimeline.hasMore,
      });

      this.timelines[type] = updatedTimeline;
      this.isLoading = false;

      logDebug('[Timeline Store] Timeline state after update:', this.timelines[type]);
    } catch (error) {
      console.error('[Timeline Store] Error loading timeline:', error);
      this.timelines[type] = {
        ...this.timelines[type],
        isLoading: false,
        error: error as Error
      };
      this.isLoading = false;
      this.error = error instanceof Error ? error.message : 'Failed to load timeline';
    }
  }

  async loadMore(type: string): Promise<void> {
    const timeline = this.timelines[type];
    
    if (!timeline || !timeline.hasMore || timeline.isLoadingMore) {
      return;
    }
    
    this.timelines[type] = { ...this.timelines[type], isLoadingMore: true };
    
    try {
      const adapter = await getGraphQLAdapter(authStore.currentInstance || undefined);
      let timelineResponse: any;
      
      const pagination = {
        first: DEFAULT_PAGE_SIZE,
        after: timeline.endCursor,
      };
      
      if (type.startsWith('list:')) {
        const listId = type.replace('list:', '');
        timelineResponse = await adapter.fetchListTimeline(listId, pagination);
      } else {
        switch (type) {
          case 'home':
            timelineResponse = await adapter.fetchHomeTimeline(pagination);
            break;
          case 'local':
            timelineResponse = await adapter.fetchPublicTimeline(pagination, 'LOCAL');
            break;
          case 'federated':
            timelineResponse = await adapter.fetchPublicTimeline(pagination, 'PUBLIC');
            break;
          default:
            throw new Error(`Unknown timeline type: ${type}`);
        }
      }
      
      const statuses: Status[] = (timelineResponse?.edges || [])
        .map((edge: any) => mapGraphQLToStatus(edge.node));
      
      const pageInfo = timelineResponse?.pageInfo;
      
      this.timelines[type] = {
        ...this.timelines[type],
        statuses: [...this.timelines[type].statuses, ...statuses],
        hasMore: pageInfo?.hasNextPage || false,
        endCursor: pageInfo?.endCursor || null,
        isLoadingMore: false
      };
    } catch (error) {
      console.error('[Timeline Store] Error loading more:', error);
      this.timelines[type] = {
        ...this.timelines[type],
        isLoadingMore: false,
        error: error as Error
      };
    }
  }

  async refreshTimeline(type: string): Promise<void> {
    const timeline = this.timelines[type];
    
    if (!timeline || timeline.statuses.length === 0) {
      return this.loadTimeline(type);
    }
    
    try {
      // Force refresh by clearing cache
      await this.loadTimeline(type, { limit: DEFAULT_PAGE_SIZE });
    } catch (error) {
      console.error('[Timeline Store] Error refreshing timeline:', error);
      // Failed to refresh timeline - keep existing data
    }
  }

  prependStatus(type: string, status: Status): void {
    if (this.timelines[type]) {
      this.timelines[type] = {
        ...this.timelines[type],
        statuses: [status, ...this.timelines[type].statuses]
      };
    }
  }

  updateStatus(statusId: string, updates: Partial<Status>): void {
    logDebug('[Timeline Store] Updating status:', { statusId, updates });
    
    // Update in all timelines
    Object.entries(this.timelines).forEach(([type, timeline]) => {
      this.timelines[type] = {
        ...timeline,
        statuses: timeline.statuses.map(status => {
          if (status.id === statusId) {
            const updated = { ...status, ...updates };
            logDebug('[Timeline Store] Status updated:', { 
              id: statusId, 
              wasFavorited: status.favourited, 
              isFavorited: updated.favourited,
              wasBookmarked: status.bookmarked,
              isBookmarked: updated.bookmarked,
            });
            return updated;
          }
          // Also update if it's a reblog
          if (status.reblog?.id === statusId) {
            return {
              ...status,
              reblog: { ...status.reblog, ...updates }
            };
          }
          return status;
        })
      };
    });
  }

  removeStatus(statusId: string): void {
    // Remove from all timelines
    Object.entries(this.timelines).forEach(([type, timeline]) => {
      this.timelines[type] = {
        ...timeline,
        statuses: timeline.statuses.filter(status => 
          status.id !== statusId && status.reblog?.id !== statusId
        )
      };
    });
  }

  clearTimeline(type: string): void {
    this.timelines[type] = { ...initialTimelineData };
  }

  async favoriteStatus(statusId: string): Promise<void> {
    const adapter = await getGraphQLAdapter(authStore.currentInstance || undefined);
    
    // Find the status in any timeline
    let originalStatus: Status | undefined;
    for (const timeline of Object.values(this.timelines)) {
      originalStatus = timeline.statuses.find(s => s.id === statusId || s.reblog?.id === statusId);
      if (originalStatus) break;
    }
    
    // Optimistic update
    this.updateStatus(statusId, { 
      favourited: true,
      favourites_count: (originalStatus?.favourites_count || 0) + 1
    });
    
    try {
      const response = await adapter.likeObject(statusId) as any;
      // Update with server response
      this.updateStatus(statusId, {
        favourited: response.userInteractions?.liked || true,
        favourites_count: response.likes?.totalCount || response.likesCount || (originalStatus?.favourites_count || 0) + 1
      });
    } catch (error) {
      // Revert on error
      this.updateStatus(statusId, { 
        favourited: false,
        favourites_count: (originalStatus?.favourites_count || 1) - 1
      });
      throw error;
    }
  }

  async unfavoriteStatus(statusId: string): Promise<void> {
    const adapter = await getGraphQLAdapter(authStore.currentInstance || undefined);
    
    // Find the status in any timeline
    let originalStatus: Status | undefined;
    for (const timeline of Object.values(this.timelines)) {
      originalStatus = timeline.statuses.find(s => s.id === statusId || s.reblog?.id === statusId);
      if (originalStatus) break;
    }
    
    // Optimistic update
    this.updateStatus(statusId, { 
      favourited: false,
      favourites_count: Math.max(0, (originalStatus?.favourites_count || 1) - 1)
    });
    
    try {
      const response = await adapter.unlikeObject(statusId) as any;
      // Update with server response
      this.updateStatus(statusId, {
        favourited: response.userInteractions?.liked || false,
        favourites_count: response.likes?.totalCount || response.likesCount || Math.max(0, (originalStatus?.favourites_count || 1) - 1)
      });
    } catch (error) {
      // Revert on error
      this.updateStatus(statusId, { 
        favourited: true,
        favourites_count: (originalStatus?.favourites_count || 0) + 1
      });
      throw error;
    }
  }

  async reblogStatus(statusId: string): Promise<void> {
    const adapter = await getGraphQLAdapter(authStore.currentInstance || undefined);
    
    // Find the status in any timeline
    let originalStatus: Status | undefined;
    for (const timeline of Object.values(this.timelines)) {
      originalStatus = timeline.statuses.find(s => s.id === statusId || s.reblog?.id === statusId);
      if (originalStatus) break;
    }
    
    // Optimistic update
    this.updateStatus(statusId, { 
      reblogged: true,
      reblogs_count: (originalStatus?.reblogs_count || 0) + 1
    });
    
    try {
      const response = await adapter.shareObject(statusId) as any;
      // Update with server response
      this.updateStatus(statusId, {
        reblogged: response.userInteractions?.shared || true,
        reblogs_count: response.shares?.totalCount || response.sharesCount || (originalStatus?.reblogs_count || 0) + 1
      });
    } catch (error) {
      // Revert on error
      this.updateStatus(statusId, { 
        reblogged: false,
        reblogs_count: (originalStatus?.reblogs_count || 1) - 1
      });
      throw error;
    }
  }

  async unreblogStatus(statusId: string): Promise<void> {
    const adapter = await getGraphQLAdapter(authStore.currentInstance || undefined);
    
    // Find the status in any timeline
    let originalStatus: Status | undefined;
    for (const timeline of Object.values(this.timelines)) {
      originalStatus = timeline.statuses.find(s => s.id === statusId || s.reblog?.id === statusId);
      if (originalStatus) break;
    }
    
    // Optimistic update
    this.updateStatus(statusId, { 
      reblogged: false,
      reblogs_count: Math.max(0, (originalStatus?.reblogs_count || 1) - 1)
    });
    
    try {
      const response = await adapter.unshareObject(statusId) as any;
      // Update with server response
      this.updateStatus(statusId, {
        reblogged: response.userInteractions?.shared || false,
        reblogs_count: response.shares?.totalCount || response.sharesCount || Math.max(0, (originalStatus?.reblogs_count || 1) - 1)
      });
    } catch (error) {
      // Revert on error
      this.updateStatus(statusId, { 
        reblogged: true,
        reblogs_count: (originalStatus?.reblogs_count || 0) + 1
      });
      throw error;
    }
  }

  async bookmarkStatus(statusId: string): Promise<void> {
    const adapter = await getGraphQLAdapter(authStore.currentInstance || undefined);
    
    // Optimistic update
    this.updateStatus(statusId, { bookmarked: true });
    
    try {
      const response = await adapter.bookmarkObject(statusId) as any;
      // Update with server response
      this.updateStatus(statusId, {
        bookmarked: response.userInteractions?.bookmarked || true
      });
    } catch (error) {
      // Revert on error
      this.updateStatus(statusId, { bookmarked: false });
      throw error;
    }
  }

  async unbookmarkStatus(statusId: string): Promise<void> {
    const adapter = await getGraphQLAdapter(authStore.currentInstance || undefined);
    
    // Optimistic update
    this.updateStatus(statusId, { bookmarked: false });
    
    try {
      const response = await adapter.unbookmarkObject(statusId) as any;
      // Update with server response
      this.updateStatus(statusId, {
        bookmarked: response.userInteractions?.bookmarked || false
      });
    } catch (error) {
      // Revert on error
      this.updateStatus(statusId, { bookmarked: true });
      throw error;
    }
  }

  async deleteStatus(statusId: string): Promise<void> {
    const adapter = await getGraphQLAdapter(authStore.currentInstance || undefined);
    
    try {
      await adapter.deleteObject(statusId);
      // Remove from all timelines
      this.removeStatus(statusId);
    } catch (error) {
      throw error;
    }
  }

  async connectStream(type: string): Promise<void> {
    const timeline = this.timelines[type];
    
    // Don't connect if already connected
    if (timeline?.stream) {
      return;
    }
    
    // Don't connect if not authenticated
    if (!authStore.isAuthenticated || !authStore.currentInstance) {
      logDebug('[Timeline Stream] Cannot connect - not authenticated');
      return;
    }
    
    try {
      const adapter = await getGraphQLAdapter(authStore.currentInstance);
    
    // Determine timeline type for subscription
    let timelineType: 'HOME' | 'PUBLIC' | 'LOCAL' | 'DIRECT' | 'HASHTAG' | 'LIST' = 'HOME';
    let listId: string | undefined;
    
    if (type.startsWith('list:')) {
      timelineType = 'LIST';
      listId = type.replace('list:', '');
    } else {
      switch (type) {
        case 'home':
          timelineType = 'HOME';
          break;
        case 'local':
          timelineType = 'LOCAL';
          break;
        case 'federated':
          timelineType = 'PUBLIC';
          break;
        default:
          console.warn(`[Timeline Stream] Unknown timeline type for streaming: ${type}`);
          return;
      }
    }
    
    // Subscribe to timeline updates
    const subscription = adapter.subscribeToTimelineUpdates({
      type: timelineType,
      listId,
    }).subscribe({
      next: (result: any) => {
        try {
          const update = result.data?.timelineUpdates;
          if (!update) return;

          const status = mapGraphQLToStatus(update);
          const timelineState = this.timelines[type];

          if (!timelineState) return;

          const existing = timelineState.statuses.some(current => current.id === status.id);

          if (existing) {
            this.updateStatus(status.id, status);
          } else {
            this.prependStatus(type, status);
          }
        } catch (error) {
          console.error('[Timeline Stream] Failed to process update:', error);
        }
      },
      error: (error: any) => {
        console.error('[Timeline Stream] Error:', error);
        this.timelines[type] = { ...this.timelines[type], stream: null };
        // Reconnect after delay
        setTimeout(() => {
          this.connectStream(type);
        }, 5000);
      },
      complete: () => {
        logDebug('[Timeline Stream] Connection closed');
        this.timelines[type] = { ...this.timelines[type], stream: null };
      }
    });
    
    this.timelines[type] = { ...this.timelines[type], stream: subscription };
    } catch (error) {
      console.error('[Timeline Stream] Failed to connect stream:', error);
      // Don't retry if no auth token
    }
  }

  disconnectStream(type: string): void {
    const timeline = this.timelines[type];
    
    if (timeline?.stream) {
      timeline.stream.unsubscribe();
      this.timelines[type] = { ...this.timelines[type], stream: null };
    }
  }
}

// Create singleton instance
export const timelineStore = new TimelineStore();
