<script lang="ts">
  import type { Notification } from '@/types/mastodon';
  import { dismissNotification } from '@/lib/stores/notifications';
  import { formatDistanceToNow } from '@/lib/utils/date';
  import { sanitizeMastodonHtml } from '@/lib/utils/sanitize';
  import Button from './Button.svelte';
  
  export let notification: Notification;
  
  let isInteracting = false;
  
  async function handleDismiss() {
    if (isInteracting) return;
    
    isInteracting = true;
    try {
      await dismissNotification(notification.id);
    } finally {
      isInteracting = false;
    }
  }
  
  function getNotificationIcon() {
    switch (notification.type) {
      case 'mention':
        return '💬';
      case 'reblog':
        return '🔁';
      case 'favourite':
        return '⭐';
      case 'follow':
        return '👤';
      case 'follow_request':
        return '🔒';
      case 'poll':
        return '📊';
      case 'update':
        return '✏️';
      case 'admin.sign_up':
        return '🆕';
      case 'admin.report':
        return '⚠️';
      default:
        return '🔔';
    }
  }
  
  function getNotificationText() {
    const name = notification.account.display_name || notification.account.username;
    
    switch (notification.type) {
      case 'mention':
        return `mentioned you`;
      case 'reblog':
        return `boosted your post`;
      case 'favourite':
        return `favorited your post`;
      case 'follow':
        return `followed you`;
      case 'follow_request':
        return `requested to follow you`;
      case 'poll':
        return `A poll you voted in has ended`;
      case 'update':
        return `edited a post you interacted with`;
      case 'admin.sign_up':
        return `signed up`;
      case 'admin.report':
        return `reported a post`;
      default:
        return 'sent you a notification';
    }
  }
  
</script>

<article
  class="notification-card p-4 border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
  aria-label={`${getNotificationText()} from ${notification.account.display_name || notification.account.username}`}
>
  <div class="flex gap-3">
    <!-- Icon -->
    <div class="flex-shrink-0 text-2xl" aria-hidden="true">
      {getNotificationIcon()}
    </div>
    
    <!-- Content -->
    <div class="flex-1 min-w-0">
      <!-- Header -->
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-2 flex-wrap">
          <a
            href="/profile/{notification.account.acct}"
            class="flex items-center gap-2 hover:underline"
            on:click|stopPropagation
          >
            <img
              src={notification.account.avatar}
              alt=""
              class="w-6 h-6 rounded-full"
            />
            <span class="font-semibold">
              {notification.account.display_name || notification.account.username}
            </span>
          </a>
          <span class="text-gray-600 dark:text-gray-400">
            {getNotificationText()}
          </span>
        </div>
        
        <div class="flex items-center gap-2">
          <time 
            datetime={notification.created_at}
            class="text-sm text-gray-500 dark:text-gray-400"
          >
            {formatDistanceToNow(new Date(notification.created_at))}
          </time>
          
          <button
            on:click|stopPropagation={handleDismiss}
            class="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            aria-label="Dismiss notification"
            disabled={isInteracting}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Status preview (for mention, reblog, favourite, update) -->
      {#if notification.status && ['mention', 'reblog', 'favourite', 'update'].includes(notification.type)}
        <a
          href="/status/{notification.status.id}"
          class="mt-2 block p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
          on:click|stopPropagation
        >
          <div class="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
            {@html sanitizeMastodonHtml(notification.status.content)}
          </div>
        </a>
      {/if}
      
      <!-- Follow request actions -->
      {#if notification.type === 'follow_request'}
        <div class="mt-3 flex gap-2">
          <Button
            size="small"
            on:click={(e) => {
              e.stopPropagation();
              // TODO: Implement accept follow request
            }}
          >
            Accept
          </Button>
          <Button
            variant="secondary"
            size="small"
            on:click={(e) => {
              e.stopPropagation();
              // TODO: Implement reject follow request
            }}
          >
            Reject
          </Button>
        </div>
      {/if}
    </div>
  </div>
</article>

<style>
  .line-clamp-3 {
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
  }
</style>