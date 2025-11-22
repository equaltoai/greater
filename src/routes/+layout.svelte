<script lang="ts">
  // REQUIRED: Greater Components CSS imports
  import '@equaltoai/greater-components/tokens/theme.css';
  import '@equaltoai/greater-components/primitives/theme.css';
  import '@equaltoai/greater-components/fediverse/theme.css';
  
  import '../app.css';
  import { ThemeProvider } from '$lib/gc';
  import ThemeInitializer from '$lib/components/islands/svelte/ThemeInitializer.svelte';
  import OfflineIndicator from '$lib/components/islands/svelte/OfflineIndicator.svelte';
  import { setContext } from 'svelte';
  import { authStore } from '$lib/stores/auth.svelte';
  import { getCurrentToken } from '$lib/api/graphql-client';
  import {
    buildNotificationIntegration,
    notificationIntegrationContextKey,
    type NotificationIntegrationInstance,
  } from '$lib/integrations/realtime';
  
  import type { Snippet } from 'svelte';
  
  interface Props {
    children: Snippet;
  }
  
  let { children }: Props = $props();

  const notificationIntegrationState = $state<{
    integration: NotificationIntegrationInstance | null;
  }>({ integration: null });
  setContext(notificationIntegrationContextKey, notificationIntegrationState);

  const currentInstance = $derived(authStore.currentInstance);
  const isAuthenticated = $derived(authStore.isAuthenticated);

  $effect(() => {
    if (typeof window === 'undefined') {
      notificationIntegrationState.integration?.destroy();
      notificationIntegrationState.integration = null;
      return;
    }

    if (!isAuthenticated || !currentInstance) {
      notificationIntegrationState.integration?.destroy();
      notificationIntegrationState.integration = null;
      return;
    }

    let cancelled = false;

    (async () => {
      const token = await getCurrentToken(currentInstance);
      if (cancelled) return;

      notificationIntegrationState.integration?.destroy();
      const integration = buildNotificationIntegration({
        instance: currentInstance,
        accessToken: token,
        autoConnect: false,
      });

      try {
        await integration.connect();
        if (cancelled) {
          integration.destroy();
          return;
        }
        notificationIntegrationState.integration = integration;
      } catch (error) {
        console.error('[Layout] Failed to initialize notification integration', error);
        integration.destroy();
        notificationIntegrationState.integration = null;
      }
    })();

    return () => {
      cancelled = true;
      notificationIntegrationState.integration?.destroy();
      notificationIntegrationState.integration = null;
    };
  });
</script>

<svelte:head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="A modern, high-performance web client for Mastodon-compatible instances" />
</svelte:head>

<ThemeProvider>
  <ThemeInitializer />
  <OfflineIndicator />
  {@render children()}
</ThemeProvider>
