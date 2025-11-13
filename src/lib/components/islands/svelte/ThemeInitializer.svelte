<script lang="ts">
  import { onMount } from 'svelte';
  import { currentTheme, applyTheme } from '$lib/stores/theme';
  
  onMount(() => {
    // Apply initial theme
    const colors = currentTheme.get();
    applyTheme(colors);
    
    // Subscribe to theme changes
    const unsubscribe = currentTheme.subscribe(colors => {
      applyTheme(colors);
    });
    
    return unsubscribe;
  });
</script>

<!-- This component has no visual output, it just initializes the theme system -->