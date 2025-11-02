<script lang="ts">
  import { onMount } from 'svelte';
  import { getGraphQLAdapter } from '../../../lib/api/graphql-client';
  import { authStore } from '../../../lib/stores/auth.svelte';
  import { sanitizeUserContent } from '../../../lib/utils/sanitize';
  import type { Account, Relationship } from '../../../types/mastodon';
  import type { Account as LesserAccount } from '../../../lib/api/schemas';
  import Button from './Button.svelte';
  import { getAccountService } from '../../../lib/api/account-service';
  
  interface Props {
    username: string;
    domain?: string | null;
  }
  
  let { username, domain }: Props = $props();
  
  ;
  
  let account = $state<Account | null>(null);
  let relationship = $state<Relationship | null>(null);
  let loading = $state(true);
  let error = $state('');
  let isInteracting = $state(false);
  
  // Cast to Lesser Account to access enhanced fields
  const lesserAccount = $derived(account as unknown as LesserAccount | null);
  
  // Derived state
  const isOwnProfile = $derived(
    account && authStore.currentUser && 
    account.id === authStore.currentUser.id
  );
  
  // Watch for auth store changes if viewing own profile
  $effect(() => {
    if (isOwnProfile && authStore.currentUser) {
      account = authStore.currentUser;
    }
  });
  
  onMount(async () => {
    await loadProfile();
  });
  
  async function loadProfile() {
    loading = true;
    error = '';
    
    try {
      const accountService = getAccountService();
      
      // Build the identifier based on what we have
      let identifier: string;
      if (domain) {
        identifier = `${username}@${domain}`;
      } else {
        identifier = username;
      }
      
      // Resolve the account (uses GraphQL now)
      account = await accountService.resolveAccount(identifier);
      
      // Get relationship if logged in and not own profile
      if (authStore.currentUser && account.id !== authStore.currentUser.id) {
        const adapter = await getGraphQLAdapter();
        const graphqlRelationship = await adapter.getRelationship(account.id);
        
        // Map GraphQL relationship to Mastodon format
        relationship = {
          id: account.id,
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
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load profile';
      console.error('Failed to load profile:', err);
    } finally {
      loading = false;
    }
  }
  
  async function handleFollow() {
    if (!account || !authStore.currentUser || isInteracting) return;
    
    isInteracting = true;
    try {
      const adapter = await getGraphQLAdapter();
      const identifier = account.id;
      
      if (relationship?.following) {
        await adapter.unfollowActor(identifier);
      } else {
        await adapter.followActor(identifier);
      }
      
      // Fetch updated relationship
      const graphqlRelationship = await adapter.getRelationship(identifier);
      relationship = {
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
    } catch (err) {
      console.error('Follow/unfollow failed:', err);
      alert('Failed to update follow status');
    } finally {
      isInteracting = false;
    }
  }
  
  function formatCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }
  
  function stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '');
  }
  
  // Generate avatar placeholder
  const avatarPlaceholder = $derived(account ? (account.display_name || account.username).charAt(0).toUpperCase() : '');
</script>

