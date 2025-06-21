<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { 
    composeText$,
    composeVisibility$,
    composeSensitive$,
    composeSpoilerText$,
    composeMedia$,
    composePoll$,
    composeReplyTo$,
    isComposing$,
    isUploading$,
    uploadProgress$,
    composeError$,
    uploadMedia,
    removeMedia,
    createPost,
    saveDraft,
    clearCompose,
    characterCount$,
    canPost$
  } from '../../../lib/stores/compose';
  import type { CreatePollParams, MediaAttachment, Status } from '../../../types/mastodon';
  import { Globe, Lock, Mail, Users, X } from 'lucide-svelte';
  import { getClient } from '../../../lib/api/client';
  import { timelineStore } from '../../../lib/stores/timeline.svelte';

  // Local state
  let text = '';
  let visibility: 'public' | 'unlisted' | 'private' | 'direct' = 'public';
  let sensitive = false;
  let spoilerText = '';
  let media: MediaAttachment[] = [];
  let poll: CreatePollParams | null = null;
  let replyToId: string | null = null;
  let replyToStatus: Status | null = null;
  let isComposing = false;
  let isUploading = false;
  let uploadProgress = 0;
  let error: string | null = null;
  let characterCount = 0;
  let canPost = false;

  let textareaEl: HTMLTextAreaElement;
  let fileInputEl: HTMLInputElement;
  let maxCharacters = 500;

  const visibilityOptions = [
    { value: 'public', label: 'Public', icon: Globe, description: 'Visible for all' },
    { value: 'unlisted', label: 'Unlisted', icon: Lock, description: 'Not in public timelines' },
    { value: 'private', label: 'Followers only', icon: Users, description: 'Only followers can see' },
    { value: 'direct', label: 'Direct', icon: Mail, description: 'Only people mentioned' },
  ] as const;

  let showVisibilityDropdown = false;
  let showPollForm = false;
  let pollOptions = ['', ''];
  let pollExpiresIn = 86400; // 24 hours in seconds

  $: isOverLimit = characterCount > maxCharacters;

  // Store subscriptions
  const unsubscribers: Array<() => void> = [];

  onMount(() => {
    // Subscribe to stores
    unsubscribers.push(
      composeText$.subscribe(v => text = v),
      composeVisibility$.subscribe(v => visibility = v),
      composeSensitive$.subscribe(v => sensitive = v),
      composeSpoilerText$.subscribe(v => spoilerText = v),
      composeMedia$.subscribe(v => media = v),
      composePoll$.subscribe(v => poll = v),
      composeReplyTo$.subscribe(async (v) => {
        replyToId = v;
        if (v) {
          // Fetch the status being replied to
          try {
            const client = getClient();
            replyToStatus = await client.getStatus(v);
          } catch (err) {
            console.error('Failed to fetch reply status:', err);
          }
        } else {
          replyToStatus = null;
        }
      }),
      isComposing$.subscribe(v => isComposing = v),
      isUploading$.subscribe(v => isUploading = v),
      uploadProgress$.subscribe(v => uploadProgress = v),
      composeError$.subscribe(v => error = v),
      characterCount$.subscribe(v => characterCount = v),
      canPost$.subscribe(v => canPost = v)
    );

    return () => {
      // Save draft on unmount if there's content
      if (text.trim()) {
        saveDraft();
      }
      // Unsubscribe from all stores
      unsubscribers.forEach(unsub => unsub());
    };
  });

  function handleTextInput() {
    composeText$.set(text);
    // Auto-resize textarea
    if (textareaEl) {
      textareaEl.style.height = 'auto';
      textareaEl.style.height = textareaEl.scrollHeight + 'px';
    }
  }

  async function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const files = Array.from(target.files || []);
    
    for (const file of files) {
      if (file.size > 8 * 1024 * 1024) {
        composeError$.set('File size must be less than 8MB');
        continue;
      }
      
      await uploadMedia(file);
    }
    
    target.value = '';
  }

  function togglePoll() {
    showPollForm = !showPollForm;
    if (!showPollForm) {
      composePoll$.set(null);
      pollOptions = ['', ''];
    }
  }

  function updatePoll() {
    if (showPollForm && pollOptions.filter(o => o.trim()).length >= 2) {
      composePoll$.set({
        options: pollOptions.filter(o => o.trim()),
        expires_in: pollExpiresIn,
        multiple: false,
        hide_totals: false
      });
    } else {
      composePoll$.set(null);
    }
  }

  function addPollOption() {
    if (pollOptions.length < 4) {
      pollOptions = [...pollOptions, ''];
    }
  }

  function removePollOption(index: number) {
    if (pollOptions.length > 2) {
      pollOptions = pollOptions.filter((_, i) => i !== index);
      updatePoll();
    }
  }

  async function handleSubmit() {
    if (!canPost) return;

    // Update poll data before posting
    updatePoll();

    const status = await createPost();
    if (status) {
      // Add the new status to the home timeline
      timelineStore.prependStatus('home', status);
      // The compose form will be cleared by createPost()
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    // Submit with Cmd/Ctrl + Enter
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && canPost) {
      handleSubmit();
    }
  }
</script>

