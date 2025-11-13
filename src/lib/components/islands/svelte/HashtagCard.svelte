<script lang="ts">
  import type { Tag } from '$lib/types/mastodon';
  
  interface Props {
    hashtag: Tag;
  }
  
  let { hashtag }: Props = $props();
  
  // Calculate trend (comparing today to yesterday)
  function calculateTrend(): number {
    if (!hashtag.history || hashtag.history.length < 2) return 0;
    
    const today = parseInt(hashtag.history[0].uses);
    const yesterday = parseInt(hashtag.history[1].uses);
    
    if (yesterday === 0) return today > 0 ? 100 : 0;
    
    return Math.round(((today - yesterday) / yesterday) * 100);
  }
  
  // Generate sparkline data
  function generateSparkline(): string {
    if (!hashtag.history || hashtag.history.length === 0) return '';
    
    const values = hashtag.history
      .slice()
      .reverse()
      .map(h => parseInt(h.uses));
    
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    
    const width = 120;
    const height = 40;
    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    });
    
    return points.join(' ');
  }
  
  const trend = calculateTrend();
  const sparklinePoints = generateSparkline();
  
  // Format numbers with commas
  function formatNumber(num: string | number): string {
    return parseInt(num.toString()).toLocaleString();
  }
</script>

<a 
  href={`/tags/${hashtag.name}`}
  class="block bg-white dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
>
  <div class="flex items-center justify-between">
    <div class="flex-1">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
        #{hashtag.name}
      </h3>
      
      {#if hashtag.history && hashtag.history.length > 0}
        <div class="mt-1 flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <span>{formatNumber(hashtag.history[0].accounts)} people</span>
          <span>·</span>
          <span>{formatNumber(hashtag.history[0].uses)} posts today</span>
          
          {#if trend !== 0}
            <span>·</span>
            <span class="flex items-center {trend > 0 ? 'text-green-600' : 'text-red-600'}">
              {#if trend > 0}
                <svg class="w-4 h-4 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              {:else}
                <svg class="w-4 h-4 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
              {/if}
              {Math.abs(trend)}%
            </span>
          {/if}
        </div>
      {/if}
    </div>
    
    <!-- Sparkline -->
    {#if sparklinePoints}
      <div class="ml-4">
        <svg width="120" height="40" class="text-blue-500">
          <polyline
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            points={sparklinePoints}
          />
        </svg>
      </div>
    {/if}
  </div>
</a>