<script lang="ts">
  import { themeState, setThemeMode, type ThemeMode } from '@/lib/stores/theme';
  
  let themeStateValue = $state(themeState.get());
  
  $effect(() => {
    const unsubscribe = themeState.subscribe(value => {
      themeStateValue = value;
    });
    return () => unsubscribe();
  });
  
  let showDropdown = $state(false);
  
  // Theme options
  const themes: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: 'Light', icon: '☀️' },
    { value: 'dark', label: 'Dark', icon: '🌙' },
    { value: 'system', label: 'System', icon: '🔄' }
  ];
  
  // Handle theme change
  function handleThemeChange(newTheme: ThemeMode) {
    setThemeMode(newTheme);
    showDropdown = false;
  }
  
  // Get current icon
  const currentIcon = $derived(
    themes.find(t => t.value === themeStateValue.mode)?.icon || '🔄'
  );
  
  // Close dropdown on outside click
  function handleClickOutside(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if (!target.closest('#theme-toggle-container')) {
      showDropdown = false;
    }
  }
  
  $effect(() => {
    if (showDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  });
</script>

<div class="relative" id="theme-toggle-container">
  <button
    type="button"
    class="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    aria-label="Toggle theme"
    onclick={() => showDropdown = !showDropdown}
  >
    <span class="text-xl">{currentIcon}</span>
  </button>
  
  <!-- Dropdown menu -->
  {#if showDropdown}
    <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 animate-in">
      <div class="py-1">
        {#each themes as theme}
          <button
            type="button"
            class="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors {
              themeStateValue.mode === theme.value ? 'bg-gray-100 dark:bg-gray-800' : ''
            }"
            onclick={() => handleThemeChange(theme.value)}
          >
            <span class="mr-3 text-xl">{theme.icon}</span>
            <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{theme.label}</span>
            {#if themeStateValue.mode === theme.value}
              <svg class="ml-auto w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
            {/if}
          </button>
        {/each}
        
        <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
        
        <a
          href="/settings/appearance"
          class="flex items-center w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-sm"
        >
          <svg class="mr-3 w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span class="text-gray-700 dark:text-gray-300">Appearance Settings</span>
        </a>
      </div>
    </div>
  {/if}
</div>

