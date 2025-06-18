<script lang="ts">
  import type { Account, Relationship } from '@/types/mastodon';
  import { getClient } from '@/lib/api/client';
  import { authStore } from '@/lib/stores/auth.svelte';
  
  interface Props {
    user: Account;
    relationship?: Relationship;
    onRelationshipUpdate?: (relationship: Relationship) => void;
  }
  
  let { user, relationship, onRelationshipUpdate }: Props = $props();
  
  let isFollowing = $state(relationship?.following || false);
  let isFollowingLoading = $state(false);
  
  const isOwnProfile = $derived(
    authStore.currentUser && user.id === authStore.currentUser.id
  );
  
  // Update local state when relationship prop changes
  $effect(() => {
    if (relationship) {
      isFollowing = relationship.following;
    }
  });
  
  async function toggleFollow() {
    const client = getClient();
    if (!client || isOwnProfile) return;
    
    isFollowingLoading = true;
    
    try {
      let newRelationship: Relationship;
      if (isFollowing) {
        newRelationship = await client.unfollowAccount(user.id);
      } else {
        newRelationship = await client.followAccount(user.id);
      }
      
      isFollowing = newRelationship.following;
      
      // Notify parent component of the update
      if (onRelationshipUpdate) {
        onRelationshipUpdate(newRelationship);
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
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

<div class="flex items-start space-x-3">
  <!-- Avatar -->
  <a href={`/@${user.acct}`} class="flex-shrink-0">
    <img
      src={user.avatar}
      alt={user.display_name || user.username}
      class="w-12 h-12 rounded-full"
      loading="lazy"
    />
  </a>
  
  <!-- User Info -->
  <div class="flex-1 min-w-0">
    <div class="flex items-center justify-between">
      <div class="truncate">
        <a href={`/@${user.acct}`} class="hover:underline">
          <h3 class="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {user.display_name || user.username}
            {#if user.bot}
              <span class="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">BOT</span>
            {/if}
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">@{user.acct}</p>
        </a>
      </div>
      
      <!-- Follow Button -->
      {#if !isOwnProfile && authStore.currentUser}
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
    {#if user.note}
      <p class="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
        {parseNote(user.note)}
      </p>
    {/if}
    
    <!-- Stats -->
    <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
      <span>
        <strong class="text-gray-900 dark:text-gray-100">{formatNumber(user.statuses_count)}</strong> posts
      </span>
      <span>
        <strong class="text-gray-900 dark:text-gray-100">{formatNumber(user.followers_count)}</strong> followers
      </span>
      <span>
        <strong class="text-gray-900 dark:text-gray-100">{formatNumber(user.following_count)}</strong> following
      </span>
    </div>
  </div>
</div>