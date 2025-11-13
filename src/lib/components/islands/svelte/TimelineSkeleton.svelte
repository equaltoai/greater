<script lang="ts">
	import StatusSkeleton from './StatusSkeleton.svelte';
	
	interface Props {
		count?: number;
	}
	
	let { count = 5 }: Props = $props();
</script>

<div class="space-y-2">
	{#each Array(count) as _, i}
		<StatusSkeleton />
	{/each}
</div>