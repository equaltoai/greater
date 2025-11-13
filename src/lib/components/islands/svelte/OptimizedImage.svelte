<script lang="ts">
  import { MediaOptimizer } from '$lib/media/optimizer';
  import { onMount } from 'svelte';
  
  interface Props {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
    aspectRatio?: number;
    sizes?: string;
    loading?: 'lazy' | 'eager';
    objectFit?: 'cover' | 'contain' | 'fill';
    blurhash?: string;
    class?: string;
  }
  
  let { 
    src, 
    alt = '', 
    width,
    height,
    aspectRatio,
    sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    loading = 'lazy',
    objectFit = 'cover',
    blurhash,
    class: className = ''
  }: Props = $props();
  
  let imageElement: HTMLImageElement;
  let isLoaded = $state(false);
  let hasError = $state(false);
  
  // Generate responsive image attributes
  const responsiveImage = $derived(
    MediaOptimizer.getResponsiveImage(src, alt, { sizes, aspectRatio, objectFit })
  );
  
  // Get placeholder
  const placeholder = $derived(
    MediaOptimizer.getBlurhashPlaceholder(blurhash)
  );
  
  // Calculate aspect ratio padding
  const paddingBottom = $derived.by(() => {
    if (aspectRatio) {
      return `${(1 / aspectRatio) * 100}%`;
    }
    if (width && height) {
      return `${(height / width) * 100}%`;
    }
    return '56.25%'; // Default 16:9
  });
  
  // Handle intersection observer for lazy loading animation
  let observer: IntersectionObserver;
  
  onMount(() => {
    if (loading === 'eager') {
      // Preload critical images
      MediaOptimizer.preloadImage(src, { width, format: 'webp' });
    }
    
    // Set up intersection observer for load animation
    if (imageElement && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );
      
      observer.observe(imageElement);
    }
    
    return () => {
      observer?.disconnect();
    };
  });
  
  function handleLoad() {
    isLoaded = true;
  }
  
  function handleError() {
    hasError = true;
  }
</script>

<div 
  class="optimized-image relative overflow-hidden {className}"
  style="background-color: var(--color-surface);"
>
  {#if !hasError}
    <!-- Aspect ratio container -->
    <div 
      class="relative w-full"
      style={aspectRatio || (width && height) ? `padding-bottom: ${paddingBottom}` : ''}
    >
      <!-- Placeholder -->
      {#if !isLoaded && placeholder}
        <div 
          class="absolute inset-0 w-full h-full"
          style="background-image: url({placeholder}); background-size: cover; filter: blur(20px); transform: scale(1.1);"
        />
      {/if}
      
      <!-- Main image -->
      <img
        bind:this={imageElement}
        src={responsiveImage.src}
        srcset={responsiveImage.srcset}
        sizes={responsiveImage.sizes}
        {alt}
        {width}
        {height}
        {loading}
        onload={handleLoad}
        onerror={handleError}
        class="absolute inset-0 w-full h-full transition-opacity duration-300 {
          isLoaded ? 'opacity-100' : 'opacity-0'
        }"
        style="object-fit: {objectFit}"
      />
    </div>
  {:else}
    <!-- Error state -->
    <div 
      class="flex items-center justify-center bg-gray-100 dark:bg-gray-800"
      style={aspectRatio || (width && height) ? `padding-bottom: ${paddingBottom}` : 'min-height: 200px'}
    >
      <div class="text-center p-4">
        <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p class="text-sm text-gray-500 dark:text-gray-400">Failed to load image</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .optimized-image img {
    image-rendering: -webkit-optimize-contrast;
    image-rendering: crisp-edges;
  }
  
  /* Progressive loading animation */
  .optimized-image img.is-visible {
    animation: fadeIn 0.3s ease-out;
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(1.02);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  /* Disable right-click save on sensitive images */
  .optimized-image[data-sensitive="true"] img {
    pointer-events: none;
    user-select: none;
  }
</style>