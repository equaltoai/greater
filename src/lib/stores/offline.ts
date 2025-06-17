import type { CreateStatusParams } from '@/types/mastodon';

interface OfflinePost {
  id: string;
  data: CreateStatusParams;
  timestamp: number;
  retries: number;
  error?: string;
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

// Offline state management with Svelte 5 runes
class OfflineStore {
  posts = $state<OfflinePost[]>([]);
  isOnline = $state(typeof navigator !== 'undefined' ? navigator.onLine : true);
  isSyncing = $state(false);
  
  private offlineDB = new OfflineDB();
  
  constructor() {
    // Load persisted state from localStorage
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('offline-queue');
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          if (parsed.state) {
            this.posts = parsed.state.posts || [];
          }
        } catch (e) {
          console.error('Failed to load offline state:', e);
        }
      }
      
      // Persist state changes to localStorage
      $effect(() => {
        const toPersist = {
          state: {
            posts: this.posts
          }
        };
        localStorage.setItem('offline-queue', JSON.stringify(toPersist));
      });
      
      // Set up online/offline listeners
      window.addEventListener('online', () => {
        this.setOnlineStatus(true);
      });

      window.addEventListener('offline', () => {
        this.setOnlineStatus(false);
      });

      // Listen for sync complete messages from service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data.type === 'sync-complete') {
            this.removePost(event.data.postId);
          }
        });
      }
      
      // Load posts from IndexedDB on startup
      this.offlineDB.getAllPosts().then(posts => {
        this.posts = posts;
      }).catch(console.error);
    }
  }

  addPost(data: CreateStatusParams): string {
    const id = `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const post: OfflinePost = {
      id,
      data,
      timestamp: Date.now(),
      retries: 0
    };

    this.posts = [...this.posts, post];

    // Save to IndexedDB
    this.offlineDB.savePost(post).catch(console.error);

    // Register for background sync if available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        (registration as any).sync?.register('sync-posts').catch(console.error);
      });
    }

    return id;
  }

  removePost(id: string): void {
    this.posts = this.posts.filter(post => post.id !== id);

    // Remove from IndexedDB
    this.offlineDB.deletePost(id).catch(console.error);
  }

  updatePost(id: string, updates: Partial<OfflinePost>): void {
    this.posts = this.posts.map(post => 
      post.id === id ? { ...post, ...updates } : post
    );
  }

  setOnlineStatus(online: boolean): void {
    this.isOnline = online;
    
    // Trigger sync when coming back online
    if (online && this.posts.length > 0) {
      this.syncPosts();
    }
  }

  async syncPosts(): Promise<void> {
    if (!this.isOnline || this.posts.length === 0 || this.isSyncing) {
      return;
    }

    this.isSyncing = true;

    try {
      // Import API client dynamically to avoid circular dependencies
      const { getClient } = await import('@/lib/api/client');
      const client = getClient();

      for (const post of this.posts) {
        try {
          await client.createStatus(post.data);
          this.removePost(post.id);
        } catch (error) {
          // Update retry count and error
          this.updatePost(post.id, {
            retries: post.retries + 1,
            error: error instanceof Error ? error.message : 'Failed to sync'
          });

          // Remove if too many retries
          if (post.retries >= 3) {
            this.removePost(post.id);
          }
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  clearQueue(): void {
    const posts = this.posts;
    this.posts = [];

    // Clear from IndexedDB
    posts.forEach(post => {
      this.offlineDB.deletePost(post.id).catch(console.error);
    });
  }
}

// Create singleton instance
export const offlineStore = new OfflineStore();