<div class="user-profile">
  {#if loading}
    <div class="p-4 animate-pulse">
      <div class="relative h-32 bg-gray-300 dark:bg-gray-700"></div>
      <div class="px-4 pb-4">
        <div class="relative -mt-16 mb-4">
          <div class="w-24 h-24 rounded-full bg-gray-300 dark:bg-gray-700 border-4 border-white dark:border-gray-900"></div>
        </div>
        <div class="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
        <div class="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  {:else if error}
    <div class="p-8 text-center text-red-600 dark:text-red-400">
      {error}
    </div>
  {:else if account}
    <!-- Header image -->
    <div class="relative h-48 bg-gradient-to-br from-purple-600 to-pink-600">
      {#if account.header}
        <img 
          src={account.header} 
          alt="Header" 
          class="w-full h-full object-cover"
        />
      {/if}
    </div>
    
    <div class="px-4 pb-4">
      <!-- Avatar and follow button -->
      <div class="relative -mt-16 mb-4 flex items-end justify-between">
        {#if account.avatar}
          <img 
            src={account.avatar} 
            alt={account.display_name || account.username}
            class="w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 object-cover"
            onerror={(e) => {
              e.currentTarget.style.display = 'none';
              const nextSibling = e.currentTarget.nextElementSibling;
              if (nextSibling) {
                nextSibling.style.display = 'flex';
              }
            }}
          />
          <div 
            class="w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-3xl"
            style="display: none;"
          >
            {avatarPlaceholder}
          </div>
        {:else}
          <div 
            class="w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-3xl"
          >
            {avatarPlaceholder}
          </div>
        {/if}
        
        {#if !isOwnProfile && authStore.currentUser}
          <Button
            onclick={handleFollow}
            loading={isInteracting}
            variant={relationship?.following ? 'secondary' : 'primary'}
            class="rounded-full"
          >
            {#if relationship?.following}
              Following
            {:else if relationship?.requested}
              Requested
            {:else}
              Follow
            {/if}
          </Button>
        {:else if isOwnProfile}
          <a 
            href="/settings/profile"
            class="px-6 py-2 rounded-full font-medium bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            Edit Profile
          </a>
        {/if}
      </div>
      
      <!-- Profile info -->
      <div class="mb-4">
        <h1 class="text-2xl font-bold flex items-center gap-2">
          {account.display_name || account.username}
          {#if account.bot}
            <span class="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-800 rounded">BOT</span>
          {/if}
          {#if account.locked}
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd" />
            </svg>
          {/if}
          {#if lesserAccount?.trust_indicators}
            <!-- Trust Score Badge -->
            <span class="px-3 py-1 text-sm rounded-full {
              lesserAccount.trust_indicators.score >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
              lesserAccount.trust_indicators.score >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
              'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
            }">
              Trust: {lesserAccount.trust_indicators.score}
            </span>
            <!-- Verification Badge -->
            {#if lesserAccount.trust_indicators.verification_level !== 'none'}
              <span class="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {lesserAccount.trust_indicators.verification_level}
              </span>
            {/if}
          {/if}
        </h1>
        <p class="text-gray-600 dark:text-gray-400">@{account.acct}</p>
      </div>
      
      {#if account.note}
        <div class="mb-4 prose prose-sm dark:prose-invert max-w-none">
          {@html sanitizeUserContent(account.note)}
        </div>
      {/if}
      
      <!-- Metadata fields -->
      {#if account.fields.length > 0}
        <div class="mb-4 space-y-2">
          {#each account.fields as field}
            <div class="flex gap-2 text-sm">
              <dt class="font-medium text-gray-600 dark:text-gray-400 min-w-[100px]">
                {field.name}
              </dt>
              <dd class="flex-1 flex items-center gap-1">
                {@html sanitizeUserContent(field.value)}
                {#if field.verified_at}
                  <span class="text-green-600 dark:text-green-400" title="Verified on {new Date(field.verified_at).toLocaleDateString()}">
                    <svg class="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                  </span>
                {/if}
              </dd>
            </div>
          {/each}
        </div>
      {/if}
      
      <!-- Stats -->
      <div class="flex gap-6 text-sm">
        <a href={`/@${username}${domain ? `@${domain}` : ''}/following`} class="hover:underline">
          <strong class="font-semibold">{formatCount(account.following_count)}</strong>
          <span class="text-gray-600 dark:text-gray-400"> Following</span>
        </a>
        <a href={`/@${username}${domain ? `@${domain}` : ''}/followers`} class="hover:underline">
          <strong class="font-semibold">{formatCount(account.followers_count)}</strong>
          <span class="text-gray-600 dark:text-gray-400"> Followers</span>
        </a>
        <div>
          <strong class="font-semibold">{formatCount(account.statuses_count)}</strong>
          <span class="text-gray-600 dark:text-gray-400"> Posts</span>
        </div>
      </div>
      
      {#if lesserAccount?.cost_transparency && (isOwnProfile || authStore.currentUser)}
        <div class="mt-4 p-3 rounded-lg bg-gray-100 dark:bg-gray-800 space-y-2">
          <h3 class="font-medium text-sm text-gray-700 dark:text-gray-300">Cost Transparency</h3>
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span class="text-gray-600 dark:text-gray-400">Monthly Cost</span>
              <div class="font-semibold">${(lesserAccount.cost_transparency.monthly_cost / 100).toFixed(2)}</div>
            </div>
            <div>
              <span class="text-gray-600 dark:text-gray-400">Cost per Post</span>
              <div class="font-semibold">${(lesserAccount.cost_transparency.cost_per_post / 1000000).toFixed(6)}</div>
            </div>
            <div>
              <span class="text-gray-600 dark:text-gray-400">Storage Used</span>
              <div class="font-semibold">{Math.round(lesserAccount.cost_transparency.storage_used / 1024 / 1024)} MB</div>
            </div>
          </div>
        </div>
      {/if}
      
      <!-- Relationship badges -->
      {#if relationship}
        <div class="mt-4 flex flex-wrap gap-2">
          {#if relationship.followed_by}
            <span class="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-800 rounded">
              Follows you
            </span>
          {/if}
          {#if relationship.blocking}
            <span class="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-600 rounded">
              Blocked
            </span>
          {/if}
          {#if relationship.muting}
            <span class="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 rounded">
              Muted
            </span>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

