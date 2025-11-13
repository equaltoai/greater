<script lang="ts">
  import TimelineLayout from '../layouts/TimelineLayout.svelte';
  import Timeline from '../components/islands/svelte/Timeline.svelte';
</script>

<TimelineLayout title="Local Timeline" activeTab="local">
  <Timeline timelineType="local" />
</TimelineLayout>
