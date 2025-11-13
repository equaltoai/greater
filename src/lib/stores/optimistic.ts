/**
 * Optimistic updates for better UX
 * Updates UI immediately while API calls happen in background
 * 
 * NOTE: This module is now deprecated. The timeline store handles
 * optimistic updates directly using GraphQL mutations.
 * Kept for backward compatibility with components not yet migrated.
 */

import { timelineStore } from './timeline.svelte';
import { getGraphQLAdapter } from '$lib/api/graphql-client';
import type { Status } from '$lib/types/mastodon';
import type { TimelineData } from './timeline.svelte';

interface OptimisticUpdate {
  id: string;
  type: 'favorite' | 'reblog' | 'bookmark';
  statusId: string;
  previousState: boolean;
  timestamp: number;
}

// Track pending updates
const pendingUpdates = new Map<string, OptimisticUpdate>();

/**
 * Optimistically toggle favorite status
 * Migrated to GraphQL
 */
export async function toggleFavorite(status: Status): Promise<void> {
  const updateId = crypto.randomUUID();
  const previousState = status.favourited || false;
  const newState = !previousState;
  
  // Store pending update
  pendingUpdates.set(updateId, {
    id: updateId,
    type: 'favorite',
    statusId: status.id,
    previousState,
    timestamp: Date.now()
  });
  
  // Optimistic update
  timelineStore.updateStatus(status.id, {
    favourited: newState,
    favourites_count: status.favourites_count + (newState ? 1 : -1)
  });
  
  try {
    const adapter = await getGraphQLAdapter();
    const response = newState
      ? await adapter.likeObject(status.id)
      : await adapter.unlikeObject(status.id);
    
    // Update with server response
    // Response might be boolean or object - use type assertion
    const responseObj = typeof response === 'object' ? (response as any) : null;
    const liked = responseObj?.userInteractions?.liked ?? newState;
    const likesCount = responseObj?.likes?.totalCount ?? status.favourites_count;
    
    timelineStore.updateStatus(status.id, {
      favourited: liked,
      favourites_count: likesCount
    });
    
    // Remove from pending
    pendingUpdates.delete(updateId);
  } catch (error) {
    // Revert on error
    timelineStore.updateStatus(status.id, {
      favourited: previousState,
      favourites_count: status.favourites_count
    });
    
    pendingUpdates.delete(updateId);
    throw error;
  }
}

/**
 * Optimistically toggle reblog status
 * Migrated to GraphQL
 */
export async function toggleReblog(status: Status): Promise<void> {
  const updateId = crypto.randomUUID();
  const previousState = status.reblogged || false;
  const newState = !previousState;
  
  pendingUpdates.set(updateId, {
    id: updateId,
    type: 'reblog',
    statusId: status.id,
    previousState,
    timestamp: Date.now()
  });
  
  // Optimistic update
  timelineStore.updateStatus(status.id, {
    reblogged: newState,
    reblogs_count: status.reblogs_count + (newState ? 1 : -1)
  });
  
  try {
    const adapter = await getGraphQLAdapter();
    const response = newState
      ? await adapter.shareObject(status.id)
      : await adapter.unshareObject(status.id);
    
    // Update with server response
    // Response might be boolean or object - use type assertion
    const responseObj = typeof response === 'object' ? (response as any) : null;
    const shared = responseObj?.userInteractions?.shared ?? newState;
    const sharesCount = responseObj?.shares?.totalCount ?? status.reblogs_count;
    
    timelineStore.updateStatus(status.id, {
      reblogged: shared,
      reblogs_count: sharesCount
    });
    
    pendingUpdates.delete(updateId);
  } catch (error) {
    // Revert on error
    timelineStore.updateStatus(status.id, {
      reblogged: previousState,
      reblogs_count: status.reblogs_count
    });
    
    pendingUpdates.delete(updateId);
    throw error;
  }
}

/**
 * Optimistically toggle bookmark status
 * Migrated to GraphQL
 */
export async function toggleBookmark(status: Status): Promise<void> {
  const updateId = crypto.randomUUID();
  const previousState = status.bookmarked || false;
  const newState = !previousState;
  
  pendingUpdates.set(updateId, {
    id: updateId,
    type: 'bookmark',
    statusId: status.id,
    previousState,
    timestamp: Date.now()
  });
  
  // Optimistic update
  timelineStore.updateStatus(status.id, {
    bookmarked: newState
  });
  
  try {
    const adapter = await getGraphQLAdapter();
    const response = newState
      ? await adapter.bookmarkObject(status.id)
      : await adapter.unbookmarkObject(status.id);
    
    // Update with server response
    // Response might be boolean or object - use type assertion
    const responseObj = typeof response === 'object' ? (response as any) : null;
    const bookmarked = responseObj?.userInteractions?.bookmarked ?? newState;
    
    timelineStore.updateStatus(status.id, {
      bookmarked: bookmarked
    });
    
    pendingUpdates.delete(updateId);
  } catch (error) {
    // Revert on error
    timelineStore.updateStatus(status.id, {
      bookmarked: previousState
    });
    
    pendingUpdates.delete(updateId);
    throw error;
  }
}

/**
 * Delete status with optimistic removal
 * Migrated to GraphQL
 */
export async function deleteStatus(statusId: string): Promise<void> {
  const status = findStatus(statusId);
  
  if (!status) return;
  
  // Optimistic removal
  timelineStore.removeStatus(statusId);
  
  try {
    const adapter = await getGraphQLAdapter();
    await adapter.deleteObject(statusId);
  } catch (error) {
    // Re-add the status on error
    // This is more complex as we need to maintain order
    // Failed to delete status - cannot restore to timeline
    // Status remains deleted in UI to avoid confusion
    throw error;
  }
}

/**
 * Check if a status has pending updates
 */
export function hasPendingUpdates(statusId: string): boolean {
  for (const update of pendingUpdates.values()) {
    if (update.statusId === statusId) {
      return true;
    }
  }
  return false;
}

/**
 * Clean up old pending updates (older than 30 seconds)
 */
export function cleanupPendingUpdates(): void {
  const now = Date.now();
  const timeout = 30000; // 30 seconds
  
  for (const [id, update] of pendingUpdates.entries()) {
    if (now - update.timestamp > timeout) {
      pendingUpdates.delete(id);
    }
  }
}

// Periodically clean up old pending updates
if (typeof window !== 'undefined') {
  setInterval(cleanupPendingUpdates, 10000); // Every 10 seconds
}

function findStatus(statusId: string): Status | undefined {
  const timelines = timelineStore.timelines as Record<string, TimelineData>;
  
  for (const timeline of Object.values(timelines)) {
    const directMatch = timeline.statuses.find((item) => item.id === statusId);
    if (directMatch) {
      return directMatch;
    }
    
    const reblogMatch = timeline.statuses.find((item) => item.reblog?.id === statusId);
    if (reblogMatch?.reblog) {
      return reblogMatch.reblog;
    }
  }
  
  return undefined;
}
