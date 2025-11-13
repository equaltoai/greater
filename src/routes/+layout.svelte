<script lang="ts">
  // REQUIRED: Greater Components CSS imports
  import '@equaltoai/greater-components-tokens/theme.css';
  import '@equaltoai/greater-components-primitives/style.css';
  
  import '../app.css';
  import { ThemeProvider } from '$lib/gc';
  import ThemeInitializer from '$lib/components/islands/svelte/ThemeInitializer.svelte';
  import OfflineIndicator from '$lib/components/islands/svelte/OfflineIndicator.svelte';
  
  import type { Snippet } from 'svelte';
  
  interface Props {
    children: Snippet;
  }
  
  let { children }: Props = $props();
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
