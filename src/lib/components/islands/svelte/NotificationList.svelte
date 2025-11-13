<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createVirtualizer } from '@tanstack/svelte-virtual';
  import {
    filteredNotifications$,
    isLoadingNotifications$,
    notificationsError$,
    hasMoreNotifications$,
    notificationFilter$,
    unreadCount$,
    notificationCounts$,
    loadNotifications,
    clearAllNotifications,
    startNotificationStream,
    stopNotificationStream,
    requestNotificationPermission
  } from '$lib/stores/notifications';
  import NotificationCard from './NotificationCard.svelte';
  import ErrorState from './ErrorState.svelte';
  import EmptyState from './EmptyState.svelte';
  import Button from './Button.svelte';
  import type { NotificationType } from '$lib/types/mastodon';
  
  let notifications: any[] = [];
  let isLoading = false;
  let error: string | null = null;
  let hasMore = true;
  let filter: NotificationType | 'all' = 'all';
  let unreadCount = 0;
  let notificationCounts: any = {};
  
  let isLoadingMore = false;
  
  // Subscribe to stores
  const unsubscribes: Array<() => void> = [];
  
  onMount(async () => {
    // Subscribe to stores
    unsubscribes.push(
      filteredNotifications$.subscribe(v => notifications = v),
      isLoadingNotifications$.subscribe(v => isLoading = v),
      notificationsError$.subscribe(v => error = v),
      hasMoreNotifications$.subscribe(v => hasMore = v),
      notificationFilter$.subscribe(v => filter = v),
      unreadCount$.subscribe(v => unreadCount = v),
      notificationCounts$.subscribe(v => notificationCounts = v)
    );
    
    // Load initial notifications
    await loadNotifications(true);
    
    // Start real-time updates
    startNotificationStream();
    
    // Request notification permission
    requestNotificationPermission();
  });
  
  onDestroy(() => {
    unsubscribes.forEach(unsub => unsub());
    stopNotificationStream();
  });
  
  async function handleLoadMore() {
    if (!hasMore || isLoadingMore) return;
    
    isLoadingMore = true;
    await loadNotifications();
    isLoadingMore = false;
  }
  
  function handleFilterChange(newFilter: typeof filter) {
    notificationFilter$.set(newFilter);
  }
  
  async function handleClearAll() {
    if (confirm('Are you sure you want to clear all notifications?')) {
      await clearAllNotifications();
    }
  }
  
  const filterOptions: Array<{ value: NotificationType | 'all'; label: string; icon: string }> = [
    { value: 'all', label: 'All', icon: '🔔' },
    { value: 'mention', label: 'Mentions', icon: '💬' },
    { value: 'reblog', label: 'Boosts', icon: '🔁' },
    { value: 'favourite', label: 'Favorites', icon: '⭐' },
    { value: 'follow', label: 'Follows', icon: '👤' },
    { value: 'poll', label: 'Polls', icon: '📊' },
  ];
  
  // Handle infinite scroll
  function handleScroll(e: Event) {
    const target = e.target as HTMLElement;
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    
    if (scrollBottom < 500 && hasMore && !isLoadingMore) {
      handleLoadMore();
    }
  }
</script>

<div class="h-full flex flex-col bg-white dark:bg-gray-900">
  <!-- Header with filters -->
  <div class="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
    <div class="px-4 py-3">
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-xl font-semibold">Notifications</h1>
        
        {#if notifications.length > 0}
          <Button
            variant="secondary"
            size="small"
            on:click={handleClearAll}
          >
            Clear all
          </Button>
        {/if}
      </div>
      
      <!-- Filter tabs -->
      <div class="flex gap-1 overflow-x-auto pb-2">
        {#each filterOptions as option}
          <button
            on:click={() => handleFilterChange(option.value)}
            class="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors"
            class:bg-purple-600={filter === option.value}
            class:text-white={filter === option.value}
            class:bg-gray-100={filter !== option.value}
            class:dark:bg-gray-800={filter !== option.value}
            class:hover:bg-gray-200={filter !== option.value}
            class:dark:hover:bg-gray-700={filter !== option.value}
          >
            <span>{option.icon}</span>
            <span>{option.label}</span>
            {#if notificationCounts[option.value] > 0}
              <span class="ml-1 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full text-xs">
                {notificationCounts[option.value]}
              </span>
            {/if}
          </button>
        {/each}
      </div>
      
    </div>
  </div>
  
  <!-- Notifications list -->
  <div 
    class="flex-1 overflow-y-auto"
    on:scroll={handleScroll}
  >
    {#if error}
      <ErrorState
        title="Failed to load notifications"
        message={error}
        on:retry={() => loadNotifications(true)}
      />
    {:else if isLoading && notifications.length === 0}
      <div class="p-4 space-y-4">
        {#each Array(5) as _}
          <div class="animate-pulse">
            <div class="flex gap-3">
              <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              <div class="flex-1">
                <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {:else if notifications.length === 0}
      <EmptyState
        icon="🔔"
        title="No notifications"
        message="When someone interacts with you, it will show up here"
      />
    {:else}
      {#each notifications as notification}
        <NotificationCard {notification} />
      {/each}
      
      {#if isLoadingMore}
        <div class="p-4 text-center">
          <div class="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading more...</span>
          </div>
        </div>
      {/if}
      
      {#if !hasMore && notifications.length > 0}
        <div class="p-4 text-center text-gray-500 dark:text-gray-400">
          No more notifications
        </div>
      {/if}
    {/if}
  </div>
</div>

