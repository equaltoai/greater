<script lang="ts">
	import { onMount } from 'svelte';
	import VirtualizedTimeline from './VirtualizedTimelineInner.svelte';
	
	interface Props {
		type?: 'home' | 'local' | 'federated';
		timelineType?: 'home' | 'local' | 'federated' | 'hashtag';
		hashtag?: string;
	}
	
	let { type = 'home', timelineType, hashtag }: Props = $props();
	
	let mounted = $state(false);
	
	onMount(() => {
		mounted = true;
	});
</script>

{#if mounted}
	<VirtualizedTimeline {type} {timelineType} {hashtag} />
{:else}
	<div class="flex-1 overflow-y-auto px-4 py-4">
		<div class="animate-pulse space-y-4">
			{#each Array(10) as _, i}
				<div class="bg-surface rounded-lg p-4 space-y-3">
					<div class="flex items-center space-x-3">
						<div class="w-12 h-12 bg-border rounded-full"></div>
						<div class="space-y-2 flex-1">
							<div class="h-4 bg-border rounded w-1/4"></div>
							<div class="h-3 bg-border rounded w-1/3"></div>
						</div>
					</div>
					<div class="space-y-2">
						<div class="h-4 bg-border rounded"></div>
						<div class="h-4 bg-border rounded w-5/6"></div>
					</div>
				</div>
			{/each}
		</div>
	</div>
{/if}