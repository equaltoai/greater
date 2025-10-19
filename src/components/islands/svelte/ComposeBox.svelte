<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
import { GCTextField } from '@/lib/components';
import Button from './Button.svelte';
import MediaUpload from './MediaUpload.svelte';
import { 
  composeText$,
  composeVisibility$,
  composeSensitive$,
  composeSpoilerText$,
  composePoll$,
  composeReplyTo$,
  isComposing$,
  composeError$,
  createPost,
  saveDraft,
  clearCompose,
  characterCount$,
    canPost$
  } from '../../../lib/stores/compose';
import type { CreatePollParams, Status } from '../../../types/mastodon';
  import { Globe, Lock, Mail, Users, X } from 'lucide-svelte';
  import { getClient } from '../../../lib/api/client';
  import { timelineStore } from '../../../lib/stores/timeline.svelte';

  // Declare the window.quoteContext type
  declare global {
    interface Window {
      quoteContext?: {
        statusId: string;
        quotedStatus: Status;
      };
    }
  }

  // Local state
  let text = '';
  let visibility: 'public' | 'unlisted' | 'private' | 'direct' = 'public';
  let sensitive = false;
  let spoilerText = '';
  let poll: CreatePollParams | null = null;
  let replyToId: string | null = null;
  let replyToStatus: Status | null = null;
  let isComposing = false;
  let error = $state<string | null>(null);
  let characterCount = $state(0);
  let canPost = $state(false);

  let textareaEl: HTMLTextAreaElement;
  let maxCharacters = $state(500);

  const visibilityOptions = [
    { value: 'public', label: 'Public', icon: Globe, description: 'Visible for all' },
    { value: 'unlisted', label: 'Unlisted', icon: Lock, description: 'Not in public timelines' },
    { value: 'private', label: 'Followers only', icon: Users, description: 'Only followers can see' },
    { value: 'direct', label: 'Direct', icon: Mail, description: 'Only people mentioned' },
  ] as const;

  let showVisibilityDropdown = $state(false);
  let showPollForm = $state(false);
  let pollOptions = $state(['', '']);
  let pollExpiresIn = $state(86400); // 24 hours in seconds
  let quotedStatus = $state(null);
  let visibilityButtonRef: HTMLButtonElement;
  let dropdownPosition = $state<'above' | 'below'>('above');

  const isOverLimit = $derived(characterCount > maxCharacters);

  // Store subscriptions
  const unsubscribers: Array<() => void> = [];

  onMount(() => {
    // Handle click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (showVisibilityDropdown && visibilityButtonRef && !visibilityButtonRef.contains(event.target as Node)) {
        const dropdown = document.querySelector('.visibility-dropdown');
        if (dropdown && !dropdown.contains(event.target as Node)) {
          showVisibilityDropdown = false;
        }
      }
    };

    document.addEventListener('click', handleClickOutside);

    // Check for reply context from sessionStorage
    const replyContextStr = sessionStorage.getItem('compose_reply_context');
    if (replyContextStr) {
      try {
        const replyContext = JSON.parse(replyContextStr);
        composeReplyTo$.set(replyContext.replyToId);
        composeText$.set(replyContext.mention);
        // Clear the context after using it
        sessionStorage.removeItem('compose_reply_context');
      } catch (err) {
        console.error('Failed to parse reply context:', err);
      }
    }
    
    // Check for quote context from sessionStorage
    const quoteContextStr = sessionStorage.getItem('compose_quote_context');
    if (quoteContextStr) {
      try {
        const quoteContext = JSON.parse(quoteContextStr);
        // Store the full quote context for later use
        window.quoteContext = quoteContext;
        quotedStatus = quoteContext.quotedStatus;
        // Don't pre-fill text for quotes - let user write their commentary
        // Clear the context after using it
        sessionStorage.removeItem('compose_quote_context');
      } catch (err) {
        console.error('Failed to parse quote context:', err);
      }
    }
    
    // Subscribe to stores
    unsubscribers.push(
      composeText$.subscribe(v => text = v),
      composeVisibility$.subscribe(v => visibility = v),
      composeSensitive$.subscribe(v => sensitive = v),
      composeSpoilerText$.subscribe(v => spoilerText = v),
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
      composeError$.subscribe(v => error = v),
      characterCount$.subscribe(v => characterCount = v),
      canPost$.subscribe(v => canPost = v)
    );

    return () => {
      // Save draft on unmount if there's content
      if (text.trim()) {
        saveDraft();
      }
      // Remove event listener
      document.removeEventListener('click', handleClickOutside);
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

    // Check if this is a quote boost
    if (window.quoteContext) {
      try {
        const client = getClient();
        const { statusId } = window.quoteContext;
        
        console.log('[ComposeBox] Quote boost context:', window.quoteContext);
        console.log('[ComposeBox] Status ID:', statusId);
        
        if (!statusId) {
          throw new Error('No status ID found in quote context');
        }
        
        // Use the reblogStatus method which handles ID extraction
        const response = await client.reblogStatus(statusId, {
          comment: text,
          visibility: visibility
        });
        
        // Add the new quote boost to timeline
        timelineStore.prependStatus('home', response);
        
        // Clear the quote context
        window.quoteContext = null;
        
        // Clear the compose form
        clearCompose();
        
        // Navigate back
        window.location.href = '/home';
        return;
      } catch (error) {
        console.error('Quote boost failed:', error);
        composeError$.set(error instanceof Error ? error.message : 'Failed to post quote');
        return;
      }
    }

    // Regular post
    const status = await createPost();
    if (status) {
      // Add the new status to the home timeline
      timelineStore.prependStatus('home', status);
      // The compose form will be cleared by createPost()
      
      // Navigate back to home after successful post
      window.location.href = '/home';
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    // Submit with Cmd/Ctrl + Enter
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter' && canPost) {
      handleSubmit();
    }
  }

  function calculateDropdownPosition() {
    if (!visibilityButtonRef) return;
    
    const rect = visibilityButtonRef.getBoundingClientRect();
    const dropdownHeight = 240; // Approximate height of dropdown with 4 items
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    
    // If not enough space above, show below
    dropdownPosition = spaceAbove < dropdownHeight && spaceBelow > dropdownHeight ? 'below' : 'above';
  }

  function toggleVisibilityDropdown() {
    calculateDropdownPosition();
    showVisibilityDropdown = !showVisibilityDropdown;
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

  <!-- Quoted Status -->
  {#if quotedStatus}
    <div class="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div class="text-sm text-gray-500 dark:text-gray-400 mb-2">Quoting</div>
      <div class="flex items-start gap-3">
        <img 
          src={quotedStatus.account.avatar} 
          alt={quotedStatus.account.display_name || quotedStatus.account.username}
          class="w-10 h-10 rounded-full"
        />
        <div class="flex-1 min-w-0">
          <div class="font-medium">
            {quotedStatus.account.display_name || quotedStatus.account.username}
            <span class="text-gray-500 dark:text-gray-400 font-normal">
              @{quotedStatus.account.acct}
            </span>
          </div>
          <div class="text-gray-700 dark:text-gray-300 mt-1">
            {@html quotedStatus.content}
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Content Warning -->
  {#if sensitive}
    <div class="mb-4">
      <GCTextField
        bind:value={spoilerText}
        oninput={() => composeSpoilerText$.set(spoilerText)}
        placeholder="Content warning"
        class="w-full"
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
          <GCTextField
            bind:value={pollOptions[index]}
            oninput={updatePoll}
            placeholder={`Option ${index + 1}`}
            class="flex-1"
          />
          {#if pollOptions.length > 2}
            <Button
              type="button"
              onclick={() => removePollOption(index)}
              variant="danger"
              size="sm"
            >
              Remove
            </Button>
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

  <MediaUpload maxFiles={4} />

  <!-- Actions Bar -->
  <div class="mt-4 flex items-center justify-between">
    <div class="flex items-center gap-2">
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
          bind:this={visibilityButtonRef}
          type="button"
          on:click={toggleVisibilityDropdown}
          class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg flex items-center gap-1"
          title="Visibility"
        >
          <svelte:component this={visibilityOptions.find(o => o.value === visibility)?.icon} class="w-5 h-5" />
          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {#if showVisibilityDropdown}
          <div class="absolute {dropdownPosition === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
            {#each visibilityOptions as option}
              <button
                type="button"
                on:click={() => {
                  composeVisibility$.set(option.value);
                  showVisibilityDropdown = false;
                }}
                class="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors {visibility === option.value ? 'bg-purple-50 dark:bg-purple-900/20' : ''}"
              >
                <svelte:component this={option.icon} class="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div class="text-left flex-1">
                  <div class="font-medium text-sm">{option.label}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{option.description}</div>
                </div>
                {#if visibility === option.value}
                  <svg class="w-4 h-4 text-purple-600 dark:text-purple-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                {/if}
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
