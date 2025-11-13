<script lang="ts">
  import TimelineLayout from '../layouts/TimelineLayout.svelte';
  import Timeline from '../components/islands/svelte/Timeline.svelte';
  import ComposeBox from '../components/islands/svelte/ComposeBox.svelte';
</script>

<TimelineLayout title="Home" activeTab="home">
  <div class="home-page">
    <div class="compose-section">
      <ComposeBox />
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
    gap: var(--spacing-4, 1rem);
  }

  .compose-section {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg, 0.5rem);
    padding: var(--spacing-4, 1rem);
  }

  .timeline-section {
    flex: 1;
  }
</style>
