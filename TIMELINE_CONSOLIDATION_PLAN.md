# Timeline Consolidation Plan

## Current State Analysis

### The Problem
1. **Two separate timeline components with duplicated functionality:**
   - `SimpleTimeline.svelte` - Used for home timeline only
   - `VirtualizedTimeline.svelte` + `VirtualizedTimelineInner.svelte` - Used for local and federated timelines

2. **Bugs introduced during attempted fixes:**
   - Changed `groupedStatuses()` to `groupedStatuses` in SimpleTimeline (this was actually correct)
   - Changed virtualizer from `$state` to `$derived.by` in VirtualizedTimelineInner (this broke it - virtualizer needs mutable state)

3. **Posts not displaying anywhere after these changes**

### Feature Comparison

**SimpleTimeline features:**
- Conversation grouping (groups posts with their replies hierarchically)
- Basic scrolling
- Load more button
- Simpler implementation

**VirtualizedTimeline features:**
- Virtual scrolling for performance (@tanstack/svelte-virtual)
- Pull-to-refresh (touch gestures)
- Intersection observer for infinite scroll
- More complex but better performance for large lists

## The Right Solution: One Timeline Component

### Design Principles
1. **Single source of truth** - One timeline component for all timeline types
2. **Progressive enhancement** - Virtual scrolling only when needed (>50 items)
3. **Feature parity** - All timelines get all features
4. **Clean architecture** - Clear separation of concerns

### Implementation Plan

#### Step 1: Create new Timeline.svelte component

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { createVirtualizer } from '@tanstack/svelte-virtual';
  import { timelineStore } from '@/lib/stores/timeline.svelte';
  import type { TimelineType } from '@/lib/stores/timeline.svelte';
  import StatusCard from './StatusCard.svelte';
  import TimelineSkeleton from './TimelineSkeleton.svelte';
  import ErrorState from './ErrorState.svelte';
  import EmptyState from './EmptyState.svelte';

  interface Props {
    type?: TimelineType;
    enableVirtualization?: boolean | 'auto';  // 'auto' = enable for >50 items
    groupConversations?: boolean;  // Group posts with replies
    enablePullToRefresh?: boolean;
  }

  let { 
    type = 'home',
    enableVirtualization = 'auto',
    groupConversations = type === 'home',  // Default true for home
    enablePullToRefresh = true
  }: Props = $props();
