<script lang="ts">
  import TimelineLayout from '../layouts/TimelineLayout.svelte';
  import Timeline from '../components/islands/svelte/Timeline.svelte';
</script>

<TimelineLayout title="Federated Timeline" activeTab="federated">
  <Timeline timelineType="federated" />
</TimelineLayout>
