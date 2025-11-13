<script lang="ts">
  import BaseLayout from '../../layouts/BaseLayout.svelte';
  import OAuthCallback from '../../components/islands/svelte/OAuthCallback.svelte';
</script>

<BaseLayout title="Completing Login - Greater">
  <div class="callback-page">
    <div class="callback-container">
      <OAuthCallback />
    </div>
  </div>
</BaseLayout>

<style>
  .callback-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background-color: var(--color-background);
    padding: var(--spacing-4, 1rem);
  }

  .callback-container {
    text-align: center;
  }
</style>
