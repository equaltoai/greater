<script lang="ts">
  import type { Account, Relationship } from '@/types/mastodon';
  import type { Account as LesserAccount } from '@/lib/api/schemas';
  import { GCAvatar } from '@/lib/components';
  import { getGraphQLAdapter } from '@/lib/api/graphql-client';
  import { authStore } from '@/lib/stores/auth.svelte';
  import { stripHtmlSafe } from '@/lib/utils/sanitize';
  
  interface Props {
    user: Account;
    relationship?: Relationship;
    onRelationshipUpdate?: (relationship: Relationship) => void;
  }
  
  let { user, relationship, onRelationshipUpdate }: Props = $props();
  
  // Cast to Lesser Account to access trust indicators if available
  const lesserUser = user as unknown as LesserAccount;
  
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
    if (isOwnProfile) return;
    
    isFollowingLoading = true;
    
    try {
      const adapter = await getGraphQLAdapter();
      const identifier = user.id;
      
      if (isFollowing) {
        await adapter.unfollowActor(identifier);
      } else {
        await adapter.followActor(identifier);
      }
      
      // Toggle the state optimistically
      isFollowing = !isFollowing;
      
      // Fetch updated relationship to confirm
      const graphqlRelationship = await adapter.getRelationship(identifier);
      const newRelationship: Relationship = {
        id: identifier,
        following: graphqlRelationship.following || false,
        followed_by: graphqlRelationship.followedBy || false,
        blocking: graphqlRelationship.blocking || false,
        blocked_by: graphqlRelationship.blockedBy || false,
        muting: graphqlRelationship.muting || false,
        muting_notifications: graphqlRelationship.mutingNotifications || false,
        requested: graphqlRelationship.requested || false,
        domain_blocking: false,
        showing_reblogs: true,
        endorsed: false,
        notifying: false,
        note: ''
      };
      
      isFollowing = newRelationship.following;
      
      // Notify parent component of the update
      if (onRelationshipUpdate) {
        onRelationshipUpdate(newRelationship);
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
      // Revert optimistic update on error
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
</script>

<div class="flex items-start space-x-3">
  <!-- Avatar -->
  <a href={`/@${user.acct}`} class="flex-shrink-0">
    <GCAvatar
      src={user.avatar}
      alt={user.display_name || user.username}
      size="md"
      fallback={(user.display_name || user.username).charAt(0).toUpperCase()}
    />
  </a>
  
  <!-- User Info -->
  <div class="flex-1 min-w-0">
    <div class="flex items-center justify-between">
      <div class="truncate">
        <a href={`/@${user.acct}`} class="hover:underline">
          <h3 class="font-semibold text-gray-900 dark:text-gray-100 truncate flex items-center">
            {user.display_name || user.username}
            {#if user.bot}
              <span class="ml-1 text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">BOT</span>
            {/if}
            {#if lesserUser.trust_indicators}
              <!-- Trust Score Badge -->
              <span class="ml-2 text-xs px-2 py-0.5 rounded-full {
                lesserUser.trust_indicators.score >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                lesserUser.trust_indicators.score >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
              }">
                Trust: {lesserUser.trust_indicators.score}
              </span>
              <!-- Verification Badge -->
              {#if lesserUser.trust_indicators.verification_level !== 'none'}
                <span class="ml-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {lesserUser.trust_indicators.verification_level}
                </span>
              {/if}
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
        {stripHtmlSafe(user.note)}
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