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
      
      console.log('[StatusThread] Loaded thread:', {
        statusId,
        status: status?.id,
        ancestors: context?.ancestors?.length || 0,
        descendants: context?.descendants?.length || 0,
        descendantIds: context?.descendants?.map(d => ({id: d.id, replyTo: d.in_reply_to_id}))
      });
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
  {:else if status}
    <div class="space-y-4">
      <!-- Main status in consistent card format -->
      <div class="bg-surface rounded-lg border border-border overflow-hidden">
        <StatusCard status={status} showThread={false} />
        
        <!-- Reply composer -->
        <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
          <button
            onclick={() => {
              // Store reply context in sessionStorage before navigating
              const replyContext = {
                replyToId: status.id,
                mention: `@${status.account.acct} `
              };
              sessionStorage.setItem('compose_reply_context', JSON.stringify(replyContext));
              window.location.href = '/compose';
            }}
            class="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 dark:text-gray-400"
          >
            Reply to @{status.account.acct}...
          </button>
        </div>
      </div>
      
      <!-- Replies (descendants) -->
      {#if context && context.descendants.length > 0}
        <div class="bg-surface rounded-lg border border-border overflow-hidden">
          <div class="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
              {context.descendants.length} {context.descendants.length === 1 ? 'Reply' : 'Replies'}
            </p>
          </div>
          
          {#snippet renderReplies(statuses, parentId)}
            {#each statuses.filter(s => s.in_reply_to_id === parentId) as reply}
              {@const childReplies = statuses.filter(s => s.in_reply_to_id === reply.id)}
              <div class="border-b border-gray-200 dark:border-gray-800 last:border-b-0">
                <StatusCard status={reply} showThread={false} />
                
                <!-- Nested replies -->
                {#if childReplies.length > 0}
                  <div class="border-l-2 border-gray-200 dark:border-gray-700 ml-12">
                    {@render renderReplies(statuses, reply.id)}
                  </div>
                {/if}
              </div>
            {/each}
          {/snippet}
          
          {@render renderReplies(context.descendants, status.id)}
        </div>
      {/if}
    </div>
  {:else}
    <div class="p-8 text-center text-gray-500 dark:text-gray-400">
      Status not found
    </div>
  {/if}
</div>