<script lang="ts">
  import { onMount } from 'svelte';
  
  let username = $state('');
  let isLoading = $state(false);
  let error = $state('');
  let success = $state('');
  let webAuthnSupported = $state(false);
  let step = $state<'username' | 'webauthn'>('username');
  
  // Check WebAuthn support on mount
  onMount(() => {
    webAuthnSupported = !!window.PublicKeyCredential;
    if (!webAuthnSupported) {
      error = 'WebAuthn is not supported in this browser. Please use a modern browser.';
    }
  });
  
  // Validate username
  function validateUsername() {
    if (!username || username.length < 3) {
      error = 'Username must be at least 3 characters long';
      return false;
    }
    
    if (username.match(/[^a-zA-Z0-9_-]/)) {
      error = 'Username can only contain letters, numbers, underscore and hyphen';
      return false;
    }
    
    error = '';
    return true;
  }
  
  // Handle registration with WebAuthn
  async function handleRegistration(e: Event) {
    e.preventDefault();
    
    if (!validateUsername() || !webAuthnSupported) return;
    
    isLoading = true;
    error = '';
    success = '';
    
    try {
      // Step 1: Create account
      const accountResponse = await fetch('/api/v1/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          locale: 'en',
          agreement: true,
          reason: 'WebAuthn registration'
        })
      });
      
      const accountData = await accountResponse.json();
      
      if (!accountResponse.ok) {
        throw new Error(accountData.error || 'Account creation failed');
      }
      
      // Step 2: Begin WebAuthn registration
      step = 'webauthn';
      
      // Get registration options from server
      const beginResponse = await fetch('/api/v1/auth/webauthn/register/begin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accountData.access_token}`
        },
        body: JSON.stringify({
          username
        })
      });
      
      const beginData = await beginResponse.json();
      
      if (!beginResponse.ok) {
        throw new Error(beginData.error || 'Failed to start WebAuthn registration');
      }
      
      // Convert base64 to ArrayBuffer
      const publicKeyOptions = beginData.publicKey;
      publicKeyOptions.challenge = base64ToArrayBuffer(publicKeyOptions.challenge);
      publicKeyOptions.user.id = new TextEncoder().encode(publicKeyOptions.user.id);
      
      if (publicKeyOptions.excludeCredentials) {
        publicKeyOptions.excludeCredentials = publicKeyOptions.excludeCredentials.map((cred: any) => ({
          ...cred,
          id: base64ToArrayBuffer(cred.id)
        }));
      }
      
      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: publicKeyOptions
      }) as PublicKeyCredential;
      
      if (!credential) {
        throw new Error('Failed to create credential');
      }
      
      // Prepare response
      // Note: credential.id is base64url encoded, but we need to keep it as-is for the id field
      // For rawId, we convert from ArrayBuffer to standard base64 (with +/= padding)
      const rawIdBase64 = arrayBufferToBase64(credential.rawId);
      
      // Debug logging
      console.log('WebAuthn Registration Debug:');
      console.log('credential.id (base64url):', credential.id);
      console.log('rawId (converted to base64):', rawIdBase64);
      console.log('Are they the same?', credential.id === rawIdBase64);
      
      const credentialResponse = {
        id: credential.id,
        rawId: rawIdBase64,
        type: credential.type,
        response: {
          clientDataJSON: arrayBufferToBase64((credential.response as AuthenticatorAttestationResponse).clientDataJSON),
          attestationObject: arrayBufferToBase64((credential.response as AuthenticatorAttestationResponse).attestationObject)
        }
      };
      
      // Complete registration
      const finishResponse = await fetch('/api/v1/auth/webauthn/register/finish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accountData.access_token}`
        },
        body: JSON.stringify({
          username,
          challenge: beginData.challenge,
          response: credentialResponse,
          credential_name: 'Primary Passkey'
        })
      });
      
      const finishData = await finishResponse.json();
      
      if (!finishResponse.ok) {
        throw new Error(finishData.error || 'Failed to complete registration');
      }
      
      success = 'Account created successfully! Redirecting to login...';
      
      // Redirect to login
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Registration failed';
      step = 'username';
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

<form onsubmit={handleRegistration} class="space-y-6">
  <div>
    <h2 class="text-2xl font-bold text-text mb-2">Create your Lesser account</h2>
    <p class="text-sm text-text-muted">Join with just a username and passkey</p>
  </div>
  
  {#if error}
    <div class="p-3 bg-error/10 border border-error/20 rounded-md text-error text-sm">
      {error}
    </div>
  {/if}
  
  {#if success}
    <div class="p-3 bg-success/10 border border-success/20 rounded-md text-success text-sm">
      {success}
    </div>
  {/if}
  
  {#if step === 'username'}
    <div>
      <label for="username" class="block text-sm font-medium text-text mb-2">
        Choose your username
      </label>
      <input
        id="username"
        type="text"
        bind:value={username}
        placeholder="johndoe"
        required
        disabled={isLoading || !webAuthnSupported}
        class="block w-full px-3 py-2 border border-border rounded-md bg-background text-text placeholder-text-muted focus:ring-2 focus:ring-primary focus:border-primary transition-colors disabled:opacity-50"
        autocomplete="username"
        autocapitalize="off"
        autocorrect="off"
      />
      <p class="mt-1 text-xs text-text-muted">
        Your handle will be @{username || 'username'}@lesser.host
      </p>
    </div>
    
    <div class="p-4 bg-surface rounded-lg border border-border">
      <h3 class="text-sm font-medium text-text mb-2">What's a passkey?</h3>
      <p class="text-xs text-text-muted">
        Passkeys are a secure, passwordless way to sign in. They use your device's 
        built-in authentication (like Touch ID, Face ID, or Windows Hello) to keep 
        your account safe.
      </p>
    </div>
  {/if}
  
  {#if step === 'webauthn'}
    <div class="text-center py-8">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
        <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"></path>
        </svg>
      </div>
      <h3 class="text-lg font-medium text-text mb-2">Create your passkey</h3>
      <p class="text-sm text-text-muted">
        Follow your browser's prompts to create a passkey for @{username}
      </p>
    </div>
  {/if}
  
  <button
    type="submit"
    disabled={isLoading || !webAuthnSupported}
    class="w-full py-3 px-4 bg-primary text-white font-medium rounded-md hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
  >
    {#if isLoading}
      {#if step === 'username'}
        Creating account...
      {:else}
        Setting up passkey...
      {/if}
    {:else}
      Create account with passkey
    {/if}
  </button>
  
  <div class="text-center text-sm text-text-muted">
    Already have an account?
    <a href="/login" class="text-primary hover:text-primary-hover">
      Sign in
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
</form>