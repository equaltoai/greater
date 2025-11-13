<script lang="ts">
  import { onMount } from 'svelte';
  import { themeState, setThemeMode, setThemePreset, createCustomTheme, deleteCustomTheme, setActiveCustomTheme, currentTheme } from '$lib/stores/theme';
  import { ColorHarmonics } from '$lib/theme/color-harmonics';
  import type { HarmonyType, ThemeMode, ThemePreset } from '$lib/stores/theme';
  import Button from './Button.svelte';
  
  // Initialize with default values for SSR
  let themeStateValue = $state({
    mode: 'system' as ThemeMode,
    preset: 'default' as ThemePreset,
    customThemes: [],
    activeCustomThemeId: undefined
  });
  let currentThemeValue = $state({});
  let mounted = $state(false);
  
  onMount(() => {
    mounted = true;
    // Initialize with actual store values on client
    themeStateValue = themeState.get();
    currentThemeValue = currentTheme.get();
  });
  
  $effect(() => {
    if (!mounted) return;
    
    const unsubTheme = themeState.subscribe(value => {
      themeStateValue = value;
    });
    const unsubCurrent = currentTheme.subscribe(value => {
      currentThemeValue = value;
    });
    return () => {
      unsubTheme();
      unsubCurrent();
    };
  });
  
  let showCustomizer = $state(false);
  let seedColor = $state('#2563eb');
  let harmonyType = $state<HarmonyType>('triad-equilateral');
  let themeName = $state('');
  
  // Preview colors
  const previewColors = $derived.by(() => {
    const isDark = themeStateValue.mode === 'dark' || 
      (themeStateValue.mode === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    return ColorHarmonics.generateTheme(seedColor, harmonyType, isDark);
  });
  
  function handleModeChange(mode: ThemeMode) {
    setThemeMode(mode);
  }
  
  function handlePresetChange(preset: ThemePreset) {
    setThemePreset(preset);
  }
  
  function randomizeSeed() {
    seedColor = ColorHarmonics.randomSeedColor();
  }
  
  function saveCustomTheme() {
    if (!themeName.trim()) {
      alert('Please enter a theme name');
      return;
    }
    
    createCustomTheme(themeName, seedColor, harmonyType);
    themeName = '';
    showCustomizer = false;
  }
  
  function exportTheme(theme: any) {
    const data = JSON.stringify(theme, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${theme.name.toLowerCase().replace(/\s+/g, '-')}-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  
  // Color wheel visualization
  let colorWheelCanvas: HTMLCanvasElement;
  
  $effect(() => {
    if (typeof window === 'undefined' || !colorWheelCanvas || !showCustomizer) return;
    
    const ctx = colorWheelCanvas.getContext('2d');
    if (!ctx) return;
    
    const centerX = 100;
    const centerY = 100;
    const radius = 80;
    
    // Draw color wheel
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 1) * Math.PI / 180;
      const endAngle = angle * Math.PI / 180;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      gradient.addColorStop(0, `hsl(${angle}, 50%, 90%)`);
      gradient.addColorStop(0.7, `hsl(${angle}, 70%, 50%)`);
      gradient.addColorStop(1, `hsl(${angle}, 90%, 30%)`);
      
      ctx.fillStyle = gradient;
      ctx.fill();
    }
    
    // Draw harmony indicators
    const seedHsl = ColorHarmonics.hexToHsl(seedColor);
    const harmonyColors = ColorHarmonics.generateHarmony(seedHsl, harmonyType);
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    
    // Draw lines between harmony colors
    if (harmonyColors.length > 1) {
      ctx.beginPath();
      harmonyColors.forEach((color, i) => {
        const angle = color.h * Math.PI / 180;
        const x = centerX + Math.cos(angle - Math.PI / 2) * radius * 0.8;
        const y = centerY + Math.sin(angle - Math.PI / 2) * radius * 0.8;
        
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      // Close the shape for tetrads
      if (harmonyColors.length > 3) {
        const firstAngle = harmonyColors[0].h * Math.PI / 180;
        const firstX = centerX + Math.cos(firstAngle - Math.PI / 2) * radius * 0.8;
        const firstY = centerY + Math.sin(firstAngle - Math.PI / 2) * radius * 0.8;
        ctx.lineTo(firstX, firstY);
      }
      
      ctx.stroke();
    }
    
    // Draw color dots
    harmonyColors.forEach((color, i) => {
      const angle = color.h * Math.PI / 180;
      const x = centerX + Math.cos(angle - Math.PI / 2) * radius * 0.8;
      const y = centerY + Math.sin(angle - Math.PI / 2) * radius * 0.8;
      
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fillStyle = ColorHarmonics.hslToHex(color);
      ctx.fill();
      ctx.strokeStyle = i === 0 ? '#fff' : '#000';
      ctx.lineWidth = i === 0 ? 4 : 2;
      ctx.stroke();
    });
  });
</script>

<div class="space-y-6">
  {#if !mounted}
    <!-- Loading state for SSR -->
    <div class="animate-pulse">
      <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-3"></div>
      <div class="flex gap-2">
        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        <div class="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
      </div>
    </div>
  {:else}
    <!-- Theme Mode -->
    <div>
    <h3 class="text-lg font-semibold mb-3">Theme Mode</h3>
    <div class="flex gap-2">
      {#each ['light', 'dark', 'system'] as mode}
        <button
          onclick={() => handleModeChange(mode)}
          class="px-4 py-2 rounded-lg transition-colors {
            themeStateValue.mode === mode
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }"
        >
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </button>
      {/each}
    </div>
  </div>
  
  <!-- Theme Preset -->
  <div>
    <h3 class="text-lg font-semibold mb-3">Theme Style</h3>
    <div class="flex gap-2">
      {#each ['default', 'high-contrast'] as preset}
        <button
          onclick={() => handlePresetChange(preset)}
          class="px-4 py-2 rounded-lg transition-colors {
            themeStateValue.preset === preset
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
          }"
        >
          {preset.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
        </button>
      {/each}
    </div>
  </div>
  
  <!-- Custom Themes -->
  <div>
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-lg font-semibold">Custom Themes</h3>
      <Button onclick={() => showCustomizer = !showCustomizer} size="sm">
        {showCustomizer ? 'Close' : 'Create New'}
      </Button>
    </div>
    
    {#if showCustomizer}
      <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-4">
        <!-- Color Wheel -->
        <div class="flex gap-4">
          <canvas 
            bind:this={colorWheelCanvas}
            width="200" 
            height="200"
            class="rounded-lg bg-white dark:bg-gray-900"
          />
          
          <div class="flex-1 space-y-3">
            <!-- Seed Color -->
            <div>
              <label class="block text-sm font-medium mb-1">Seed Color</label>
              <div class="flex gap-2">
                <input
                  type="color"
                  bind:value={seedColor}
                  class="h-10 w-20 rounded cursor-pointer"
                />
                <input
                  type="text"
                  bind:value={seedColor}
                  class="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
                <Button onclick={randomizeSeed} size="sm">Random</Button>
              </div>
            </div>
            
            <!-- Harmony Type -->
            <div>
              <label class="block text-sm font-medium mb-1">Harmony Type</label>
              <select
                bind:value={harmonyType}
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              >
                <option value="dyad">Dyad (Complementary)</option>
                <option value="triad-equilateral">Triad (Equilateral)</option>
                <option value="triad-isosceles">Triad (Split Complementary)</option>
                <option value="tetrad-square">Tetrad (Square)</option>
                <option value="tetrad-rectangle">Tetrad (Rectangle)</option>
              </select>
            </div>
            
            <!-- Theme Name -->
            <div>
              <label class="block text-sm font-medium mb-1">Theme Name</label>
              <input
                type="text"
                bind:value={themeName}
                placeholder="My Custom Theme"
                class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>
          </div>
        </div>
        
        <!-- Preview -->
        <div class="border-t border-gray-300 dark:border-gray-600 pt-4">
          <h4 class="text-sm font-medium mb-2">Preview</h4>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded" style="background-color: {previewColors.primary}"></div>
                <span class="text-sm">Primary</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded" style="background-color: {previewColors.accent1}"></div>
                <span class="text-sm">Accent 1</span>
              </div>
              {#if previewColors.accent2}
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded" style="background-color: {previewColors.accent2}"></div>
                  <span class="text-sm">Accent 2</span>
                </div>
              {/if}
            </div>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded border" style="background-color: {previewColors.background}"></div>
                <span class="text-sm">Background</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded" style="background-color: {previewColors.surface}"></div>
                <span class="text-sm">Surface</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded" style="background-color: {previewColors.text}"></div>
                <span class="text-sm">Text</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Save Button -->
        <div class="flex justify-end">
          <Button onclick={saveCustomTheme}>Save Theme</Button>
        </div>
      </div>
    {/if}
    
    <!-- Saved Themes -->
    {#if themeStateValue.customThemes.length > 0}
      <div class="space-y-2 mt-4">
        {#each themeStateValue.customThemes as theme}
          <div class="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="flex gap-1">
                <div class="w-6 h-6 rounded" style="background-color: {theme.colors.primary}"></div>
                <div class="w-6 h-6 rounded" style="background-color: {theme.colors.accent1}"></div>
                {#if theme.colors.accent2}
                  <div class="w-6 h-6 rounded" style="background-color: {theme.colors.accent2}"></div>
                {/if}
              </div>
              <span class="font-medium">{theme.name}</span>
              <span class="text-sm text-gray-500">({theme.harmonyType})</span>
            </div>
            <div class="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onclick={() => setActiveCustomTheme(theme.id)}
                disabled={themeStateValue.activeCustomThemeId === theme.id}
              >
                {themeStateValue.activeCustomThemeId === theme.id ? 'Active' : 'Use'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onclick={() => exportTheme(theme)}
              >
                Export
              </Button>
              <Button
                size="sm"
                variant="outline"
                onclick={() => deleteCustomTheme(theme.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
  {/if}
</div>