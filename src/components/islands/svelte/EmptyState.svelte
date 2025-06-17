<script lang="ts">
	interface Props {
		title?: string;
		message?: string;
		icon?: string;
		action?: {
			label: string;
			onClick: () => void;
		};
	}
	
	let { 
		title = "No content yet",
		message = "When there's something to show, it will appear here.",
		icon = "inbox",
		action
	}: Props = $props();
</script>

<div class="flex-1 flex items-center justify-center p-8">
	<div class="text-center max-w-md">
		<!-- Icon -->
		<div class="mx-auto w-16 h-16 mb-4 rounded-full bg-surface-variant flex items-center justify-center">
			{#if icon === 'inbox'}
				<svg class="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
				</svg>
			{:else if icon === 'search'}
				<svg class="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
				</svg>
			{:else if icon === 'users'}
				<svg class="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
				</svg>
			{/if}
		</div>
		
		<h2 class="text-xl font-semibold text-text mb-2">{title}</h2>
		<p class="text-text-secondary mb-6">{message}</p>
		
		{#if action}
			<button onclick={action.onClick} class="btn btn-primary">
				{action.label}
			</button>
		{/if}
	</div>
</div>