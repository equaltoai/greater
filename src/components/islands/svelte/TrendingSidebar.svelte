<script lang="ts">
  // Placeholder trending data
  const trendingHashtags = [
    { tag: 'mastodon', posts: 1234 },
    { tag: 'fediverse', posts: 987 },
    { tag: 'opensource', posts: 654 },
    { tag: 'tech', posts: 543 },
    { tag: 'art', posts: 432 }
  ];
  
  const trendingAccounts = [
    { username: 'alice', display_name: 'Alice', followers: 5432 },
    { username: 'bob', display_name: 'Bob Developer', followers: 3210 },
    { username: 'carol', display_name: 'Carol Artist', followers: 2109 }
  ];
  
  // Format numbers
  function formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
</script>

<aside class="w-full max-w-sm bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
  <!-- Trending Hashtags -->
  <section class="p-4 border-b border-gray-200 dark:border-gray-700">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
      Trending Hashtags
    </h2>
    
    <div class="space-y-3">
      {#each trendingHashtags as hashtag}
        <a
          href={`/tags/${hashtag.tag}`}
          class="block hover:bg-gray-50 dark:hover:bg-gray-800 -mx-2 px-2 py-1 rounded transition-colors"
        >
          <div class="flex items-center justify-between">
            <span class="text-blue-600 dark:text-blue-400 font-medium">
              #{hashtag.tag}
            </span>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {formatNumber(hashtag.posts)} posts
            </span>
          </div>
        </a>
      {/each}
    </div>
    
    <a
      href="/explore/tags"
      class="inline-block mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
    >
      View all trending tags →
    </a>
  </section>
  
  <!-- Suggested Accounts -->
  <section class="p-4">
    <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
      Who to Follow
    </h2>
    
    <div class="space-y-3">
      {#each trendingAccounts as account}
        <div class="flex items-center justify-between">
          <a
            href={`/@${account.username}`}
            class="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <div class="w-10 h-10 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <span class="text-sm font-medium text-gray-600 dark:text-gray-300">
                {account.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {account.display_name}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                @{account.username}
              </p>
            </div>
          </a>
          
          <button
            type="button"
            class="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            Follow
          </button>
        </div>
      {/each}
    </div>
    
    <a
      href="/explore/accounts"
      class="inline-block mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline"
    >
      Find more accounts →
    </a>
  </section>
</aside>

