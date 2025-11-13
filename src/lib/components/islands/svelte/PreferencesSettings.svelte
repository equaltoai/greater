<script lang="ts">
  import { onMount } from 'svelte';
  import { GCSelect, GCSwitch, GCButton } from '$lib/components';
  import { 
    timelinePrefs$, 
    composePrefs$, 
    notificationPrefs$, 
    a11yPrefs$,
    applyFontSize 
  } from '$lib/stores/preferences';
  import { authStore } from '$lib/stores/auth.svelte';
  import type { Preferences } from '$lib/types/mastodon';
  
  // Get current values
  let timelinePrefs = $timelinePrefs$;
  let composePrefs = $composePrefs$;
  let notificationPrefs = $notificationPrefs$;
  let a11yPrefs = $a11yPrefs$;
  
  let serverPrefs: Preferences | null = null;
  let loading = true;
  let error = '';
  let saveSuccess = false;
  
  onMount(async () => {
    // Note: Server preferences sync via GraphQL not yet implemented
    // Using local preferences only for now
    console.log('PreferencesSettings: Using local preferences (server sync needs GraphQL implementation)');
    loading = false;
  });
  
  function savePreferences() {
    // Save to local storage
    timelinePrefs$.set(timelinePrefs);
    composePrefs$.set(composePrefs);
    notificationPrefs$.set(notificationPrefs);
    a11yPrefs$.set(a11yPrefs);
    
    // Apply font size immediately
    applyFontSize(timelinePrefs.fontSize);
    
    // Show success message
    saveSuccess = true;
    setTimeout(() => saveSuccess = false, 3000);
  }
  
  async function requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      notificationPrefs.desktop = permission === 'granted';
    }
  }
</script>

