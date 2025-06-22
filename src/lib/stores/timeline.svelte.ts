/**
 * Timeline state management with Svelte 5
 * Handles home, local, and federated timelines with caching
 */

import type { Status, TimelineParams } from '@/types/mastodon';
import { getClient } from '@/lib/api/client';
import { authStore } from './auth.svelte';

interface TimelineData {
  statuses: Status[];
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  lastFetch: number;
  stream: EventSource | { close: () => void } | null;
  gaps: TimelineGap[];
}

interface TimelineGap {
  above: string; // Status ID above the gap
  below: string; // Status ID below the gap
}

export type TimelineType = 'home' | 'local' | 'federated';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const initialTimelineData: TimelineData = {
  statuses: [],
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  lastFetch: 0,
  stream: null,
  gaps: []
};

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
      console.log('[Timeline Store] Loading timeline:', {
        type,
        currentInstance: authStore.currentInstance,
        isAuthenticated: authStore.isAuthenticated,
        currentUser: authStore.currentUser?.username
      });
      
      const client = getClient(authStore.currentInstance || undefined);
      let statuses: Status[];
      
      if (type.startsWith('list:')) {
        const listId = type.replace('list:', '');
        statuses = await client.getListTimeline(listId, params);
      } else {
        switch (type) {
          case 'home':
            statuses = await client.getHomeTimeline(params);
            break;
          case 'local':
            statuses = await client.getLocalTimeline(params);
            break;
          case 'federated':
            statuses = await client.getPublicTimeline(params);
            break;
          default:
            throw new Error(`Unknown timeline type: ${type}`);
        }
      }
      
      console.log('[Timeline Store] Loaded statuses:', statuses.length);
      console.log('[Timeline Store] First status:', statuses[0]);
      console.log('[Timeline Store] All statuses:', statuses);
      
      const updatedTimeline = {
        ...this.timelines[type],
        statuses: params?.since_id 
          ? [...statuses, ...this.timelines[type].statuses]
          : statuses,
        hasMore: statuses.length >= (params?.limit || 20),
        isLoading: false,
        lastFetch: now,
        error: null
      };
      
      console.log('[Timeline Store] Setting timeline state:', {
        type,
        statusCount: updatedTimeline.statuses.length,
        isLoading: updatedTimeline.isLoading,
        error: updatedTimeline.error
      });
      
      this.timelines[type] = updatedTimeline;
      this.isLoading = false;
      
      console.log('[Timeline Store] Timeline state after update:', this.timelines[type]);
    } catch (error) {
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
    
    if (!timeline || !timeline.hasMore || timeline.isLoadingMore || timeline.statuses.length === 0) {
      return;
    }
    
    const lastStatus = timeline.statuses[timeline.statuses.length - 1];
    
    this.timelines[type] = { ...this.timelines[type], isLoadingMore: true };
    
    try {
      const client = getClient(authStore.currentInstance || undefined);
      let statuses: Status[];
      
      const params: TimelineParams = {
        max_id: lastStatus.id,
        limit: 20
      };
      
      if (type.startsWith('list:')) {
        const listId = type.replace('list:', '');
        statuses = await client.getListTimeline(listId, params);
      } else {
        switch (type) {
          case 'home':
            statuses = await client.getHomeTimeline(params);
            break;
          case 'local':
            statuses = await client.getLocalTimeline(params);
            break;
          case 'federated':
            statuses = await client.getPublicTimeline(params);
            break;
          default:
            throw new Error(`Unknown timeline type: ${type}`);
        }
      }
      
      this.timelines[type] = {
        ...this.timelines[type],
        statuses: [...this.timelines[type].statuses, ...statuses],
        hasMore: statuses.length >= 20,
        isLoadingMore: false
      };
    } catch (error) {
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
    
    const firstStatus = timeline.statuses[0];
    
    try {
      await this.loadTimeline(type, { since_id: firstStatus.id });
    } catch (error) {
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
    console.log('[Timeline Store] Updating status:', { statusId, updates });
    
    // Update in all timelines
    Object.entries(this.timelines).forEach(([type, timeline]) => {
      this.timelines[type] = {
        ...timeline,
        statuses: timeline.statuses.map(status => {
          if (status.id === statusId) {
            const updated = { ...status, ...updates };
            console.log('[Timeline Store] Status updated:', { 
              id: statusId, 
              wasFavorited: status.favourited, 
              isFavorited: updated.favourited,
              wasBookmarked: status.bookmarked,
              isBookmarked: updated.bookmarked,
              hadContent: !!status.content,
              hasContent: !!updated.content
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
    const client = getClient(authStore.currentInstance || undefined);
    
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
      const status = await client.favouriteStatus(statusId);
      this.updateStatus(statusId, status);
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
    const client = getClient(authStore.currentInstance || undefined);
    
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
      const status = await client.unfavouriteStatus(statusId);
      this.updateStatus(statusId, status);
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
    const client = getClient(authStore.currentInstance || undefined);
    
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
      const status = await client.reblogStatus(statusId);
      this.updateStatus(statusId, status);
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
    const client = getClient(authStore.currentInstance || undefined);
    
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
      const status = await client.unreblogStatus(statusId);
      this.updateStatus(statusId, status);
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
    const client = getClient(authStore.currentInstance || undefined);
    
    // Optimistic update
    this.updateStatus(statusId, { bookmarked: true });
    
    try {
      const status = await client.bookmarkStatus(statusId);
      this.updateStatus(statusId, status);
    } catch (error) {
      // Revert on error
      this.updateStatus(statusId, { bookmarked: false });
      throw error;
    }
  }

  async unbookmarkStatus(statusId: string): Promise<void> {
    const client = getClient(authStore.currentInstance || undefined);
    
    // Optimistic update
    this.updateStatus(statusId, { bookmarked: false });
    
    try {
      const status = await client.unbookmarkStatus(statusId);
      this.updateStatus(statusId, status);
    } catch (error) {
      // Revert on error
      this.updateStatus(statusId, { bookmarked: true });
      throw error;
    }
  }

  async deleteStatus(statusId: string): Promise<void> {
    const client = getClient();
    
    try {
      await client.deleteStatus(statusId);
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
    
    const client = getClient();
    let streamType: 'user' | 'public' | 'hashtag' | 'list';
    let params: Record<string, string> = {};
    
    if (type.startsWith('list:')) {
      const listId = type.replace('list:', '');
      streamType = 'list';
      params.list = listId;
    } else {
      switch (type) {
        case 'home':
          streamType = 'user';
          break;
        case 'local':
          streamType = 'public';
          params.local = 'true';
          break;
        case 'federated':
          streamType = 'public';
          break;
        default:
          throw new Error(`Unknown timeline type for streaming: ${type}`);
      }
    }
    
    const stream = await client.createStream(streamType, params, {
      onMessage: (event) => {
        try {
          // The event.type property is set by our WebSocket wrapper
          // For SSE, we need to check the actual event type
          const eventType = (event as any).type || event.type;
          
          if (eventType === 'update') {
            const status = JSON.parse(event.data) as Status;
            this.prependStatus(type, status);
          } else if (eventType === 'delete') {
            const statusId = event.data;
            this.removeStatus(statusId);
          }
        } catch (error) {
          // Failed to parse streaming update - skip this update
          console.error('[Timeline Stream] Failed to parse event:', error);
        }
      },
      onError: (error) => {
        console.error('[Timeline Stream] Error:', error);
        // Reconnect after delay
        setTimeout(() => {
          this.connectStream(type);
        }, 5000);
      },
      onClose: () => {
        console.log('[Timeline Stream] Connection closed');
        this.timelines[type] = { ...this.timelines[type], stream: null };
      }
    });
    
    this.timelines[type] = { ...this.timelines[type], stream };
  }

  disconnectStream(type: string): void {
    const timeline = this.timelines[type];
    
    if (timeline?.stream) {
      timeline.stream.close();
      this.timelines[type] = { ...this.timelines[type], stream: null };
    }
  }
}

// Create singleton instance
export const timelineStore = new TimelineStore();