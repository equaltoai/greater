/**
 * Timeline state management with Svelte 5
 * Handles home, local, and federated timelines with caching
 */

import type { Status, TimelineParams } from '@/types/mastodon';
import { getClient } from '@/lib/api/client';

interface TimelineData {
  statuses: Status[];
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  lastFetch: number;
  stream: EventSource | null;
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

  constructor() {
    // Subscribe to auth changes to clear timelines
    if (typeof window !== 'undefined') {
      let previousInstance: string | null = null;
      $effect(() => {
        if (authStore.currentInstance !== previousInstance) {
          // Clear all timelines when switching instances
          if (previousInstance !== null) {
            Object.keys(this.timelines).forEach(type => {
              this.disconnectStream(type);
              this.clearTimeline(type);
            });
          }
          previousInstance = authStore.currentInstance;
        }
      });
    }
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
      const client = getClient();
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
      
      this.timelines[type] = {
        ...this.timelines[type],
        statuses: params?.since_id 
          ? [...statuses, ...this.timelines[type].statuses]
          : statuses,
        hasMore: statuses.length >= (params?.limit || 20),
        isLoading: false,
        lastFetch: now,
        error: null
      };
      this.isLoading = false;
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
      const client = getClient();
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
    // Update in all timelines
    Object.entries(this.timelines).forEach(([type, timeline]) => {
      this.timelines[type] = {
        ...timeline,
        statuses: timeline.statuses.map(status => {
          if (status.id === statusId) {
            return { ...status, ...updates };
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
    const client = getClient();
    
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
    const client = getClient();
    
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
    const client = getClient();
    
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
    const client = getClient();
    
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
    const client = getClient();
    
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
    const client = getClient();
    
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
    let stream: EventSource;
    
    if (type.startsWith('list:')) {
      const listId = type.replace('list:', '');
      stream = await client.streamList(listId);
    } else {
      switch (type) {
        case 'home':
          stream = await client.streamUser();
          break;
        case 'local':
          stream = await client.streamPublic({ local: true });
          break;
        case 'federated':
          stream = await client.streamPublic();
          break;
        default:
          throw new Error(`Unknown timeline type for streaming: ${type}`);
      }
    }
    
    stream.addEventListener('update', (event) => {
      try {
        const status = JSON.parse(event.data) as Status;
        this.prependStatus(type, status);
      } catch (error) {
        // Failed to parse streaming update - skip this update
      }
    });
    
    stream.addEventListener('delete', (event) => {
      const statusId = event.data;
      this.removeStatus(statusId);
    });
    
    stream.addEventListener('error', () => {
      // Stream error - attempting reconnection
      stream.close();
      
      // Reconnect after delay
      setTimeout(() => {
        this.connectStream(type);
      }, 5000);
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

// Import auth store
import { authStore } from './auth';