<script lang="ts">
  import MainLayout from '../layouts/MainLayout.svelte';
  import ComposeBox from '../components/islands/svelte/ComposeBox.svelte';
</script>

<MainLayout title="Compose">
  <div class="compose-page">
    <h1 class="page-title">Compose Post</h1>
    <div class="compose-container">
      <ComposeBox standalone={true} />
    </div>
  </div>
</MainLayout>

<style>
  .compose-page {
    max-width: 800px;
    margin: 0 auto;
  }

  .page-title {
    font-size: var(--font-size-2xl, 1.5rem);
    font-weight: var(--font-weight-bold, 700);
    color: var(--color-text);
    margin-bottom: var(--spacing-4, 1rem);
  }

  .compose-container {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg, 0.5rem);
    padding: var(--spacing-4, 1rem);
  }
</style>
