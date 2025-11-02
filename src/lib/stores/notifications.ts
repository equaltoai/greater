/**
 * Notifications state management using GraphQL
 * Handles real-time updates, filtering, and marking as read
 */

import { atom, map, computed } from 'nanostores';
import type { Notification, NotificationType, Status, Account } from '@/types/mastodon';
import { getGraphQLAdapter } from '@/lib/api/graphql-client';
import { logDebug } from '@/lib/utils/logger';
import { mapGraphQLMediaToAttachment } from '@/lib/mappers/media';
import { authStore } from './auth.svelte';
import { stripHtmlSafe } from '@/lib/utils/sanitize';

const supportsBrowserNotifications = (): boolean =>
  typeof window !== 'undefined' && typeof window.Notification === 'function';

// Subscription type from Apollo Client (provided via greater-components)
type Subscription = {
  unsubscribe: () => void;
};

// Notification state
export const notifications$ = map<Record<string, Notification>>({});
export const isLoadingNotifications$ = atom<boolean>(false);
export const notificationsError$ = atom<string | null>(null);
export const hasMoreNotifications$ = atom<boolean>(true);
export const endCursor$ = atom<string | null>(null);

// Filter state
export const notificationFilter$ = atom<NotificationType | 'all'>('all');

// Notification count (all notifications are considered "unread" until dismissed)
export const unreadCount$ = computed([notifications$], (notifications) => {
  return Object.values(notifications).length;
});

// Filtered notifications
export const filteredNotifications$ = computed(
  [notifications$, notificationFilter$],
  (notifications, filter) => {
    let filtered = Object.values(notifications);
    
    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(n => n.type === filter);
    }
    
    // Sort by created_at descending
    return filtered.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }
);

// Notification type counts
export const notificationCounts$ = computed([notifications$], (notifications) => {
  const counts: Record<NotificationType | 'all', number> = {
    all: 0,
    mention: 0,
    status: 0,
    reblog: 0,
    follow: 0,
    follow_request: 0,
    favourite: 0,
    poll: 0,
    update: 0,
    'admin.sign_up': 0,
    'admin.report': 0
  };
  
  Object.values(notifications).forEach(notification => {
    counts.all++;
    const notificationType = notification.type as NotificationType;
    if (counts[notificationType] !== undefined) {
      counts[notificationType]++;
    }
  });
  
  return counts;
});

/**
 * Map GraphQL notification to Mastodon-compatible format
 */
function mapGraphQLToNotification(node: any): Notification {
  const notification = node.notification || node;
  
  // Map GraphQL notification type to Mastodon type
  const typeMap: Record<string, NotificationType> = {
    'MENTION': 'mention',
    'LIKE': 'favourite',
    'SHARE': 'reblog',
    'FOLLOW': 'follow',
    'FOLLOW_REQUEST': 'follow_request',
    'POLL': 'poll',
    'STATUS': 'status',
    'UPDATE': 'update',
    'ADMIN_SIGN_UP': 'admin.sign_up',
    'ADMIN_REPORT': 'admin.report',
  };
  
  const type = typeMap[notification.type] || 'mention';
  
  // Map account (actor)
  const account: Account = mapGraphQLToAccount(notification.actor || notification.account);
  
  // Map status if present
  const status: Status | null = notification.object ? mapGraphQLToStatus(notification.object) : null;
  
  return {
    id: notification.id,
    type,
    created_at: notification.createdAt || notification.created_at || new Date().toISOString(),
    account,
    status: status || undefined,
  };
}

