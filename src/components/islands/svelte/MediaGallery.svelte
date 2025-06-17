<script lang="ts">
  import type { MediaAttachment } from '@/types/mastodon';
  import { onMount } from 'svelte';
  
  interface Props {
    media: MediaAttachment[];
    sensitive?: boolean;
  }
  
  let { media, sensitive = false }: Props = $props();
  
  let showSensitive = $state(!sensitive);
  let selectedIndex = $state<number | null>(null);
  let imageLoadStates = $state<Record<string, boolean>>({});
  
  // Lightbox controls
  function openLightbox(index: number) {
    selectedIndex = index;
    document.body.style.overflow = 'hidden';
  }
  
  function closeLightbox() {
    selectedIndex = null;
    document.body.style.overflow = '';
  }
  
  function navigateLightbox(direction: 'prev' | 'next') {
    if (selectedIndex === null) return;
    
    if (direction === 'prev') {
      selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : media.length - 1;
    } else {
      selectedIndex = selectedIndex < media.length - 1 ? selectedIndex + 1 : 0;
    }
  }
  
  // Keyboard navigation
  function handleKeydown(e: KeyboardEvent) {
    if (selectedIndex === null) return;
    
    switch (e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        navigateLightbox('prev');
        break;
      case 'ArrowRight':
        navigateLightbox('next');
        break;
    }
  }
  
  // Grid layout calculation
  const gridClass = $derived.by(() => {
    switch (media.length) {
      case 1:
        return 'grid-cols-1';
      case 2:
        return 'grid-cols-2';
      case 3:
        return 'grid-cols-2';
      case 4:
        return 'grid-cols-2';
      default:
        return 'grid-cols-3';
    }
  });
  
  const itemClass = $derived.by(() => {
    if (media.length === 3) {
      return (index: number) => index === 0 ? 'row-span-2' : '';
    }
    return () => '';
  });
  
  // Aspect ratio handling
  function getAspectRatio(attachment: MediaAttachment): string {
    if (attachment.meta?.small?.aspect) {
      const aspect = attachment.meta.small.aspect;
      return `${aspect}`;
    }
    return '1'; // Default square
  }
  
  // Image optimization
  function getOptimizedUrl(attachment: MediaAttachment, size: 'preview' | 'small' | 'original' = 'small'): string {
    if (size === 'preview' && attachment.preview_url) {
      return attachment.preview_url;
    }
    if (size === 'small' && attachment.preview_url) {
      return attachment.preview_url;
    }
    return attachment.url;
  }
  
  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      if (selectedIndex !== null) {
        document.body.style.overflow = '';
      }
    };
  });
</script>

<div class="media-gallery">
  {#if sensitive && !showSensitive}
    <!-- Sensitive content warning -->
    <div class="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-video flex items-center justify-center">
      <div class="text-center p-4">
        <svg class="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sensitive content</p>
        <button
          onclick={() => showSensitive = true}
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Show
        </button>
      </div>
    </div>
  {:else}
    <!-- Media grid -->
    <div class="grid gap-1 {gridClass} rounded-lg overflow-hidden">
      {#each media as attachment, index}
        {#if attachment.type === 'image' || attachment.type === 'gifv' || attachment.type === 'video'}
          <button
            onclick={() => openLightbox(index)}
            class="relative overflow-hidden bg-gray-100 dark:bg-gray-800 {itemClass(index)} focus:outline-none focus:ring-2 focus:ring-blue-500"
            style="aspect-ratio: {getAspectRatio(attachment)}"
          >
            {#if attachment.type === 'video' || attachment.type === 'gifv'}
              <video
                src={attachment.url}
                poster={attachment.preview_url}
                class="w-full h-full object-cover"
                muted
                loop={attachment.type === 'gifv'}
                playsinline
              >
                <source src={attachment.url} type="video/mp4" />
              </video>
              <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div class="bg-black/60 rounded-full p-3">
                  <svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                </div>
              </div>
            {:else}
              <img
                src={getOptimizedUrl(attachment, 'small')}
                alt={attachment.description || ''}
                class="w-full h-full object-cover"
                loading="lazy"
                onload={() => imageLoadStates[attachment.id] = true}
              />
              {#if !imageLoadStates[attachment.id]}
                <div class="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              {/if}
            {/if}
            
            {#if attachment.description}
              <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                <span class="text-xs text-white">ALT</span>
              </div>
            {/if}
          </button>
        {:else if attachment.type === 'audio'}
          <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center space-x-3">
            <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <div class="flex-1">
              <audio
                src={attachment.url}
                controls
                class="w-full"
                preload="metadata"
              />
            </div>
          </div>
        {/if}
      {/each}
    </div>
  {/if}
  
  <!-- Lightbox -->
  {#if selectedIndex !== null}
    <div 
      class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
      onclick={closeLightbox}
    >
      <button
        onclick={closeLightbox}
        class="absolute top-4 right-4 text-white/80 hover:text-white p-2"
        aria-label="Close"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      {#if media.length > 1}
        <button
          onclick={(e) => {
            e.stopPropagation();
            navigateLightbox('prev');
          }}
          class="absolute left-4 text-white/80 hover:text-white p-2"
          aria-label="Previous"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button
          onclick={(e) => {
            e.stopPropagation();
            navigateLightbox('next');
          }}
          class="absolute right-4 text-white/80 hover:text-white p-2"
          aria-label="Next"
        >
          <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      {/if}
      
      {#if selectedIndex !== null}
        {@const currentMedia = media[selectedIndex]}
        <div class="max-w-[90vw] max-h-[90vh] relative" onclick={(e) => e.stopPropagation()}>
          {#if currentMedia.type === 'image'}
          <img
            src={currentMedia.url}
            alt={currentMedia.description || ''}
            class="max-w-full max-h-[90vh] object-contain"
          />
        {:else if currentMedia.type === 'video' || currentMedia.type === 'gifv'}
          <video
            src={currentMedia.url}
            poster={currentMedia.preview_url}
            controls={currentMedia.type === 'video'}
            autoplay
            loop={currentMedia.type === 'gifv'}
            muted={currentMedia.type === 'gifv'}
            class="max-w-full max-h-[90vh]"
          />
        {/if}
        
          {#if currentMedia.description}
            <div class="absolute bottom-0 left-0 right-0 bg-black/80 p-4">
              <p class="text-white text-sm">{currentMedia.description}</p>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>