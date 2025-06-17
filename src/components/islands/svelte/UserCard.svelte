<script lang="ts">
  import type { Account } from '@/types/mastodon';
  import { getClient } from '@/lib/api/client';
  import { authStore } from '@/lib/stores/auth';
  
  interface Props {
    account: Account;
  }
  
  let { account }: Props = $props();
  
  ;
  
  let isFollowing = $state(account.following || false);
  let isFollowingLoading = $state(false);
  
  const currentUserId = authStore.currentAccount?.id;
  const isOwnProfile = currentUserId === account.id;
  
  async function toggleFollow() {
    const client = getClient();
    if (!client || isOwnProfile) return;
    
    isFollowingLoading = true;
    
    try {
      if (isFollowing) {
        await client.unfollowAccount(account.id);
        isFollowing = false;
      } else {
        await client.followAccount(account.id);
        isFollowing = true;
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      // Revert on error
      isFollowing = !isFollowing;
    } finally {
      isFollowingLoading = false;
    }
  }
  
  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
  
  // Parse note to extract text content
  function parseNote(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || '';
  }
</script>

<div class="bg-white dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
  <div class="flex items-start space-x-3">
    <!-- Avatar -->
    <a href={`/@${account.acct}`} class="flex-shrink-0">
      <img
        src={account.avatar}
        alt={account.display_name || account.username}
        class="w-12 h-12 rounded-full"
        loading="lazy"
      />
    </a>
    
    <!-- User Info -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between">
        <div class="truncate">
          <a href={`/@${account.acct}`} class="hover:underline">
            <h3 class="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {account.display_name || account.username}
              {#if account.bot}
                <span class="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">BOT</span>
              {/if}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">@{account.acct}</p>
          </a>
        </div>
        
        <!-- Follow Button -->
        {#if !isOwnProfile}
          <button
            onclick={toggleFollow}
            disabled={isFollowingLoading}
            class="ml-2 px-4 py-1.5 rounded-full text-sm font-medium transition-colors {
              isFollowing
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            } disabled:opacity-50"
          >
            {isFollowingLoading ? '...' : isFollowing ? 'Following' : 'Follow'}
          </button>
        {/if}
      </div>
      
      <!-- Bio -->
      {#if account.note}
        <p class="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
          {parseNote(account.note)}
        </p>
      {/if}
      
      <!-- Stats -->
      <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
        <span>
          <strong class="text-gray-900 dark:text-gray-100">{formatNumber(account.statuses_count)}</strong> posts
        </span>
        <span>
          <strong class="text-gray-900 dark:text-gray-100">{formatNumber(account.followers_count)}</strong> followers
        </span>
        <span>
          <strong class="text-gray-900 dark:text-gray-100">{formatNumber(account.following_count)}</strong> following
        </span>
      </div>
    </div>
  </div>
</div>