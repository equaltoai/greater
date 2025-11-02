<script lang="ts">
  import { onMount } from 'svelte';
  import { getGraphQLAdapter } from '@/lib/api/graphql-client';
  import { GCCheckbox, GCSwitch, GCButton } from '@/lib/components';
  import { notificationPrefs$, type NotificationPreferences } from '@/lib/stores/preferences';
  import type { PushSubscription as GraphQLPushSubscription } from '@equaltoai/greater-components/adapters/graphql/generated/types.js';

  let prefs: NotificationPreferences = $notificationPrefs$;

  let pushSupported = false;
  let pushSubscription: GraphQLPushSubscription | null = null;
  let pushPermission: NotificationPermission = 'default';
  let loadingPush = false;

  let saveSuccess = false;
  let saveError = '';

  onMount(async () => {
    pushSupported = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

    if (pushSupported) {
      pushPermission = Notification.permission;

      try {
        const adapter = await getGraphQLAdapter();
        pushSubscription = (await adapter.getPushSubscription()) ?? null;
        prefs.desktop = pushSubscription !== null && pushPermission === 'granted';
      } catch (error) {
        console.error('Failed to check push subscription:', error);
      }
    }
  });

  async function requestNotificationPermission() {
    if (!pushSupported) return;

    const permission = await Notification.requestPermission();
    pushPermission = permission;
    prefs.desktop = permission === 'granted';

    if (permission === 'granted') {
      await enablePushNotifications();
    }
  }

  async function enablePushNotifications() {
    if (!pushSupported || pushPermission !== 'granted') return;

    loadingPush = true;
    saveError = '';

    try {
      const adapter = await getGraphQLAdapter();
      const registration = await navigator.serviceWorker.ready;

      const browserSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          'BKd0F0Y0B_VnfPt4cP7BLlZZwM1DGk5LwI5fEDx6uB2A0PMqVFmUwi9dBNVq4K5WZLCddL7TqxqZ9niPRmZyD6A'
        ),
      });

      const keys = extractSubscriptionKeys(browserSubscription);
      const alerts = buildAlertPreferences();

      const registered = await adapter.registerPushSubscription({
        endpoint: browserSubscription.endpoint,
        keys,
        alerts,
      });

      pushSubscription = registered ?? null;
      prefs.desktop = pushSubscription !== null;
    } catch (error) {
      console.error('Failed to enable push notifications:', error);
      saveError = 'Failed to enable push notifications';
    } finally {
      loadingPush = false;
    }
  }

  async function disablePushNotifications() {
    if (!pushSupported || !pushSubscription) return;

    loadingPush = true;
    saveError = '';

    try {
      const adapter = await getGraphQLAdapter();

      const registration = await navigator.serviceWorker.ready;
      const browserSubscription = await registration.pushManager.getSubscription();
      if (browserSubscription) {
        await browserSubscription.unsubscribe();
      }

      await adapter.deletePushSubscription();

      pushSubscription = null;
      prefs.desktop = false;
    } catch (error) {
      console.error('Failed to disable push notifications:', error);
      saveError = 'Failed to disable push notifications';
    } finally {
      loadingPush = false;
    }
  }

  async function savePreferences() {
    notificationPrefs$.set(prefs);

    if (pushSubscription) {
      await updatePushAlerts();
    }

    saveSuccess = true;
    setTimeout(() => {
      saveSuccess = false;
    }, 3000);
  }

  async function updatePushAlerts() {
    try {
      const adapter = await getGraphQLAdapter();
      const updated = await adapter.updatePushSubscription({
        alerts: buildAlertPreferences(),
      });

      pushSubscription = updated ?? pushSubscription;
    } catch (error) {
      console.error('Failed to update push alerts:', error);
      saveError = 'Failed to update push notifications';
    }
  }

  function buildAlertPreferences() {
    return {
      follow: !prefs.filterFollows,
      reblog: !prefs.filterBoosts,
      favourite: !prefs.filterFavorites,
      mention: !prefs.filterMentions,
      poll: !prefs.filterPolls,
    };
  }

  function extractSubscriptionKeys(subscription: PushSubscription) {
    const p256dh = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');

    if (!p256dh || !auth) {
      throw new Error('Incomplete push subscription keys');
    }

    return {
      p256dh: arrayBufferToBase64(p256dh),
      auth: arrayBufferToBase64(auth),
    };
  }

  function arrayBufferToBase64(buffer: ArrayBuffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  }

  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  function testNotification() {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Test Notification', {
        body: 'This is a test notification from Greater',
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        tag: 'test',
      });
    }
  }
</script>

