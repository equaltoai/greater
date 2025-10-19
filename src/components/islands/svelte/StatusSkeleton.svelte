<script lang="ts">
	import { GCSkeleton } from '@/lib/components';
</script>

<div class="card p-4 space-y-3">
	<div class="flex items-start gap-3">
		<!-- Avatar skeleton -->
		<GCSkeleton variant="circular" width="48px" height="48px" />
		
		<div class="flex-1 space-y-3">
			<!-- Header skeleton -->
			<div class="flex items-center gap-2">
				<GCSkeleton variant="text" width="128px" height="16px" />
				<GCSkeleton variant="text" width="96px" height="12px" />
			</div>
			
			<!-- Content skeleton -->
			<div class="space-y-2">
				<GCSkeleton variant="text" width="100%" height="16px" />
				<GCSkeleton variant="text" width="80%" height="16px" />
				<GCSkeleton variant="text" width="60%" height="16px" />
			</div>
			
			<!-- Media skeleton (randomly show) -->
			{#if Math.random() > 0.5}
				<GCSkeleton variant="rectangular" width="100%" height="192px" class="rounded-lg" />
			{/if}
			
			<!-- Actions skeleton -->
			<div class="flex items-center gap-6 pt-2">
				<GCSkeleton variant="circular" width="20px" height="20px" />
				<GCSkeleton variant="circular" width="20px" height="20px" />
				<GCSkeleton variant="circular" width="20px" height="20px" />
				<GCSkeleton variant="circular" width="20px" height="20px" />
			</div>
		</div>
	</div>
</div>