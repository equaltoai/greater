<script lang="ts">
  import MainLayout from '../layouts/MainLayout.svelte';
  import SearchBar from '../components/islands/svelte/SearchBar.svelte';
  import SearchResults from '../components/islands/svelte/SearchResults.svelte';
</script>

<MainLayout title="Search">
  <div class="search-page">
    <div class="search-header">
      <h1 class="page-title">Search</h1>
      <SearchBar />
    </div>
    <div class="search-content">
      <SearchResults />
    </div>
  </div>
</MainLayout>

<style>
  .search-page {
    max-width: 800px;
    margin: 0 auto;
  }

  .search-header {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg, 0.5rem);
    padding: var(--spacing-4, 1rem);
    margin-bottom: var(--spacing-4, 1rem);
  }

  .page-title {
    font-size: var(--font-size-2xl, 1.5rem);
    font-weight: var(--font-weight-bold, 700);
    color: var(--color-text);
    margin-bottom: var(--spacing-4, 1rem);
  }

  .search-content {
    flex: 1;
  }
</style>
