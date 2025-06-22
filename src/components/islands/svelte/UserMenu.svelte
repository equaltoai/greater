<script lang="ts">
  import { authStore } from '@/lib/stores/auth.svelte';
  import { getClient } from '@/lib/api/client';
  import { onMount } from 'svelte';
  import type { Account } from '@/types/mastodon';
  
  let isOpen = $state(false);
  let menuButton: HTMLButtonElement;
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
  
  // Close menu when clicking outside
  function handleClickOutside(event: MouseEvent) {
    if (menuButton && !menuButton.contains(event.target as Node)) {
      isOpen = false;
    }
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
  
  // Add/remove click listener
  $effect(() => {
    if (typeof window !== 'undefined') {
      if (isOpen) {
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
      }
    }
  });
</script>

{#if authStore.currentUser}
  <div class="relative">
    <button
      bind:this={menuButton}
      type="button"
      onclick={toggleMenu}
      class="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="User menu"
      aria-expanded={isOpen}
    >
      <!-- User avatar -->
      {#if currentUser?.avatar}
        <img 
          src={currentUser.avatar} 
          alt={currentUser.display_name || currentUser.username}
          class="w-8 h-8 rounded-full object-cover"
        />
      {:else}
        <div class="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
          <span class="text-sm font-medium text-gray-600 dark:text-gray-300">
            {(authStore.currentUser.display_name || authStore.currentUser.username).charAt(0).toUpperCase()}
          </span>
        </div>
      {/if}
      
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
    
    <!-- Dropdown menu -->
    {#if isOpen}
      <div class="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
        <!-- User info -->
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
            {currentUser?.display_name || currentUser?.username || authStore.currentUser.display_name || authStore.currentUser.username}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            @{currentUser?.username || authStore.currentUser.username}
          </p>
        </div>
        
        <!-- Menu items -->
        <a
          href={`/@${currentUser?.username || authStore.currentUser.username}`}
          class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          View Profile
        </a>
        
        <a
          href="/settings"
          class="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Settings
        </a>
        
        <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
        
        <button
          type="button"
          onclick={handleLogout}
          class="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Log out
        </button>
      </div>
    {/if}
  </div>
{:else}
  <!-- Show login button if not authenticated -->
  <a
    href="/auth/login"
    class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
  >
    Log in
  </a>
{/if}

