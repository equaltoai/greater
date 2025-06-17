/**
 * Timeline state management with Zustand
 * Handles home, local, and federated timelines with caching
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { Status, TimelineParams } from '@/types/mastodon';
import { getClient } from '@/lib/api/client';

interface TimelineState {
  // Timeline data
  home: TimelineData;
  local: TimelineData;
  federated: TimelineData;
  
  // Actions
  loadTimeline: (type: TimelineType, params?: TimelineParams) => Promise<void>;
  loadMore: (type: TimelineType) => Promise<void>;
  refresh: (type: TimelineType) => Promise<void>;
  prependStatus: (type: TimelineType, status: Status) => void;
  updateStatus: (statusId: string, updates: Partial<Status>) => void;
  removeStatus: (statusId: string) => void;
  clearTimeline: (type: TimelineType) => void;
  
  // Interactions
  favoriteStatus: (statusId: string) => Promise<void>;
  unfavoriteStatus: (statusId: string) => Promise<void>;
  reblogStatus: (statusId: string) => Promise<void>;
  unreblogStatus: (statusId: string) => Promise<void>;
  bookmarkStatus: (statusId: string) => Promise<void>;
  unbookmarkStatus: (statusId: string) => Promise<void>;
  
  // Streaming
  connectStream: (type: TimelineType) => void;
  disconnectStream: (type: TimelineType) => void;
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
    home: { ...initialTimelineData },
    local: { ...initialTimelineData },
    federated: { ...initialTimelineData },
    
    loadTimeline: async (type: TimelineType, params?: TimelineParams) => {
      const timeline = get()[type];
      const now = Date.now();
      
      // Skip if recently fetched and not forcing refresh
      if (!params?.since_id && timeline.lastFetch && now - timeline.lastFetch < CACHE_DURATION && timeline.statuses.length > 0) {
        return;
      }
      
      set(state => ({
        [type]: { ...state[type], isLoading: true, error: null }
      }));
      
      try {
        const client = getClient();
        let statuses: Status[];
        
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
        }
        
        set(state => ({
          [type]: {
            ...state[type],
            statuses: params?.since_id 
              ? [...statuses, ...state[type].statuses]
              : statuses,
            hasMore: statuses.length >= (params?.limit || 20),
            isLoading: false,
            lastFetch: now,
            error: null
          }
        }));
      } catch (error) {
        set(state => ({
          [type]: {
            ...state[type],
            isLoading: false,
            error: error as Error
          }
        }));
      }
    },
    
    loadMore: async (type: TimelineType) => {
      const timeline = get()[type];
      
      if (!timeline.hasMore || timeline.isLoadingMore || timeline.statuses.length === 0) {
        return;
      }
      
      const lastStatus = timeline.statuses[timeline.statuses.length - 1];
      
      set(state => ({
        [type]: { ...state[type], isLoadingMore: true }
      }));
      
      try {
        const client = getClient();
        let statuses: Status[];
        
        const params: TimelineParams = {
          max_id: lastStatus.id,
          limit: 20
        };
        
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
        }
        
        set(state => ({
          [type]: {
            ...state[type],
            statuses: [...state[type].statuses, ...statuses],
            hasMore: statuses.length >= 20,
            isLoadingMore: false
          }
        }));
      } catch (error) {
        set(state => ({
          [type]: {
            ...state[type],
            isLoadingMore: false,
            error: error as Error
          }
        }));
      }
    },
    
    refresh: async (type: TimelineType) => {
      const timeline = get()[type];
      
      if (timeline.statuses.length === 0) {
        return get().loadTimeline(type);
      }
      
      const firstStatus = timeline.statuses[0];
      
      try {
        await get().loadTimeline(type, { since_id: firstStatus.id });
      } catch (error) {
        // Failed to refresh timeline - keep existing data
      }
    },
    
    prependStatus: (type: TimelineType, status: Status) => {
      set(state => ({
        [type]: {
          ...state[type],
          statuses: [status, ...state[type].statuses]
        }
      }));
    },
    
    updateStatus: (statusId: string, updates: Partial<Status>) => {
      set(state => {
        const updatedState = { ...state };
        
        // Update in all timelines
        (['home', 'local', 'federated'] as TimelineType[]).forEach(type => {
          updatedState[type] = {
            ...state[type],
            statuses: state[type].statuses.map(status => {
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
        
        return updatedState;
      });
    },
    
    removeStatus: (statusId: string) => {
      set(state => {
        const updatedState = { ...state };
        
        // Remove from all timelines
        (['home', 'local', 'federated'] as TimelineType[]).forEach(type => {
          updatedState[type] = {
            ...state[type],
            statuses: state[type].statuses.filter(status => 
              status.id !== statusId && status.reblog?.id !== statusId
            )
          };
        });
        
        return updatedState;
      });
    },
    
    clearTimeline: (type: TimelineType) => {
      set(state => ({
        [type]: { ...initialTimelineData }
      }));
    },
    
    favoriteStatus: async (statusId: string) => {
      const client = getClient();
      
      // Optimistic update
      get().updateStatus(statusId, { 
        favourited: true,
        favourites_count: (get().home.statuses.find(s => s.id === statusId || s.reblog?.id === statusId)?.favourites_count || 0) + 1
      });
      
      try {
        const status = await client.favouriteStatus(statusId);
        get().updateStatus(statusId, status);
      } catch (error) {
        // Revert on error
        get().updateStatus(statusId, { 
          favourited: false,
          favourites_count: (get().home.statuses.find(s => s.id === statusId || s.reblog?.id === statusId)?.favourites_count || 1) - 1
        });
        throw error;
      }
    },
    
    unfavoriteStatus: async (statusId: string) => {
      const client = getClient();
      
      // Optimistic update
      get().updateStatus(statusId, { 
        favourited: false,
        favourites_count: Math.max(0, (get().home.statuses.find(s => s.id === statusId || s.reblog?.id === statusId)?.favourites_count || 1) - 1)
      });
      
      try {
        const status = await client.unfavouriteStatus(statusId);
        get().updateStatus(statusId, status);
      } catch (error) {
        // Revert on error
        get().updateStatus(statusId, { 
          favourited: true,
          favourites_count: (get().home.statuses.find(s => s.id === statusId || s.reblog?.id === statusId)?.favourites_count || 0) + 1
        });
        throw error;
      }
    },
    
    reblogStatus: async (statusId: string) => {
      const client = getClient();
      
      // Optimistic update
      get().updateStatus(statusId, { 
        reblogged: true,
        reblogs_count: (get().home.statuses.find(s => s.id === statusId || s.reblog?.id === statusId)?.reblogs_count || 0) + 1
      });
      
      try {
        const status = await client.reblogStatus(statusId);
        get().updateStatus(statusId, status);
      } catch (error) {
        // Revert on error
        get().updateStatus(statusId, { 
          reblogged: false,
          reblogs_count: (get().home.statuses.find(s => s.id === statusId || s.reblog?.id === statusId)?.reblogs_count || 1) - 1
        });
        throw error;
      }
    },
    
    unreblogStatus: async (statusId: string) => {
      const client = getClient();
      
      // Optimistic update
      get().updateStatus(statusId, { 
        reblogged: false,
        reblogs_count: Math.max(0, (get().home.statuses.find(s => s.id === statusId || s.reblog?.id === statusId)?.reblogs_count || 1) - 1)
      });
      
      try {
        const status = await client.unreblogStatus(statusId);
        get().updateStatus(statusId, status);
      } catch (error) {
        // Revert on error
        get().updateStatus(statusId, { 
          reblogged: true,
          reblogs_count: (get().home.statuses.find(s => s.id === statusId || s.reblog?.id === statusId)?.reblogs_count || 0) + 1
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
    
    connectStream: (type: TimelineType) => {
      const timeline = get()[type];
      
      // Don't connect if already connected
      if (timeline.stream) {
        return;
      }
      
      const client = getClient();
      let stream: EventSource;
      
      switch (type) {
        case 'home':
          stream = client.streamUser();
          break;
        case 'local':
          stream = client.streamPublic({ local: true });
          break;
        case 'federated':
          stream = client.streamPublic();
          break;
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
        [type]: { ...state[type], stream }
      }));
    },
    
    disconnectStream: (type: TimelineType) => {
      const timeline = get()[type];
      
      if (timeline.stream) {
        timeline.stream.close();
        set(state => ({
          [type]: { ...state[type], stream: null }
        }));
      }
    }
  }))
);

// Subscribe to auth changes to clear timelines
import { useAuthStore } from './auth';

useAuthStore.subscribe(
  state => state.currentInstance,
  (instance, previousInstance) => {
    if (instance !== previousInstance) {
      // Clear all timelines when switching instances
      const store = useTimelineStore.getState();
      store.clearTimeline('home');
      store.clearTimeline('local');
      store.clearTimeline('federated');
    }
  }
);