function mapGraphQLToAccount(actor: any): Account {
  if (!actor) {
    return {
      id: 'unknown',
      username: 'unknown',
      acct: 'unknown',
      display_name: 'Unknown',
      avatar: '',
      header: '',
    } as Account;
  }

  return {
    id: actor.id,
    username: actor.preferredUsername || actor.username,
    acct: actor.webfinger || `${actor.preferredUsername}@${new URL(actor.id).hostname}`,
    display_name: actor.name || actor.preferredUsername,
    locked: actor.manuallyApprovesFollowers || false,
    bot: actor.type === 'Service',
    created_at: actor.published || new Date().toISOString(),
    note: actor.summary || '',
    url: actor.url || actor.id,
    avatar: actor.icon?.url || '',
    avatar_static: actor.icon?.url || '',
    header: actor.image?.url || '',
    header_static: actor.image?.url || '',
    followers_count: actor.followers?.totalCount || 0,
    following_count: actor.following?.totalCount || 0,
    statuses_count: actor.outbox?.totalCount || 0,
    last_status_at: null,
    emojis: [],
    fields: (actor.attachment || [])
      .filter((a: any) => a.type === 'PropertyValue')
      .map((a: any) => ({
        name: a.name,
        value: a.value,
        verified_at: null,
      })),
    discoverable: true,
    group: false,
  } as Account;
}

function mapGraphQLToStatus(obj: any): Status {
  return {
    id: obj.id,
    uri: obj.id,
    url: obj.id,
    created_at: obj.published || obj.createdAt || new Date().toISOString(),
    account: mapGraphQLToAccount(obj.attributedTo || obj.author),
    content: obj.content || '',
    visibility: (obj.visibility?.toLowerCase() || 'public') as any,
    sensitive: obj.sensitive ?? false,
    spoiler_text: obj.summary ?? obj.spoilerText ?? '',
    media_attachments: (obj.attachments || []).map((a: any) => mapGraphQLMediaToAttachment(a)),
    mentions: [],
    tags: [],
    emojis: [],
    reblogs_count: obj.shares?.totalCount || obj.sharesCount || 0,
    favourites_count: obj.likes?.totalCount || obj.likesCount || 0,
    replies_count: obj.replies?.totalCount || obj.repliesCount || 0,
    reblogged: obj.userInteractions?.shared || false,
    favourited: obj.userInteractions?.liked || false,
    bookmarked: obj.userInteractions?.bookmarked || false,
    pinned: obj.userInteractions?.pinned || false,
    reblog: obj.shareOf ? mapGraphQLToStatus(obj.shareOf) : null,
    in_reply_to_id: obj.inReplyTo?.id || null,
    in_reply_to_account_id: null,
    application: null as any,
    language: obj.language || null,
    muted: false,
    poll: null,
    card: null,
    edited_at: obj.updated || null,
  };
}

// Load notifications
export async function loadNotifications(reset = false) {
  if (isLoadingNotifications$.get()) return;
  
  isLoadingNotifications$.set(true);
  notificationsError$.set(null);
  
  try {
    const adapter = await getGraphQLAdapter();
    
    const variables: any = { 
      first: 20,
      after: reset ? undefined : endCursor$.get(),
    };
    
    const response = await adapter.fetchNotifications(variables);
    
    const newNotifications = (response?.edges || [])
      .map((edge: any) => mapGraphQLToNotification(edge.node));
    
    const pageInfo = response?.pageInfo;
    
    if (!pageInfo?.hasNextPage) {
      hasMoreNotifications$.set(false);
    }
    
    if (pageInfo?.endCursor) {
      endCursor$.set(pageInfo.endCursor);
    }
    
    // Add to store
    const notificationsMap = reset ? {} : { ...notifications$.get() };
    newNotifications.forEach((notification: Notification) => {
      notificationsMap[notification.id] = notification;
    });
    
    notifications$.set(notificationsMap);
  } catch (error) {
    console.error('[Notifications] Error loading notifications:', error);
    notificationsError$.set(error instanceof Error ? error.message : 'Failed to load notifications');
  } finally {
    isLoadingNotifications$.set(false);
  }
}

// Clear all notifications
export async function clearAllNotifications() {
  try {
    const adapter = await getGraphQLAdapter();
    await adapter.clearNotifications();
    
    // Clear local state
    notifications$.set({});
    endCursor$.set(null);
    hasMoreNotifications$.set(true);
  } catch (error) {
    console.error('Failed to clear all notifications:', error);
  }
}

