<script lang="ts">
  import { ComposeCompound as Compose } from '$lib/gc';
  import { authStore } from '$lib/stores/auth.svelte';
  import MainLayout from '$lib/layouts/MainLayout.svelte';
  import { createGraphQLComposeHandlers } from '$lib/stores/compose';
  
  const currentUser = $derived(authStore.currentUser);
  
  // Compose handlers
  const composeHandlers = createGraphQLComposeHandlers({
    onSuccess: async () => {
      // Navigate back to home after posting
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  });
</script>

<MainLayout title="Compose">
  <div class="compose-page">
    <h1 class="page-title">Compose Post</h1>
    {#if currentUser}
      <div class="compose-container">
        <Compose.Root
          config={{ allowMedia: true, placeholder: "What's on your mind?" }}
          handlers={composeHandlers}
        >
          <Compose.Editor rows={6} />
          <Compose.MediaUpload />
          <div class="compose-controls">
            <Compose.VisibilitySelect />
            <Compose.CharacterCount />
            <Compose.Submit text="Post" />
          </div>
        </Compose.Root>
      </div>
    {:else}
      <p>Please sign in to compose a post</p>
    {/if}
  </div>
</MainLayout>

<style>
  .compose-page {
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

  .compose-container {
    background-color: var(--gr-semantic-background-primary);
    border: 1px solid var(--gr-semantic-border-default);
    border-radius: var(--gr-radii-lg);
    padding: var(--gr-spacing-scale-4);
  }

  .compose-controls {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--gr-spacing-scale-2);
    margin-top: var(--gr-spacing-scale-3);
  }
</style>
