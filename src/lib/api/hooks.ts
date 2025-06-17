/**
 * Svelte stores for API operations
 */

import { readable, writable, derived } from 'svelte/store';
import type { Readable, Writable } from 'svelte/store';
import type { Status, Account, Notification, TimelineParams } from '@/types/mastodon';
import { getClient } from './client';
import { APIError } from './client';

// Generic store for API calls
interface APIState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function createAPIStore<T>(
  fetcher: () => Promise<T>
): Readable<APIState<T>> & { refetch: () => Promise<void> } {
  const { subscribe, set } = writable<APIState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const refetch = async () => {
    set({ data: null, loading: true, error: null });
    try {
      const data = await fetcher();
      set({ data, loading: false, error: null });
    } catch (error) {
      set({ data: null, loading: false, error: error as Error });
    }
  };

  // Initial fetch
  refetch();

  return {
    subscribe,
    refetch,
  };
}

// Timeline store
export function createTimelineStore(
  endpoint: 'home' | 'public' | 'local' | 'tag' | 'list',
  params?: TimelineParams & { tag?: string; listId?: string }
) {
  const statuses = writable<Status[]>([]);
  const loading = writable(false);
  const error = writable<Error | null>(null);
  const hasMore = writable(true);

  const loadMore = async () => {
    const $statuses = await new Promise<Status[]>((resolve) => {
      statuses.subscribe((value) => {
        resolve(value);
      })();
    });

    if ($statuses.length === 0) return;

    loading.set(true);
    error.set(null);

    try {
      const client = await getClient();
      const lastStatus = $statuses[$statuses.length - 1];
      let newStatuses: Status[] = [];
      switch (endpoint) {
        case 'home':
          newStatuses = await client.getHomeTimeline({
            ...params,
            max_id: lastStatus.id,
          });
          break;
        case 'public':
          newStatuses = await client.getPublicTimeline({
            ...params,
            max_id: lastStatus.id,
          });
          break;
        case 'local':
          newStatuses = await client.getLocalTimeline({
            ...params,
            max_id: lastStatus.id,
          });
          break;
        case 'tag':
          if (params?.tag) {
            newStatuses = await client.getTagTimeline(params.tag, {
              ...params,
              max_id: lastStatus.id,
            });
          }
          break;
        case 'list':
          if (params?.listId) {
            newStatuses = await client.getListTimeline(params.listId, {
              max_id: lastStatus.id,
            });
          }
          break;
      }

      if (newStatuses.length === 0) {
        hasMore.set(false);
      } else {
        statuses.update((s) => [...s, ...newStatuses]);
      }
    } catch (e) {
      error.set(e as Error);
    } finally {
      loading.set(false);
    }
  };

  const refresh = async () => {
    loading.set(true);
    error.set(null);

    try {
      const client = await getClient();
      let newStatuses: Status[] = [];
      switch (endpoint) {
        case 'home':
          newStatuses = await client.getHomeTimeline(params);
          break;
        case 'public':
          newStatuses = await client.getPublicTimeline(params);
          break;
        case 'local':
          newStatuses = await client.getLocalTimeline(params);
          break;
        case 'tag':
          if (params?.tag) {
            newStatuses = await client.getTagTimeline(params.tag, params);
          }
          break;
        case 'list':
          if (params?.listId) {
            newStatuses = await client.getListTimeline(params.listId);
          }
          break;
      }
      statuses.set(newStatuses);
      hasMore.set(true);
    } catch (e) {
      error.set(e as Error);
    } finally {
      loading.set(false);
    }
  };

  // Initial load
  refresh();

  return {
    statuses: { subscribe: statuses.subscribe },
    loading: { subscribe: loading.subscribe },
    error: { subscribe: error.subscribe },
    hasMore: { subscribe: hasMore.subscribe },
    loadMore,
    refresh,
  };
}

// Account store
export function createAccountStore(id: string) {
  return createAPIStore(async () => {
    const client = await getClient();
    return client.getAccount(id);
  });
}

// Notifications store
export function createNotificationsStore() {
  const notifications = writable<Notification[]>([]);
  const loading = writable(false);
  const error = writable<Error | null>(null);
  const hasMore = writable(true);

  const loadMore = async () => {
    const $notifications = await new Promise<Notification[]>((resolve) => {
      notifications.subscribe((value) => {
        resolve(value);
      })();
    });

    if ($notifications.length === 0) return;

    loading.set(true);
    error.set(null);

    try {
      const client = await getClient();
      const lastNotification = $notifications[$notifications.length - 1];
      const newNotifications = await client.getNotifications({
        max_id: lastNotification.id,
      });

      if (newNotifications.length === 0) {
        hasMore.set(false);
      } else {
        notifications.update((n) => [...n, ...newNotifications]);
      }
    } catch (e) {
      error.set(e as Error);
    } finally {
      loading.set(false);
    }
  };

  const refresh = async () => {
    loading.set(true);
    error.set(null);

    try {
      const client = await getClient();
      const newNotifications = await client.getNotifications();
      notifications.set(newNotifications);
      hasMore.set(true);
    } catch (e) {
      error.set(e as Error);
    } finally {
      loading.set(false);
    }
  };

  // Initial load
  refresh();

  return {
    notifications: { subscribe: notifications.subscribe },
    loading: { subscribe: loading.subscribe },
    error: { subscribe: error.subscribe },
    hasMore: { subscribe: hasMore.subscribe },
    loadMore,
    refresh,
  };
}