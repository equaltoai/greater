<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth.svelte';
  
  let error = $state('');
  let status = $state('Processing login...');
  
  onMount(async () => {
    try {
      console.log('[OAuthCallback] Starting OAuth callback processing');
      
      // Get URL parameters
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');
      const errorParam = params.get('error');
      const errorDescription = params.get('error_description');
      
      console.log('[OAuthCallback] Parameters:', { 
        hasCode: !!code, 
        hasState: !!state, 
        error: errorParam 
      });
      
      // Check for OAuth errors
      if (errorParam) {
        error = errorDescription || errorParam;
        status = 'Login failed';
        console.error('[OAuthCallback] OAuth error:', { errorParam, errorDescription });
        
        // Redirect back to login after delay
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 3000);
        return;
      }
      
      // Validate required parameters
      if (!code || !state) {
        error = 'Missing authorization code or state';
        status = 'Invalid request';
        console.error('[OAuthCallback] Missing parameters:', { code, state });
        
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 3000);
        return;
      }
      
      try {
        // Initialize auth store first
        console.log('[OAuthCallback] Initializing auth store');
        authStore.initialize();
        
        // Complete the login process
        status = 'Verifying credentials...';
        console.log('[OAuthCallback] Completing login with code and state');
        await authStore.completeLogin(code, state);
        
        status = 'Login successful!';
        console.log('[OAuthCallback] Login completed successfully');
        
        // Redirect to home page
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } catch (e) {
        console.error('[OAuthCallback] Login error:', e);
        error = e instanceof Error ? e.message : 'Failed to complete login';
        status = 'Login failed';
        
        // Log additional details for debugging
        if (e instanceof Error) {
          console.error('[OAuthCallback] Error details:', {
            message: e.message,
            stack: e.stack,
            name: e.name
          });
        }
        
        // Redirect back to login after delay
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 3000);
      }
    } catch (unexpectedError) {
      console.error('[OAuthCallback] Unexpected error in onMount:', unexpectedError);
      error = 'An unexpected error occurred';
      status = 'Error';
    }
  });
</script>

<div class="text-center">
  <div class="bg-surface rounded-lg shadow-lg p-8 max-w-md w-full">
    {#if error}
      <div class="mb-4">
        <svg class="mx-auto h-12 w-12 text-error" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-text mb-2">{status}</h2>
      <p class="text-text-muted mb-4">{error}</p>
      <p class="text-sm text-text-muted">Redirecting back to login...</p>
    {:else}
      <div class="mb-4">
        <svg class="animate-spin mx-auto h-12 w-12 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-text mb-2">{status}</h2>
      <p class="text-text-muted">Please wait while we complete your login.</p>
    {/if}
  </div>
</div>
