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

	// Get timeline from store - use derived for reactivity
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

	// Debug logging
	$effect(() => {
		console.log('[Timeline] Timeline state:', {
			type,
			statusCount: timeline.statuses.length,
			isLoading: timeline.isLoading,
			hasTimeline: !!timelineStore.timelines[type],
			groupedStatusCount: groupedStatuses.length,
			shouldVirtualize,
			virtualizer: !!virtualizer
		});
	});

	// Group statuses into conversations with all replies
	const groupedStatuses = $derived.by(() => {
		console.log('[Timeline] Computing groupedStatuses:', {
			groupConversations,
			statusCount: timeline.statuses.length
		});
		
		if (!groupConversations) {
			// Return each status as a standalone item with no replies
			return timeline.statuses.map(s => ({ status: s, replies: [] }));
		}

		const statusMap = new Map(timeline.statuses.map(s => [s.id, s]));
		const rootStatuses = [];
		const processed = new Set();
		
		// Helper to recursively collect all replies
		function collectReplies(statusId) {
			const replies = [];
			for (const status of timeline.statuses) {
				if (status.in_reply_to_id === statusId && !processed.has(status.id)) {
					processed.add(status.id);
					replies.push({
						status,
						replies: collectReplies(status.id)
					});
				}
			}
			return replies;
		}
		
		// Process all statuses
		for (const status of timeline.statuses) {
			if (processed.has(status.id)) continue;
			
			// If this is a reply and the parent is in our timeline, skip it
			if (status.in_reply_to_id && statusMap.has(status.in_reply_to_id)) {
				continue;
			}
			
			// This is a root post (or a reply to something not in our timeline)
			processed.add(status.id);
			rootStatuses.push({
				status,
				replies: collectReplies(status.id)
			});
		}
		
		return rootStatuses;
	});

	// DOM elements
	let scrollElement: HTMLDivElement;
	let observerElement: HTMLDivElement;
	let pullToRefreshElement: HTMLDivElement;

	// Pull to refresh state
	let isPulling = $state(false);
	let pullDistance = $state(0);
	let isRefreshing = $state(false);

	// Determine if we should use virtualization
	const shouldVirtualize = $derived(
		enableVirtualization === true || 
		(enableVirtualization === 'auto' && groupedStatuses.length > 50)
	);

	// Virtual scrolling setup - using $state for mutable virtualizer
	let virtualizer = $state(null);
	
	$effect(() => {
		if (!shouldVirtualize || !scrollElement || groupedStatuses.length === 0) {
			virtualizer = null;
			return;
		}
		
		virtualizer = createVirtualizer({
			count: groupedStatuses.length,
			getScrollElement: () => scrollElement,
			estimateSize: () => 200,
			overscan: 5,
			gap: 8,
		});
	});

	const virtualItems = $derived(virtualizer?.getVirtualItems() || []);
	const totalSize = $derived(virtualizer?.getTotalSize() || 0);

	// Intersection observer for infinite scroll
	let intersectionObserver: IntersectionObserver;

	onMount(() => {
		// Initialize the store on first use
		timelineStore.initialize();
		
		// Load timeline
		timelineStore.loadTimeline(type);
		
		// Connect to streaming updates
		timelineStore.connectStream(type);
		
		// Set up intersection observer for infinite scroll
		intersectionObserver = new IntersectionObserver(
			(entries) => {
				if (entries[0].isIntersecting && timeline.hasMore && !timeline.isLoadingMore) {
					timelineStore.loadMore(type);
				}
			},
			{ rootMargin: '100px' }
		);
		
		if (observerElement) {
			intersectionObserver.observe(observerElement);
		}
		
		// Set up pull-to-refresh if enabled
		if (enablePullToRefresh) {
			let startY = 0;
			let currentY = 0;
			
			const handleTouchStart = (e: TouchEvent) => {
				if (scrollElement.scrollTop === 0) {
					startY = e.touches[0].clientY;
				}
			};
			
			const handleTouchMove = (e: TouchEvent) => {
				if (!startY) return;
				
				currentY = e.touches[0].clientY;
				const distance = currentY - startY;
				
				if (distance > 0 && scrollElement.scrollTop === 0) {
					e.preventDefault();
					isPulling = true;
					pullDistance = Math.min(distance, 100);
					
					if (pullToRefreshElement) {
						pullToRefreshElement.style.transform = `translateY(${pullDistance}px)`;
					}
				}
			};
			
			const handleTouchEnd = async () => {
				if (pullDistance > 60 && !isRefreshing) {
					isRefreshing = true;
					await timelineStore.refreshTimeline(type);
					isRefreshing = false;
				}
				
				isPulling = false;
				pullDistance = 0;
				startY = 0;
				
				if (pullToRefreshElement) {
					pullToRefreshElement.style.transform = 'translateY(0)';
				}
			};
			
			scrollElement?.addEventListener('touchstart', handleTouchStart, { passive: true });
			scrollElement?.addEventListener('touchmove', handleTouchMove, { passive: false });
			scrollElement?.addEventListener('touchend', handleTouchEnd);
			
			return () => {
				scrollElement?.removeEventListener('touchstart', handleTouchStart);
				scrollElement?.removeEventListener('touchmove', handleTouchMove);
				scrollElement?.removeEventListener('touchend', handleTouchEnd);
			};
		}
		
		return () => {
			timelineStore.disconnectStream(type);
			intersectionObserver?.disconnect();
		};
	});

	function handleRefresh() {
		timelineStore.refreshTimeline(type);
	}

	function handleLoadMore() {
		if (!timeline.hasMore || timeline.isLoadingMore) return;
		timelineStore.loadMore(type);
	}
