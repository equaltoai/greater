/**
 * Notifications state management using Nanostores
 * Handles real-time updates, filtering, and marking as read
 */

import { atom, map, computed } from 'nanostores';
import type { Notification, NotificationType } from '@/types/mastodon';
import { getClient } from '@/lib/api/client';
import { authStore } from './auth';

// Notification state
export const notifications$ = map<Record<string, Notification>>({});
export const isLoadingNotifications$ = atom<boolean>(false);
export const notificationsError$ = atom<string | null>(null);
export const hasMoreNotifications$ = atom<boolean>(true);
export const lastNotificationId$ = atom<string | null>(null);

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
    admin: {
      sign_up: 0,
      report: 0
    }
  };
  
  Object.values(notifications).forEach(notification => {
    counts.all++;
    if (notification.type === 'admin.sign_up' || notification.type === 'admin.report') {
      counts.admin[notification.type.split('.')[1] as 'sign_up' | 'report']++;
    } else {
      counts[notification.type as keyof typeof counts]++;
    }
  });
  
  return counts;
});

// Load notifications
export async function loadNotifications(reset = false) {
  if (isLoadingNotifications$.get()) return;
  
  isLoadingNotifications$.set(true);
  notificationsError$.set(null);
  
  try {
    const client = getClient();
    const params: any = { limit: 20 };
    
    if (!reset && lastNotificationId$.get()) {
      params.max_id = lastNotificationId$.get();
    }
    
    const newNotifications = await client.getNotifications(params);
    
    if (newNotifications.length < 20) {
      hasMoreNotifications$.set(false);
    }
    
    if (newNotifications.length > 0) {
      lastNotificationId$.set(newNotifications[newNotifications.length - 1].id);
    }
    
    // Add to store
    const notificationsMap = reset ? {} : { ...notifications$.get() };
    newNotifications.forEach(notification => {
      notificationsMap[notification.id] = notification;
    });
    
    notifications$.set(notificationsMap);
  } catch (error) {
    notificationsError$.set(error instanceof Error ? error.message : 'Failed to load notifications');
  } finally {
    isLoadingNotifications$.set(false);
  }
}

// Clear all notifications
export async function clearAllNotifications() {
  try {
    const client = getClient();
    await client.clearNotifications();
    
    // Clear local state
    notifications$.set({});
  } catch (error) {
    console.error('Failed to clear all notifications:', error);
  }
}

// Clear notification
export async function dismissNotification(notificationId: string) {
  try {
    const client = getClient();
    await client.dismissNotification(notificationId);
    
    // Remove from local state
    const updatedNotifications = { ...notifications$.get() };
    delete updatedNotifications[notificationId];
    notifications$.set(updatedNotifications);
  } catch (error) {
    console.error('Failed to dismiss notification:', error);
  }
}

// Real-time streaming
let eventSource: EventSource | null = null;

export function startNotificationStream() {
  if (eventSource) return;
  
  const { currentUser } = authStore.getState();
  if (!currentUser) return;
  
  const client = getClient();
  eventSource = client.streamNotifications();
  
  eventSource.addEventListener('notification', (event) => {
    try {
      const notification: Notification = JSON.parse(event.data);
      
      // Add to store
      notifications$.set({
        ...notifications$.get(),
        [notification.id]: notification
      });
      
      // Trigger browser notification if enabled
      if ('Notification' in window && Notification.permission === 'granted') {
        showBrowserNotification(notification);
      }
    } catch (error) {
      console.error('Failed to parse notification:', error);
    }
  });
  
  eventSource.addEventListener('delete', (event) => {
    try {
      const notificationId = JSON.parse(event.data);
      dismissNotification(notificationId);
    } catch (error) {
      console.error('Failed to parse delete event:', error);
    }
  });
  
  eventSource.onerror = () => {
    console.error('Notification stream error');
    stopNotificationStream();
    // Retry after 5 seconds
    setTimeout(() => startNotificationStream(), 5000);
  };
}

export function stopNotificationStream() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
}

// Browser notifications
function showBrowserNotification(notification: Notification) {
  let title = '';
  let body = '';
  let icon = notification.account?.avatar;
  
  switch (notification.type) {
    case 'mention':
      title = `${notification.account.display_name || notification.account.username} mentioned you`;
      body = notification.status?.content.replace(/<[^>]*>/g, '') || '';
      break;
    case 'reblog':
      title = `${notification.account.display_name || notification.account.username} boosted your post`;
      body = notification.status?.content.replace(/<[^>]*>/g, '') || '';
      break;
    case 'favourite':
      title = `${notification.account.display_name || notification.account.username} favorited your post`;
      body = notification.status?.content.replace(/<[^>]*>/g, '') || '';
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
      body = notification.status?.content.replace(/<[^>]*>/g, '') || '';
      break;
    case 'update':
      title = 'A post you interacted with was edited';
      body = notification.status?.content.replace(/<[^>]*>/g, '') || '';
      break;
  }
  
  if (title) {
    new Notification(title, {
      body: body.length > 100 ? body.substring(0, 100) + '...' : body,
      icon,
      tag: notification.id,
      data: { notificationId: notification.id }
    });
  }
}

// Request permission for browser notifications
export async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

// Clean up on logout
authStore.subscribe((state) => {
  if (!state.currentUser) {
    stopNotificationStream();
    notifications$.set({});
    lastNotificationId$.set(null);
    hasMoreNotifications$.set(true);
  }
});