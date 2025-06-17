<script lang="ts">
  import type { MediaAttachment } from '@/types/mastodon';
  import { getClient } from '@/lib/api/client';
  import { MediaOptimizer } from '@/lib/media/optimizer';
  import Button from './Button.svelte';
  
  interface Props {
    onupload: (attachment: MediaAttachment) => void;
    onremove: (id: string) => void;
    attachments: MediaAttachment[];
    maxFiles?: number;
  }
  
  let { onupload, onremove, attachments, maxFiles = 4 }: Props = $props();
  
  let fileInput: HTMLInputElement;
  let uploadProgress = $state<Record<string, number>>({});
  let uploadErrors = $state<Record<string, string>>({});
  let isDragging = $state(false);
  
  // Check if we can add more files
  const canAddMore = $derived(attachments.length < maxFiles);
  
  // Accepted file types
  const acceptedTypes = 'image/*,video/*,audio/*';
  const maxSizeMB = 40; // Mastodon default
  
  async function handleFiles(files: FileList | File[]) {
    const client = getClient();
    if (!client) return;
    
    const fileArray = Array.from(files);
    const remainingSlots = maxFiles - attachments.length;
    const filesToUpload = fileArray.slice(0, remainingSlots);
    
    for (const file of filesToUpload) {
      // Validate file size
      if (!MediaOptimizer.validateMediaSize(file, maxSizeMB)) {
        uploadErrors[file.name] = `File too large. Max size is ${maxSizeMB}MB`;
        continue;
      }
      
      // Start upload
      const uploadId = Date.now().toString();
      uploadProgress[uploadId] = 0;
      
      try {
        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        
        // TODO: Add proper progress tracking
        // For now, simulate progress
        const progressInterval = setInterval(() => {
          uploadProgress[uploadId] = Math.min(uploadProgress[uploadId] + 10, 90);
        }, 200);
        
        // Upload to Mastodon
        const attachment = await client.uploadMedia(file);
        
        clearInterval(progressInterval);
        uploadProgress[uploadId] = 100;
        
        // Add to attachments
        onupload(attachment);
        
        // Clean up
        setTimeout(() => {
          delete uploadProgress[uploadId];
        }, 500);
      } catch (error) {
        uploadErrors[file.name] = error instanceof Error ? error.message : 'Upload failed';
        delete uploadProgress[uploadId];
      }
    }
  }
  
  function handleFileSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      handleFiles(input.files);
    }
  }
  
  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }
  
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }
  
  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
  }
  
  function triggerFileSelect() {
    fileInput?.click();
  }
  
  function handlePaste(e: ClipboardEvent) {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    const files: File[] = [];
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }
    
    if (files.length > 0) {
      handleFiles(files);
    }
  }
  
  // Add paste listener
  $effect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  });
</script>

<div class="media-upload">
  <!-- File input (hidden) -->
  <input
    bind:this={fileInput}
    type="file"
    accept={acceptedTypes}
    multiple
    onchange={handleFileSelect}
    class="hidden"
  />
  
  <!-- Uploaded media preview -->
  {#if attachments.length > 0}
    <div class="mb-4 grid grid-cols-2 gap-2">
      {#each attachments as attachment}
        <div class="relative group">
          {#if attachment.type === 'image' || attachment.type === 'gifv'}
            <img
              src={attachment.preview_url || attachment.url}
              alt={attachment.description || ''}
              class="w-full h-32 object-cover rounded-lg"
            />
          {:else if attachment.type === 'video'}
            <video
              src={attachment.url}
              poster={attachment.preview_url}
              class="w-full h-32 object-cover rounded-lg"
            />
          {:else if attachment.type === 'audio'}
            <div class="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <svg class="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          {/if}
          
          <!-- Remove button -->
          <button
            onclick={() => onremove(attachment.id)}
            class="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Remove attachment"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <!-- Alt text indicator -->
          {#if attachment.description}
            <div class="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
              ALT
            </div>
          {:else}
            <button
              class="absolute bottom-1 left-1 bg-red-600 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              onclick={() => {/* TODO: Add alt text */}}
            >
              Add ALT
            </button>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
  
  <!-- Upload progress -->
  {#each Object.entries(uploadProgress) as [id, progress]}
    <div class="mb-2">
      <div class="flex items-center justify-between text-sm mb-1">
        <span>Uploading...</span>
        <span>{progress}%</span>
      </div>
      <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          class="h-full bg-blue-500 transition-all duration-300"
          style="width: {progress}%"
        />
      </div>
    </div>
  {/each}
  
  <!-- Upload errors -->
  {#each Object.entries(uploadErrors) as [filename, error]}
    <div class="mb-2 p-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm">
      <strong>{filename}:</strong> {error}
    </div>
  {/each}
  
  <!-- Drop zone -->
  {#if canAddMore}
    <div
      ondrop={handleDrop}
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
      class="border-2 border-dashed rounded-lg p-4 text-center transition-colors {
        isDragging 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' 
          : 'border-gray-300 dark:border-gray-600'
      }"
    >
      <button
        onclick={triggerFileSelect}
        type="button"
        class="inline-flex items-center space-x-2 text-blue-500 hover:text-blue-600"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <span>Upload media</span>
      </button>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        or drag and drop • Max {maxSizeMB}MB
      </p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        {attachments.length}/{maxFiles} files
      </p>
    </div>
  {/if}
</div>