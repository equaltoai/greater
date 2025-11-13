import type { CreateStatusParams } from '$lib/types/mastodon';
import { getGraphQLAdapter } from '$lib/api/graphql-client';
import type { LesserGraphQLAdapter } from '@equaltoai/greater-components/adapters';

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
    // Constructor is empty to avoid SSR issues
  }
  
  initialize() {
    if (typeof window === 'undefined') return;
    
    // Load persisted state from localStorage
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
  
  private persist() {
    if (typeof window === 'undefined') return;
    
    const toPersist = {
      state: {
        posts: this.posts
      }
    };
    localStorage.setItem('offline-queue', JSON.stringify(toPersist));
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
      const adapter = await getGraphQLAdapter();

      for (const post of this.posts) {
        try {
          const variables = mapCreateStatusParamsToGraphQL(post.data);
          await adapter.createNote(variables);
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

/**
 * Map CreateStatusParams (Mastodon REST shape) into Lesser GraphQL createNote variables.
 */
type CreateNoteVariables = Parameters<LesserGraphQLAdapter['createNote']>[0];

function mapCreateStatusParamsToGraphQL(params: CreateStatusParams): CreateNoteVariables {
  const variables: Record<string, unknown> = {
    content: params.status ?? '',
    visibility: mapVisibilityToGraphQL(params.visibility ?? 'public'),
    sensitive: params.sensitive ?? false,
  };

  if (params.spoiler_text) {
    variables.summary = params.spoiler_text;
  }

  if (params.in_reply_to_id) {
    variables.inReplyToId = params.in_reply_to_id;
  }

  if (params.media_ids?.length) {
    variables.mediaIds = [...params.media_ids];
  }

  if (params.poll) {
    variables.poll = {
      options: [...params.poll.options],
      expiresIn: params.poll.expires_in,
      multiple: params.poll.multiple ?? false,
      hideTotals: params.poll.hide_totals ?? false,
    };
  }

  if (params.language) {
    variables.language = params.language;
  }

  return variables as unknown as CreateNoteVariables;
}

/**
 * Convert Mastodon visibility strings into Lesser GraphQL enum values.
 */
function mapVisibilityToGraphQL(
  visibility: NonNullable<CreateStatusParams['visibility']>
): 'PUBLIC' | 'UNLISTED' | 'FOLLOWERS' | 'DIRECT' {
  const visibilityMap = {
    public: 'PUBLIC',
    unlisted: 'UNLISTED',
    private: 'FOLLOWERS',
    direct: 'DIRECT',
  } as const;

  return visibilityMap[visibility] ?? 'PUBLIC';
}
