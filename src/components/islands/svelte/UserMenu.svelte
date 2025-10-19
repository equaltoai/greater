<script lang="ts">
  import { GCAvatar, GCMenu } from '@/lib/components';
  import { authStore } from '@/lib/stores/auth.svelte';
  import { getClient } from '@/lib/api/client';
  import { onMount } from 'svelte';
  import type { Account } from '@/types/mastodon';
  
  let isOpen = $state(false);
  let currentUser = $state<Account | null>(null);
  
  onMount(async () => {
    try {
      const client = getClient();
      currentUser = await client.verifyCredentials();
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  });
  
  // Toggle menu
  function toggleMenu() {
    isOpen = !isOpen;
  }
  
  // Handle logout
  async function handleLogout() {
    isOpen = false;
    try {
      await authStore.logout();
      // Redirect to login page
      window.location.href = '/auth/login';
    } catch (error) {
      // Logout failed - redirect anyway to clear UI state
      // Error has already been handled in the auth store
      window.location.href = '/auth/login';
    }
  }
  
  const menuItems = $derived(() => [
    {
      label: 'View Profile',
      href: `/@${currentUser?.username || authStore.currentUser?.username}`,
    },
    {
      label: 'Settings',
      href: '/settings',
    },
    { divider: true },
    {
      label: 'Log out',
      onClick: handleLogout,
      variant: 'danger' as const,
    }
  ]);
</script>

{#if authStore.currentUser}
  <GCMenu bind:open={isOpen} items={menuItems} align="end">
    {#snippet trigger()}
      <button
        type="button"
        onclick={toggleMenu}
        class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <GCAvatar
          src={currentUser?.avatar}
          alt={currentUser?.display_name || currentUser?.username || authStore.currentUser.display_name || authStore.currentUser.username}
          size="sm"
          fallback={(currentUser?.display_name || currentUser?.username || authStore.currentUser.display_name || authStore.currentUser.username).charAt(0).toUpperCase()}
        />
        
        <!-- Username (hidden on mobile) -->
        <span class="hidden sm:block text-sm font-medium text-gray-900 dark:text-gray-100">
          {currentUser?.display_name || currentUser?.username || authStore.currentUser.display_name || authStore.currentUser.username}
        </span>
        
        <!-- Dropdown arrow -->
        <svg
          class="w-4 h-4 text-gray-500 transition-transform"
          class:rotate-180={isOpen}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    {/snippet}
    {#snippet header()}
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
          {currentUser?.display_name || currentUser?.username || authStore.currentUser.display_name || authStore.currentUser.username}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          @{currentUser?.username || authStore.currentUser.username}
        </p>
      </div>
    {/snippet}
  </GCMenu>
{:else}
  <!-- Show login button if not authenticated -->
  <a
    href="/auth/login"
    class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
  >
    Log in
  </a>
{/if}

