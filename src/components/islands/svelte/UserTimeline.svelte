<script lang="ts">
  import { onMount } from 'svelte';
  import { getClient } from '../../../lib/api/client';
  import { authStore } from '../../../lib/stores/auth.svelte';
  import type { Status, Account } from '../../../types/mastodon';
  import StatusCard from './StatusCard.svelte';
  import { getAccountService, getAccountStatuses } from '../../../lib/api/account-service';
  
  let { username, domain }: { username: string; domain?: string | null } = $props();
  
  let statuses = $state<Status[]>([]);
  let loading = $state(true);
  let error = $state('');
  let hasMore = $state(true);
  let loadingMore = $state(false);
  let account: Account | null = null;
  
  onMount(async () => {
    await loadStatuses();
  });
  
  async function loadStatuses() {
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
      
      // Resolve the account
      account = await accountService.resolveAccount(identifier);
      
      // Then load their statuses using the resolved account ID
      const userStatuses = await getAccountStatuses(account.id, { limit: 20 });
      statuses = userStatuses;
      hasMore = userStatuses.length === 20;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load statuses';
      console.error('Failed to load user statuses:', err);
    } finally {
      loading = false;
    }
  }
  
  async function loadMore() {
    if (!hasMore || loadingMore || !account) return;
    
    loadingMore = true;
    
    try {
      const lastStatus = statuses[statuses.length - 1];
      
      const moreStatuses = await getAccountStatuses(account.id, {
        max_id: lastStatus.id,
        limit: 20
      });
      
      statuses = [...statuses, ...moreStatuses];
      hasMore = moreStatuses.length === 20;
    } catch (err) {
      console.error('Failed to load more statuses:', err);
    } finally {
      loadingMore = false;
    }
  }
</script>

<div class="space-y-4">
  {#if loading}
    <div class="text-center py-12">
      <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p>Loading posts...</p>
    </div>
  {:else if error}
    <div class="text-center py-12 text-red-600 dark:text-red-400">
      <p>{error}</p>
    </div>
  {:else if statuses.length === 0}
    <div class="text-center py-12 text-gray-500">
      <p>No posts yet</p>
    </div>
  {:else}
    {#each statuses as status (status.id)}
      <StatusCard {status} />
    {/each}
    
    {#if hasMore}
      <div class="text-center py-4">
        <button
          onclick={loadMore}
          disabled={loadingMore}
          class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {loadingMore ? 'Loading...' : 'Load more'}
        </button>
      </div>
    {/if}
  {/if}
</div>