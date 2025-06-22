<script lang="ts">
  import { getClient } from '../../../lib/api/client';
  import { timelineStore } from '../../../lib/stores/timeline.svelte';
  import type { Status } from '../../../types/mastodon';

  export let replyTo: Status;
  export let onSuccess: (status: Status) => void = () => {};

  let text = `@${replyTo.account.acct} `;
  let isSubmitting = false;
  let error = '';
  let textareaEl: HTMLTextAreaElement;
  let isFocused = false;

  $: characterCount = text.length;
  $: canPost = text.trim().length > 0 && text.trim() !== `@${replyTo.account.acct}` && characterCount <= 500 && !isSubmitting;

  function handleTextInput() {
    if (textareaEl) {
      textareaEl.style.height = 'auto';
      textareaEl.style.height = textareaEl.scrollHeight + 'px';
    }
  }

  async function handleSubmit() {
    if (!canPost) return;

    isSubmitting = true;
    error = '';

    try {
      const client = getClient();
      const status = await client.createStatus({
        status: text,
        in_reply_to_id: replyTo.id,
        visibility: replyTo.visibility || 'public'
      });

      // Clear the text
      text = `@${replyTo.account.acct} `;
      isFocused = false;
      
      // Call success callback
      onSuccess(status);
      
      // Also add to timeline
      timelineStore.prependStatus('home', status);
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to post reply';
      console.error('Failed to post reply:', err);
    } finally {
      isSubmitting = false;
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && canPost) {
      handleSubmit();
    }
  }

  function handleFocus() {
    isFocused = true;
    // Place cursor at end
    setTimeout(() => {
      if (textareaEl) {
        textareaEl.selectionStart = textareaEl.selectionEnd = text.length;
      }
    }, 0);
  }
</script>

<div class="card px-4 py-3">
  {#if error}
    <div class="mb-3 p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded">
      {error}
    </div>
  {/if}

  <div class="space-y-3">
    <textarea
      bind:this={textareaEl}
      bind:value={text}
      on:input={handleTextInput}
      on:keydown={handleKeyDown}
      on:focus={handleFocus}
      on:blur={() => setTimeout(() => isFocused = false, 200)}
      placeholder="Reply to @{replyTo.account.acct}..."
      class="w-full min-h-[60px] px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all {isFocused ? 'min-h-[100px]' : ''}"
      style="height: auto;"
    />

    {#if isFocused || text.trim() !== `@${replyTo.account.acct}`}
      <div class="flex items-center justify-between">
        <div class="text-sm {characterCount > 500 ? 'text-red-500' : 'text-gray-500'}">
          {characterCount}/500
        </div>
        
        <button
          type="button"
          on:click={handleSubmit}
          disabled={!canPost}
          class="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Replying...' : 'Reply'}
        </button>
      </div>
    {/if}
  </div>
</div>