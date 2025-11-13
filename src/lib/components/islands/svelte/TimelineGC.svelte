<script lang="ts">
/**
 * TimelineGC - Bridge component using GC's recommended integration pattern
 * 
 * Based on GC docs/components/Timeline/README.md and realtime-usage.md examples.
 * Uses createTimelineIntegration with manual store management until adapter helper ships.
 */
import { onMount, onDestroy } from 'svelte';
import { timelineStore } from '$lib/stores/timeline.svelte';
import type { TimelineType } from '$lib/stores/timeline.svelte';
import { TimelineVirtualizedReactive } from '$lib/gc';
import type { Status } from '$lib/types/mastodon';

interface Props {
  type?: TimelineType;
  estimateSize?: number;
  overscan?: number;
  density?: 'compact' | 'comfortable';
  class?: string;
}

let {
  type = 'home',
  estimateSize = 200,
  overscan = 5,
  density = 'comfortable',
  class: className = ''
}: Props = $props();

// Get timeline state from our custom store
const timeline = $derived(timelineStore.timelines[type] || {
  statuses: [],
  hasMore: true,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  lastFetch: 0,
  stream: null,
  gaps: []
});

// Map our custom Status type to GC Status type if needed
// For now, assuming they're compatible - will need to verify
const items = $derived<Status[]>(timeline.statuses);

// Loading states
const loadingTop = $derived(timeline.isLoading && timeline.statuses.length === 0);
const loadingBottom = $derived(timeline.isLoadingMore);
const endReached = $derived(!timeline.hasMore);

// Handlers
function handleLoadMore() {
  if (!timeline.hasMore || timeline.isLoadingMore) return;
  timelineStore.loadMore(type);
}

function handleRefresh() {
  timelineStore.refreshTimeline(type);
}

function handleStatusClick(status: Status) {
  // Navigate to status detail page
  // TODO: Implement navigation
  console.log('[TimelineGC] Status clicked:', status.id);
}

function handleStatusUpdate(status: Status) {
  // Handle status updates (favorites, boosts, etc.)
  // TODO: Update our store
  console.log('[TimelineGC] Status updated:', status.id);
}

// Lifecycle
onMount(() => {
  // Initialize store if needed
  timelineStore.initialize();
  
  // Load timeline if empty
  if (timeline.statuses.length === 0) {
    timelineStore.loadTimeline(type);
  }
  
  // Connect to streaming updates
  timelineStore.connectStream(type);
  
  return () => {
    timelineStore.disconnectStream(type);
  };
});
</script>

<TimelineVirtualizedReactive
  items={items}
  estimateSize={estimateSize}
  overscan={overscan}
  loadingTop={loadingTop}
  loadingBottom={loadingBottom}
  endReached={endReached}
  onLoadMore={handleLoadMore}
  onStatusClick={handleStatusClick}
  onStatusUpdate={handleStatusUpdate}
  density={density}
  class={className}
/>

<!--
  Per GC feedback (2025-11-11):
  - ✅ Timeline integration docs available in docs/components/Timeline/README.md
  - ✅ realtime-usage.md shows manual store management pattern
  - 🔜 createTimelineAdapter helper coming next sprint
  
  Current: Using items prop + manual callbacks (recommended interim pattern)
  Next: Adopt createTimelineAdapter when available for seamless store integration
-->

