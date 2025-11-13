<script lang="ts">
  import SettingsLayout from '../../layouts/SettingsLayout.svelte';
  import { location } from 'svelte-spa-router';
  
  // Import settings components
  import PreferencesSettings from '../../components/islands/svelte/PreferencesSettings.svelte';
  import ProfileSettings from '../../components/islands/svelte/ProfileSettings.svelte';
  import ThemeSettings from '../../components/islands/svelte/ThemeSettings.svelte';
  import NotificationSettings from '../../components/islands/svelte/NotificationSettings.svelte';

  // Determine which settings page to show based on route
  let currentPath = $derived($location.split('/').pop() || 'preferences');
</script>

<SettingsLayout title="Settings - Greater">
  <div class="settings-page">
    {#if currentPath === 'preferences' || currentPath === 'settings'}
      <h2 class="settings-title">Preferences</h2>
      <PreferencesSettings />
    {:else if currentPath === 'profile'}
      <h2 class="settings-title">Profile</h2>
      <ProfileSettings />
    {:else if currentPath === 'theme' || currentPath === 'appearance'}
      <h2 class="settings-title">Appearance</h2>
      <ThemeSettings />
    {:else if currentPath === 'notifications'}
      <h2 class="settings-title">Notifications</h2>
      <NotificationSettings />
    {:else}
      <h2 class="settings-title">Preferences</h2>
      <PreferencesSettings />
    {/if}
  </div>
</SettingsLayout>

<style>
  .settings-page {
    width: 100%;
  }

  .settings-title {
    font-size: var(--font-size-2xl, 1.5rem);
    font-weight: var(--font-weight-bold, 700);
    color: var(--color-text);
    margin-bottom: var(--spacing-6, 1.5rem);
    padding-bottom: var(--spacing-4, 1rem);
    border-bottom: 1px solid var(--color-border);
  }
</style>
