<script lang="ts">
  import { offlineStore } from '@/lib/stores/offline.svelte';
  
  $: queuedCount = offlineStore.posts.length;
  
  let showBanner = false;
  let wasOffline = false;
  
  $: {
    // Show banner when going offline or coming back online with queued posts
    if (!offlineStore.isOnline && !wasOffline) {
      showBanner = true;
      wasOffline = true;
    } else if (offlineStore.isOnline && wasOffline) {
      if (queuedCount > 0) {
        showBanner = true;
        // Hide after sync completes
        setTimeout(() => {
          if (offlineStore.posts.length === 0) {
            showBanner = false;
          }
        }, 3000);
      } else {
        showBanner = false;
      }
      wasOffline = false;
    }
  }
  
  function dismiss() {
    showBanner = false;
  }
</script>

{#if showBanner}
  <div class="offline-banner {offlineStore.isOnline ? 'online' : 'offline'}">
    <div class="banner-content">
      {#if !offlineStore.isOnline}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 1l22 22M9 9v.01M15 9a6 6 0 0 1 4.24 10.24M7.83 7.83A6 6 0 0 0 12 18c1.46 0 2.8-.52 3.84-1.39M5 12h.01M19 12a7 7 0 0 0-7-7M12 19v.01"/>
        </svg>
        <span>You're offline. Posts will be sent when connection is restored.</span>
      {:else if offlineStore.isSyncing}
        <svg class="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
        <span>Syncing {queuedCount} queued {queuedCount === 1 ? 'post' : 'posts'}...</span>
      {:else if queuedCount > 0}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
        <span>{queuedCount} {queuedCount === 1 ? 'post' : 'posts'} queued</span>
      {:else}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
        <span>Back online!</span>
      {/if}
    </div>
    
    <button class="dismiss-btn" on:click={dismiss} aria-label="Dismiss">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  </div>
{/if}

<style>
  .offline-banner {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    animation: slideDown 0.3s ease;
  }
  
  .offline-banner.offline {
    background: #dc2626;
    color: white;
  }
  
  .offline-banner.online {
    background: #10b981;
    color: white;
  }
  
  .banner-content {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    font-weight: 500;
  }
  
  .dismiss-btn {
    background: none;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 4px;
    opacity: 0.8;
    transition: opacity 0.2s;
  }
  
  .dismiss-btn:hover {
    opacity: 1;
  }
  
  .spinner {
    animation: spin 1s linear infinite;
  }
  
  @keyframes slideDown {
    from {
      transform: translateY(-100%);
    }
    to {
      transform: translateY(0);
    }
  }
  
  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  @media (max-width: 640px) {
    .offline-banner {
      padding: 10px 12px;
    }
    
    .banner-content {
      font-size: 13px;
    }
  }
</style>