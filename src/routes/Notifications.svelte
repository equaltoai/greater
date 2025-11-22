<script lang="ts">
  import { NotificationsFeedReactive } from '$lib/gc';
  import { authStore } from '$lib/stores/auth.svelte';
  import MainLayout from '$lib/layouts/MainLayout.svelte';
  import { getContext } from 'svelte';
  import {
    notificationIntegrationContextKey,
    type NotificationIntegrationInstance,
  } from '$lib/integrations/realtime';
  
  const currentUser = $derived(authStore.currentUser);
  const notificationCtx = getContext<{
    integration: NotificationIntegrationInstance | null;
  }>(notificationIntegrationContextKey);
  const notificationIntegration = $derived(notificationCtx?.integration ?? null);
</script>

<MainLayout title="Notifications">
  <div class="notifications-page">
    <h1 class="page-title">Notifications</h1>
    {#if notificationIntegration && currentUser}
      <div class="notifications-container">
        <NotificationsFeedReactive
          integration={notificationIntegration}
          density="comfortable"
          showRealtimeIndicator={true}
        />
      </div>
    {:else if currentUser}
      <p>Connecting to notifications…</p>
    {:else}
      <p>Please sign in to view notifications</p>
    {/if}
  </div>
</MainLayout>

<style>
  .notifications-page {
    max-width: 800px;
    margin: 0 auto;
    padding: var(--gr-spacing-scale-4);
  }

  .page-title {
    font-size: var(--gr-typography-fontSize-2xl);
    font-weight: var(--gr-typography-fontWeight-bold);
    color: var(--gr-semantic-text-primary);
    margin-bottom: var(--gr-spacing-scale-4);
  }

  .notifications-container {
    background-color: var(--gr-semantic-background-primary);
    border: 1px solid var(--gr-semantic-border-default);
    border-radius: var(--gr-radii-lg);
    padding: var(--gr-spacing-scale-4);
  }
</style>
