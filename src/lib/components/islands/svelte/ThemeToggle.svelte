<script lang="ts">
  import { GCThemeSwitcher } from '$lib/components';
  import { themeState, setThemeMode, type ThemeMode } from '$lib/stores/theme';
  
  let themeStateValue = $state(themeState.get());
  
  $effect(() => {
    const unsubscribe = themeState.subscribe(value => {
      themeStateValue = value;
    });
    return () => unsubscribe();
  });
  
  // Handle theme change from the primitive component
  function handleThemeChange(event: CustomEvent<ThemeMode>) {
    setThemeMode(event.detail);
  }
</script>

<GCThemeSwitcher 
  value={themeStateValue.mode}
  onchange={handleThemeChange}
  class="theme-toggle"
/>

