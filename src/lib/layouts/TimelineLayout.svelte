<script lang="ts">
  import type { Snippet } from 'svelte';
  import MainLayout from './MainLayout.svelte';
  import TimelineTabs from '../components/islands/svelte/TimelineTabs.svelte';
  import { authStore } from '$lib/stores/auth.svelte';
  
  interface Props {
    title?: string;
    activeTab?: 'home' | 'local' | 'federated';
    children: Snippet;
  }
  
  let { title = 'Timeline', activeTab = 'home', children }: Props = $props();
  
  // Default to local timeline if not authenticated and trying to view home
  const effectiveTab = $derived(
    activeTab === 'home' && !authStore.isAuthenticated ? 'local' : activeTab
  );
</script>

<MainLayout {title}>
  <div class="timeline-layout">
    <TimelineTabs activeTab={effectiveTab} />
    <div class="timeline-content">
      {@render children()}
    </div>
  </div>
</MainLayout>

<style>
  .timeline-layout {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }

  .timeline-content {
    margin-top: var(--spacing-4, 1rem);
  }
</style>
