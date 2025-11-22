<script lang="ts">
  import {
    TimelineVirtualizedReactive,
    ComposeCompound as Compose,
    type ComposeHandlers,
    type StatusActionHandlers,
  } from '$lib/gc';
  import { authStore } from '$lib/stores/auth.svelte';
  import { getCurrentToken } from '$lib/api/graphql-client';
  import TimelineLayout from '$lib/layouts/TimelineLayout.svelte';
  import TimelineSkeleton from '$lib/components/islands/svelte/TimelineSkeleton.svelte';
  import ErrorState from '$lib/components/islands/svelte/ErrorState.svelte';
  import { buildTimelineIntegration, type TimelineIntegrationInstance } from '$lib/integrations/realtime';
  import { logDebug, logError } from '$lib/utils/logger';
  import {
    boostStatus,
    favoriteStatus,
    unboostStatus,
    unfavoriteStatus,
  } from '$lib/api/mutations';
  
  const currentUser = $derived(authStore.currentUser);
  const currentInstance = $derived(authStore.currentInstance);
  
  let timelineIntegration = $state<TimelineIntegrationInstance | null>(null);
  let integrationError = $state<string | null>(null);
  let isConnecting = $state(false);
  let integrationNonce = $state(0);
  
  $effect(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    integrationNonce;
    if (typeof window === 'undefined') {
      timelineIntegration?.destroy();
      timelineIntegration = null;
      return;
    }
  
    if (!currentUser || !currentInstance) {
      integrationError = null;
      isConnecting = false;
      timelineIntegration?.destroy();
      timelineIntegration = null;
      return;
    }
  
    let cancelled = false;
    isConnecting = true;
  
    (async () => {
      const token = await getCurrentToken(currentInstance);
      if (cancelled) return;
  
      const integration = buildTimelineIntegration({
        instance: currentInstance,
        accessToken: token,
        view: 'federated',
        autoConnect: false,
      });
  
      try {
        await integration.connect();
        if (cancelled) {
          integration.destroy();
          return;
        }
        timelineIntegration?.destroy();
        timelineIntegration = integration;
        integrationError = null;
      } catch (error) {
        integration.destroy();
        if (!cancelled) {
          const msg = error instanceof Error ? error.message : 'Unable to connect to timeline';
          logError('[Federated Timeline] Connection failed', { error });
          integrationError = msg;
          timelineIntegration = null;
        }
      } finally {
        if (!cancelled) {
          isConnecting = false;
        }
      }
    })();
  
    return () => {
      cancelled = true;
      timelineIntegration?.destroy();
      timelineIntegration = null;
    };
  });
  
  import { createGraphQLComposeHandlers } from '$lib/stores/compose';

  const composeHandlers = createGraphQLComposeHandlers({
    onSuccess: async () => {
      await timelineIntegration?.refresh();
    },
  });

  const actionHandlers: StatusActionHandlers = {
    onReply: (status) => logDebug('[Federated Timeline] Reply action placeholder', status.id),
    onBoost: async (status) => {
      if (status.reblogged) {
        await unboostStatus(status.id);
      } else {
        await boostStatus(status.id);
      }
    },
    onFavorite: async (status) => {
      if (status.favourited) {
        await unfavoriteStatus(status.id);
      } else {
        await favoriteStatus(status.id);
      }
    },
  };

  function reconnectTimeline() {
    integrationError = null;
    integrationNonce += 1;
  }
</script>

<TimelineLayout title="Federated Timeline" activeTab="federated">
  <div class="timeline-page">
    {#if currentUser}
      <div class="compose-section">
        <Compose.Root
          config={{ allowMedia: true, placeholder: 'Share something with the fediverse…' }}
          handlers={composeHandlers}
        >
          <Compose.Editor rows={3} />
          <Compose.MediaUpload />
          <div class="compose-controls">
            <Compose.VisibilitySelect />
            <Compose.CharacterCount />
            <Compose.Submit text="Post" />
          </div>
        </Compose.Root>
      </div>
      <div class="timeline-section">
        {#if integrationError}
          <ErrorState
            title="Unable to load timeline"
            message={integrationError}
            on:retry={reconnectTimeline}
          />
        {:else if !timelineIntegration || isConnecting}
          <TimelineSkeleton />
        {:else}
          <TimelineVirtualizedReactive
            integration={timelineIntegration}
            density="comfortable"
            showRealtimeIndicator={true}
            {actionHandlers}
          />
        {/if}
      </div>
    {:else}
      <div class="error-state">
        <p>Please sign in to view the federated timeline</p>
      </div>
    {/if}
  </div>
</TimelineLayout>

<style>
  .timeline-page {
    display: flex;
    flex-direction: column;
    gap: var(--gr-spacing-scale-4);
    height: 100%;
  }

  .compose-section {
    background-color: var(--gr-semantic-background-primary);
    border: 1px solid var(--gr-semantic-border-default);
    border-radius: var(--gr-radii-lg);
    padding: var(--gr-spacing-scale-4);
  }

  .timeline-section {
    flex: 1;
    min-height: 0;
  }

  .error-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--gr-semantic-text-secondary);
  }

  .compose-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gr-spacing-scale-2);
    margin-top: var(--gr-spacing-scale-3);
  }
</style>
