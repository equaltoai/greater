<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { authStore } from '$lib/stores/auth.svelte';
  import { unreadCount$, startNotificationStream } from '$lib/stores/notifications';
  import { UserCircle, Home as HomeIcon, LocalIcon, Globe, Bell, Bookmark, ListIcon, Settings as SettingsIcon } from '$lib/gc';
  
  interface NavItem {
    href: string;
    label: string;
    icon: any; // Svelte component
    exact?: boolean;
  }
  
  // Filter nav items based on auth state
  const publicNavItems: NavItem[] = [
    { href: '/local', label: 'Local', icon: LocalIcon },
    { href: '/federated', label: 'Federated', icon: Globe },
  ];
  
  const authenticatedNavItems: NavItem[] = [
    { href: '/home', label: 'Home', icon: HomeIcon, exact: true },
    { href: '/notifications', label: 'Notifications', icon: Bell },
    { href: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
    { href: '/lists', label: 'Lists', icon: ListIcon },
    { href: '/settings', label: 'Settings', icon: SettingsIcon },
  ];
  
  // Use $effect to track auth changes
  let navItems = $state<NavItem[]>(publicNavItems);
  
  $effect(() => {
    if (authStore.isAuthenticated) {
      navItems = [...authenticatedNavItems.slice(0, 1), ...publicNavItems, ...authenticatedNavItems.slice(1)];
    } else {
      navItems = publicNavItems;
    }
  });
  
  let currentPath = $state('');
  let unreadCount = 0;
  let unsubscribe: () => void;
  
  onMount(() => {
    currentPath = window.location.pathname;
    
    // Subscribe to unread count
    unsubscribe = unreadCount$.subscribe(count => {
      unreadCount = count;
    });
    
    // Start notification streaming if user is logged in
    if (authStore.currentUser) {
      startNotificationStream();
    }
  });
  
  onDestroy(() => {
    if (unsubscribe) unsubscribe();
  });
  
  function isActive(href: string, exact = false): boolean {
    if (exact) {
      return currentPath === href;
    }
    return currentPath.startsWith(href);
  }
</script>

<nav class="nav">
  <!-- User menu / Sign in -->
  <div class="user-section">
    {#if authStore.isAuthenticated && authStore.currentUser}
      <div class="user-menu">
        {#if authStore.currentUser.avatar}
          <img 
            src={authStore.currentUser.avatar} 
            alt={authStore.currentUser.display_name}
            class="user-avatar"
          />
        {:else}
          <div class="user-avatar-icon">
            <UserCircle size={40} />
          </div>
        {/if}
        <div class="user-info">
          <div class="user-name">{authStore.currentUser.display_name || authStore.currentUser.username}</div>
          <div class="user-handle">@{authStore.currentUser.acct}</div>
        </div>
      </div>
    {:else}
      <a href="/auth/login" class="sign-in-button">
        <UserCircle size={20} />
        <span>Sign In</span>
      </a>
    {/if}
  </div>

  <ul class="nav-list">
    {#each navItems as item}
      <li>
        <a 
          href={item.href} 
          class="nav-link {isActive(item.href, item.exact) ? 'active' : ''}"
          aria-current={isActive(item.href, item.exact) ? 'page' : undefined}
        >
          {#if isActive(item.href, item.exact)}
            <span class="active-indicator"></span>
          {/if}
          <span class="nav-icon">
            <svelte:component this={item.icon} size={20} />
            {#if item.href === '/notifications' && unreadCount > 0}
              <span class="badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            {/if}
          </span>
          <span class="nav-label">{item.label}</span>
        </a>
      </li>
    {/each}
  </ul>
  
  {#if authStore.isAuthenticated}
    <div class="compose-button-wrapper">
      <a href="/compose" class="compose-button">
        <span class="compose-icon">✏️</span>
        <span>Compose</span>
      </a>
    </div>
  {/if}
</nav>

<!-- Mobile bottom navigation -->
<nav class="mobile-nav">
  <a href="/home" class="mobile-nav-link {isActive('/home', true) ? 'active' : ''}">
    {#if isActive('/home', true)}
      <span class="mobile-indicator"></span>
    {/if}
    <span>🏠</span>
  </a>
  <a href="/local" class="mobile-nav-link {isActive('/local') ? 'active' : ''}">
    {#if isActive('/local')}
      <span class="mobile-indicator"></span>
    {/if}
    <LocalIcon size={24} />
  </a>
  <a href="/notifications" class="mobile-nav-link {isActive('/notifications') ? 'active' : ''}">
    {#if isActive('/notifications')}
      <span class="mobile-indicator"></span>
    {/if}
    <span class="mobile-icon-wrapper">
      🔔
      {#if unreadCount > 0}
        <span class="mobile-badge">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      {/if}
    </span>
  </a>
  <a href="/compose" class="mobile-compose-button">
    <span>✏️</span>
  </a>
  <a href="/settings" class="mobile-nav-link {isActive('/settings') ? 'active' : ''}">
    {#if isActive('/settings')}
      <span class="mobile-indicator"></span>
    {/if}
    <span>⚙️</span>
  </a>
</nav>

<style>
  .nav {
    display: flex;
    flex-direction: column;
    gap: var(--gr-spacing-scale-4);
  }
  
  .nav-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: var(--gr-spacing-scale-1);
    margin: 0;
    padding: 0;
  }
  
  .nav-link {
    display: flex;
    align-items: center;
    gap: var(--gr-spacing-scale-3);
    padding: var(--gr-spacing-scale-3) var(--gr-spacing-scale-4);
    border-radius: var(--gr-radii-lg);
    color: var(--gr-semantic-foreground-primary);
    text-decoration: none;
    transition: background-color 0.2s;
    position: relative;
  }
  
  .nav-link:hover {
    background-color: var(--gr-semantic-background-secondary);
  }
  
  .nav-link.active {
    background-color: var(--gr-semantic-background-secondary);
    color: var(--gr-semantic-action-primary-default);
    font-weight: var(--gr-typography-fontWeight-medium);
  }
  
  .active-indicator {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 2rem;
    background-color: var(--gr-semantic-action-primary-default);
    border-radius: 0 4px 4px 0;
  }
  
  .nav-icon {
    font-size: var(--gr-typography-fontSize-xl);
    position: relative;
  }
  
  .badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background-color: var(--gr-semantic-action-error-default);
    color: white;
    font-size: var(--gr-typography-fontSize-xs);
    border-radius: 9999px;
    height: 1.25rem;
    min-width: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
  }
  
  .nav-label {
    font-size: var(--gr-typography-fontSize-base);
  }
  
  .compose-button-wrapper {
    margin-top: var(--gr-spacing-scale-8);
  }
  
  .compose-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--gr-spacing-scale-2);
    width: 100%;
    padding: var(--gr-spacing-scale-3) var(--gr-spacing-scale-4);
    border-radius: 9999px;
    background-color: var(--gr-semantic-action-primary-default);
    color: white;
    font-weight: var(--gr-typography-fontWeight-medium);
    text-decoration: none;
    transition: background-color 0.2s;
  }
  
  .compose-button:hover {
    background-color: var(--gr-semantic-action-primary-hover);
  }
  
  .compose-icon {
    font-size: var(--gr-typography-fontSize-xl);
  }
  
  /* User section */
  .user-section {
    margin-bottom: var(--gr-spacing-scale-6);
    padding-bottom: var(--gr-spacing-scale-4);
    border-bottom: 1px solid var(--gr-semantic-border-default);
  }
  
  .user-menu {
    display: flex;
    align-items: center;
    gap: var(--gr-spacing-scale-3);
    padding: var(--gr-spacing-scale-3);
    border-radius: var(--gr-radii-lg);
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .user-menu:hover {
    background-color: var(--gr-semantic-background-secondary);
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 9999px;
    object-fit: cover;
  }
  
  .user-avatar-icon {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--gr-semantic-foreground-tertiary);
  }
  
  .user-info {
    flex: 1;
    min-width: 0;
  }
  
  .user-name {
    font-weight: var(--gr-typography-fontWeight-medium);
    font-size: var(--gr-typography-fontSize-sm);
    color: var(--gr-semantic-foreground-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .user-handle {
    font-size: var(--gr-typography-fontSize-xs);
    color: var(--gr-semantic-foreground-tertiary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .sign-in-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--gr-spacing-scale-2);
    width: 100%;
    padding: var(--gr-spacing-scale-3) var(--gr-spacing-scale-4);
    border-radius: var(--gr-radii-lg);
    background-color: var(--gr-semantic-action-primary-default);
    color: white;
    font-weight: var(--gr-typography-fontWeight-medium);
    text-decoration: none;
    transition: background-color 0.2s;
  }
  
  .sign-in-button:hover {
    background-color: var(--gr-semantic-action-primary-hover);
  }

  /* Mobile bottom navigation */
  .mobile-nav {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    background-color: var(--gr-semantic-background-primary);
    border-top: 1px solid var(--gr-semantic-border-default);
    height: 4rem;
    align-items: center;
    justify-content: space-around;
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .mobile-nav-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    font-size: var(--gr-typography-fontSize-2xl);
    color: var(--gr-semantic-foreground-tertiary);
    transition: color 0.2s;
    position: relative;
    text-decoration: none;
  }
  
  .mobile-nav-link:hover {
    color: var(--gr-semantic-foreground-primary);
  }
  
  .mobile-nav-link.active {
    color: var(--gr-semantic-action-primary-default);
  }
  
  .mobile-indicator {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 3rem;
    height: 4px;
    background-color: var(--gr-semantic-action-primary-default);
    border-radius: 0 0 4px 4px;
  }
  
  .mobile-icon-wrapper {
    position: relative;
  }
  
  .mobile-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    background-color: var(--gr-semantic-action-error-default);
    color: white;
    font-size: var(--gr-typography-fontSize-xs);
    border-radius: 9999px;
    height: 1.25rem;
    min-width: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
  }
  
  .mobile-compose-button {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--gr-semantic-action-primary-default);
    color: white;
    border-radius: 9999px;
    width: 3.5rem;
    height: 3.5rem;
    margin-top: -1rem;
    text-decoration: none;
  }

  @media (max-width: 768px) {
    .nav {
      display: none;
    }
    
    .mobile-nav {
      display: flex;
    }
  }
</style>
