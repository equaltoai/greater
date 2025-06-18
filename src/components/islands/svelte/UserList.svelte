<script lang="ts">
  import { onMount } from 'svelte';
  import { getClient } from '../../../lib/api/client';
  import { authStore } from '../../../lib/stores/auth.svelte';
  import type { Account, Relationship } from '../../../types/mastodon';
  import UserCard from './UserCard.svelte';
  
  interface Props {
    username: string;
    domain?: string | null;
    listType: 'followers' | 'following';
  }
  
  let { username, domain, listType }: Props = $props();
  
  let users = $state<Account[]>([]);
  let relationships = $state<Map<string, Relationship>>(new Map());
  let loading = $state(true);
  let error = $state('');
  let hasMore = $state(true);
  let loadingMore = $state(false);
  let account: Account | null = null;
  let nextMaxId: string | null = null;
  
  onMount(async () => {
    await loadUsers();
  });
  
  async function loadUsers() {
    loading = true;
    error = '';
    
    
    try {
      const client = getClient();
      
      // First find the account (same logic as UserProfile)
      if (!domain && authStore.currentUser && authStore.currentUser.username === username) {
        account = authStore.currentUser;
      } else {
        let searchAcct = username;
        
        if (!domain && authStore.currentInstance) {
          searchAcct = `@${username}`;
        } else if (domain) {
          searchAcct = `@${username}@${domain}`;
        }
        
        const searchResults = await client.search({ 
          q: searchAcct, 
          type: 'accounts', 
          limit: 5, 
          resolve: true 
        });
        
        let foundAccount = searchResults.accounts.find(acc => {
          if (domain) {
            return acc.acct === `${username}@${domain}` || acc.username === username;
          } else {
            return acc.username === username && !acc.acct.includes('@');
          }
        });
        
        if (!foundAccount && searchResults.accounts.length > 0) {
          foundAccount = searchResults.accounts[0];
        }
        
        if (!foundAccount) {
          throw new Error('User not found');
        }
        
        account = foundAccount;
      }
      
      // Then load their followers/following
      let result;
      if (listType === 'followers') {
        result = await client.getAccountFollowers(account.id, { limit: 40 });
      } else {
        result = await client.getAccountFollowing(account.id, { limit: 40 });
      }
      
      users = result;
      hasMore = result.length === 40;
      
      // Extract next max_id from Link header if available
      // This would need to be added to the API client to return pagination info
      
      // Get relationships for all users if logged in
      if (authStore.currentUser && users.length > 0) {
        const userIds = users.map(u => u.id);
        const rels = await client.getRelationships(userIds);
        relationships = new Map(rels.map(r => [r.id, r]));
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load users';
      console.error('Failed to load users:', err);
    } finally {
      loading = false;
    }
  }
  
  async function loadMore() {
    if (!hasMore || loadingMore || !account) return;
    
    loadingMore = true;
    
    try {
      const client = getClient();
      
      let moreUsers;
      if (listType === 'followers') {
        moreUsers = await client.getAccountFollowers(account.id, {
          max_id: users[users.length - 1].id,
          limit: 40
        });
      } else {
        moreUsers = await client.getAccountFollowing(account.id, {
          max_id: users[users.length - 1].id,
          limit: 40
        });
      }
      
      // Get relationships for new users
      if (authStore.currentUser && moreUsers.length > 0) {
        const userIds = moreUsers.map(u => u.id);
        const rels = await client.getRelationships(userIds);
        rels.forEach(r => relationships.set(r.id, r));
        relationships = relationships; // Trigger reactivity
      }
      
      users = [...users, ...moreUsers];
      hasMore = moreUsers.length === 40;
    } catch (err) {
      console.error('Failed to load more users:', err);
    } finally {
      loadingMore = false;
    }
  }
  
  async function handleRelationshipUpdate(userId: string, newRelationship: Relationship) {
    relationships.set(userId, newRelationship);
    relationships = relationships; // Trigger reactivity
  }
</script>

<div class="divide-y divide-gray-200 dark:divide-gray-700">
  {#if loading}
    <div class="p-8 text-center">
      <div class="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p>Loading {listType}...</p>
    </div>
  {:else if error}
    <div class="p-8 text-center text-red-600 dark:text-red-400">
      <p>{error}</p>
    </div>
  {:else if users.length === 0}
    <div class="p-8 text-center text-gray-500">
      {#if domain}
        <p class="mb-2">Unable to load {listType} for this remote user</p>
        <p class="text-sm">This information may not be available due to federation limitations</p>
      {:else}
        <p>No {listType} yet</p>
      {/if}
    </div>
  {:else}
    {#each users as user (user.id)}
      {@const userRelationship = relationships.get(user.id)}
      <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
        <UserCard 
          {user} 
          relationship={userRelationship}
          onRelationshipUpdate={(rel) => handleRelationshipUpdate(user.id, rel)}
        />
      </div>
    {/each}
    
    {#if hasMore}
      <div class="p-4 text-center">
        <button
          onclick={loadMore}
          disabled={loadingMore}
          class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loadingMore ? 'Loading...' : 'Load more'}
        </button>
      </div>
    {/if}
  {/if}
</div>