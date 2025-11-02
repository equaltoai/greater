<script lang="ts">
  import { onMount } from 'svelte';
  import { getGraphQLAdapter, fetchThreadContext } from '../../../lib/api/graphql-client';
  import StatusCard from './StatusCard.svelte';
  import StatusSkeleton from './StatusSkeleton.svelte';
  import ErrorState from './ErrorState.svelte';
  import InlineReplyBox from './InlineReplyBox.svelte';
  import type { Status, StatusContext } from '../../../types/mastodon';

  export let statusId: string;

  let status: Status | null = null;
  let context: StatusContext | null = null;
  let loading = true;
  let error = '';

  onMount(async () => {
    await loadThread();
  });

  // Map GraphQL object to Status
  function mapGraphQLToStatus(obj: any): Status {
    return {
      id: obj.id,
      created_at: obj.published,
      content: obj.content || '',
      visibility: obj.visibility?.toLowerCase() || 'public',
      sensitive: obj.sensitive || false,
      spoiler_text: obj.summary || '',
      uri: obj.id,
      url: obj.url || obj.id,
      in_reply_to_id: obj.inReplyTo?.id || null,
      in_reply_to_account_id: null,
      replies_count: obj.replies?.totalCount || 0,
      reblogs_count: obj.shares?.totalCount || 0,
      favourites_count: obj.likes?.totalCount || 0,
      favourited: obj.userInteractions?.liked || false,
      reblogged: obj.userInteractions?.shared || false,
      bookmarked: obj.userInteractions?.bookmarked || false,
      account: {
        id: obj.attributedTo?.id || obj.author?.id || '',
        username: obj.attributedTo?.preferredUsername || obj.author?.preferredUsername || '',
        acct: obj.attributedTo?.webfinger || obj.author?.webfinger || '',
        display_name: obj.attributedTo?.name || obj.author?.name || '',
        avatar: obj.attributedTo?.icon?.url || obj.author?.icon?.url || '',
        avatar_static: obj.attributedTo?.icon?.url || obj.author?.icon?.url || '',
        url: obj.attributedTo?.url || obj.author?.url || '',
        locked: false,
        bot: false,
        discoverable: true,
        group: false,
        created_at: new Date().toISOString(),
        note: '',
        header: '',
        header_static: '',
        followers_count: 0,
        following_count: 0,
        statuses_count: 0,
        last_status_at: null,
        emojis: [],
        fields: []
      },
      media_attachments: [],
      mentions: [],
      tags: [],
      emojis: [],
      card: null,
      poll: null,
      application: null,
      language: null,
      pinned: false,
      reblog: null,
      muted: false,
      edited_at: null
    };
  }

  async function loadThread() {
    loading = true;
    error = '';
    
    try {
      const adapter = await getGraphQLAdapter();
      
      // Load status and thread context in parallel
      const [statusObj, threadContextData] = await Promise.all([
        adapter.getObjectById(statusId),
        fetchThreadContext(statusId)
      ]);
      
      status = mapGraphQLToStatus(statusObj);
      
      // Map ancestors and descendants from GraphQL
      context = {
        ancestors: threadContextData.ancestors.map(mapGraphQLToStatus),
        descendants: threadContextData.descendants.map(mapGraphQLToStatus)
      };
      
      console.log('[StatusThread] Loaded thread:', {
        statusId,
        status: status?.id,
        ancestors: context.ancestors.length,
        descendants: context.descendants.length
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

  // Handle successful reply
  async function handleReplySuccess(newStatus: Status) {
    // Reload the thread to show the new reply
    await loadThread();
  }
</script>

<div class="min-h-[400px]">
  {#if loading}
    <div class="px-4 py-4 space-y-4">
      <StatusSkeleton />
      <StatusSkeleton />
      <StatusSkeleton />
    </div>
  {:else if error}
    <div class="px-4 py-4">
      <ErrorState message={error} onRetry={loadThread} />
    </div>
  {:else if status}
    <div class="px-4 py-4 space-y-4">
      <!-- Main status -->
      <StatusCard status={status} showThread={false} />
      
      <!-- Reply composer -->
      <InlineReplyBox replyTo={status} onSuccess={handleReplySuccess} />
      
      <!-- Replies (descendants) -->
      {#if context && context.descendants.length > 0}
        <div class="card px-4 py-2">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            {context.descendants.length} {context.descendants.length === 1 ? 'Reply' : 'Replies'}
          </p>
        </div>
        
        {#snippet renderReplies(statuses, parentId, depth = 0)}
          {#each statuses.filter(s => s.in_reply_to_id === parentId) as reply}
            {@const childReplies = statuses.filter(s => s.in_reply_to_id === reply.id)}
            <div class:ml-12={depth > 0}>
              <StatusCard status={reply} showThread={false} />
              
              <!-- Nested replies -->
              {#if childReplies.length > 0}
                {@render renderReplies(statuses, reply.id, depth + 1)}
              {/if}
            </div>
          {/each}
        {/snippet}
        
        {@render renderReplies(context.descendants, status.id)}
      {/if}
    </div>
  {:else}
    <div class="p-8 text-center text-gray-500 dark:text-gray-400">
      Status not found
    </div>
  {/if}
</div>