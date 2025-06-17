<script lang="ts">
  import { onMount } from 'svelte';
  import { searchStore } from '@/lib/stores/search';
  import { getClient } from '@/lib/api/client';
  import StatusCard from './StatusCard.svelte';
  import UserCard from './UserCard.svelte';
  import HashtagCard from './HashtagCard.svelte';
  import EmptyState from './EmptyState.svelte';
  import ErrorState from './ErrorState.svelte';
  import StatusSkeleton from './StatusSkeleton.svelte';
  
  ;
  
  let searchQuery = $state('');
  let activeTab = $state<'all' | 'accounts' | 'statuses' | 'hashtags'>('all');
  
  // Get query from URL on mount
  onMount(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const q = urlParams.get('q');
    if (q) {
      searchQuery = q;
      performSearch();
    }
  });
  
  async function performSearch() {
    const client = getClient();
    if (!searchQuery.trim() || !client) return;
    
    // Update URL
    const url = new URL(window.location.href);
    url.searchParams.set('q', searchQuery);
    window.history.replaceState({}, '', url);
    
    await searchStore.search(client, searchQuery);
  }
  
  function handleSubmit(e: Event) {
    e.preventDefault();
    performSearch();
  }
  
  function handleTabChange(tab: typeof activeTab) {
    activeTab = tab;
    searchStore.setActiveTab(tab);
  }
  
  function clearSearch() {
    searchQuery = '';
    searchStore.clearResults();
    
    // Clear URL
    const url = new URL(window.location.href);
    url.searchParams.delete('q');
    window.history.replaceState({}, '', url);
  }
  
  const results = $derived(searchStore.results);
  const loading = $derived(searchStore.loading);
  const error = $derived(searchStore.error);
  const searchHistory = $derived(searchStore.searchHistory);
  
  // Filter results based on active tab
  const filteredResults = $derived({
    accounts: activeTab === 'all' || activeTab === 'accounts' ? results?.accounts || [] : [],
    statuses: activeTab === 'all' || activeTab === 'statuses' ? results?.statuses || [] : [],
    hashtags: activeTab === 'all' || activeTab === 'hashtags' ? results?.hashtags || [] : []
  });
  
  const hasResults = $derived(results && (
    results.accounts.length > 0 || 
    results.statuses.length > 0 || 
    results.hashtags.length > 0
  ));
</script>

<div class="space-y-4">
  <!-- Search Form -->
  <form onsubmit={handleSubmit} class="sticky top-0 bg-white dark:bg-gray-900 z-10 pb-4">
    <div class="relative">
      <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      <input
        type="search"
        bind:value={searchQuery}
        placeholder="Search posts, users, hashtags..."
        class="w-full pl-10 pr-10 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      
      {#if searchQuery}
        <button
          type="button"
          onclick={clearSearch}
          class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Clear search"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      {/if}
    </div>
  </form>
  
  <!-- Search History (when no active search) -->
  {#if !searchQuery && searchHistory.length > 0}
    <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
      <div class="flex items-center justify-between mb-3">
        <h3 class="font-semibold text-gray-900 dark:text-gray-100">Recent Searches</h3>
        <button
          onclick={() => searchStore.clearHistory()}
          class="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Clear all
        </button>
      </div>
      <div class="space-y-2">
        {#each searchHistory as query}
          <button
            onclick={() => {
              searchQuery = query;
              performSearch();
            }}
            class="flex items-center space-x-2 w-full text-left px-3 py-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span class="text-gray-700 dark:text-gray-300">{query}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
  
  <!-- Tabs -->
  {#if hasResults || loading}
    <div class="border-b border-gray-200 dark:border-gray-700">
      <nav class="flex space-x-8">
        <button
          onclick={() => handleTabChange('all')}
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors {
            activeTab === 'all' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }"
        >
          All
        </button>
        <button
          onclick={() => handleTabChange('accounts')}
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors {
            activeTab === 'accounts' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }"
        >
          People
          {#if results?.accounts.length}
            <span class="ml-1 text-xs">({results.accounts.length})</span>
          {/if}
        </button>
        <button
          onclick={() => handleTabChange('statuses')}
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors {
            activeTab === 'statuses' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }"
        >
          Posts
          {#if results?.statuses.length}
            <span class="ml-1 text-xs">({results.statuses.length})</span>
          {/if}
        </button>
        <button
          onclick={() => handleTabChange('hashtags')}
          class="py-2 px-1 border-b-2 font-medium text-sm transition-colors {
            activeTab === 'hashtags' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }"
        >
          Hashtags
          {#if results?.hashtags.length}
            <span class="ml-1 text-xs">({results.hashtags.length})</span>
          {/if}
        </button>
      </nav>
    </div>
  {/if}
  
  <!-- Results -->
  <div class="space-y-4">
    {#if loading}
      <div class="space-y-4">
        {#each Array(3) as _}
          <StatusSkeleton />
        {/each}
      </div>
    {:else if error}
      <ErrorState message={error} onretry={performSearch} />
    {:else if !hasResults && searchQuery}
      <EmptyState 
        message="No results found" 
        description={`Try searching for something else or check your spelling`}
      />
    {:else if hasResults}
      <!-- Accounts -->
      {#if filteredResults.accounts.length > 0}
        <section>
          {#if activeTab === 'all'}
            <h2 class="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">People</h2>
          {/if}
          <div class="space-y-2">
            {#each filteredResults.accounts as account}
              <UserCard {account} />
            {/each}
          </div>
        </section>
      {/if}
      
      <!-- Statuses -->
      {#if filteredResults.statuses.length > 0}
        <section>
          {#if activeTab === 'all'}
            <h2 class="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Posts</h2>
          {/if}
          <div class="space-y-4">
            {#each filteredResults.statuses as status}
              <StatusCard {status} />
            {/each}
          </div>
        </section>
      {/if}
      
      <!-- Hashtags -->
      {#if filteredResults.hashtags.length > 0}
        <section>
          {#if activeTab === 'all'}
            <h2 class="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">Hashtags</h2>
          {/if}
          <div class="space-y-2">
            {#each filteredResults.hashtags as hashtag}
              <HashtagCard {hashtag} />
            {/each}
          </div>
        </section>
      {/if}
    {/if}
  </div>
</div>