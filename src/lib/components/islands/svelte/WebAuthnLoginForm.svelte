<script lang="ts">
  import { onMount } from 'svelte';
  
  let username = $state('');
  let isLoading = $state(false);
  let error = $state('');
  let webAuthnSupported = $state(false);
  
  // Check WebAuthn support on mount
  onMount(() => {
    webAuthnSupported = !!window.PublicKeyCredential;
    if (!webAuthnSupported) {
      error = 'WebAuthn is not supported in this browser. Please use a modern browser.';
    }
  });
  
  // Handle WebAuthn login
  async function handleLogin(e: Event) {
    e.preventDefault();
    
    if (!username || !webAuthnSupported) {
      error = 'Please enter your username';
      return;
    }
    
    isLoading = true;
    error = '';
    
    try {
      // Step 1: Begin WebAuthn login
      const beginResponse = await fetch('/api/v1/auth/webauthn/login/begin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username })
      });
      
      const beginData = await beginResponse.json();
      
      if (!beginResponse.ok) {
        throw new Error(beginData.error || 'Failed to start login');
      }
      
      // Convert base64 to ArrayBuffer
      const publicKeyOptions = beginData.publicKey;
      publicKeyOptions.challenge = base64ToArrayBuffer(publicKeyOptions.challenge);
      
      if (publicKeyOptions.allowCredentials) {
        publicKeyOptions.allowCredentials = publicKeyOptions.allowCredentials.map((cred: any) => ({
          ...cred,
          id: base64ToArrayBuffer(cred.id)
        }));
      }
      
      // Get credential
      const credential = await navigator.credentials.get({
        publicKey: publicKeyOptions
      }) as PublicKeyCredential;
      
      if (!credential) {
        throw new Error('Authentication cancelled');
      }
      
      // Prepare response
      const credentialResponse = {
        id: credential.id,
        rawId: arrayBufferToBase64(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: arrayBufferToBase64((credential.response as AuthenticatorAssertionResponse).clientDataJSON),
          authenticatorData: arrayBufferToBase64((credential.response as AuthenticatorAssertionResponse).authenticatorData),
          signature: arrayBufferToBase64((credential.response as AuthenticatorAssertionResponse).signature),
          userHandle: (credential.response as AuthenticatorAssertionResponse).userHandle ? 
            arrayBufferToBase64((credential.response as AuthenticatorAssertionResponse).userHandle!) : null
        }
      };
      
      // Complete login
      const finishResponse = await fetch('/api/v1/auth/webauthn/login/finish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          challenge: beginData.challenge,
          response: credentialResponse,
          device_name: 'Web Browser'
        })
      });
      
      const finishData = await finishResponse.json();
      
      if (!finishResponse.ok) {
        throw new Error(finishData.error || 'Login failed');
      }
      
      // Store auth token and redirect
      if (finishData.access_token) {
        localStorage.setItem('lesser_token', finishData.access_token);
        localStorage.setItem('lesser_username', username);
        
        // Redirect to home
        window.location.href = '/';
      }
      
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          error = 'Authentication was cancelled or timed out';
        } else {
          error = err.message;
        }
      } else {
        error = 'Login failed';
      }
    } finally {
      isLoading = false;
    }
  }
  
  // Utility functions
  function base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
</script>

<form onsubmit={handleLogin} class="space-y-6">
  <div>
    <h2 class="text-2xl font-bold text-text mb-2">Sign in to Lesser</h2>
    <p class="text-sm text-text-muted">Use your passkey to sign in securely</p>
  </div>
  
  {#if error}
    <div class="p-3 bg-error/10 border border-error/20 rounded-md text-error text-sm">
      {error}
    </div>
  {/if}
  
  <div>
    <label for="username" class="block text-sm font-medium text-text mb-2">
      Username
    </label>
    <input
      id="username"
      type="text"
      bind:value={username}
      placeholder="johndoe"
      required
      disabled={isLoading || !webAuthnSupported}
      class="block w-full px-3 py-2 border border-border rounded-md bg-background text-text placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50"
      autocomplete="username webauthn"
      autocapitalize="off"
      autocorrect="off"
    />
  </div>
  
  <button
    type="submit"
    disabled={isLoading || !webAuthnSupported}
    class="w-full py-3 px-4 bg-primary text-white font-medium rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  >
    {#if isLoading}
      <span class="inline-flex items-center">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Authenticating...
      </span>
    {:else}
      Sign in with passkey
    {/if}
  </button>
  
  <div class="text-center text-sm text-text-muted">
    Don't have an account?
    <a href="/register" class="text-primary hover:text-primary-hover">
      Create one
    </a>
  </div>
  
  {#if !webAuthnSupported}
    <div class="p-3 bg-warning/10 border border-warning/20 rounded-md">
      <p class="text-sm text-warning">
        <strong>Browser not supported:</strong> Please use a modern browser that supports WebAuthn 
        (Chrome, Firefox, Safari, or Edge).
      </p>
    </div>
  {/if}
  
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
      <summary class="hover:text-text">What are passkeys?</summary>
      <p class="mt-2 pl-4">
        Passkeys are a secure replacement for passwords. They use your device's 
        built-in security (like Touch ID or Face ID) to verify your identity. 
        No passwords to remember or type!
      </p>
    </details>
    
    <details class="cursor-pointer">
      <summary class="hover:text-text">Having trouble signing in?</summary>
      <p class="mt-2 pl-4">
        Make sure you're using the same device and browser where you created your passkey. 
        If you've switched devices, you may need to set up a new passkey.
      </p>
    </details>
  </div>
</form>
