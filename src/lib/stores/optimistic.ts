/**
 * Optimistic updates for better UX
 * Updates UI immediately while API calls happen in background
 */

import { timelineStore } from './timeline';
import { getClient } from '@/lib/api/client';
import type { Status } from '@/types/mastodon';

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
  timelineStore.getState().updateStatus(status.id, {
    favourited: newState,
    favourites_count: status.favourites_count + (newState ? 1 : -1)
  });
  
  try {
    const client = getClient();
    const updatedStatus = newState
      ? await client.favouriteStatus(status.id)
      : await client.unfavouriteStatus(status.id);
    
    // Update with server response
    timelineStore.getState().updateStatus(status.id, {
      favourited: updatedStatus.favourited,
      favourites_count: updatedStatus.favourites_count
    });
    
    // Remove from pending
    pendingUpdates.delete(updateId);
  } catch (error) {
    // Revert on error
    timelineStore.getState().updateStatus(status.id, {
      favourited: previousState,
      favourites_count: status.favourites_count
    });
    
    pendingUpdates.delete(updateId);
    throw error;
  }
}

/**
 * Optimistically toggle reblog status
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
  timelineStore.getState().updateStatus(status.id, {
    reblogged: newState,
    reblogs_count: status.reblogs_count + (newState ? 1 : -1)
  });
  
  try {
    const client = getClient();
    const updatedStatus = newState
      ? await client.reblogStatus(status.id)
      : await client.unreblogStatus(status.id);
    
    // Update with server response
    timelineStore.getState().updateStatus(status.id, {
      reblogged: updatedStatus.reblogged,
      reblogs_count: updatedStatus.reblogs_count
    });
    
    pendingUpdates.delete(updateId);
  } catch (error) {
    // Revert on error
    timelineStore.getState().updateStatus(status.id, {
      reblogged: previousState,
      reblogs_count: status.reblogs_count
    });
    
    pendingUpdates.delete(updateId);
    throw error;
  }
}

/**
 * Optimistically toggle bookmark status
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
  timelineStore.getState().updateStatus(status.id, {
    bookmarked: newState
  });
  
  try {
    const client = getClient();
    const updatedStatus = newState
      ? await client.bookmarkStatus(status.id)
      : await client.unbookmarkStatus(status.id);
    
    // Update with server response
    timelineStore.getState().updateStatus(status.id, {
      bookmarked: updatedStatus.bookmarked
    });
    
    pendingUpdates.delete(updateId);
  } catch (error) {
    // Revert on error
    timelineStore.getState().updateStatus(status.id, {
      bookmarked: previousState
    });
    
    pendingUpdates.delete(updateId);
    throw error;
  }
}

/**
 * Delete status with optimistic removal
 */
export async function deleteStatus(statusId: string): Promise<void> {
  // Store the status before removing (in case we need to restore)
  const timeline = timelineStore.getState();
  const status = timeline.home.statuses.find(s => s.id === statusId) ||
                 timeline.local.statuses.find(s => s.id === statusId) ||
                 timeline.federated.statuses.find(s => s.id === statusId);
  
  if (!status) return;
  
  // Optimistic removal
  timeline.removeStatus(statusId);
  
  try {
    const client = getClient();
    await client.deleteStatus(statusId);
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