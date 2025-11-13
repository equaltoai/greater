<script lang="ts">
/**
 * NotificationsGC - Bridge to GC NotificationsFeedReactive
 * 
 * Based on GC Timeline integration pattern, adapted for notifications.
 * Manual store management until createNotificationIntegration helper available.
 */
import { onMount } from 'svelte';
import { NotificationsFeedReactive } from '$lib/gc';
import { notificationsStore } from '$lib/stores/notifications';
import { authStore } from '$lib/stores/auth.svelte';
import type { Notification } from '$lib/types/mastodon';

interface Props {
  filter?: 'all' | 'mention' | 'favourite' | 'reblog' | 'follow' | 'poll';
  density?: 'compact' | 'comfortable';
  class?: string;
}

let {
  filter = 'all',
  density = 'comfortable',
  class: className = ''
}: Props = $props();

// Get notifications from store
const notifications = $derived<Notification[]>(notificationsStore.notifications || []);
const isLoading = $derived(notificationsStore.isLoading);
const hasMore = $derived(notificationsStore.hasMore);

// Handlers
function handleLoadMore() {
  if (!hasMore || isLoading) return;
  notificationsStore.loadMore();
}

function handleNotificationClick(notification: Notification) {
  // Navigate to status or profile
  console.log('[NotificationsGC] Clicked:', notification.type, notification.id);
  // TODO: Implement navigation
}

function handleMarkAsRead(notificationId: string) {
  console.log('[NotificationsGC] Mark as read:', notificationId);
  // TODO: Implement mark as read
}

// Lifecycle
onMount(() => {
  notificationsStore.initialize();
  notificationsStore.load();
  
  return () => {
    // Cleanup if needed
  };
});
</script>

<NotificationsFeedReactive
  items={notifications}
  loadingBottom={isLoading}
  endReached={!hasMore}
  onLoadMore={handleLoadMore}
  onNotificationClick={handleNotificationClick}
  onMarkAsRead={handleMarkAsRead}
  {density}
  class={className}
/>

<!--
  Per GC realtime-usage.md:
  - Similar pattern to Timeline integration
  - Use items prop with manual store management
  - createNotificationIntegration available for real-time updates
-->

