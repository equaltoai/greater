/**
 * Timeline state management with Zustand
 * Handles home, local, and federated timelines with caching
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Status, TimelineParams } from '@/types/mastodon';
import { getClient } from '@/lib/api/client';

interface TimelineState {
  // Timeline data - supports dynamic timeline types
  timelines: Record<string, TimelineData>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadTimeline: (type: string, params?: TimelineParams) => Promise<void>;
  loadMore: (type: string) => Promise<void>;
  refreshTimeline: (type: string) => Promise<void>;
  prependStatus: (type: string, status: Status) => void;
  updateStatus: (statusId: string, updates: Partial<Status>) => void;
  removeStatus: (statusId: string) => void;
  clearTimeline: (type: string) => void;
  
  // Interactions
  favoriteStatus: (statusId: string) => Promise<void>;
  unfavoriteStatus: (statusId: string) => Promise<void>;
  reblogStatus: (statusId: string) => Promise<void>;
  unreblogStatus: (statusId: string) => Promise<void>;
  bookmarkStatus: (statusId: string) => Promise<void>;
  unbookmarkStatus: (statusId: string) => Promise<void>;
  deleteStatus: (statusId: string) => Promise<void>;
  
  // Streaming
  connectStream: (type: string) => Promise<void>;
  disconnectStream: (type: string) => void;
}

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

export const useTimelineStore = create<TimelineState>()(
  subscribeWithSelector((set, get) => ({
    timelines: {},
    isLoading: false,
    error: null,
    
    loadTimeline: async (type: string, params?: TimelineParams) => {
      const timeline = get().timelines[type] || { ...initialTimelineData };
      const now = Date.now();
      
      // Skip if recently fetched and not forcing refresh
      if (!params?.since_id && timeline.lastFetch && now - timeline.lastFetch < CACHE_DURATION && timeline.statuses.length > 0) {
        return;
      }
      
      set({ isLoading: true, error: null });
      
      // Initialize timeline if doesn't exist
      if (!get().timelines[type]) {
        set(state => ({
          timelines: { ...state.timelines, [type]: { ...initialTimelineData } }
        }));
      }
      
      set(state => ({
        timelines: {
          ...state.timelines,
          [type]: { ...state.timelines[type], isLoading: true, error: null }
        }
      }));
      
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
        
        set(state => ({
          timelines: {
            ...state.timelines,
            [type]: {
              ...state.timelines[type],
              statuses: params?.since_id 
                ? [...statuses, ...state.timelines[type].statuses]
                : statuses,
              hasMore: statuses.length >= (params?.limit || 20),
              isLoading: false,
              lastFetch: now,
              error: null
            }
          },
          isLoading: false
        }));
      } catch (error) {
        set(state => ({
          timelines: {
            ...state.timelines,
            [type]: {
              ...state.timelines[type],
              isLoading: false,
              error: error as Error
            }
          },
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load timeline'
        }));
      }
    },
    
    loadMore: async (type: string) => {
      const timeline = get().timelines[type];
      
      if (!timeline || !timeline.hasMore || timeline.isLoadingMore || timeline.statuses.length === 0) {
        return;
      }
      
      const lastStatus = timeline.statuses[timeline.statuses.length - 1];
      
      set(state => ({
        timelines: {
          ...state.timelines,
          [type]: { ...state.timelines[type], isLoadingMore: true }
        }
      }));
      
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
        
        set(state => ({
          timelines: {
            ...state.timelines,
            [type]: {
              ...state.timelines[type],
              statuses: [...state.timelines[type].statuses, ...statuses],
              hasMore: statuses.length >= 20,
              isLoadingMore: false
            }
          }
        }));
      } catch (error) {
        set(state => ({
          timelines: {
            ...state.timelines,
            [type]: {
              ...state.timelines[type],
              isLoadingMore: false,
              error: error as Error
            }
          }
        }));
      }
    },
    
    refreshTimeline: async (type: string) => {
      const timeline = get().timelines[type];
      
      if (!timeline || timeline.statuses.length === 0) {
        return get().loadTimeline(type);
      }
      
      const firstStatus = timeline.statuses[0];
      
      try {
        await get().loadTimeline(type, { since_id: firstStatus.id });
      } catch (error) {
        // Failed to refresh timeline - keep existing data
      }
    },
    
    prependStatus: (type: string, status: Status) => {
      set(state => ({
        timelines: {
          ...state.timelines,
          [type]: {
            ...state.timelines[type],
            statuses: [status, ...state.timelines[type].statuses]
          }
        }
      }));
    },
    
    updateStatus: (statusId: string, updates: Partial<Status>) => {
      set(state => {
        const updatedTimelines: Record<string, TimelineData> = {};
        
        // Update in all timelines
        Object.entries(state.timelines).forEach(([type, timeline]) => {
          updatedTimelines[type] = {
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
        
        return { ...state, timelines: updatedTimelines };
      });
    },
    
    removeStatus: (statusId: string) => {
      set(state => {
        const updatedTimelines: Record<string, TimelineData> = {};
        
        // Remove from all timelines
        Object.entries(state.timelines).forEach(([type, timeline]) => {
          updatedTimelines[type] = {
            ...timeline,
            statuses: timeline.statuses.filter(status => 
              status.id !== statusId && status.reblog?.id !== statusId
            )
          };
        });
        
        return { ...state, timelines: updatedTimelines };
      });
    },
    
    clearTimeline: (type: string) => {
      set(state => ({
        timelines: {
          ...state.timelines,
          [type]: { ...initialTimelineData }
        }
      }));
    },
    
    favoriteStatus: async (statusId: string) => {
      const client = getClient();
      
      // Find the status in any timeline
      let originalStatus: Status | undefined;
      for (const timeline of Object.values(get().timelines)) {
        originalStatus = timeline.statuses.find(s => s.id === statusId || s.reblog?.id === statusId);
        if (originalStatus) break;
      }
      
      // Optimistic update
      get().updateStatus(statusId, { 
        favourited: true,
        favourites_count: (originalStatus?.favourites_count || 0) + 1
      });
      
      try {
        const status = await client.favouriteStatus(statusId);
        get().updateStatus(statusId, status);
      } catch (error) {
        // Revert on error
        get().updateStatus(statusId, { 
          favourited: false,
          favourites_count: (originalStatus?.favourites_count || 1) - 1
        });
        throw error;
      }
    },
    
    unfavoriteStatus: async (statusId: string) => {
      const client = getClient();
      
      // Find the status in any timeline
      let originalStatus: Status | undefined;
      for (const timeline of Object.values(get().timelines)) {
        originalStatus = timeline.statuses.find(s => s.id === statusId || s.reblog?.id === statusId);
        if (originalStatus) break;
      }
      
      // Optimistic update
      get().updateStatus(statusId, { 
        favourited: false,
        favourites_count: Math.max(0, (originalStatus?.favourites_count || 1) - 1)
      });
      
      try {
        const status = await client.unfavouriteStatus(statusId);
        get().updateStatus(statusId, status);
      } catch (error) {
        // Revert on error
        get().updateStatus(statusId, { 
          favourited: true,
          favourites_count: (originalStatus?.favourites_count || 0) + 1
        });
        throw error;
      }
    },
    
    reblogStatus: async (statusId: string) => {
      const client = getClient();
      
      // Find the status in any timeline
      let originalStatus: Status | undefined;
      for (const timeline of Object.values(get().timelines)) {
        originalStatus = timeline.statuses.find(s => s.id === statusId || s.reblog?.id === statusId);
        if (originalStatus) break;
      }
      
      // Optimistic update
      get().updateStatus(statusId, { 
        reblogged: true,
        reblogs_count: (originalStatus?.reblogs_count || 0) + 1
      });
      
      try {
        const status = await client.reblogStatus(statusId);
        get().updateStatus(statusId, status);
      } catch (error) {
        // Revert on error
        get().updateStatus(statusId, { 
          reblogged: false,
          reblogs_count: (originalStatus?.reblogs_count || 1) - 1
        });
        throw error;
      }
    },
    
    unreblogStatus: async (statusId: string) => {
      const client = getClient();
      
      // Find the status in any timeline
      let originalStatus: Status | undefined;
      for (const timeline of Object.values(get().timelines)) {
        originalStatus = timeline.statuses.find(s => s.id === statusId || s.reblog?.id === statusId);
        if (originalStatus) break;
      }
      
      // Optimistic update
      get().updateStatus(statusId, { 
        reblogged: false,
        reblogs_count: Math.max(0, (originalStatus?.reblogs_count || 1) - 1)
      });
      
      try {
        const status = await client.unreblogStatus(statusId);
        get().updateStatus(statusId, status);
      } catch (error) {
        // Revert on error
        get().updateStatus(statusId, { 
          reblogged: true,
          reblogs_count: (originalStatus?.reblogs_count || 0) + 1
        });
        throw error;
      }
    },
    
    bookmarkStatus: async (statusId: string) => {
      const client = getClient();
      
      // Optimistic update
      get().updateStatus(statusId, { bookmarked: true });
      
      try {
        const status = await client.bookmarkStatus(statusId);
        get().updateStatus(statusId, status);
      } catch (error) {
        // Revert on error
        get().updateStatus(statusId, { bookmarked: false });
        throw error;
      }
    },
    
    unbookmarkStatus: async (statusId: string) => {
      const client = getClient();
      
      // Optimistic update
      get().updateStatus(statusId, { bookmarked: false });
      
      try {
        const status = await client.unbookmarkStatus(statusId);
        get().updateStatus(statusId, status);
      } catch (error) {
        // Revert on error
        get().updateStatus(statusId, { bookmarked: true });
        throw error;
      }
    },

    deleteStatus: async (statusId: string) => {
      const client = getClient();
      
      try {
        await client.deleteStatus(statusId);
        // Remove from all timelines
        get().removeStatus(statusId);
      } catch (error) {
        throw error;
      }
    },
    
    connectStream: async (type: string) => {
      const timeline = get().timelines[type];
      
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
          get().prependStatus(type, status);
        } catch (error) {
          // Failed to parse streaming update - skip this update
        }
      });
      
      stream.addEventListener('delete', (event) => {
        const statusId = event.data;
        get().removeStatus(statusId);
      });
      
      stream.addEventListener('error', () => {
        // Stream error - attempting reconnection
        stream.close();
        
        // Reconnect after delay
        setTimeout(() => {
          get().connectStream(type);
        }, 5000);
      });
      
      set(state => ({
        timelines: {
          ...state.timelines,
          [type]: { ...state.timelines[type], stream }
        }
      }));
    },
    
    disconnectStream: (type: string) => {
      const timeline = get().timelines[type];
      
      if (timeline?.stream) {
        timeline.stream.close();
        set(state => ({
          timelines: {
            ...state.timelines,
            [type]: { ...state.timelines[type], stream: null }
          }
        }));
      }
    }
  }))
);

// Subscribe to auth changes to clear timelines
import { useAuthStore } from './auth';

// Subscribe to auth changes to clear timelines
let previousInstance: string | null = null;
useAuthStore.subscribe((state) => {
  if (state.currentInstance !== previousInstance) {
    // Clear all timelines when switching instances
    if (previousInstance !== null) {
      const store = useTimelineStore.getState();
      Object.keys(store.timelines).forEach(type => {
        store.disconnectStream(type);
        store.clearTimeline(type);
      });
    }
    previousInstance = state.currentInstance;
  }
});