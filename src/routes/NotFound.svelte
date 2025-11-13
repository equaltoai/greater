<script lang="ts">
  import BaseLayout from '../layouts/BaseLayout.svelte';
  import { GCButton } from '$lib/lib/components';
  import { push } from 'svelte-spa-router';
</script>

<BaseLayout title="Page Not Found - Greater">
  <div class="not-found-page">
    <div class="not-found-content">
      <h1 class="error-code">404</h1>
      <h2 class="error-title">Page Not Found</h2>
      <p class="error-message">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <GCButton variant="primary" onclick={() => push('/')}>
        Go Home
      </GCButton>
    </div>
  </div>
</BaseLayout>

<style>
  .not-found-page {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: var(--spacing-4, 1rem);
  }

  .not-found-content {
    text-align: center;
    max-width: 500px;
  }

  .error-code {
    font-size: 6rem;
    font-weight: var(--font-weight-bold, 700);
    color: var(--color-primary);
    line-height: 1;
    margin-bottom: var(--spacing-4, 1rem);
  }

  .error-title {
    font-size: var(--font-size-2xl, 1.5rem);
    font-weight: var(--font-weight-semibold, 600);
    color: var(--color-text);
    margin-bottom: var(--spacing-3, 0.75rem);
  }

  .error-message {
    font-size: var(--font-size-base, 1rem);
    color: var(--color-text-muted);
    margin-bottom: var(--spacing-6, 1.5rem);
  }
</style>
