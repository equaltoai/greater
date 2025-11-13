<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { timelineStore } from '$lib/stores/timeline.svelte';
  import { listsStore } from '$lib/stores/lists.svelte';
  import Timeline from './Timeline.svelte';
  import EmptyState from './EmptyState.svelte';
  import ErrorState from './ErrorState.svelte';
  import Button from './Button.svelte';

  export let listId: string;

  ;
  ;

  let list = listsStore.getListById(listId);
  let memberCount = 0;

  $: statuses = timelineStore.timelines[`list:${listId}`] || [];
  $: isLoading = timelineStore.isLoading;
  $: error = timelineStore.error;

  onMount(async () => {
    // Fetch list details if not cached
    if (!list) {
      await listsStore.fetchLists();
      list = listsStore.getListById(listId);
    }

    // Fetch list members
    await listsStore.fetchListMembers(listId);
    memberCount = listsStore.listMembers[listId]?.length || 0;

    // Load timeline
    await timelineStore.loadTimeline(`list:${listId}`);
  });

  onDestroy(() => {
    // Clean up if needed
  });

  async function handleRefresh() {
    await timelineStore.refreshTimeline(`list:${listId}`);
  }

  async function loadMore() {
    await timelineStore.loadMore(`list:${listId}`);
  }

  function handleManageList() {
    window.location.href = '/lists';
  }
</script>

<div class="list-timeline">
  {#if list}
    <div class="list-header">
      <div class="list-info">
        <h1>{list.title}</h1>
        <p class="list-meta">
          {memberCount} {memberCount === 1 ? 'member' : 'members'}
        </p>
      </div>
      <Button variant="tertiary" on:click={handleManageList}>
        Manage List
      </Button>
    </div>
  {/if}

  {#if error}
    <ErrorState 
      message={error} 
      onRetry={handleRefresh} 
    />
  {:else if statuses.length === 0 && !isLoading}
    <EmptyState
      icon="message"
      title="No posts yet"
      description={memberCount === 0 
        ? "Add accounts to this list to see their posts" 
        : "Posts from list members will appear here"}
      action={memberCount === 0 ? "Manage List" : undefined}
      onAction={memberCount === 0 ? handleManageList : undefined}
    />
  {:else}
    <Timeline
      type={`list:${listId}`}
      groupConversations={false}
    />
  {/if}
</div>

<style>
  .list-timeline {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .list-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-bg-primary);
  }

  .list-info {
    flex: 1;
    min-width: 0;
  }

  h1 {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0 0 4px 0;
  }

  .list-meta {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0;
  }

  @media (max-width: 640px) {
    .list-header {
      padding: 12px 16px;
    }

    h1 {
      font-size: 18px;
    }
  }
</style>