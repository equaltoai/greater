<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { useAuthStore } from '@/lib/stores/auth';
  import { unreadCount$, startNotificationStream } from '@/lib/stores/notifications';
  
  const authStore = useAuthStore.getState();
  
  interface NavItem {
    href: string;
    label: string;
    icon: string;
    exact?: boolean;
  }
  
  const navItems: NavItem[] = [
    { href: '/home', label: 'Home', icon: '🏠', exact: true },
    { href: '/local', label: 'Local', icon: '🏘️' },
    { href: '/federated', label: 'Federated', icon: '🌐' },
    { href: '/notifications', label: 'Notifications', icon: '🔔' },
    { href: '/bookmarks', label: 'Bookmarks', icon: '🔖' },
    { href: '/lists', label: 'Lists', icon: '📋' },
    { href: `/@${authStore.currentUser?.username || ''}`, label: 'Profile', icon: '👤' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];
  
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

<nav class="space-y-4">
  <ul class="space-y-1">
    {#each navItems as item}
      <li>
        <a 
          href={item.href} 
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-text hover:bg-surface-hover transition-colors relative {isActive(item.href, item.exact) ? 'bg-primary/10 text-primary font-medium' : ''}"
          aria-current={isActive(item.href, item.exact) ? 'page' : undefined}
        >
          {#if isActive(item.href, item.exact)}
            <span class="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r"></span>
          {/if}
          <span class="text-xl relative">
            {item.icon}
            {#if item.href === '/notifications' && unreadCount > 0}
              <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            {/if}
          </span>
          <span class="text-base">{item.label}</span>
        </a>
      </li>
    {/each}
  </ul>
  
  <div class="mt-8">
    <a href="/compose" class="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary-hover transition-colors">
      <span class="text-xl">✏️</span>
      <span>Compose</span>
    </a>
  </div>
</nav>

<!-- Mobile bottom navigation -->
<nav class="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border flex items-center justify-around h-16 safe-bottom">
  <a href="/home" class="flex items-center justify-center w-full h-full text-2xl hover:text-text transition-colors relative {isActive('/home', true) ? 'text-primary' : 'text-text-muted'}">
    {#if isActive('/home', true)}
      <span class="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b"></span>
    {/if}
    <span>🏠</span>
  </a>
  <a href="/local" class="flex items-center justify-center w-full h-full text-2xl hover:text-text transition-colors relative {isActive('/local') ? 'text-primary' : 'text-text-muted'}">
    {#if isActive('/local')}
      <span class="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b"></span>
    {/if}
    <span>🏘️</span>
  </a>
  <a href="/notifications" class="flex items-center justify-center w-full h-full text-2xl hover:text-text transition-colors relative {isActive('/notifications') ? 'text-primary' : 'text-text-muted'}">
    {#if isActive('/notifications')}
      <span class="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b"></span>
    {/if}
    <span class="relative">
      🔔
      {#if unreadCount > 0}
        <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      {/if}
    </span>
  </a>
  <a href="/compose" class="flex items-center justify-center text-white bg-primary rounded-full w-14 h-14 -mt-4">
    <span>✏️</span>
  </a>
  <a href={`/@${authStore.currentUser?.username || ''}`} class="flex items-center justify-center w-full h-full text-2xl hover:text-text transition-colors relative {isActive(`/@${authStore.currentUser?.username || ''}`) ? 'text-primary' : 'text-text-muted'}">
    {#if isActive(`/@${authStore.currentUser?.username || ''}`)}
      <span class="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b"></span>
    {/if}
    <span>👤</span>
  </a>
</nav>