// Clear notification
export async function dismissNotification(notificationId: string) {
  try {
    const adapter = await getGraphQLAdapter();
    await adapter.dismissNotification(notificationId);
    
    // Remove from local state
    const updatedNotifications = { ...notifications$.get() };
    delete updatedNotifications[notificationId];
    notifications$.set(updatedNotifications);
  } catch (error) {
    console.error('Failed to dismiss notification:', error);
  }
}

// Real-time streaming
let streamConnection: Subscription | null = null;

export async function startNotificationStream() {
  if (streamConnection) return;
  
  if (!authStore.currentUser) return;
  
  const adapter = await getGraphQLAdapter();
  
  streamConnection = adapter.subscribeToNotificationStream().subscribe({
    next: (result: any) => {
      try {
        const update = result.data?.notificationStream;
        if (!update) return;
        
        switch (update.type) {
          case 'NEW':
            if (update.notification) {
              const notification = mapGraphQLToNotification(update.notification);
              
              // Add to store
              notifications$.set({
                ...notifications$.get(),
                [notification.id]: notification
              });
              
              // Trigger browser notification if enabled
              if (supportsBrowserNotifications() && window.Notification.permission === 'granted') {
                showBrowserNotification(notification);
              }
            }
            break;
          case 'DELETE':
            if (update.notificationId) {
              dismissNotification(update.notificationId);
            }
            break;
        }
      } catch (error) {
        console.error('Failed to parse notification event:', error);
      }
    },
    error: (error: unknown) => {
      console.error('Notification stream error:', error);
      stopNotificationStream();
      // Retry after 5 seconds
      setTimeout(() => startNotificationStream(), 5000);
    },
    complete: () => {
      logDebug('Notification stream closed');
      streamConnection = null;
    }
  });
}

export function stopNotificationStream() {
  if (streamConnection) {
    streamConnection.unsubscribe();
    streamConnection = null;
  }
}

// Browser notifications
function showBrowserNotification(notification: Notification) {
  if (!supportsBrowserNotifications()) {
    return;
  }
  
  let title = '';
  let body = '';
  let icon = notification.account?.avatar;
  
  switch (notification.type) {
    case 'mention':
      title = `${notification.account.display_name || notification.account.username} mentioned you`;
      body = notification.status?.content ? stripHtmlSafe(notification.status.content) : '';
      break;
    case 'reblog':
      title = `${notification.account.display_name || notification.account.username} boosted your post`;
      body = notification.status?.content ? stripHtmlSafe(notification.status.content) : '';
      break;
    case 'favourite':
      title = `${notification.account.display_name || notification.account.username} favorited your post`;
      body = notification.status?.content ? stripHtmlSafe(notification.status.content) : '';
      break;
    case 'follow':
      title = `${notification.account.display_name || notification.account.username} followed you`;
      body = `@${notification.account.acct}`;
      break;
    case 'follow_request':
      title = `${notification.account.display_name || notification.account.username} requested to follow you`;
      body = `@${notification.account.acct}`;
      break;
    case 'poll':
      title = 'A poll you voted in has ended';
      body = notification.status?.content ? stripHtmlSafe(notification.status.content) : '';
      break;
    case 'update':
      title = 'A post you interacted with was edited';
      body = notification.status?.content ? stripHtmlSafe(notification.status.content) : '';
      break;
  }
  
  if (title) {
    new window.Notification(title, {
      body: body.length > 100 ? body.substring(0, 100) + '...' : body,
      icon,
      tag: notification.id,
      data: { notificationId: notification.id }
    });
  }
}

// Request permission for browser notifications
export async function requestNotificationPermission() {
  if (supportsBrowserNotifications() && window.Notification.permission === 'default') {
    const permission = await window.Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

// Export a cleanup function that can be called when logging out
export function cleanupNotifications() {
  stopNotificationStream();
  notifications$.set({});
  endCursor$.set(null);
  hasMoreNotifications$.set(true);
}
