<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth.svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';

  let status = $state<'processing' | 'success' | 'error'>('processing');
  let message = $state('Completing sign in...');

  onMount(async () => {
    try {
      // Get code and state from URL params
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const state = params.get('state');

      if (!code || !state) {
        throw new Error('Missing authorization code or state');
      }

      // Complete the login process
      await authStore.completeLogin(code, state);

      status = 'success';
      message = 'Sign in successful! Redirecting...';

      // Redirect to home timeline after brief delay
      setTimeout(() => {
        goto(resolve('/'));
      }, 1500);
    } catch (error) {
      status = 'error';
      message = error instanceof Error ? error.message : 'Failed to complete sign in';
      console.error('[Auth Callback] Error:', error);
    }
  });
</script>

<svelte:head>
  <title>Completing Sign In - Greater</title>
</svelte:head>

<div class="callback-page">
  <div class="callback-container">
    {#if status === 'processing'}
      <div class="spinner"></div>
      <h1>Completing sign in...</h1>
      <p>Please wait while we finalize your authentication</p>
    {:else if status === 'success'}
      <div class="success-icon">✓</div>
      <h1>Success!</h1>
      <p>You're now signed in. Redirecting to your timeline...</p>
    {:else}
      <div class="error-icon">✕</div>
      <h1>Sign in failed</h1>
      <p>{message}</p>
      <a href={resolve('/auth/login')} class="retry-button"> Try again </a>
    {/if}
  </div>
</div>

<style>
  .callback-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--gr-semantic-background-primary);
    padding: var(--gr-spacing-scale-4);
  }

  .callback-container {
    text-align: center;
    max-width: 480px;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--gr-semantic-border-default);
    border-top-color: var(--gr-semantic-action-primary-default);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto var(--gr-spacing-scale-6);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .success-icon,
  .error-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    font-weight: bold;
    margin: 0 auto var(--gr-spacing-scale-6);
  }

  .success-icon {
    background: var(--gr-semantic-action-success-default);
    color: white;
  }

  .error-icon {
    background: var(--gr-semantic-action-error-default);
    color: white;
  }

  h1 {
    font-size: var(--gr-typography-fontSize-2xl);
    font-weight: var(--gr-typography-fontWeight-bold);
    color: var(--gr-semantic-foreground-primary);
    margin: 0 0 var(--gr-spacing-scale-3) 0;
  }

  p {
    font-size: var(--gr-typography-fontSize-base);
    color: var(--gr-semantic-foreground-secondary);
    margin: 0;
  }

  .retry-button {
    display: inline-block;
    margin-top: var(--gr-spacing-scale-6);
    padding: var(--gr-spacing-scale-3) var(--gr-spacing-scale-6);
    background: var(--gr-semantic-action-primary-default);
    color: white;
    text-decoration: none;
    border-radius: var(--gr-radii-lg);
    font-weight: var(--gr-typography-fontWeight-medium);
    transition: background-color 0.2s;
  }

  .retry-button:hover {
    background: var(--gr-semantic-action-primary-hover);
  }
</style>
