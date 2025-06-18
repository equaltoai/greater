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
		timelineType?: 'home' | 'local' | 'federated' | 'hashtag';
		hashtag?: string;
	}
	
	let { type = 'home', timelineType, hashtag }: Props = $props();
	
	// Support alternative prop name for backwards compatibility
	const actualType = timelineType || type;
	
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
		console.log('[VirtualizedTimeline] Effect running for type:', type);
		console.log('[VirtualizedTimeline] timelineStore.timelines:', timelineStore.timelines);
		
		timeline = timelineStore.timelines[type] || {
			statuses: [],
			hasMore: true,
			isLoading: false,
			isLoadingMore: false,
			error: null,
			lastFetch: 0,
			stream: null,
			gaps: []
		};
		
		console.log('[VirtualizedTimeline] Timeline state:', {
			type,
			statusCount: timeline.statuses.length,
			isLoading: timeline.isLoading,
			error: timeline.error,
			firstStatus: timeline.statuses[0]
		});
	});
	
	let scrollElement: HTMLDivElement;
	let observerElement: HTMLDivElement;
	let pullToRefreshElement: HTMLDivElement;
	
	// Force virtualizer update when scroll element is ready
	$effect(() => {
		if (scrollElement && timeline.statuses.length > 0) {
			console.log('[VirtualizedTimeline] Scroll element ready, triggering virtualizer update');
			// The derived will automatically re-run when dependencies change
		}
	});
	
	let isPulling = $state(false);
	let pullDistance = $state(0);
	let isRefreshing = $state(false);
	
	// Add debugging
	$effect(() => {
		console.log('[VirtualizedTimeline] Render check:', {
			statusCount: timeline.statuses.length,
			isLoading: timeline.isLoading,
			hasError: !!timeline.error
		});
	});
	
	// Virtual scrolling setup
	let virtualizer = $state(null);
	
	$effect(() => {
		console.log('[VirtualizedTimeline] Creating virtualizer:', {
			scrollElement: !!scrollElement,
			statusCount: timeline.statuses.length
		});
		
		if (!scrollElement || timeline.statuses.length === 0) {
			virtualizer = null;
			return;
		}
		
		virtualizer = createVirtualizer({
			count: timeline.statuses.length,
			getScrollElement: () => scrollElement,
			estimateSize: () => 200, // Estimated height of each status
			overscan: 5,
			gap: 8, // Gap between items
		});
	});
	
	const virtualItems = $derived.by(() => {
		if (!virtualizer) return [];
		const items = virtualizer.getVirtualItems() || [];
		console.log('[VirtualizedTimeline] Virtual items:', items.length, items);
		return items;
	});
	const totalSize = $derived.by(() => {
		if (!virtualizer) return 0;
		const size = virtualizer.getTotalSize() || 0;
		console.log('[VirtualizedTimeline] Total size:', size);
		return size;
	});
	
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
		
		// Set up pull-to-refresh
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
			timelineStore.disconnectStream(type);
			intersectionObserver?.disconnect();
			
			scrollElement?.removeEventListener('touchstart', handleTouchStart);
			scrollElement?.removeEventListener('touchmove', handleTouchMove);
			scrollElement?.removeEventListener('touchend', handleTouchEnd);
		};
	});
	
	function handleRefresh() {
		if (typeof window !== 'undefined') {
			timelineStore.refreshTimeline(type);
		}
	}
	
	function initVirtualizer(node: HTMLDivElement) {
		console.log('[VirtualizedTimeline] initVirtualizer action called');
		// This ensures the element is in the DOM
		return {
			destroy() {}
		};
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
			use:initVirtualizer
		>
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
			
			<!-- Virtual list container -->
			<div
				style="height: {totalSize}px; width: 100%; position: relative;"
				class="px-4"
			>
				{#snippet virtualItem(item)}
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
						<StatusCard status={timeline.statuses[item.index]} />
					</div>
				{/snippet}
				
				{#each virtualItems as item (timeline.statuses[item.index].id)}
					{@render virtualItem(item)}
				{/each}
			</div>
			
			<!-- Load more trigger -->
			<div bind:this={observerElement} class="h-1"></div>
			
			<!-- Load more indicator -->
			{#if timeline.isLoadingMore}
				<div class="py-4 text-center">
					<div class="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
				</div>
			{:else if !timeline.hasMore && timeline.statuses.length > 0}
				<div class="py-4 text-center text-text-secondary">
					<p>No more posts</p>
				</div>
			{/if}
		</div>
	{/if}
</div>