```

#### Step 2: Core Features to Implement

1. **Timeline State Management**
   ```svelte
   let timeline = $state(timelineStore.timelines[type] || {
     statuses: [],
     hasMore: true,
     isLoading: false,
     isLoadingMore: false,
     error: null,
     lastFetch: 0,
     stream: null,
     gaps: []
   });

   // Subscribe to timeline changes
   $effect(() => {
     timeline = timelineStore.timelines[type] || { /* defaults */ };
   });
   ```

2. **Conversation Grouping (from SimpleTimeline)**
   ```svelte
   const groupedStatuses = $derived(() => {
     if (!groupConversations) return timeline.statuses.map(s => ({ status: s, replies: [] }));
     
     // Existing grouping logic from SimpleTimeline
     const statusMap = new Map(timeline.statuses.map(s => [s.id, s]));
     const rootStatuses = [];
     const processed = new Set();
     
     // ... grouping implementation
     return rootStatuses;
   });
   ```

3. **Virtual Scrolling (from VirtualizedTimeline)**
   ```svelte
   let scrollElement: HTMLDivElement;
   let virtualizer = $state(null);
   
   // Determine if we should use virtualization
   const shouldVirtualize = $derived(
     enableVirtualization === true || 
     (enableVirtualization === 'auto' && timeline.statuses.length > 50)
   );
   
   $effect(() => {
     if (!shouldVirtualize || !scrollElement || timeline.statuses.length === 0) {
       virtualizer = null;
       return;
     }
     
     virtualizer = createVirtualizer({
       count: groupedStatuses.length,  // Use grouped count
       getScrollElement: () => scrollElement,
       estimateSize: () => 200,
       overscan: 5,
       gap: 8,
     });
   });
   ```

4. **Pull to Refresh (from VirtualizedTimeline)**
   - Keep the touch event handling logic
   - Make it conditional based on `enablePullToRefresh` prop

5. **Infinite Scroll**
   - Use intersection observer for both virtualized and non-virtualized modes
   - Single implementation that works for both

#### Step 3: Template Structure

```svelte
<div class="relative h-full flex flex-col">
  {#if timeline.isLoading && timeline.statuses.length === 0}
    <TimelineSkeleton />
  {:else if timeline.error}
    <ErrorState />
  {:else if timeline.statuses.length === 0}
    <EmptyState />
  {:else}
    <div bind:this={scrollElement} class="flex-1 overflow-y-auto">
      {#if enablePullToRefresh}
        <!-- Pull to refresh UI -->
      {/if}
      
      {#if shouldVirtualize && virtualizer}
        <!-- Virtual list -->
        <div style="height: {totalSize}px;">
          {#each virtualItems as item}
            {@render renderStatusGroup(groupedStatuses[item.index])}
          {/each}
        </div>
      {:else}
        <!-- Regular list -->
        {#each groupedStatuses as group}
          {@render renderStatusGroup(group)}
        {/each}
      {/if}
      
      <!-- Load more trigger -->
      <div bind:this={observerElement}></div>
    </div>
  {/if}
</div>

{#snippet renderStatusGroup(group)}
  <div class="bg-surface rounded-lg border border-border overflow-hidden">
    <StatusCard status={group.status} />
    {#if group.replies.length > 0}
      {@render renderReplies(group.replies)}
    {/if}
  </div>
{/snippet}

{#snippet renderReplies(replies, depth = 1)}
  <!-- Nested reply rendering -->
{/snippet}
```

#### Step 4: Update Page References

1. **home.astro**
   ```astro
   ---
   import Timeline from '@/components/islands/svelte/Timeline.svelte';
   ---
   <Timeline type="home" client:load />
   ```

2. **local.astro**
   ```astro
   <Timeline type="local" client:load />
   ```

3. **federated.astro**
   ```astro
   <Timeline type="federated" client:load />
   ```

#### Step 5: Cleanup
1. Delete `SimpleTimeline.svelte`
2. Delete `VirtualizedTimeline.svelte`
3. Delete `VirtualizedTimelineInner.svelte`

## Key Technical Decisions

### Svelte 5 Rune Usage
- **$state**: For mutable values (timeline data, virtualizer instance, UI states)
- **$derived**: For computed values (groupedStatuses, shouldVirtualize)
- **$effect**: For side effects (subscribing to store changes, creating virtualizer)

### Performance Optimizations
1. Virtual scrolling kicks in automatically at 50+ items
2. Conversation grouping is computed with $derived for reactivity
3. Single intersection observer for infinite scroll
4. Proper cleanup in onDestroy

### Feature Flags via Props
- `enableVirtualization`: boolean | 'auto'
- `groupConversations`: boolean (default true for home)
- `enablePullToRefresh`: boolean (default true)

## Testing Strategy

1. **Home timeline**: Should show conversation grouping
2. **Local timeline**: Should show all public posts from instance
3. **Federated timeline**: Should show all public posts
4. **Performance**: Virtual scrolling should activate at 50+ items
5. **Interactions**: Reply, boost, favorite should all work
6. **Pull to refresh**: Should work on touch devices
7. **Infinite scroll**: Should load more when reaching bottom

## Migration Checklist

- [ ] Create new Timeline.svelte with all features
- [ ] Test with small data set (<50 items)
- [ ] Test with large data set (>50 items) to verify virtualization
- [ ] Update home.astro to use new Timeline
- [ ] Update local.astro to use new Timeline
- [ ] Update federated.astro to use new Timeline
- [ ] Verify all interactions work (reply, boost, favorite, etc.)
- [ ] Delete old timeline components
- [ ] Run full test suite

## Common Pitfalls to Avoid

1. **Don't use $derived for virtualizer** - It needs to be mutable $state
2. **Access $derived values directly** - Don't call them as functions
3. **Handle empty states properly** - Check array lengths before accessing
4. **Clean up event listeners** - Prevent memory leaks
5. **Test with real data** - Ensure conversation grouping works correctly

## Success Criteria

1. Single timeline component handles all use cases
2. No regression in functionality
3. Better performance with large lists
4. Cleaner, more maintainable codebase
5. All timeline types work correctly
6. Posts actually display (unlike current broken state)