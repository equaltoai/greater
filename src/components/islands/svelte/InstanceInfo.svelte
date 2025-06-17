<script lang="ts">
  import { useAuthStore } from '@/lib/stores/auth';
  
  // Get current instance from auth store
  const authStore = useAuthStore();
  const { currentInstance } = authStore;
  
  // Placeholder instance data
  // In a real app, this would be fetched from the instance API
  const instanceData = {
    title: 'Greater Instance',
    description: 'A friendly Mastodon instance for everyone',
    version: '4.2.0',
    stats: {
      user_count: 12345,
      status_count: 567890,
      domain_count: 3456
    },
    rules: [
      'Be respectful and kind',
      'No harassment or hate speech',
      'No spam or advertising',
      'Mark sensitive content appropriately',
      'Respect privacy and consent'
    ],
    contact: {
      email: 'admin@example.com',
      account: '@admin'
    }
  };
  
  // Format large numbers
  function formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
</script>

<div class="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
  <!-- Header -->
  <div class="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
    <h2 class="text-xl font-bold">{instanceData.title}</h2>
    <p class="text-sm opacity-90 mt-1">{instanceData.description}</p>
  </div>
  
  <!-- Stats -->
  <div class="grid grid-cols-3 gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
    <div class="text-center">
      <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {formatNumber(instanceData.stats.user_count)}
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-400">Users</p>
    </div>
    <div class="text-center">
      <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {formatNumber(instanceData.stats.status_count)}
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-400">Posts</p>
    </div>
    <div class="text-center">
      <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">
        {formatNumber(instanceData.stats.domain_count)}
      </p>
      <p class="text-sm text-gray-500 dark:text-gray-400">Instances</p>
    </div>
  </div>
  
  <!-- Rules -->
  <div class="p-4 border-b border-gray-200 dark:border-gray-700">
    <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">Community Rules</h3>
    <ol class="space-y-1 text-sm text-gray-600 dark:text-gray-400">
      {#each instanceData.rules as rule, index}
        <li class="flex">
          <span class="font-medium mr-2">{index + 1}.</span>
          <span>{rule}</span>
        </li>
      {/each}
    </ol>
  </div>
  
  <!-- Footer -->
  <div class="p-4 text-sm">
    <p class="text-gray-600 dark:text-gray-400">
      Running Mastodon {instanceData.version}
    </p>
    <p class="text-gray-600 dark:text-gray-400 mt-1">
      Contact: 
      <a 
        href={`mailto:${instanceData.contact.email}`}
        class="text-blue-600 dark:text-blue-400 hover:underline"
      >
        {instanceData.contact.email}
      </a>
    </p>
    
    {#if currentInstance}
      <p class="text-xs text-gray-500 dark:text-gray-500 mt-2">
        Connected to: {currentInstance}
      </p>
    {/if}
  </div>
  
  <!-- Links -->
  <div class="p-4 bg-gray-50 dark:bg-gray-800 flex justify-around text-sm">
    <a 
      href="/about"
      class="text-blue-600 dark:text-blue-400 hover:underline"
    >
      About
    </a>
    <a 
      href="/terms"
      class="text-blue-600 dark:text-blue-400 hover:underline"
    >
      Terms
    </a>
    <a 
      href="/privacy"
      class="text-blue-600 dark:text-blue-400 hover:underline"
    >
      Privacy
    </a>
    <a 
      href="https://github.com"
      target="_blank"
      rel="noopener noreferrer"
      class="text-blue-600 dark:text-blue-400 hover:underline"
    >
      Source
    </a>
  </div>
</div>

