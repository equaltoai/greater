<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '@/lib/stores/auth.svelte';
  
  interface Props {
    redirectTo?: string;
  }
  
  let { redirectTo = '/auth/login' }: Props = $props();
  
  let isChecking = $state(true);
  let isAuthenticated = $state(false);
  
  onMount(async () => {
    // Initialize auth store
    authStore.initialize();
    
    // Wait a bit for auth store to load from localStorage
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check authentication status
    isAuthenticated = authStore.isAuthenticated;
    isChecking = false;
    
    // Redirect if not authenticated
    if (!isAuthenticated) {
      console.log('[AuthGuard] Not authenticated, redirecting to:', redirectTo);
      window.location.href = redirectTo;
    }
  });
</script>

{#if isChecking}
  <div class="min-h-screen flex items-center justify-center">
    <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
  </div>
{:else if isAuthenticated}
  <slot />
{:else}
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-text-muted">Redirecting to login...</p>
  </div>
{/if}