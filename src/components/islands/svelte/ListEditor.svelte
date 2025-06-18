<script lang="ts">
  import type { List } from '@/types/mastodon';
  import { createEventDispatcher } from 'svelte';
  import { listsStore } from '@/lib/stores/lists.svelte';
  import Button from './Button.svelte';

  export let list: List | null = null;
  export let onClose: () => void;

  const dispatch = createEventDispatcher();
  ;

  let title = list?.title || '';
  let repliesPolicy: 'followed' | 'list' | 'none' = list?.replies_policy || 'list';
  let isSubmitting = false;
  let error = '';

  async function handleSubmit() {
    if (!title.trim()) {
      error = 'List name is required';
      return;
    }

    isSubmitting = true;
    error = '';

    try {
      if (list) {
        await listsStore.updateList(list.id, title, repliesPolicy);
        dispatch('updated', list.id);
      } else {
        const newList = await listsStore.createList(title, repliesPolicy);
        dispatch('created', newList);
      }
      onClose();
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to save list';
    } finally {
      isSubmitting = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="list-editor-backdrop" on:click={onClose}>
  <div class="list-editor" on:click|stopPropagation>
    <h2>{list ? 'Edit List' : 'Create New List'}</h2>
    
    <form on:submit|preventDefault={handleSubmit}>
      <div class="form-group">
        <label for="list-title">List name</label>
        <input
          id="list-title"
          type="text"
          bind:value={title}
          placeholder="Enter list name"
          maxlength="200"
          required
          disabled={isSubmitting}
        />
      </div>

      <div class="form-group">
        <label for="replies-policy">Show replies</label>
        <select
          id="replies-policy"
          bind:value={repliesPolicy}
          disabled={isSubmitting}
        >
          <option value="followed">To people you follow</option>
          <option value="list">To list members</option>
          <option value="none">Don't show replies</option>
        </select>
      </div>

      {#if error}
        <div class="error-message">{error}</div>
      {/if}

      <div class="actions">
        <Button variant="tertiary" on:click={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !title.trim()}>
          {isSubmitting ? 'Saving...' : list ? 'Save Changes' : 'Create List'}
        </Button>
      </div>
    </form>
  </div>
</div>

<style>
  .list-editor-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 16px;
  }

  .list-editor {
    background: var(--color-bg-primary);
    border-radius: 12px;
    padding: 24px;
    max-width: 480px;
    width: 100%;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  h2 {
    margin: 0 0 24px 0;
    font-size: 20px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .form-group {
    margin-bottom: 20px;
  }

  label {
    display: block;
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text-secondary);
  }

  input,
  select {
    width: 100%;
    padding: 10px 16px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-bg-secondary);
    color: var(--color-text-primary);
    font-size: 16px;
    transition: border-color 0.2s;
  }

  input:focus,
  select:focus {
    outline: none;
    border-color: var(--color-primary);
  }

  input:disabled,
  select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error-message {
    padding: 12px;
    background: var(--color-error-bg);
    color: var(--color-error);
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
  }

  .actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  @media (max-width: 480px) {
    .list-editor {
      padding: 20px;
    }

    .actions {
      flex-direction: column-reverse;
    }

    .actions :global(button) {
      width: 100%;
    }
  }
</style>