<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { GCTextField } from '@/lib/components';
  import Button from './Button.svelte';
  import type { MediaAttachment } from '@/types/mastodon';
  import type { MediaCategory } from '@/lib/api/graphql-client';
  import { MediaOptimizer } from '@/lib/media/optimizer';
  import {
    composeMedia$,
    composeMediaWarnings$,
    composeError$,
    composeDefaultMediaType$,
    composeSensitive$,
    composeSpoilerText$,
    uploadMedia,
    removeMedia,
  } from '@/lib/stores/compose';
  import { inferMediaCategoryFromFile } from '@/lib/mappers/media';

  interface Props {
    maxFiles?: number;
  }

  let { maxFiles = 4 }: Props = $props();

  const MAX_FILE_SIZE_MB = 40;
  const MAX_DESCRIPTION_LENGTH = 1500;
  const MAX_SPOILER_LENGTH = 200;
  const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/'];
  const ALLOWED_MIME_TYPES = new Set(['application/pdf']);

  type PendingUpload = {
    id: string;
    file: File;
    description: string;
    spoilerText: string;
    sensitive: boolean;
    mediaType: MediaCategory | null;
    error: string | null;
    uploading: boolean;
  };

  const mediaTypeOptions: Array<{ value: MediaCategory; label: string }> = [
    { value: 'IMAGE', label: 'Image' },
    { value: 'GIFV', label: 'GIF' },
    { value: 'VIDEO', label: 'Video' },
    { value: 'AUDIO', label: 'Audio' },
    { value: 'DOCUMENT', label: 'Document' },
  ];

  let fileInput: HTMLInputElement;
  let attachments = $state<MediaAttachment[]>([]);
  let warnings = $state<Record<string, string[]>>({});
  let composeError = $state<string | null>(null);
  let defaultMediaType = $state<MediaCategory>('IMAGE');
  let globalSensitive = $state(false);
  let globalSpoilerText = $state('');
  let pendingUploads = $state<PendingUpload[]>([]);
  let isDragging = $state(false);

  const unsubscribers: Array<() => void> = [];

  onMount(() => {
    unsubscribers.push(
      composeMedia$.subscribe((value) => (attachments = value)),
      composeMediaWarnings$.subscribe((value) => (warnings = value)),
      composeError$.subscribe((value) => (composeError = value)),
      composeDefaultMediaType$.subscribe((value) => (defaultMediaType = value)),
      composeSensitive$.subscribe((value) => (globalSensitive = value)),
      composeSpoilerText$.subscribe((value) => (globalSpoilerText = value))
    );

    if (typeof document !== 'undefined') {
      document.addEventListener('paste', handlePaste);
    }
  });

  onDestroy(() => {
    unsubscribers.forEach((unsub) => unsub());
    if (typeof document !== 'undefined') {
      document.removeEventListener('paste', handlePaste);
    }
  });

  function isMimeAllowed(mime: string): boolean {
    const normalized = mime.toLowerCase();
    if (ALLOWED_MIME_TYPES.has(normalized)) {
      return true;
    }
    return ALLOWED_MIME_PREFIXES.some((prefix) => normalized.startsWith(prefix));
  }

  function queueFiles(files: FileList | File[]) {
    const currentCount = attachments.length + pendingUploads.length;
    const availableSlots = maxFiles - currentCount;
    if (availableSlots <= 0) {
      composeError$.set(`You can attach up to ${maxFiles} files per post`);
      return;
    }

    const candidates = Array.from(files).slice(0, availableSlots);
    const nextPending = [...pendingUploads];

    for (const file of candidates) {
      if (!MediaOptimizer.validateMediaSize(file, MAX_FILE_SIZE_MB)) {
        composeError$.set(`File "${file.name}" is too large. Max size is ${MAX_FILE_SIZE_MB}MB`);
        continue;
      }

      if (file.type && !isMimeAllowed(file.type)) {
        composeError$.set(`Unsupported file type: ${file.type}`);
        continue;
      }

      const inferredType = inferMediaCategoryFromFile(file);
      nextPending.push({
        id: crypto.randomUUID(),
        file,
        description: '',
        spoilerText: globalSpoilerText || '',
        sensitive: globalSensitive,
        mediaType: inferredType ?? defaultMediaType ?? 'IMAGE',
        error: null,
        uploading: false,
      });
    }

    pendingUploads = nextPending;
  }

  function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      queueFiles(input.files);
      input.value = '';
    }
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      queueFiles(files);
    }
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(event: DragEvent) {
    event.preventDefault();
    isDragging = false;
  }

  function triggerFileSelect() {
    fileInput?.click();
  }

  function handlePaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (const item of items) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      queueFiles(files);
    }
  }

  function updatePending(id: string, changes: Partial<PendingUpload>) {
    pendingUploads = pendingUploads.map((upload) =>
      upload.id === id ? { ...upload, ...changes } : upload
    );
  }

  function cancelPending(id: string) {
    pendingUploads = pendingUploads.filter((upload) => upload.id !== id);
  }

  async function submitPending(id: string) {
    const pending = pendingUploads.find((upload) => upload.id === id);
    if (!pending) return;

    const trimmedDescription = pending.description.trim();
    const trimmedSpoiler = pending.spoilerText.trim();

    if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
      updatePending(id, {
        error: `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`,
      });
      return;
    }

    if (trimmedSpoiler.length > MAX_SPOILER_LENGTH) {
      updatePending(id, {
        error: `Spoiler text cannot exceed ${MAX_SPOILER_LENGTH} characters`,
      });
      return;
    }

    updatePending(id, { uploading: true, error: null });

    const result = await uploadMedia(pending.file, {
      description: trimmedDescription,
      sensitive: pending.sensitive,
      spoilerText: trimmedSpoiler,
      mediaType: pending.mediaType,
    });

    if (result) {
      pendingUploads = pendingUploads.filter((upload) => upload.id !== id);
    } else {
      const latestError = composeError$.get();
      updatePending(id, {
        uploading: false,
        error: latestError || 'Upload failed. Please try again.',
      });
    }
  }

  function formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    const size = Number((bytes / Math.pow(k, i)).toFixed(1));
    return `${size} ${sizes[i]}`;
  }
