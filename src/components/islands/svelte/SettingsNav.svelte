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

<nav class="w-full">
  <div class="bg-white dark:bg-gray-800 rounded-lg p-2">
    <ul class="flex flex-col space-y-1">
      {#each navItems as item}
        <li>
          <a 
            href={item.href} 
            class="block px-4 py-2 rounded-md transition-colors {currentPath === item.href ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}"
          >
            {item.label}
          </a>
        </li>
      {/each}
    </ul>
  </div>
</nav>