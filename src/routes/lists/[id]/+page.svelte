<script lang="ts">
  import { page } from '$app/stores';
  import {
    TimelineVirtualizedReactive,
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
  const listId = $derived($page.params.id);
  
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
        view: { type: 'list', listId },
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
          logError('[List Timeline] Connection failed', { error, listId });
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
  
  const actionHandlers: StatusActionHandlers = {
    onReply: (status) => logDebug('[List Timeline] Reply action placeholder', status.id),
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

<TimelineLayout title="List Timeline" activeTab="lists">
  <div class="timeline-page">
    {#if currentUser}
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
        <p>Please sign in to view this list timeline</p>
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
</style>
