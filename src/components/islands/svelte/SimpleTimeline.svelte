<script lang="ts">
	import { onMount } from 'svelte';
	import { timelineStore } from '@/lib/stores/timeline.svelte';
	import type { TimelineType } from '@/lib/stores/timeline.svelte';
	import StatusCard from './StatusCard.svelte';
	import TimelineSkeleton from './TimelineSkeleton.svelte';
	import ErrorState from './ErrorState.svelte';
	import EmptyState from './EmptyState.svelte';
	
	interface Props {
		type?: TimelineType;
	}
	
	let { type = 'home' }: Props = $props();
	
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
		console.log('[SimpleTimeline] Timeline updated:', {
			type,
			statusCount: timeline.statuses.length,
			isLoading: timeline.isLoading
		});
	});
	
	onMount(() => {
		// Initialize the store on first use
		timelineStore.initialize();
		
		// Load timeline
		timelineStore.loadTimeline(type);
		
		// Connect to streaming updates
		timelineStore.connectStream(type);
		
		return () => {
			timelineStore.disconnectStream(type);
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
		<div class="flex-1 overflow-y-auto px-4 py-4 space-y-4">
			{#each timeline.statuses as status (status.id)}
				<StatusCard {status} />
			{/each}
			
			{#if timeline.hasMore}
				<div class="py-4 text-center">
					{#if timeline.isLoadingMore}
						<div class="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
					{:else}
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