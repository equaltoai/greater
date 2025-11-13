<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fetchHashtagTimeline } from '$lib/api/graphql-client';
  import type { Status } from '$lib/types/mastodon';
import StatusCard from './StatusCard.svelte';
import TimelineSkeleton from './TimelineSkeleton.svelte';
import ErrorState from './ErrorState.svelte';
import EmptyState from './EmptyState.svelte';
import { createVirtualizer } from '@tanstack/svelte-virtual';
import { resolveBookmarkedFlag, resolveFavouritedFlag, resolveRebloggedFlag } from '$lib/utils/interactions';
  
  interface Props {
    hashtag: string;
  }
  
  let { hashtag }: Props = $props();
  
  
  let statuses = $state<Status[]>([]);
  let isLoading = $state(true);
  let isLoadingMore = $state(false);
  let error = $state<string | null>(null);
  let hasMore = $state(true);
  let endCursor = $state<string | null>(null);
  
  let scrollElement: HTMLDivElement;
  let observerElement: HTMLDivElement;
  
  // Virtual scrolling setup
  const virtualizer = $derived.by(() => {
    if (!scrollElement) return null;
    
    return createVirtualizer({
      count: statuses.length,
      getScrollElement: () => scrollElement,
      estimateSize: () => 200,
      overscan: 5,
      gap: 8,
    });
  });
  
  const virtualItems = $derived(virtualizer?.getVirtualItems() || []);
  const totalSize = $derived(virtualizer?.getTotalSize() || 0);
  
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
      replies_count: obj.replies?.totalCount || 0,
      reblogs_count: obj.shares?.totalCount || 0,
      favourites_count: obj.likes?.totalCount || 0,
      favourited: resolveFavouritedFlag(obj),
      reblogged: resolveRebloggedFlag(obj),
      bookmarked: resolveBookmarkedFlag(obj),
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
      in_reply_to_id: obj.inReplyTo?.id || null,
      in_reply_to_account_id: null,
      reblog: null,
      muted: false,
      edited_at: null
    };
  }

  // Load initial timeline
  async function loadTimeline() {
    isLoading = true;
    error = null;
    
    try {
      const response = await fetchHashtagTimeline(hashtag, { first: 20 });
      
      // Map GraphQL objects to statuses
      statuses = response.edges.map((edge: any) => mapGraphQLToStatus(edge.node));
      
      // Update pagination
      endCursor = response.pageInfo.endCursor;
      hasMore = response.pageInfo.hasNextPage;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load timeline';
    } finally {
      isLoading = false;
    }
  }
  
  // Load more statuses
  async function loadMore() {
    if (isLoadingMore || !hasMore || !endCursor) return;
    
    isLoadingMore = true;
    
    try {
      const response = await fetchHashtagTimeline(hashtag, {
        first: 20,
        after: endCursor
      });
      
      // Append new statuses
      const newStatuses = response.edges.map((edge: any) => mapGraphQLToStatus(edge.node));
      statuses = [...statuses, ...newStatuses];
      
      // Update pagination
      endCursor = response.pageInfo.endCursor;
      hasMore = response.pageInfo.hasNextPage;
    } catch (e) {
      console.error('Failed to load more:', e);
    } finally {
      isLoadingMore = false;
    }
  }
  
  // Handle status updates from interactions
  function handleStatusUpdate(updatedStatus: Status) {
    statuses = statuses.map(s => s.id === updatedStatus.id ? updatedStatus : s);
  }
  
  function handleStatusDelete(statusId: string) {
    statuses = statuses.filter(s => s.id !== statusId);
  }
  
  // Intersection observer for infinite scroll
  let intersectionObserver: IntersectionObserver;
  
  onMount(() => {
    loadTimeline();
    
    // Set up infinite scroll
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );
    
    if (observerElement) {
      intersectionObserver.observe(observerElement);
    }
  });
  
  onDestroy(() => {
    intersectionObserver?.disconnect();
  });
</script>

<div class="space-y-4">
  {#if isLoading}
    <TimelineSkeleton />
  {:else if error}
    <ErrorState message={error} onretry={loadTimeline} />
  {:else if statuses.length === 0}
    <EmptyState 
      message="No posts yet" 
      description={`Be the first to post with #${hashtag}`}
    />
  {:else}
    <div 
      bind:this={scrollElement}
      class="relative h-[calc(100vh-16rem)] overflow-auto"
    >
      <div 
        style="height: {totalSize}px; width: 100%; position: relative;"
      >
        {#each virtualItems as item}
          {@const status = statuses[item.index]}
          <div
            style="
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: {item.size}px;
              transform: translateY({item.start}px);
            "
          >
            <StatusCard 
              {status} 
              onupdate={handleStatusUpdate}
              ondelete={handleStatusDelete}
            />
          </div>
        {/each}
      </div>
      
      <!-- Infinite scroll trigger -->
      <div 
        bind:this={observerElement}
        class="h-20 flex items-center justify-center"
      >
        {#if isLoadingMore}
          <div class="text-gray-500">Loading more...</div>
        {:else if !hasMore}
          <div class="text-gray-500">No more posts</div>
        {/if}
      </div>
    </div>
  {/if}
</div>
