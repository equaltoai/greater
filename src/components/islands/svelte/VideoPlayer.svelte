<script lang="ts">
  import type { MediaAttachment } from '@/types/mastodon';
  import { onMount } from 'svelte';
  
  interface Props {
    media: MediaAttachment;
    autoplay?: boolean;
    muted?: boolean;
    loop?: boolean;
  }
  
  let { media, autoplay = false, muted = true, loop = false }: Props = $props();
  
  let videoElement: HTMLVideoElement;
  let containerElement: HTMLDivElement;
  let isPlaying = $state(false);
  let isMuted = $state(muted);
  let currentTime = $state(0);
  let duration = $state(0);
  let buffered = $state(0);
  let volume = $state(1);
  let showControls = $state(true);
  let isFullscreen = $state(false);
  let playbackRate = $state(1);
  let hideControlsTimeout: number;
  
  // Format time for display
  function formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
  
  // Play/pause toggle
  function togglePlay() {
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
    }
  }
  
  // Mute toggle
  function toggleMute() {
    if (videoElement) {
      isMuted = !isMuted;
      videoElement.muted = isMuted;
    }
  }
  
  // Seek functionality
  function seek(e: MouseEvent) {
    if (!videoElement) return;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    videoElement.currentTime = percent * duration;
  }
  
  // Volume control
  function setVolume(e: Event) {
    const target = e.target as HTMLInputElement;
    volume = parseFloat(target.value);
    if (videoElement) {
      videoElement.volume = volume;
      if (volume > 0) {
        isMuted = false;
        videoElement.muted = false;
      }
    }
  }
  
  // Fullscreen toggle
  async function toggleFullscreen() {
    if (!containerElement) return;
    
    if (!isFullscreen) {
      if (containerElement.requestFullscreen) {
        await containerElement.requestFullscreen();
      } else if ((containerElement as any).webkitRequestFullscreen) {
        await (containerElement as any).webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      }
    }
  }
  
  // Playback rate control
  function changePlaybackRate() {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    playbackRate = rates[nextIndex];
    
    if (videoElement) {
      videoElement.playbackRate = playbackRate;
    }
  }
  
  // Picture-in-picture
  async function togglePiP() {
    if (!videoElement) return;
    
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoElement.requestPictureInPicture();
      }
    } catch (error) {
      console.error('PiP failed:', error);
    }
  }
  
  // Auto-hide controls
  function resetControlsTimeout() {
    clearTimeout(hideControlsTimeout);
    showControls = true;
    
    if (isPlaying) {
      hideControlsTimeout = window.setTimeout(() => {
        showControls = false;
      }, 3000);
    }
  }
  
  // Keyboard shortcuts
  function handleKeydown(e: KeyboardEvent) {
    if (!videoElement) return;
    
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        videoElement.currentTime = Math.max(0, currentTime - 10);
        break;
      case 'ArrowRight':
        e.preventDefault();
        videoElement.currentTime = Math.min(duration, currentTime + 10);
        break;
      case 'ArrowUp':
        e.preventDefault();
        volume = Math.min(1, volume + 0.1);
        videoElement.volume = volume;
        break;
      case 'ArrowDown':
        e.preventDefault();
        volume = Math.max(0, volume - 0.1);
        videoElement.volume = volume;
        break;
      case 'm':
        e.preventDefault();
        toggleMute();
        break;
      case 'f':
        e.preventDefault();
        toggleFullscreen();
        break;
    }
  }
  
  onMount(() => {
    // Event listeners
    if (videoElement) {
      videoElement.addEventListener('loadedmetadata', () => {
        duration = videoElement.duration;
      });
      
      videoElement.addEventListener('timeupdate', () => {
        currentTime = videoElement.currentTime;
        if (duration > 0) {
          buffered = (videoElement.buffered.length > 0)
            ? videoElement.buffered.end(videoElement.buffered.length - 1) / duration
            : 0;
        }
      });
      
      videoElement.addEventListener('play', () => {
        isPlaying = true;
        resetControlsTimeout();
      });
      
      videoElement.addEventListener('pause', () => {
        isPlaying = false;
        showControls = true;
      });
      
      videoElement.addEventListener('volumechange', () => {
        volume = videoElement.volume;
        isMuted = videoElement.muted;
      });
      
      // Fullscreen change detection
      const fullscreenChange = () => {
        isFullscreen = !!document.fullscreenElement;
      };
      
      document.addEventListener('fullscreenchange', fullscreenChange);
      document.addEventListener('webkitfullscreenchange', fullscreenChange);
      
      // Keyboard shortcuts
      containerElement?.addEventListener('keydown', handleKeydown);
      
      return () => {
        clearTimeout(hideControlsTimeout);
        document.removeEventListener('fullscreenchange', fullscreenChange);
        document.removeEventListener('webkitfullscreenchange', fullscreenChange);
        containerElement?.removeEventListener('keydown', handleKeydown);
      };
    }
  });
