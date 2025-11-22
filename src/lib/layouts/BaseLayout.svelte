<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    description?: string;
    children: Snippet;
  }

  let { title = 'Greater', description = 'A modern Mastodon client', children }: Props = $props();

  // Update document title
  $effect(() => {
    if (typeof document !== 'undefined') {
      document.title = title;
    }
  });
</script>

<svelte:head>
  <meta name="description" content={description} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
</svelte:head>

<div class="base-layout">
  {@render children()}
</div>

<style>
  .base-layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: var(--gr-semantic-background-primary);
    color: var(--gr-semantic-foreground-primary);
  }
</style>