<div class="compose-box p-4 bg-white dark:bg-gray-900">
  <!-- Error message -->
  {#if error}
    <div class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
      {error}
    </div>
  {/if}

  <!-- Reply context -->
  {#if replyToStatus}
    <div class="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div class="flex items-start justify-between gap-2">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 text-sm">
            <span class="font-medium">Replying to @{replyToStatus.account.acct}</span>
          </div>
          <div class="mt-1 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {replyToStatus.content.replace(/<[^>]*>/g, '')}
          </div>
        </div>
        <button
          type="button"
          on:click={() => {
            composeReplyTo$.set(null);
            // Remove the mention if it's the only text
            if (text.trim() === `@${replyToStatus?.account.acct}`) {
              composeText$.set('');
            }
          }}
          class="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          title="Cancel reply"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>
  {/if}

  <!-- Content Warning -->
  {#if sensitive}
    <div class="mb-4">
      <input
        type="text"
        bind:value={spoilerText}
        on:input={() => composeSpoilerText$.set(spoilerText)}
        placeholder="Content warning"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
    </div>
  {/if}

  <!-- Main Text Area -->
  <div class="relative">
    <textarea
      bind:this={textareaEl}
      bind:value={text}
      on:input={handleTextInput}
      on:keydown={handleKeyDown}
      placeholder="What's on your mind?"
      aria-label="Compose new post"
      aria-describedby="character-count"
      aria-invalid={isOverLimit}
      class="w-full min-h-[120px] p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
      style="height: auto;"
    />
  </div>

  <!-- Poll Form -->
  {#if showPollForm}
    <div class="mt-4 p-4 border border-gray-300 dark:border-gray-700 rounded-lg">
      <h3 class="font-medium mb-3">Poll options</h3>
      {#each pollOptions as option, index}
        <div class="flex gap-2 mb-2">
          <input
            type="text"
            bind:value={pollOptions[index]}
            on:input={updatePoll}
            placeholder={`Option ${index + 1}`}
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          {#if pollOptions.length > 2}
            <button
              type="button"
              on:click={() => removePollOption(index)}
              class="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            >
              Remove
            </button>
          {/if}
        </div>
      {/each}
      
      {#if pollOptions.length < 4}
        <button
          type="button"
          on:click={addPollOption}
          class="text-purple-600 hover:text-purple-700 text-sm font-medium"
        >
          + Add option
        </button>
      {/if}

      <div class="mt-3">
        <label class="text-sm text-gray-600 dark:text-gray-400">
          Poll expires in
          <select
            bind:value={pollExpiresIn}
            on:change={updatePoll}
            class="ml-2 px-2 py-1 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-900"
          >
            <option value={300}>5 minutes</option>
            <option value={1800}>30 minutes</option>
            <option value={3600}>1 hour</option>
            <option value={21600}>6 hours</option>
            <option value={86400}>24 hours</option>
            <option value={259200}>3 days</option>
            <option value={604800}>7 days</option>
          </select>
        </label>
      </div>
    </div>
  {/if}

  <!-- Media Previews -->
  {#if media.length > 0}
    <div class="mt-4 grid grid-cols-2 gap-2">
      {#each media as attachment}
        <div class="relative group">
          {#if attachment.type === 'image'}
            <img
              src={attachment.preview_url || attachment.url}
              alt={attachment.description || 'Media preview'}
              class="w-full h-32 object-cover rounded-lg"
            />
          {:else}
            <div class="w-full h-32 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
              <span class="text-gray-500 dark:text-gray-400">{attachment.type}</span>
            </div>
          {/if}
          <button
            type="button"
            on:click={() => removeMedia(attachment.id)}
            class="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      {/each}
    </div>
  {/if}

  <!-- Upload Progress -->
  {#if isUploading}
    <div class="mt-4">
      <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <span>Uploading...</span>
        <span>{uploadProgress}%</span>
      </div>
      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
        <div
          class="bg-purple-600 h-2 rounded-full transition-all duration-300"
          style="width: {uploadProgress}%"
        />
      </div>
    </div>
  {/if}

  <!-- Actions Bar -->
  <div class="mt-4 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <!-- Media Upload -->
      <input
        bind:this={fileInputEl}
        type="file"
        accept="image/*,video/*"
        multiple
        on:change={handleFileSelect}
        class="hidden"
        disabled={media.length >= 4 || isUploading}
      />
      <button
        type="button"
        on:click={() => fileInputEl.click()}
        disabled={media.length >= 4 || isUploading}
        class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        title="Add media"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      <!-- Poll -->
      <button
        type="button"
        on:click={togglePoll}
        class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        class:text-purple-600={showPollForm}
        title="Add poll"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>

      <!-- Content Warning -->
      <button
        type="button"
        on:click={() => composeSensitive$.set(!sensitive)}
        class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        class:text-purple-600={sensitive}
        title="Content warning"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </button>

      <!-- Visibility -->
      <div class="relative">
        <button
          type="button"
          on:click={() => showVisibilityDropdown = !showVisibilityDropdown}
          class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-1"
          title="Visibility"
        >
          <svelte:component this={visibilityOptions.find(o => o.value === visibility)?.icon} class="w-5 h-5" />
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {#if showVisibilityDropdown}
          <div class="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
            {#each visibilityOptions as option}
              <button
                type="button"
                on:click={() => {
                  composeVisibility$.set(option.value);
                  showVisibilityDropdown = false;
                }}
                class="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                class:bg-purple-50={visibility === option.value}
              >
                <svelte:component this={option.icon} class="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div class="text-left">
                  <div class="font-medium">{option.label}</div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">{option.description}</div>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <div class="flex items-center gap-3">
      <!-- Character Count -->
      <div
        id="character-count"
        class="text-sm"
        class:text-gray-500={!isOverLimit}
        class:text-red-500={isOverLimit}
        aria-live="polite"
        aria-atomic="true"
      >
        {characterCount}/{maxCharacters}
      </div>

      <!-- Submit Button -->
      <button
        type="button"
        on:click={handleSubmit}
        disabled={!canPost}
        class="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isComposing ? 'Posting...' : 'Post'}
      </button>
    </div>
  </div>
</div>
