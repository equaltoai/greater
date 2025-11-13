<script lang="ts">
  import TimelineLayout from '$lib/layouts/TimelineLayout.svelte';
  import Timeline from '$lib/components/islands/svelte/Timeline.svelte';
</script>

<TimelineLayout title="Local Timeline" activeTab="local">
  <Timeline timelineType="local" />
</TimelineLayout>
