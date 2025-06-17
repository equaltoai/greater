<script lang="ts">
  import { theme$, type Theme } from '@/lib/stores/preferences';
  
  // Get current theme
  let currentTheme = $state(theme$.get());
  
  // Subscribe to theme changes with effect
  $effect(() => {
    const unsubscribe = theme$.subscribe(value => {
      currentTheme = value;
    });
    return () => unsubscribe();
  });
  
  // Theme options
  const themes: { value: Theme; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'auto', label: 'Auto', icon: '🔄' },
    { value: 'high-contrast', label: 'High Contrast', icon: '⚡' }
  ];
  
  // Handle theme change
  function handleThemeChange(newTheme: Theme) {
    theme$.set(newTheme);
  }
</script>

<div class="relative">
  <button
    type="button"
    class="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    aria-label="Toggle theme"
    id="theme-toggle-button"
  >
    {#if currentTheme === 'light'}
      <span class="text-xl">☀️</span>
    {:else if currentTheme === 'dark'}
      <span class="text-xl">🌙</span>
    {:else if currentTheme === 'high-contrast'}
      <span class="text-xl">⚡</span>
    {:else}
      <span class="text-xl">🔄</span>
    {/if}
  </button>
  
  <!-- Dropdown menu (placeholder - not functional yet) -->
  <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 hidden">
    <div class="py-1">
      {#each themes as theme}
        <button
          type="button"
          class="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          class:bg-gray-100={currentTheme === theme.value}
          class:dark:bg-gray-800={currentTheme === theme.value}
          onclick={() => handleThemeChange(theme.value)}
        >
          <span class="mr-3 text-xl">{theme.icon}</span>
          <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{theme.label}</span>
        </button>
      {/each}
    </div>
  </div>
</div>

