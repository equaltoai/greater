<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { getClient } from '@/lib/api/client';
  import type { Status } from '@/types/mastodon';
  import StatusCard from './StatusCard.svelte';
  import TimelineSkeleton from './TimelineSkeleton.svelte';
  import ErrorState from './ErrorState.svelte';
  import EmptyState from './EmptyState.svelte';
  import { createVirtualizer } from '@tanstack/svelte-virtual';
  
  interface Props {
    hashtag: string;
  }
  
  let { hashtag }: Props = $props();
  
  
  let statuses = $state<Status[]>([]);
  let isLoading = $state(true);
  let isLoadingMore = $state(false);
  let error = $state<string | null>(null);
  let hasMore = $state(true);
  
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
  
  // Load initial timeline
  async function loadTimeline() {
    const client = getClient();
    if (!client) return;
    
    isLoading = true;
    error = null;
    
    try {
      const results = await client.getTagTimeline(hashtag, { limit: 20 });
      statuses = results;
      hasMore = results.length === 20;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load timeline';
    } finally {
      isLoading = false;
    }
  }
  
  // Load more statuses
  async function loadMore() {
    const client = getClient();
    if (!client || isLoadingMore || !hasMore || statuses.length === 0) return;
    
    isLoadingMore = true;
    
    try {
      const lastStatus = statuses[statuses.length - 1];
      const results = await client.getTagTimeline(hashtag, {
        max_id: lastStatus.id,
        limit: 20
      });
      
      if (results.length === 0) {
        hasMore = false;
      } else {
        statuses = [...statuses, ...results];
      }
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