</script>

<div class="space-y-4">
  {#if composeError}
    <div class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
      {composeError}
    </div>
  {/if}

  <section class="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600 dark:text-gray-400">
    <span class="font-medium uppercase tracking-wide">Default media type</span>
    <select
      class="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      bind:value={defaultMediaType}
      onchange={(event) => composeDefaultMediaType$.set((event.currentTarget as HTMLSelectElement).value as MediaCategory)}
    >
      {#each mediaTypeOptions as option}
        <option value={option.value}>{option.label}</option>
      {/each}
    </select>
  </section>

  {#if pendingUploads.length > 0}
    <section class="space-y-3">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-200">Pending uploads</h3>
      {#each pendingUploads as upload (upload.id)}
        <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/60">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div class="flex-1 space-y-3">
              <div>
                <div class="text-sm font-medium text-gray-900 dark:text-gray-50">
                  {upload.file.name}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  {upload.file.type || 'Unknown type'} • {formatFileSize(upload.file.size)}
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant={upload.sensitive ? 'primary' : 'secondary'}
                  size="sm"
                  onclick={() => updatePending(upload.id, { sensitive: !upload.sensitive })}
                >
                  {upload.sensitive ? 'Marked sensitive' : 'Mark sensitive'}
                </Button>

                <label class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Media type
                  <select
                    class="mt-1 block rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                    bind:value={upload.mediaType}
                    onchange={(event) =>
                      updatePending(upload.id, {
                        mediaType: (event.currentTarget as HTMLSelectElement).value as MediaCategory,
                      })
                    }
                  >
                    {#each mediaTypeOptions as option}
                      <option value={option.value}>{option.label}</option>
                    {/each}
                  </select>
                </label>
              </div>

              <GCTextField
                bind:value={upload.description}
                oninput={(event) =>
                  updatePending(upload.id, {
                    description: (event.currentTarget as HTMLInputElement).value,
                  })
                }
                placeholder="Alt text (optional)"
                class="w-full"
                maxlength={MAX_DESCRIPTION_LENGTH}
              />

              <GCTextField
                bind:value={upload.spoilerText}
                oninput={(event) =>
                  updatePending(upload.id, {
                    spoilerText: (event.currentTarget as HTMLInputElement).value,
                  })
                }
                placeholder="Spoiler text (optional)"
                class="w-full"
                maxlength={MAX_SPOILER_LENGTH}
              />
            </div>

            <div class="flex w-full flex-col items-stretch gap-2 lg:w-auto lg:items-end">
              <Button
                type="button"
                variant="primary"
                size="sm"
                loading={upload.uploading}
                disabled={upload.uploading}
                onclick={() => submitPending(upload.id)}
              >
                Upload
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={upload.uploading}
                onclick={() => cancelPending(upload.id)}
              >
                Cancel
              </Button>
              {#if upload.error}
                <div class="text-xs text-red-600 dark:text-red-400">{upload.error}</div>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </section>
  {/if}

  {#if attachments.length > 0}
    <section class="space-y-3">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-200">Attached media</h3>
      <div class="grid gap-3 sm:grid-cols-2">
        {#each attachments as attachment}
          <div class="group relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition ring-purple-500 hover:ring-2 dark:border-gray-700 dark:bg-gray-900/60">
            {#if attachment.type === 'image' || attachment.type === 'gifv'}
              <img
                src={attachment.preview_url || attachment.url}
                alt={attachment.description || 'Media preview'}
                class="h-40 w-full object-cover"
                loading="lazy"
              />
            {:else if attachment.type === 'video'}
              <video
                src={attachment.url}
                poster={attachment.preview_url}
                class="h-40 w-full object-cover"
                muted
                playsinline
                controls={attachment.type !== 'gifv'}
              />
            {:else if attachment.type === 'audio'}
              <div class="flex h-40 w-full flex-col items-center justify-center bg-gray-100 px-4 dark:bg-gray-800">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Audio attachment</span>
                <audio src={attachment.url} controls class="mt-2 w-full" preload="metadata" />
              </div>
            {:else}
              <div class="flex h-40 w-full flex-col items-center justify-center bg-gray-100 px-4 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                Unsupported preview • {attachment.meta?.media_type || attachment.type}
              </div>
            {/if}

            <div class="space-y-2 p-3 text-xs text-gray-600 dark:text-gray-300">
              <div class="flex flex-wrap items-center gap-2">
                <span class="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  {attachment.meta?.media_category || 'UNKNOWN'}
                </span>
                {#if attachment.sensitive}
                  <span class="rounded-full bg-yellow-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                    Sensitive
                  </span>
                {/if}
                {#if attachment.spoiler_text}
                  <span class="rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    CW
                  </span>
                {/if}
              </div>

              {#if attachment.description}
                <div>
                  <span class="font-medium">Alt text:</span>
                  <span class="ml-1">{attachment.description}</span>
                </div>
              {/if}

              {#if attachment.spoiler_text}
                <div>
                  <span class="font-medium">Spoiler:</span>
                  <span class="ml-1">{attachment.spoiler_text}</span>
                </div>
              {/if}

              {#if warnings[attachment.id]?.length}
                <div class="rounded-md border border-amber-200 bg-amber-50 p-2 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
                  <span class="font-medium">Warnings:</span>
                  <ul class="ml-4 list-disc">
                    {#each warnings[attachment.id] as warning}
                      <li>{warning}</li>
                    {/each}
                  </ul>
                </div>
              {/if}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              class="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100"
              onclick={() => removeMedia(attachment.id)}
            >
              Remove
            </Button>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <section>
    <input
      bind:this={fileInput}
      type="file"
      accept="image/*,video/*,audio/*,application/pdf"
      multiple
      class="hidden"
      onchange={handleFileSelect}
    />

    <div
      class="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center transition-colors dark:border-gray-700 dark:bg-gray-900/40"
      class:is-dragging={isDragging}
      ondrop={handleDrop}
      ondragover={handleDragOver}
      ondragleave={handleDragLeave}
    >
      <Button type="button" variant="secondary" size="sm" onclick={triggerFileSelect}>
        Select files
      </Button>
      <p class="text-sm text-gray-600 dark:text-gray-400">or drag & drop • Max {MAX_FILE_SIZE_MB}MB</p>
      <p class="text-xs text-gray-500 dark:text-gray-500">
        {attachments.length + pendingUploads.length}/{maxFiles} attachments queued
      </p>
    </div>
  </section>
</div>

<style>
  .is-dragging {
    border-color: var(--gr-semantic-action-primary-default);
    background-color: rgba(99, 102, 241, 0.08);
  }
</style>
