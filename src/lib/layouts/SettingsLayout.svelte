<script lang="ts">
  import type { Snippet } from 'svelte';
  import MainLayout from './MainLayout.svelte';
  import SettingsNav from '../components/islands/svelte/SettingsNav.svelte';
  
  interface Props {
    title?: string;
    children: Snippet;
  }
  
  let { title = 'Settings', children }: Props = $props();
</script>

<MainLayout {title}>
  <div class="settings-layout">
    <aside class="settings-sidebar">
      <SettingsNav />
    </aside>
    <main class="settings-content">
      {@render children()}
    </main>
  </div>
</MainLayout>

<style>
  .settings-layout {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: var(--spacing-6, 1.5rem);
    max-width: 1200px;
    margin: 0 auto;
  }

  .settings-sidebar {
    position: sticky;
    top: var(--spacing-4, 1rem);
    align-self: start;
  }

  .settings-content {
    min-width: 0; /* Prevents grid blowout */
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg, 0.5rem);
    padding: var(--spacing-6, 1.5rem);
  }

  @media (max-width: 768px) {
    .settings-layout {
      grid-template-columns: 1fr;
      gap: var(--spacing-4, 1rem);
    }

    .settings-sidebar {
      position: static;
    }
  }
</style>
