<script lang="ts">
  import { onMount } from 'svelte';
  
  let instance = $state('dev.lesser.host');
  let isValidating = $state(false);
  let isValid = $state(false);
  let error = $state('');
  let validationTimeout: number;
  let authStoreInstance: any = null;
  
  // Load auth store only on mount
  onMount(async () => {
    const { authStore } = await import('@/lib/stores/auth.svelte');
    authStoreInstance = authStore;
    
    // Initialize the store
    if (authStoreInstance.initialize) {
      authStoreInstance.initialize();
    }
    
    // Check if already authenticated and redirect
    console.log('[LoginForm] Auth state:', {
      isAuthenticated: authStoreInstance.isAuthenticated,
      currentUser: authStoreInstance.currentUser,
      currentInstance: authStoreInstance.currentInstance
    });
    
    if (authStoreInstance.isAuthenticated) {
      console.log('[LoginForm] Already authenticated, redirecting to home');
      window.location.href = '/';
    }
    
    // Validate the default instance
    validateInstanceDebounced();
  });
  
  // Validate instance URL as user types
  function validateInstanceDebounced() {
    clearTimeout(validationTimeout);
    error = '';
    isValid = false;
    
    if (!instance || !authStoreInstance) return;
    
    isValidating = true;
    validationTimeout = setTimeout(async () => {
      try {
        const normalized = instance.trim().toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/\/$/, '');
        
        if (!normalized || !normalized.includes('.')) {
          isValid = false;
          isValidating = false;
          return;
        }
        
        const valid = await authStoreInstance.validateInstanceUrl(normalized);
        isValid = valid;
        if (!valid) {
          error = 'Could not connect to this instance';
        }
      } catch (e) {
        isValid = false;
        error = 'Invalid instance URL';
      } finally {
        isValidating = false;
      }
    }, 500);
  }
  
  // Handle form submission
  async function handleSubmit(e: Event) {
    e.preventDefault();
    
    if (!isValid || isValidating || !authStoreInstance) return;
    
    try {
      error = '';
      const { url } = await authStoreInstance.startLogin(instance);
      
      // Redirect to Mastodon for authorization
      window.location.href = url;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to start login';
    }
  }
  
  // Popular instances for quick selection
  const popularInstances = [
    'dev.lesser.host',
    'mastodon.social',
    'mastodon.world',
    'fosstodon.org',
    'mstdn.social'
  ];
  
  function selectInstance(selected: string) {
    instance = selected;
    validateInstanceDebounced();
  }
</script>

<form onsubmit={handleSubmit} class="space-y-6">
  <div>
    <label for="instance" class="block text-sm font-medium text-text mb-2">
      Your Mastodon Instance
    </label>
    <div class="relative">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <span class="text-text-muted">https://</span>
      </div>
      <input
        id="instance"
        type="text"
        bind:value={instance}
        oninput={validateInstanceDebounced}
        placeholder="dev.lesser.host"
        class="block w-full pl-20 pr-10 py-3 border border-border rounded-md bg-background text-text placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
        autocomplete="off"
        autocapitalize="off"
        autocorrect="off"
        spellcheck="false"
      />
      {#if isValidating}
        <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
          <svg class="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      {:else if isValid}
        <div class="absolute inset-y-0 right-0 pr-3 flex items-center">
          <svg class="h-5 w-5 text-success" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
          </svg>
        </div>
      {/if}
    </div>
    {#if error}
      <p class="mt-2 text-sm text-error">{error}</p>
    {/if}
  </div>
  
  <div>
    <p class="text-sm text-text-muted mb-2">Popular instances:</p>
    <div class="flex flex-wrap gap-2">
      {#each popularInstances as inst}
        <button
          type="button"
          onclick={() => selectInstance(inst)}
          class="px-3 py-1 text-sm bg-surface hover:bg-surface-hover border border-border rounded-full transition-colors"
          class:ring-2={instance === inst}
          class:ring-primary={instance === inst}
        >
          {inst}
        </button>
      {/each}
    </div>
  </div>
  
  <button
    type="submit"
    disabled={!isValid || isValidating || !!error}
    class="w-full py-3 px-4 bg-primary text-white font-medium rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  >
    Continue with {instance || 'Mastodon'}
  </button>
  
  <div class="relative">
    <div class="absolute inset-0 flex items-center">
      <div class="w-full border-t border-border"></div>
    </div>
    <div class="relative flex justify-center text-sm">
      <span class="px-2 bg-surface text-text-muted">Need help?</span>
    </div>
  </div>
  
  <div class="text-sm text-text-muted space-y-2">
    <details class="cursor-pointer">
      <summary class="hover:text-text">What is an instance?</summary>
      <p class="mt-2 pl-4">
        Mastodon is decentralized, meaning there are many servers (instances) you can join. 
        Each instance is like a different email provider - you can communicate with users 
        on any instance, regardless of which one you join.
      </p>
    </details>
    
    <details class="cursor-pointer">
      <summary class="hover:text-text">Is Greater safe?</summary>
      <p class="mt-2 pl-4">
        Yes! Greater is open source and uses OAuth, meaning we never see your password. 
        Your login goes directly to your Mastodon instance. We only receive a token 
        to access your account on your behalf.
      </p>
    </details>
    
    <details class="cursor-pointer">
      <summary class="hover:text-text">Having trouble logging in?</summary>
      <div class="mt-2 pl-4 space-y-2">
        <p>If you're seeing "redirect uri not valid" errors, try clearing stored app data:</p>
        <button
          type="button"
          onclick={async () => {
            if (typeof window !== 'undefined') {
              const { clearAppRegistrations } = await import('@/lib/auth/oauth');
              clearAppRegistrations();
              error = '';
              alert('App registrations cleared. Please try logging in again.');
            }
          }}
          class="px-3 py-1 text-xs bg-surface hover:bg-surface-hover border border-border rounded transition-colors"
        >
          Clear stored app data
        </button>
      </div>
    </details>
  </div>
</form>
