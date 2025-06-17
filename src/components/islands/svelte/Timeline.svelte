<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { useTimelineStore } from '@/lib/stores/timeline';
  import type { TimelineType } from '@/lib/stores/timeline';
  import StatusCard from './StatusCard.svelte';
  
  let { type = 'home' }: { type?: TimelineType } = $props();
  
  const store = useTimelineStore.getState();
  let timeline = $state(store[type]);
  let unsubscribe: () => void;
  
  onMount(() => {
    // Load timeline
    store.loadTimeline(type);
    
    // Connect to streaming updates
    store.connectStream(type);
    
    // Subscribe to changes
    unsubscribe = useTimelineStore.subscribe(state => {
      timeline = state[type];
    });
    
    return () => {
      store.disconnectStream(type);
      unsubscribe?.();
    };
  });
  
  function handleLoadMore() {
    store.loadMore(type);
  }
  
  function handleRefresh() {
    store.refresh(type);
  }
</script>

<div class="space-y-4">
  {#if timeline.isLoading && timeline.statuses.length === 0}
    <div class="text-center py-12">
      <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p>Loading timeline...</p>
    </div>
  {:else if timeline.error}
    <div class="text-center py-12">
      <p>Failed to load timeline</p>
      <button onclick={handleRefresh} class="btn btn-primary">
        Retry
      </button>
    </div>
  {:else if timeline.statuses.length === 0}
    <div class="text-center py-12">
      <p>No posts to show</p>
    </div>
  {:else}
    <div class="space-y-2">
      {#each timeline.statuses as status (status.id)}
        <StatusCard {status} />
      {/each}
      
      {#if timeline.hasMore}
        <div class="text-center py-4">
          {#if timeline.isLoadingMore}
            <div class="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          {:else}
            <button onclick={handleLoadMore} class="btn btn-secondary">
              Load more
            </button>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>

