<script lang="ts">
  import { TextField, Button } from '$lib/gc';
  import { authStore } from '$lib/stores/auth.svelte';
  import { Globe, ArrowRight } from '$lib/gc';

  let instance = $state('dev.lesser.host');
  let isValidating = $state(false);
  let error = $state<string | null>(null);

  const defaultServers = [
    {
      name: 'Lesser (Development)',
      domain: 'dev.lesser.host',
      description: 'Default development server',
    },
    {
      name: 'Mastodon Social',
      domain: 'mastodon.social',
      description: 'Official Mastodon instance',
    },
    { name: 'Fosstodon', domain: 'fosstodon.org', description: 'Open source focused' },
  ];

  async function handleConnect() {
    if (!instance.trim()) {
      error = 'Please enter a server address';
      return;
    }

    isValidating = true;
    error = null;

    try {
      // Start OAuth flow
      const { url } = await authStore.startLogin(instance.trim());

      // Redirect to OAuth authorization
      window.location.href = url;
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to connect to server';
      isValidating = false;
    }
  }

  function selectServer(domain: string) {
    instance = domain;
    error = null;
  }
</script>

<svelte:head>
  <title>Sign In - Greater</title>
</svelte:head>

<div class="login-page">
  <div class="login-container">
    <div class="header">
      <h1>Welcome to Greater</h1>
      <p>A modern client for the fediverse</p>
    </div>

    <div class="server-selection">
      <h2>Select your server</h2>
      <p class="subtitle">Choose a Mastodon or ActivityPub compatible server to connect</p>

      <!-- Default servers -->
      <div class="default-servers">
        {#each defaultServers as server (server.domain)}
          <button
            class="server-card {instance === server.domain ? 'selected' : ''}"
            onclick={() => selectServer(server.domain)}
            type="button"
          >
            <div class="server-icon">
              <Globe size={24} />
            </div>
            <div class="server-info">
              <div class="server-name">{server.name}</div>
              <div class="server-domain">{server.domain}</div>
              <div class="server-description">{server.description}</div>
            </div>
          </button>
        {/each}
      </div>

      <div class="divider">
        <span>or enter a custom server</span>
      </div>

      <!-- Custom server input -->
      <div class="custom-server">
        <TextField
          value={instance}
          label="Server address"
          placeholder="mastodon.example.com"
          helperText="Enter the domain of your Mastodon instance"
          error={error || undefined}
          oninput={(e) => {
            instance = e.currentTarget.value;
            error = null;
          }}
        />
      </div>

      <!-- Connect button -->
      <Button
        onclick={handleConnect}
        disabled={!instance.trim() || isValidating}
        loading={isValidating}
        variant="solid"
        size="lg"
        class="connect-button"
      >
        <span>Continue to {instance || 'server'}</span>
        <ArrowRight size={20} />
      </Button>
    </div>

    <div class="footer">
      <p>
        Don't have an account?
        <a href="https://joinmastodon.org/servers" target="_blank" rel="noopener noreferrer">
          Find a server to join
        </a>
      </p>
      <p class="about">
        Greater is an open-source Mastodon client.
        <a href="https://github.com/aron23/greater" target="_blank" rel="noopener noreferrer">
          Learn more
        </a>
      </p>
    </div>
  </div>
</div>

<style>
  .login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(
      135deg,
      var(--gr-semantic-background-primary) 0%,
      var(--gr-semantic-background-secondary) 100%
    );
    padding: var(--gr-spacing-scale-4);
  }

  .login-container {
    width: 100%;
    max-width: 560px;
    background: var(--gr-semantic-background-primary);
    border: 1px solid var(--gr-semantic-border-default);
    border-radius: var(--gr-radii-2xl);
    padding: var(--gr-spacing-scale-8);
    box-shadow: var(--gr-shadows-lg);
  }

  .header {
    text-align: center;
    margin-bottom: var(--gr-spacing-scale-8);
  }

  .header h1 {
    font-size: var(--gr-typography-fontSize-3xl);
    font-weight: var(--gr-typography-fontWeight-bold);
    color: var(--gr-semantic-foreground-primary);
    margin: 0 0 var(--gr-spacing-scale-2) 0;
  }

  .header p {
    font-size: var(--gr-typography-fontSize-lg);
    color: var(--gr-semantic-foreground-secondary);
    margin: 0;
  }

  .server-selection h2 {
    font-size: var(--gr-typography-fontSize-xl);
    font-weight: var(--gr-typography-fontWeight-semibold);
    color: var(--gr-semantic-foreground-primary);
    margin: 0 0 var(--gr-spacing-scale-2) 0;
  }

  .subtitle {
    font-size: var(--gr-typography-fontSize-sm);
    color: var(--gr-semantic-foreground-secondary);
    margin: 0 0 var(--gr-spacing-scale-6) 0;
  }

  .default-servers {
    display: flex;
    flex-direction: column;
    gap: var(--gr-spacing-scale-3);
    margin-bottom: var(--gr-spacing-scale-6);
  }

  .server-card {
    display: flex;
    align-items: center;
    gap: var(--gr-spacing-scale-4);
    padding: var(--gr-spacing-scale-4);
    border: 2px solid var(--gr-semantic-border-default);
    border-radius: var(--gr-radii-lg);
    background: transparent;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
  }

  .server-card:hover {
    border-color: var(--gr-semantic-action-primary-default);
    background: var(--gr-semantic-background-secondary);
  }

  .server-card.selected {
    border-color: var(--gr-semantic-action-primary-default);
    background: var(--gr-semantic-background-secondary);
    box-shadow: 0 0 0 1px var(--gr-semantic-action-primary-default);
  }

  .server-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: var(--gr-radii-md);
    background: var(--gr-semantic-background-tertiary);
    color: var(--gr-semantic-action-primary-default);
    flex-shrink: 0;
  }

  .server-info {
    flex: 1;
    min-width: 0;
  }

  .server-name {
    font-weight: var(--gr-typography-fontWeight-semibold);
    font-size: var(--gr-typography-fontSize-base);
    color: var(--gr-semantic-foreground-primary);
    margin-bottom: 2px;
  }

  .server-domain {
    font-size: var(--gr-typography-fontSize-sm);
    color: var(--gr-semantic-action-primary-default);
    margin-bottom: 2px;
  }

  .server-description {
    font-size: var(--gr-typography-fontSize-sm);
    color: var(--gr-semantic-foreground-tertiary);
  }

  .divider {
    display: flex;
    align-items: center;
    gap: var(--gr-spacing-scale-3);
    margin: var(--gr-spacing-scale-6) 0;
    color: var(--gr-semantic-foreground-tertiary);
    font-size: var(--gr-typography-fontSize-sm);
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--gr-semantic-border-default);
  }

  .custom-server {
    margin-bottom: var(--gr-spacing-scale-6);
  }

  .connect-button {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--gr-spacing-scale-2);
  }

  .footer {
    margin-top: var(--gr-spacing-scale-8);
    padding-top: var(--gr-spacing-scale-6);
    border-top: 1px solid var(--gr-semantic-border-default);
    text-align: center;
  }

  .footer p {
    font-size: var(--gr-typography-fontSize-sm);
    color: var(--gr-semantic-foreground-secondary);
    margin: var(--gr-spacing-scale-2) 0;
  }

  .footer a {
    color: var(--gr-semantic-action-primary-default);
    text-decoration: none;
  }

  .footer a:hover {
    text-decoration: underline;
  }

  .about {
    font-size: var(--gr-typography-fontSize-xs);
    color: var(--gr-semantic-foreground-tertiary);
  }

  @media (max-width: 640px) {
    .login-container {
      padding: var(--gr-spacing-scale-6);
    }

    .header h1 {
      font-size: var(--gr-typography-fontSize-2xl);
    }
  }
</style>
