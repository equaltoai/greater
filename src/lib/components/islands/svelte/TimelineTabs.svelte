<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth.svelte';

  type TimelineTabId = 'home' | 'local' | 'federated';
  
  interface Props {
    activeTab?: TimelineTabId;
  }
  
  let { activeTab }: Props = $props();

  const allTabs: Array<{ id: TimelineTabId; label: string; href: string; authRequired?: boolean }> = [
    { id: 'home', label: 'Home', href: '/home', authRequired: true },
    { id: 'local', label: 'Local', href: '/local' },
    { id: 'federated', label: 'Federated', href: '/federated' },
  ];
  
  // Filter tabs based on auth state
  const tabs = $derived(allTabs.filter(tab => !tab.authRequired || authStore.isAuthenticated));

  let active = $state<TimelineTabId>(activeTab || 'local');
  
  // Sync active tab with activeTab prop changes
  $effect(() => {
    if (activeTab) {
      active = activeTab;
    }
  });
  
  // Also sync on mount from URL
  onMount(() => {
    if (typeof window === 'undefined') {
      return;
    }
    
    // Prefer activeTab prop over URL
    if (!activeTab) {
      const pathname = window.location.pathname;
      if (pathname === '/' || pathname.startsWith('/home')) {
        active = 'home';
      } else if (pathname.startsWith('/local')) {
        active = 'local';
      } else if (pathname.startsWith('/federated')) {
        active = 'federated';
      }
    }
  });

  function handleSelect(tabId: TimelineTabId) {
    if (tabId === active) {
      return;
    }

    active = tabId;
    const destination = tabs.find(tab => tab.id === tabId)?.href ?? '/local';
    // Use window.location.href for full page navigation
    window.location.href = destination;
  }
</script>

<div class="tabs-container" role="tablist">
  {#each tabs as tab (tab.id)}
    <button
      role="tab"
      class:active={active === tab.id}
      onclick={() => handleSelect(tab.id)}
      aria-selected={active === tab.id}
    >
      {tab.label}
    </button>
  {/each}
</div>

<style>
  .tabs-container {
    display: flex;
    gap: 0.5rem;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0.5rem;
    overflow-x: auto;
  }
  
  button {
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    color: var(--color-text-muted);
    cursor: pointer;
    border-radius: 0.375rem;
    transition: all 0.2s;
  }
  
  button:hover {
    background: var(--color-surface);
  }
  
  button.active {
    background: var(--color-primary);
    color: white;
  }
</style>
