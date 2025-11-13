<script lang="ts">
	interface Props {
		error?: Error | null;
		title?: string;
		message?: string;
		onRetry?: () => void;
	}
	
	let { 
		error = null, 
		title = "Something went wrong",
		message = "We encountered an error while loading this content.",
		onRetry
	}: Props = $props();
	
	const errorMessage = $derived(error?.message || message);
</script>

<div class="flex-1 flex items-center justify-center p-8">
	<div class="text-center max-w-md">
		<!-- Error icon -->
		<div class="mx-auto w-16 h-16 mb-4 rounded-full bg-error/10 flex items-center justify-center">
			<svg class="w-8 h-8 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		</div>
		
		<h2 class="text-xl font-semibold text-text mb-2">{title}</h2>
		<p class="text-text-secondary mb-6">{errorMessage}</p>
		
		{#if onRetry}
			<button onclick={onRetry} class="btn btn-primary">
				<svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
				</svg>
				Try again
			</button>
		{/if}
		
		{#if import.meta.env.DEV && error}
			<details class="mt-4 text-left">
				<summary class="cursor-pointer text-sm text-text-secondary hover:text-text">
					Show error details
				</summary>
				<pre class="mt-2 p-3 bg-surface-variant rounded text-xs overflow-x-auto">
{error.stack || error.message}
				</pre>
			</details>
		{/if}
	</div>
</div>