<script lang="ts">
  import TimelineLayout from '$lib/layouts/TimelineLayout.svelte';
  import Timeline from '$lib/components/islands/svelte/Timeline.svelte';
  import ComposeBoxGC from '$lib/components/islands/svelte/ComposeBoxGC.svelte';
</script>

<TimelineLayout title="Home" activeTab="home">
  <div class="home-page">
    <div class="compose-section">
      <ComposeBoxGC />
    </div>
    <div class="timeline-section">
      <Timeline timelineType="home" />
    </div>
  </div>
</TimelineLayout>

<style>
  .home-page {
    display: flex;
    flex-direction: column;
    gap: var(--gr-spacing-scale-4);
  }

  .compose-section {
    background-color: var(--gr-semantic-background-primary);
    border: 1px solid var(--gr-semantic-border-default);
    border-radius: var(--gr-radii-lg);
    padding: var(--gr-spacing-scale-4);
  }

  .timeline-section {
    flex: 1;
  }
</style>


