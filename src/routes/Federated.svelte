<script lang="ts">
  import TimelineLayout from '$lib/layouts/TimelineLayout.svelte';
  import Timeline from '$lib/components/islands/svelte/Timeline.svelte';
</script>

<TimelineLayout title="Federated Timeline" activeTab="federated">
  <Timeline timelineType="federated" />
</TimelineLayout>
