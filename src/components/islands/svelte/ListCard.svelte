<script lang="ts">
  import type { List } from '@/types/mastodon';
  import { createEventDispatcher } from 'svelte';
  import Button from './Button.svelte';

  export let list: List;
  export let memberCount: number = 0;

  const dispatch = createEventDispatcher();

  function handleEdit() {
    dispatch('edit', list);
  }

  function handleDelete() {
    if (confirm(`Are you sure you want to delete the list "${list.title}"?`)) {
      dispatch('delete', list.id);
    }
  }

  function handleView() {
    window.location.href = `/lists/${list.id}`;
  }

  const replyPolicyLabels = {
    followed: 'Show replies to people you follow',
    list: 'Show replies to list members',
    none: 'Hide replies'
  };
</script>

<div class="list-card">
  <div class="list-info">
    <h3 class="list-title">{list.title}</h3>
    <p class="list-meta">
      {memberCount} {memberCount === 1 ? 'member' : 'members'}
      {#if list.replies_policy}
        • {replyPolicyLabels[list.replies_policy]}
      {/if}
    </p>
  </div>
  
  <div class="list-actions">
    <Button variant="tertiary" size="small" on:click={handleView}>
      View
    </Button>
    <Button variant="tertiary" size="small" on:click={handleEdit}>
      Edit
    </Button>
    <Button variant="tertiary" size="small" on:click={handleDelete}>
      Delete
    </Button>
  </div>
</div>

<style>
  .list-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: var(--color-bg-secondary);
    border-radius: 8px;
    transition: background-color 0.2s;
  }

  .list-card:hover {
    background: var(--color-bg-tertiary);
  }

  .list-info {
    flex: 1;
    min-width: 0;
  }

  .list-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0 0 4px 0;
  }

  .list-meta {
    font-size: 14px;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .list-actions {
    display: flex;
    gap: 8px;
    margin-left: 16px;
  }

  @media (max-width: 640px) {
    .list-card {
      flex-direction: column;
      align-items: flex-start;
    }

    .list-actions {
      margin-left: 0;
      margin-top: 12px;
      width: 100%;
    }

    .list-actions :global(button) {
      flex: 1;
    }
  }
</style>