<div class="space-y-8">
  {#if loading}
    <div class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
    </div>
  {:else}
    <!-- Timeline Preferences -->
    <section>
      <h3 class="text-lg font-semibold mb-4">Timeline</h3>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <span>Auto-refresh timelines</span>
          <label class="relative inline-block">
            <input type="checkbox" bind:checked={timelinePrefs.autoRefresh} class="toggle sr-only">
            <div class="toggle-bg"></div>
          </label>
        </div>
        
        <div class="flex items-center justify-between">
          <span>Show replies in timeline</span>
          <label class="relative inline-block">
            <input type="checkbox" bind:checked={timelinePrefs.showReplies} class="toggle sr-only">
            <div class="toggle-bg"></div>
          </label>
        </div>
        
        <div class="flex items-center justify-between">
          <span>Show boosts in timeline</span>
          <label class="relative inline-block">
            <input type="checkbox" bind:checked={timelinePrefs.showBoosts} class="toggle sr-only">
            <div class="toggle-bg"></div>
          </label>
        </div>
        
        <div>
          <label class="block mb-2">Media preview</label>
          <select bind:value={timelinePrefs.mediaPreview} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <option value="show">Show all media</option>
            <option value="blur">Blur sensitive media</option>
            <option value="hide">Hide all media</option>
          </select>
        </div>
        
        <div>
          <label class="block mb-2">Font size</label>
          <select bind:value={timelinePrefs.fontSize} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>
    </section>
    
    <!-- Compose Preferences -->
    <section>
      <h3 class="text-lg font-semibold mb-4">Posting</h3>
      <div class="space-y-4">
        <div>
          <label class="block mb-2">Default post visibility</label>
          <select bind:value={composePrefs.defaultVisibility} class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
            <option value="private">Followers only</option>
            <option value="direct">Direct message</option>
          </select>
        </div>
        
        <div class="flex items-center justify-between">
          <span>Mark media as sensitive by default</span>
          <label class="relative inline-block">
            <input type="checkbox" bind:checked={composePrefs.defaultSensitive} class="toggle sr-only">
            <div class="toggle-bg"></div>
          </label>
        </div>
        
        <div class="flex items-center justify-between">
          <span>Save drafts automatically</span>
          <label class="relative inline-block">
            <input type="checkbox" bind:checked={composePrefs.saveDrafts} class="toggle sr-only">
            <div class="toggle-bg"></div>
          </label>
        </div>
        
        <div class="flex items-center justify-between">
          <span>Show post preview</span>
          <label class="relative inline-block">
            <input type="checkbox" bind:checked={composePrefs.showPreview} class="toggle sr-only">
            <div class="toggle-bg"></div>
          </label>
        </div>
      </div>
    </section>
    
    <!-- Notification Preferences -->
    <section>
      <h3 class="text-lg font-semibold mb-4">Notifications</h3>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <span>Desktop notifications</span>
          <div class="flex items-center gap-2">
            <label class="relative inline-block">
              <input type="checkbox" bind:checked={notificationPrefs.desktop} class="toggle sr-only">
              <div class="toggle-bg"></div>
            </label>
            {#if !notificationPrefs.desktop && 'Notification' in window && Notification.permission === 'default'}
              <button on:click={requestNotificationPermission} class="text-sm text-primary hover:underline">
                Enable
              </button>
            {/if}
          </div>
        </div>
        
        <div class="flex items-center justify-between">
          <span>Notification sounds</span>
          <label class="relative inline-block">
            <input type="checkbox" bind:checked={notificationPrefs.sounds} class="toggle sr-only">
            <div class="toggle-bg"></div>
          </label>
        </div>
        
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">Hide notifications for:</p>
          
          <div class="flex items-center justify-between mb-2">
            <span>New followers</span>
            <label class="relative inline-block">
              <input type="checkbox" bind:checked={notificationPrefs.filterFollows} class="toggle sr-only">
              <div class="toggle-bg"></div>
            </label>
          </div>
          
          <div class="flex items-center justify-between mb-2">
            <span>Boosts</span>
            <label class="relative inline-block">
              <input type="checkbox" bind:checked={notificationPrefs.filterBoosts} class="toggle sr-only">
              <div class="toggle-bg"></div>
            </label>
          </div>
          
          <div class="flex items-center justify-between mb-2">
            <span>Favorites</span>
            <label class="relative inline-block">
              <input type="checkbox" bind:checked={notificationPrefs.filterFavorites} class="toggle sr-only">
              <div class="toggle-bg"></div>
            </label>
          </div>
          
          <div class="flex items-center justify-between mb-2">
            <span>Mentions</span>
            <label class="relative inline-block">
              <input type="checkbox" bind:checked={notificationPrefs.filterMentions} class="toggle sr-only">
              <div class="toggle-bg"></div>
            </label>
          </div>
          
          <div class="flex items-center justify-between">
            <span>Poll results</span>
            <label class="relative inline-block">
              <input type="checkbox" bind:checked={notificationPrefs.filterPolls} class="toggle sr-only">
              <div class="toggle-bg"></div>
            </label>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Accessibility Preferences -->
    <section>
      <h3 class="text-lg font-semibold mb-4">Accessibility</h3>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <span>Reduce motion</span>
          <label class="relative inline-block">
            <input type="checkbox" bind:checked={a11yPrefs.reduceMotion} class="toggle sr-only">
            <div class="toggle-bg"></div>
          </label>
        </div>
        
        <div class="flex items-center justify-between">
          <span>High contrast mode</span>
          <label class="relative inline-block">
            <input type="checkbox" bind:checked={a11yPrefs.highContrast} class="toggle sr-only">
            <div class="toggle-bg"></div>
          </label>
        </div>
        
        <div class="flex items-center justify-between">
          <span>Large text</span>
          <label class="relative inline-block">
            <input type="checkbox" bind:checked={a11yPrefs.largeText} class="toggle sr-only">
            <div class="toggle-bg"></div>
          </label>
        </div>
        
        <div class="flex items-center justify-between">
          <span>Show video captions</span>
          <label class="relative inline-block">
            <input type="checkbox" bind:checked={a11yPrefs.showCaptions} class="toggle sr-only">
            <div class="toggle-bg"></div>
          </label>
        </div>
        
        <div class="flex items-center justify-between">
          <span>Enable keyboard shortcuts</span>
          <label class="relative inline-block">
            <input type="checkbox" bind:checked={a11yPrefs.keyboardShortcuts} class="toggle sr-only">
            <div class="toggle-bg"></div>
          </label>
        </div>
      </div>
    </section>
    
    <!-- Save Button -->
    <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
      <button 
        on:click={savePreferences}
        class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
      >
        Save preferences
      </button>
      
      {#if saveSuccess}
        <span class="text-green-600 dark:text-green-400">✓ Preferences saved</span>
      {/if}
    </div>
  {/if}
</div>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  
  .toggle-bg {
    display: block;
    width: 2.75rem;
    height: 1.5rem;
    background-color: rgb(209 213 219);
    border-radius: 9999px;
    position: relative;
    transition: background-color 200ms ease-in-out;
    cursor: pointer;
  }
  
  :global(.dark) .toggle-bg {
    background-color: rgb(75 85 99);
  }
  
  .toggle:checked + .toggle-bg {
    background-color: rgb(59 130 246);
  }
  
  .toggle-bg::after {
    content: '';
    position: absolute;
    top: 0.125rem;
    left: 0.125rem;
    width: 1.25rem;
    height: 1.25rem;
    background-color: white;
    border-radius: 9999px;
    transition: transform 200ms ease-in-out;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  }
  
  .toggle:checked + .toggle-bg::after {
    transform: translateX(1.25rem);
  }
</style>