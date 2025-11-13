<script lang="ts">
  import { onMount } from 'svelte';
import { getGraphQLAdapter, fetchThreadContext } from '$lib/api/graphql-client';
import StatusCard from './StatusCard.svelte';
import StatusSkeleton from './StatusSkeleton.svelte';
import ErrorState from './ErrorState.svelte';
import InlineReplyBox from './InlineReplyBox.svelte';
import type { Status, StatusContext } from '$lib/types/mastodon';
import { resolveBookmarkedFlag, resolveFavouritedFlag, resolveRebloggedFlag } from '$lib/utils/interactions';

  export let statusId: string;

  let status: Status | null = null;
  let context: StatusContext | null = null;
  let loading = true;
  let error = '';

  onMount(async () => {
    await loadThread();
  });

  function mapActorToAccount(actor: any) {
    if (!actor?.id) {
      throw new Error('[StatusThread] Missing actor information in GraphQL response');
    }

    let hostname: string | undefined;
    try {
      hostname = new URL(actor.id).hostname;
    } catch {
      hostname = undefined;
    }

    const username = actor.username || actor.preferredUsername || '';
    const acct =
      actor.domain && username
        ? `${username}@${actor.domain}`
        : username && hostname
          ? `${username}@${hostname}`
          : username || hostname || actor.id;

    return {
      id: actor.id,
      username,
      acct,
      display_name: actor.displayName || actor.name || username,
      url: actor.id,
      avatar: actor.avatar || actor.icon?.url || '',
      avatar_static: actor.avatar || actor.icon?.url || '',
      header: actor.header || actor.image?.url || '',
      header_static: actor.header || actor.image?.url || '',
      locked: actor.locked ?? actor.manuallyApprovesFollowers ?? false,
      bot: actor.bot ?? actor.type === 'Service',
      created_at: actor.createdAt || actor.published || new Date().toISOString(),
      note: actor.summary || '',
      followers_count: actor.followers ?? actor.followers_count ?? 0,
      following_count: actor.following ?? actor.following_count ?? 0,
      statuses_count: actor.statusesCount ?? actor.outbox?.totalCount ?? 0,
      last_status_at: null,
      emojis: [],
      fields: (actor.fields || actor.attachment || [])
        .filter(Boolean)
        .map((field: any) => ({
          name: field.name || '',
          value: field.value || '',
          verified_at: field.verified_at || null,
        })),
      discoverable: actor.discoverable ?? false,
      group: actor.group ?? false,
    };
  }

  function mapGraphQLToStatus(obj: any): Status {
    const actor = obj.actor || obj.attributedTo || obj.author;
    if (!actor) {
      throw new Error('[StatusThread] Status is missing actor data');
    }

    return {
      id: obj.id,
      created_at: obj.published || obj.createdAt || obj.updated || new Date().toISOString(),
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
      favourited: resolveFavouritedFlag(obj),
      reblogged: resolveRebloggedFlag(obj),
      bookmarked: resolveBookmarkedFlag(obj),
      account: mapActorToAccount(actor),
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
      edited_at: obj.updated || null
    };
  }

  async function loadThread() {
    loading = true;
    error = '';
    
    try {
      const adapter = await getGraphQLAdapter();
      
      const [statusObj, threadContextData] = await Promise.all([
        adapter.getObject(statusId),
        fetchThreadContext(statusId).catch(err => {
          throw err;
        })
      ]);
      
      if (!statusObj) {
        throw new Error('Status not found');
      }
      
      status = mapGraphQLToStatus(statusObj);

      if (!threadContextData) {
        throw new Error('Thread context missing from GraphQL response');
      }

      const ancestors = threadContextData.ancestors ?? [];
      const descendants = threadContextData.descendants ?? [];

      context = {
        ancestors: ancestors.map(mapGraphQLToStatus),
        descendants: descendants.map(mapGraphQLToStatus)
      };
      
      console.log('[StatusThread] Loaded thread:', {
        statusId,
        status: status?.id,
        ancestors: context.ancestors.length,
        descendants: context.descendants.length
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to load thread';
      
      error = message.includes('threadContext')
        ? 'GraphQL thread context failed. Please capture logs and report to the platform team.'
        : message;
      
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