</script>

<div class="relative h-full flex flex-col">
	{#if timeline.isLoading && timeline.statuses.length === 0}
		<div class="flex-1 overflow-y-auto px-4 py-4">
			<TimelineSkeleton count={10} />
		</div>
	{:else if timeline.error}
		<ErrorState 
			error={timeline.error}
			title="Unable to load timeline"
			onRetry={handleRefresh}
		/>
	{:else if timeline.statuses.length === 0}
		<EmptyState 
			title={type === 'home' ? "Your timeline is empty" : "No posts yet"}
			message={type === 'home' 
				? "Follow some people to see their posts here!" 
				: type === 'local' 
					? "Be the first to post something on this instance!"
					: "No public posts from other instances yet."}
			icon="inbox"
		/>
	{:else}
		<div
			bind:this={scrollElement}
			class="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin"
		>
			{#if enablePullToRefresh}
				<!-- Pull to refresh indicator -->
				<div
					bind:this={pullToRefreshElement}
					class="absolute top-0 left-0 right-0 flex justify-center py-4 transition-transform duration-300 {isPulling ? '' : '-translate-y-full'}"
				>
					<div class="flex items-center gap-2 text-text-secondary">
						{#if isRefreshing}
							<div class="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
							<span>Refreshing...</span>
						{:else if pullDistance > 60}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
							</svg>
							<span>Release to refresh</span>
						{:else}
							<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
							</svg>
							<span>Pull to refresh</span>
						{/if}
					</div>
				</div>
			{/if}
			
			{#if shouldVirtualize && virtualizer}
				<!-- Virtual list container -->
				<div
					style="height: {totalSize}px; width: 100%; position: relative;"
					class="px-4"
				>
					{#each virtualItems as item (groupedStatuses[item.index].status.id)}
						<div
							style="
								position: absolute;
								top: 0;
								left: 0;
								width: 100%;
								height: {item.size}px;
								transform: translateY({item.start}px);
							"
							class="px-4"
						>
							{@render renderStatusGroup(groupedStatuses[item.index])}
						</div>
					{/each}
				</div>
			{:else}
				<!-- Regular list -->
				<div class="px-4 py-4 space-y-4">
					{#each groupedStatuses as group (group.status.id)}
						{@render renderStatusGroup(group)}
					{/each}
				</div>
			{/if}
			
			<!-- Load more trigger -->
			<div bind:this={observerElement} class="h-1"></div>
			
			<!-- Load more indicator or button -->
			{#if timeline.hasMore}
				<div class="py-4 text-center">
					{#if timeline.isLoadingMore}
						<div class="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
					{:else if !shouldVirtualize}
						<button 
							onclick={handleLoadMore}
							class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
						>
							Load more
						</button>
					{/if}
				</div>
			{:else if timeline.statuses.length > 0}
				<div class="py-4 text-center text-text-secondary">
					<p>No more posts</p>
				</div>
			{/if}
		</div>
	{/if}
</div>

{#snippet renderStatusGroup(group)}
	<StatusCard status={group.status} />
	{#if group.replies.length > 0}
		{@render renderReplies(group.replies, 1)}
	{/if}
{/snippet}

{#snippet renderReplies(replies, depth = 1)}
	{#each replies as reply (reply.status.id)}
		<div class="ml-12">
			<StatusCard status={reply.status} />
			{#if reply.replies.length > 0}
				{@render renderReplies(reply.replies, depth + 1)}
			{/if}
		</div>
	{/each}
{/snippet}