</script>

<div 
  bind:this={containerElement}
  class="relative bg-black rounded-lg overflow-hidden group"
  onmousemove={resetControlsTimeout}
  onmouseleave={() => isPlaying && (showControls = false)}
  tabindex="0"
>
  <video
    bind:this={videoElement}
    src={media.url}
    poster={media.preview_url}
    {autoplay}
    {muted}
    {loop}
    playsinline
    class="w-full h-full"
    onclick={togglePlay}
  />
  
  <!-- Play button overlay -->
  {#if !isPlaying}
    <button
      onclick={togglePlay}
      class="absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity"
      aria-label="Play video"
    >
      <div class="bg-white/90 rounded-full p-4 shadow-lg">
        <svg class="w-12 h-12 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
        </svg>
      </div>
    </button>
  {/if}
  
  <!-- Controls -->
  <div 
    class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300"
    class:opacity-0={!showControls && isPlaying}
    class:pointer-events-none={!showControls && isPlaying}
  >
    <!-- Progress bar -->
    <div 
      class="relative h-1 bg-white/30 rounded-full mb-4 cursor-pointer group/progress"
      onclick={seek}
    >
      <!-- Buffered -->
      <div 
        class="absolute inset-y-0 left-0 bg-white/40 rounded-full"
        style="width: {buffered * 100}%"
      />
      
      <!-- Progress -->
      <div 
        class="absolute inset-y-0 left-0 bg-white rounded-full"
        style="width: {(currentTime / duration) * 100}%"
      >
        <div class="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity" />
      </div>
    </div>
    
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <!-- Play/pause -->
        <button
          onclick={togglePlay}
          class="text-white p-1 hover:scale-110 transition-transform"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {#if isPlaying}
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          {:else}
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
            </svg>
          {/if}
        </button>
        
        <!-- Volume -->
        <button
          onclick={toggleMute}
          class="text-white p-1 hover:scale-110 transition-transform"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          {#if isMuted || volume === 0}
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clip-rule="evenodd" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
            </svg>
          {:else}
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          {/if}
        </button>
        
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={volume}
          oninput={setVolume}
          class="w-20 accent-white"
          aria-label="Volume"
        />
        
        <!-- Time -->
        <span class="text-white text-sm">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
      
      <div class="flex items-center space-x-2">
        <!-- Playback rate -->
        <button
          onclick={changePlaybackRate}
          class="text-white text-sm px-2 py-1 hover:bg-white/20 rounded transition-colors"
        >
          {playbackRate}x
        </button>
        
        <!-- PiP -->
        {#if document.pictureInPictureEnabled}
          <button
            onclick={togglePiP}
            class="text-white p-1 hover:scale-110 transition-transform"
            aria-label="Picture-in-picture"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M8 12h8" />
            </svg>
          </button>
        {/if}
        
        <!-- Fullscreen -->
        <button
          onclick={toggleFullscreen}
          class="text-white p-1 hover:scale-110 transition-transform"
          aria-label="Fullscreen"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {#if isFullscreen}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            {:else}
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            {/if}
          </svg>
        </button>
      </div>
    </div>
  </div>
</div>