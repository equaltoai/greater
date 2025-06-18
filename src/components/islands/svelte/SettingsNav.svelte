<script lang="ts">
  const navItems = [
    { href: '/settings', label: 'General' },
    { href: '/settings/profile', label: 'Profile' },
    { href: '/settings/appearance', label: 'Appearance' },
    { href: '/settings/notifications', label: 'Notifications' },
    { href: '/settings/privacy', label: 'Privacy & Safety' },
    { href: '/settings/account', label: 'Account' },
  ];
  
  interface Props {
    current?: string;
  }
  
  let { current = 'general' }: Props = $props();
  
  // Map current page to href
  const currentPath = navItems.find(item => 
    item.label.toLowerCase().replace(/\s+&\s+/g, '-').replace(/\s+/g, '-') === current
  )?.href || '/settings';
</script>

<nav class="w-full lg:w-64 mb-6 lg:mb-0">
  <ul class="flex lg:flex-col overflow-x-auto lg:overflow-visible space-x-4 lg:space-x-0 lg:space-y-2 pb-2 lg:pb-0">
    {#each navItems as item}
      <li>
        <a 
          href={item.href} 
          class="block px-4 py-2 rounded-md transition-colors whitespace-nowrap {currentPath === item.href ? 'bg-primary text-white' : 'text-text hover:bg-surface'}"
        >
          {item.label}
        </a>
      </li>
    {/each}
  </ul>
</nav>