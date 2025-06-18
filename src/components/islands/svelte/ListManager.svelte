<script lang="ts">
  import { onMount } from 'svelte';
  import { listsStore } from '@/lib/stores/lists.svelte';
  import ListCard from './ListCard.svelte';
  import ListEditor from './ListEditor.svelte';
  import Button from './Button.svelte';
  import EmptyState from './EmptyState.svelte';
  import ErrorState from './ErrorState.svelte';
  import type { List } from '@/types/mastodon';

  ;
  
  let showEditor = false;
  let editingList: List | null = null;

  $: ({ lists, listMembers, isLoading, error } = listsStore);

  onMount(() => {
    listsStore.fetchLists();
    
    // Fetch member counts for all lists
    lists.forEach(list => {
      if (!listMembers[list.id]) {
        listsStore.fetchListMembers(list.id);
      }
    });
  });

  function handleCreateList() {
    editingList = null;
    showEditor = true;
  }

  function handleEditList(event: CustomEvent<List>) {
    editingList = event.detail;
    showEditor = true;
  }

  async function handleDeleteList(event: CustomEvent<string>) {
    try {
      await listsStore.deleteList(event.detail);
    } catch (err) {
      console.error('Failed to delete list:', err);
    }
  }

  function handleEditorClose() {
    showEditor = false;
    editingList = null;
  }

  function handleListCreated() {
    listsStore.fetchLists();
  }

  function handleListUpdated() {
    listsStore.fetchLists();
  }
</script>

<div class="list-manager">
  <div class="header">
    <h1>Lists</h1>
    <Button on:click={handleCreateList}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
      </svg>
      New List
    </Button>
  </div>

  {#if error}
    <ErrorState 
      message={error} 
      onRetry={() => listsStore.fetchLists()} 
    />
  {:else if isLoading && lists.length === 0}
    <div class="loading">
      <div class="skeleton-list">
        {#each Array(3) as _}
          <div class="skeleton-item"></div>
        {/each}
      </div>
    </div>
  {:else if lists.length === 0}
    <EmptyState
      icon="list"
      title="No lists yet"
      description="Create lists to organize accounts you follow"
      action="Create your first list"
      onAction={handleCreateList}
    />
  {:else}
    <div class="lists-grid">
      {#each lists as list (list.id)}
        <ListCard 
          {list} 
          memberCount={listMembers[list.id]?.length || 0}
          on:edit={handleEditList}
          on:delete={handleDeleteList}
        />
      {/each}
    </div>
  {/if}
</div>

{#if showEditor}
  <ListEditor
    list={editingList}
    onClose={handleEditorClose}
    on:created={handleListCreated}
    on:updated={handleListUpdated}
  />
{/if}

<style>
  .list-manager {
    padding: 24px;
    max-width: 800px;
    margin: 0 auto;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 32px;
  }

  h1 {
    font-size: 28px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
  }

  .lists-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .loading {
    padding: 48px 0;
  }

  .skeleton-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .skeleton-item {
    height: 80px;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
  }

  @media (max-width: 640px) {
    .list-manager {
      padding: 16px;
    }

    .header {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }

    h1 {
      font-size: 24px;
    }
  }
</style>