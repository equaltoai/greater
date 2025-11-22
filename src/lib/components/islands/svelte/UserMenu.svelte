<script lang="ts">
  import { onMount } from 'svelte';
  import { GCAvatar } from '$lib/components';
  import { authStore } from '$lib/stores/auth.svelte';
  
  let isOpen = $state(false);
  let menuRef: HTMLDivElement;
  
  // Use currentUser from authStore directly (already loaded and managed there)
  const currentUser = $derived(authStore.currentUser);
  
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
  
  // Close menu when clicking outside
  onMount(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef && !menuRef.contains(event.target as Node) && isOpen) {
        isOpen = false;
      }
    }
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });
</script>

{#snippet fallbackAvatar()}
  <img src="/profile.png" alt="Default avatar" />
{/snippet}

{#if currentUser}
  <div class="relative" bind:this={menuRef}>
    <button
      type="button"
      onclick={toggleMenu}
      class="flex items-center space-x-2 p-2 rounded-lg hover:bg-surface-hover transition-colors"
      aria-label="User menu"
      aria-expanded={isOpen}
    >
      <GCAvatar
        src={currentUser.avatar}
        alt={currentUser.display_name || currentUser.username}
        size="sm"
        fallback={fallbackAvatar}
      />
      
      <!-- Username (hidden on mobile) -->
      <span class="hidden sm:block text-sm font-medium text-text">
        {currentUser.display_name || currentUser.acct || currentUser.username}
      </span>
      
      <!-- Dropdown arrow -->
      <svg
        class="w-4 h-4 text-text-muted transition-transform"
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
    
    {#if isOpen}
      <div class="absolute right-0 mt-2 w-56 bg-surface border border-border rounded-lg shadow-lg z-50">
        <div class="px-4 py-3 border-b border-border">
          <p class="text-sm font-medium text-text">
            {currentUser.display_name || currentUser.username}
          </p>
          <p class="text-sm text-text-muted">
            @{currentUser.acct || currentUser.username}
          </p>
        </div>
        
        <div class="py-1">
          <a
            href="/@{currentUser.acct || currentUser.username}"
            class="block px-4 py-2 text-sm text-text hover:bg-surface-hover"
          >
            View Profile
          </a>
          <a
            href="/settings"
            class="block px-4 py-2 text-sm text-text hover:bg-surface-hover"
          >
            Settings
          </a>
          <div class="border-t border-border my-1"></div>
          <button
            onclick={handleLogout}
            class="block w-full text-left px-4 py-2 text-sm text-error hover:bg-surface-hover"
          >
            Log out
          </button>
        </div>
      </div>
    {/if}
  </div>
{:else}
  <!-- Show login button if not authenticated -->
  <a
    href="/auth/login"
    class="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
  >
    Log in
  </a>
{/if}

