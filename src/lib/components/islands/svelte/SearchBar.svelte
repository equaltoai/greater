<script lang="ts">
  import { GCTextField } from '$lib/components';
  import { searchStore } from '$lib/stores/search.svelte';
  
  ;
  
  let searchQuery = $state('');
  let isFocused = $state(false);
  
  const searchHistory = $derived(searchStore.searchHistory);
  const filteredHistory = $derived(searchQuery 
    ? searchHistory.filter(q => q.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5)
    : searchHistory.slice(0, 5));
  
  // Handle search submission
  function handleSearch(event: Event) {
    event.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search page with query
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  }
  
  // Handle focus/blur for styling
  function handleFocus() {
    isFocused = true;
  }
  
  function handleBlur() {
    // Delay to allow clicking suggestions
    setTimeout(() => {
      isFocused = false;
    }, 200);
  }
  
  // Handle clear
  function handleClear() {
    searchQuery = '';
  }
</script>

<form onsubmit={handleSearch} class="relative w-full max-w-md">
  <GCTextField
    bind:value={searchQuery}
    type="search"
    placeholder="Search posts, users, hashtags..."
    onfocus={handleFocus}
    onblur={handleBlur}
    class="w-full search-field"
    aria-label="Search"
  >
    {#snippet prefix()}
      <svg 
        class="w-5 h-5 text-gray-400"
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          stroke-linecap="round" 
          stroke-linejoin="round" 
          stroke-width="2" 
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    {/snippet}
    {#snippet suffix()}
      {#if searchQuery}
        <button
          type="button"
          onclick={handleClear}
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Clear search"
        >
          <svg 
            class="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              stroke-linecap="round" 
              stroke-linejoin="round" 
              stroke-width="2" 
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      {/if}
    {/snippet}
  </GCTextField>
  
  <!-- Search suggestions -->
  {#if isFocused && (filteredHistory.length > 0 || searchQuery)}
    <div class="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
      {#if filteredHistory.length > 0}
        <div class="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Recent searches
        </div>
        {#each filteredHistory as query}
          <button
            type="button"
            onclick={() => {
              searchQuery = query;
              handleSearch(new Event('submit'));
            }}
            class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center space-x-2"
          >
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{query}</span>
          </button>
        {/each}
      {:else if searchQuery}
        <button
          type="submit"
          class="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          Search for "{searchQuery}"
        </button>
      {/if}
    </div>
  {/if}
</form>

