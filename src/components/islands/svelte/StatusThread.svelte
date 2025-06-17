<script lang="ts">
  import { onMount } from 'svelte';
  import { getClient } from '../../../lib/api/client';
  import StatusCard from './StatusCard.svelte';
  import StatusSkeleton from './StatusSkeleton.svelte';
  import ErrorState from './ErrorState.svelte';
  import type { Status, StatusContext } from '../../../types/mastodon';

  export let statusId: string;

  let status: Status | null = null;
  let context: StatusContext | null = null;
  let loading = true;
  let error = '';

  onMount(async () => {
    await loadThread();
  });

  async function loadThread() {
    loading = true;
    error = '';
    
    try {
      const client = getClient();
      
      // Load status and context in parallel
      const [statusResult, contextResult] = await Promise.all([
        client.getStatus(statusId),
        client.getStatusContext(statusId)
      ]);
      
      status = statusResult;
      context = contextResult;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load thread';
      console.error('Failed to load thread:', err);
    } finally {
      loading = false;
    }
  }

  // Combine ancestors and descendants with the main status
  $: thread = context ? [
    ...context.ancestors,
    ...(status ? [status] : []),
    ...context.descendants
  ] : [];

  // Find direct replies (for threading visualization)
  function isDirectReply(s: Status, index: number): boolean {
    if (index === 0) return false;
    return s.in_reply_to_id === thread[index - 1].id;
  }
</script>

<div class="min-h-[400px]">
  {#if loading}
    <StatusSkeleton />
    <StatusSkeleton />
    <StatusSkeleton />
  {:else if error}
    <ErrorState message={error} onRetry={loadThread} />
  {:else if thread.length > 0}
    {#snippet threadItem(s, index)}
      <div class="relative">
        {#if index > 0 && isDirectReply(s, index)}
          <!-- Thread line connector -->
          <div class="absolute left-12 -top-4 bottom-0 w-0.5 bg-gray-300 dark:bg-gray-700"></div>
        {/if}
        
        <div class:opacity-75={s.id !== statusId}>
          <StatusCard
            status={s}
            showThread={false}
          />
        </div>
        
        {#if s.id === statusId}
          <!-- Reply composer inline for the focused status -->
          <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
            <button
              onclick={() => {
                import('../../../lib/stores/compose').then(({ composeReplyTo$, composeText$ }) => {
                  composeReplyTo$.set(s.id);
                  composeText$.set(`@${s.account.acct} `);
                  window.location.href = '/compose';
                });
              }}
              class="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
            >
              Reply to @{s.account.acct}...
            </button>
          </div>
        {/if}
      </div>
    {/snippet}
    
    <div class="divide-y divide-gray-200 dark:divide-gray-800">
      {#each thread as s, index}
        {@render threadItem(s, index)}
      {/each}
    </div>
  {:else}
    <div class="p-8 text-center text-gray-500 dark:text-gray-400">
      Status not found
    </div>
  {/if}
</div>