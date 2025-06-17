import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CreateStatusParams } from '@/types/mastodon';

interface OfflinePost {
  id: string;
  data: CreateStatusParams;
  timestamp: number;
  retries: number;
  error?: string;
}

interface OfflineState {
  posts: OfflinePost[];
  isOnline: boolean;
  isSyncing: boolean;
  
  // Actions
  addPost: (data: CreateStatusParams) => string;
  removePost: (id: string) => void;
  updatePost: (id: string, updates: Partial<OfflinePost>) => void;
  setOnlineStatus: (online: boolean) => void;
  syncPosts: () => Promise<void>;
  clearQueue: () => void;
}

// IndexedDB wrapper for offline storage
class OfflineDB {
  private dbName = 'greater-offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('offline-posts')) {
          db.createObjectStore('offline-posts', { keyPath: 'id' });
        }
      };
    });
  }

  async savePost(post: OfflinePost): Promise<void> {
    const db = await this.open();
    const tx = db.transaction('offline-posts', 'readwrite');
    await tx.objectStore('offline-posts').put(post);
  }

  async deletePost(id: string): Promise<void> {
    const db = await this.open();
    const tx = db.transaction('offline-posts', 'readwrite');
    await tx.objectStore('offline-posts').delete(id);
  }

  async getAllPosts(): Promise<OfflinePost[]> {
    const db = await this.open();
    const tx = db.transaction('offline-posts', 'readonly');
    return new Promise((resolve, reject) => {
      const request = tx.objectStore('offline-posts').getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

const offlineDB = new OfflineDB();

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      posts: [],
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSyncing: false,

      addPost: (data) => {
        const id = `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const post: OfflinePost = {
          id,
          data,
          timestamp: Date.now(),
          retries: 0
        };

        set(state => ({
          posts: [...state.posts, post]
        }));

        // Save to IndexedDB
        offlineDB.savePost(post).catch(console.error);

        // Register for background sync if available
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          navigator.serviceWorker.ready.then(registration => {
            registration.sync.register('sync-posts').catch(console.error);
          });
        }

        return id;
      },

      removePost: (id) => {
        set(state => ({
          posts: state.posts.filter(post => post.id !== id)
        }));

        // Remove from IndexedDB
        offlineDB.deletePost(id).catch(console.error);
      },

      updatePost: (id, updates) => {
        set(state => ({
          posts: state.posts.map(post => 
            post.id === id ? { ...post, ...updates } : post
          )
        }));
      },

      setOnlineStatus: (online) => {
        set({ isOnline: online });
        
        // Trigger sync when coming back online
        if (online && get().posts.length > 0) {
          get().syncPosts();
        }
      },

      syncPosts: async () => {
        const { posts, isOnline } = get();
        
        if (!isOnline || posts.length === 0 || get().isSyncing) {
          return;
        }

        set({ isSyncing: true });

        try {
          // Import API client dynamically to avoid circular dependencies
          const { api } = await import('@/lib/api/client');
          const client = await api();

          for (const post of posts) {
            try {
              await client.createStatus(post.data);
              get().removePost(post.id);
            } catch (error) {
              // Update retry count and error
              get().updatePost(post.id, {
                retries: post.retries + 1,
                error: error instanceof Error ? error.message : 'Failed to sync'
              });

              // Remove if too many retries
              if (post.retries >= 3) {
                get().removePost(post.id);
              }
            }
          }
        } finally {
          set({ isSyncing: false });
        }
      },

      clearQueue: () => {
        const posts = get().posts;
        set({ posts: [] });

        // Clear from IndexedDB
        posts.forEach(post => {
          offlineDB.deletePost(post.id).catch(console.error);
        });
      }
    }),
    {
      name: 'offline-queue',
      partialize: (state) => ({ posts: state.posts })
    }
  )
);

// Set up online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useOfflineStore.getState().setOnlineStatus(true);
  });

  window.addEventListener('offline', () => {
    useOfflineStore.getState().setOnlineStatus(false);
  });

  // Listen for sync complete messages from service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'sync-complete') {
        useOfflineStore.getState().removePost(event.data.postId);
      }
    });
  }
}

// Load posts from IndexedDB on startup
if (typeof window !== 'undefined') {
  offlineDB.getAllPosts().then(posts => {
    useOfflineStore.setState({ posts });
  }).catch(console.error);
}