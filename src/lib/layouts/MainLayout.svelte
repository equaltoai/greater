<script lang="ts">
  import type { Snippet } from 'svelte';
  import BaseLayout from './BaseLayout.svelte';
  import Navigation from '../components/islands/svelte/Navigation.svelte';
  
  interface Props {
    title?: string;
    children: Snippet;
  }
  
  let { title = 'Greater', children }: Props = $props();
</script>

<BaseLayout {title}>
  <div class="main-layout">
    <aside class="sidebar">
      <Navigation />
    </aside>
    <main class="content">
      {@render children()}
    </main>
  </div>
</BaseLayout>

<style>
  .main-layout {
    display: flex;
    flex: 1;
    width: 100%;
    max-width: 1280px;
    margin: 0 auto;
    gap: var(--gr-spacing-scale-4);
    padding: var(--gr-spacing-scale-4);
  }

  .sidebar {
    width: 240px;
    flex-shrink: 0;
  }

  .content {
    flex: 1;
    min-width: 0;
  }

  @media (max-width: 768px) {
    .main-layout {
      padding: var(--gr-spacing-scale-2);
    }
    
    .sidebar {
      display: none;
    }
    
    .content {
      width: 100%;
    }
  }
</style>