<div class="space-y-8 max-w-2xl">
  <!-- Browser Notifications -->
  <section class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
    <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
      🔔 Browser Notifications
    </h2>
    
    <div class="space-y-4">
      {#if pushSupported}
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium">Push Notifications</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Receive notifications even when Greater is not open
            </p>
          </div>
          <div class="flex items-center gap-2">
            {#if pushPermission === 'default'}
              <button 
                on:click={requestNotificationPermission}
                class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm"
                disabled={loadingPush}
              >
                {loadingPush ? 'Loading...' : 'Enable'}
              </button>
            {:else if pushPermission === 'granted'}
              <label class="relative inline-block">
                <input 
                  type="checkbox" 
                  checked={!!pushSubscription}
                  on:change={(e) => e.currentTarget.checked ? enablePushNotifications() : disablePushNotifications()}
                  class="toggle sr-only"
                  disabled={loadingPush}
                >
                <div class="toggle-bg"></div>
              </label>
            {:else}
              <span class="text-sm text-red-600 dark:text-red-400">Blocked</span>
            {/if}
          </div>
        </div>
      {/if}
      
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium">Desktop Notifications</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Show notifications while Greater is open
          </p>
        </div>
        <label class="relative inline-block">
          <input type="checkbox" bind:checked={prefs.desktop} class="toggle sr-only">
          <div class="toggle-bg"></div>
        </label>
      </div>
      
      <div class="flex items-center justify-between">
        <div>
          <p class="font-medium">Notification Sounds</p>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Play a sound when new notifications arrive
          </p>
        </div>
        <label class="relative inline-block">
          <input type="checkbox" bind:checked={prefs.sounds} class="toggle sr-only">
          <div class="toggle-bg"></div>
        </label>
      </div>
      
      {#if prefs.desktop && pushPermission === 'granted'}
        <div class="pt-2">
          <button 
            on:click={testNotification}
            class="text-sm text-primary hover:underline"
          >
            Send test notification
          </button>
        </div>
      {/if}
    </div>
  </section>
  
  <!-- Notification Types -->
  <section class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
    <h2 class="text-xl font-semibold mb-4 flex items-center gap-2">
      🎯 Notification Types
    </h2>
    
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
      Choose which types of notifications you want to receive
    </p>
    
    <div class="space-y-3">
      <div class="flex items-center justify-between py-2">
        <div class="flex items-center gap-3">
          <span class="text-xl">👤</span>
          <div>
            <p class="font-medium">New Followers</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Someone followed you</p>
          </div>
        </div>
        <label class="relative inline-block">
          <input 
            type="checkbox" 
            checked={!prefs.filterFollows}
            on:change={(e) => prefs.filterFollows = !e.currentTarget.checked}
            class="toggle sr-only"
          >
          <div class="toggle-bg"></div>
        </label>
      </div>
      
      <div class="flex items-center justify-between py-2">
        <div class="flex items-center gap-3">
          <span class="text-xl">🔁</span>
          <div>
            <p class="font-medium">Boosts</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Someone boosted your post</p>
          </div>
        </div>
        <label class="relative inline-block">
          <input 
            type="checkbox" 
            checked={!prefs.filterBoosts}
            on:change={(e) => prefs.filterBoosts = !e.currentTarget.checked}
            class="toggle sr-only"
          >
          <div class="toggle-bg"></div>
        </label>
      </div>
      
      <div class="flex items-center justify-between py-2">
        <div class="flex items-center gap-3">
          <span class="text-xl">❤️</span>
          <div>
            <p class="font-medium">Favorites</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Someone favorited your post</p>
          </div>
        </div>
        <label class="relative inline-block">
          <input 
            type="checkbox" 
            checked={!prefs.filterFavorites}
            on:change={(e) => prefs.filterFavorites = !e.currentTarget.checked}
            class="toggle sr-only"
          >
          <div class="toggle-bg"></div>
        </label>
      </div>
      
      <div class="flex items-center justify-between py-2">
        <div class="flex items-center gap-3">
          <span class="text-xl">@</span>
          <div>
            <p class="font-medium">Mentions</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Someone mentioned you in their post</p>
          </div>
        </div>
        <label class="relative inline-block">
          <input 
            type="checkbox" 
            checked={!prefs.filterMentions}
            on:change={(e) => prefs.filterMentions = !e.currentTarget.checked}
            class="toggle sr-only"
          >
          <div class="toggle-bg"></div>
        </label>
      </div>
      
      <div class="flex items-center justify-between py-2">
        <div class="flex items-center gap-3">
          <span class="text-xl">📊</span>
          <div>
            <p class="font-medium">Poll Results</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">A poll you voted in has ended</p>
          </div>
        </div>
        <label class="relative inline-block">
          <input 
            type="checkbox" 
            checked={!prefs.filterPolls}
            on:change={(e) => prefs.filterPolls = !e.currentTarget.checked}
            class="toggle sr-only"
          >
          <div class="toggle-bg"></div>
        </label>
      </div>
    </div>
  </section>
  
  <!-- Save Button -->
  <div class="flex items-center justify-between pt-4">
    <button 
      on:click={savePreferences}
      class="px-6 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90 transition-colors"
    >
      Save preferences
    </button>
    
    {#if saveSuccess}
      <span class="text-green-600 dark:text-green-400 flex items-center gap-1">
        ✓ Preferences saved
      </span>
    {/if}
    
    {#if saveError}
      <span class="text-red-600 dark:text-red-400">{saveError}</span>
    {/if}
  </div>
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
  
  .toggle:disabled + .toggle-bg {
    opacity: 0.5;
    cursor: not-allowed;
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
