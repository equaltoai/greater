<script lang="ts">
	// Status skeleton loader component
</script>

<div class="card p-4 space-y-3 animate-pulse">
	<div class="flex items-start gap-3">
		<!-- Avatar skeleton -->
		<div class="w-12 h-12 rounded-full bg-surface-variant"></div>
		
		<div class="flex-1 space-y-3">
			<!-- Header skeleton -->
			<div class="flex items-center gap-2">
				<div class="h-4 w-32 bg-surface-variant rounded"></div>
				<div class="h-3 w-24 bg-surface-variant rounded"></div>
			</div>
			
			<!-- Content skeleton -->
			<div class="space-y-2">
				<div class="h-4 w-full bg-surface-variant rounded"></div>
				<div class="h-4 w-4/5 bg-surface-variant rounded"></div>
				<div class="h-4 w-3/5 bg-surface-variant rounded"></div>
			</div>
			
			<!-- Media skeleton (randomly show) -->
			{#if Math.random() > 0.5}
				<div class="h-48 w-full bg-surface-variant rounded-lg"></div>
			{/if}
			
			<!-- Actions skeleton -->
			<div class="flex items-center gap-6 pt-2">
				<div class="h-5 w-5 bg-surface-variant rounded"></div>
				<div class="h-5 w-5 bg-surface-variant rounded"></div>
				<div class="h-5 w-5 bg-surface-variant rounded"></div>
				<div class="h-5 w-5 bg-surface-variant rounded"></div>
			</div>
		</div>
	</div>
</div>