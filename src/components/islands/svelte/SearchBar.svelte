<script lang="ts">
  let searchQuery = $state('');
  let isFocused = $state(false);
  
  // Handle search submission (placeholder)
  function handleSearch(event: Event) {
    event.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement actual search functionality
      // Search query is available in searchQuery variable
    }
  }
  
  // Handle focus/blur for styling
  function handleFocus() {
    isFocused = true;
  }
  
  function handleBlur() {
    isFocused = false;
  }
</script>

<form onsubmit={handleSearch} class="relative w-full max-w-md">
  <div class="relative">
    <!-- Search icon -->
    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
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
    </div>
    
    <!-- Search input -->
    <input
      type="search"
      bind:value={searchQuery}
      onfocus={handleFocus}
      onblur={handleBlur}
      placeholder="Search posts, users, hashtags..."
      class="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
      class:ring-2={isFocused}
      class:ring-blue-500={isFocused}
    />
    
    <!-- Clear button (shown when there's text) -->
    {#if searchQuery}
      <button
        type="button"
        onclick={() => searchQuery = ''}
        class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
  </div>
  
  <!-- Search suggestions (placeholder - not functional yet) -->
  {#if isFocused && searchQuery}
    <div class="absolute top-full mt-2 w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
      <div class="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
        No results found for "{searchQuery}"
      </div>
    </div>
  {/if}
</form>

<style>
  /* Remove default search input styling */
  input[type="search"]::-webkit-search-cancel-button,
  input[type="search"]::-webkit-search-decoration {
    -webkit-appearance: none;
    appearance: none;
  }
</style>