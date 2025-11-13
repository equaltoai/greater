<script lang="ts">
  import { onMount } from 'svelte';
  import { getGraphQLAdapter, uploadMediaAsset } from '$lib/api/graphql-client';
  import { authStore } from '$lib/stores/auth.svelte';
  import { GCTextField, GCTextArea, GCCheckbox, GCButton as Button } from '$lib/components';
  import type { Account } from '$lib/types/mastodon';
  import { resizeAvatar, resizeHeader, formatFileSize } from '$lib/utils/imageResize';
  
  let account = $state<Account | null>(null);
  let loading = $state(true);
  let saving = $state(false);
  let error = $state('');
  let successMessage = $state('');
  
  // Form fields
  let displayName = $state('');
  let note = $state('');
  let locked = $state(false);
  let bot = $state(false);
  let discoverable = $state(true);
  let fields = $state<Array<{name: string; value: string}>>([]);
  
  // File uploads - only store previews, not files
  let avatarPreview = $state('');
  let headerPreview = $state('');
  let avatarFileInfo = $state('');
  let headerFileInfo = $state('');
  let avatarInputEl: HTMLInputElement | null = null;
  let headerInputEl: HTMLInputElement | null = null;
  
  onMount(async () => {
    await loadProfile();
  });
  
  async function loadProfile() {
    loading = true;
    error = '';
    
    try {
      // Use currentUser from authStore (already loaded via GraphQL/OAuth)
      account = authStore.currentUser;
      
      if (!account) {
        throw new Error('Not logged in');
      }
      
      // Initialize form fields
      displayName = account.display_name || '';
      note = account.source?.note || stripHtml(account.note || '');
      locked = account.locked;
      bot = account.bot;
      discoverable = account.discoverable ?? true;
      avatarPreview = account.avatar;
      headerPreview = account.header;
      
      // Initialize fields (ensure we have 4 slots)
      fields = (account.fields ?? []).map(f => ({ 
        name: f.name, 
        value: stripHtml(f.value) 
      }));
      
      while (fields.length < 4) {
        fields.push({ name: '', value: '' });
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Failed to load profile';
      console.error('Failed to load profile:', err);
    } finally {
      loading = false;
    }
  }
  
  function stripHtml(html: string): string {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
  
  function handleAvatarChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    
    // Show file info
    avatarFileInfo = `${file.name} (${formatFileSize(file.size)})`;
    
    // Don't store file in state, just create preview
    // We'll get the file directly from the input when submitting
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
  
  function handleHeaderChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    
    // Show file info
    headerFileInfo = `${file.name} (${formatFileSize(file.size)})`;
    
    // Don't store file in state, just create preview
    // We'll get the file directly from the input when submitting
    const reader = new FileReader();
    reader.onload = (e) => {
      headerPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
  
  function addField() {
    if (fields.length < 4) {
      fields = [...fields, { name: '', value: '' }];
    }
  }
  
  function removeField(index: number) {
    fields = fields.filter((_, i) => i !== index);
  }

  async function handleSubmit(event: Event) {
    event.preventDefault();
    saving = true;
    error = '';
    successMessage = '';

    try {
      const adapter = await getGraphQLAdapter();

      const fieldInputs = fields
        .map((field) => ({
          name: field.name.trim(),
          value: field.value.trim(),
        }))
        .filter((field) => field.name.length > 0 || field.value.length > 0);

      const updateInput: {
        displayName?: string;
        bio?: string;
        locked?: boolean;
        bot?: boolean;
        discoverable?: boolean;
        fields?: { name: string; value: string }[];
        avatar?: string;
        header?: string;
      } = {
        displayName,
        bio: note,
        locked,
        bot,
        discoverable,
        fields: fieldInputs,
      };

      const avatarInput = avatarInputEl;
      if (avatarInput?.files?.[0]) {
        let file = avatarInput.files[0];
        if (file.size > 0) {
          file = await resizeAvatar(file);
          const upload = await uploadMediaAsset({
            file,
            filename: file.name,
            description: 'Profile avatar',
            sensitive: false,
            spoilerText: null,
            mediaType: 'IMAGE',
          });
          const avatarUrl = upload.media?.url;
          if (!avatarUrl) {
            throw new Error('Avatar upload failed');
          }
          updateInput.avatar = avatarUrl;
        }
      }

      const headerInput = headerInputEl;
      if (headerInput?.files?.[0]) {
        let file = headerInput.files[0];
        if (file.size > 0) {
          file = await resizeHeader(file);
          const upload = await uploadMediaAsset({
            file,
            filename: file.name,
            description: 'Profile header',
            sensitive: false,
            spoilerText: null,
            mediaType: 'IMAGE',
          });
          const headerUrl = upload.media?.url;
          if (!headerUrl) {
            throw new Error('Header upload failed');
          }
          updateInput.header = headerUrl;
        }
      }

      const updatedActor = await adapter.updateProfile(updateInput);
      const { getAccountService } = await import('../../../lib/api/account-service');
      const accountService = getAccountService();
      accountService.clearCache();
      const refreshedAccount = await accountService.resolveAccount(updatedActor.id);

      account = refreshedAccount;
      displayName = account.display_name || '';
      note = account.source?.note || stripHtml(account.note || '');
      locked = account.locked;
      bot = account.bot;
      discoverable = account.discoverable ?? true;
      avatarPreview = account.avatar;
      headerPreview = account.header;

      fields = (account.fields ?? []).map((f) => ({
        name: f.name,
        value: stripHtml(f.value),
      }));
      while (fields.length < 4) {
        fields.push({ name: '', value: '' });
      }

      if (authStore.currentUser?.id === account.id) {
        authStore.updateAccount(account);
      }

      successMessage = 'Profile updated successfully!';

      if (avatarInput) avatarInput.value = '';
      if (headerInput) headerInput.value = '';
      avatarFileInfo = '';
      headerFileInfo = '';
    } catch (err) {
      console.error('Failed to update profile:', err);

      if (err instanceof Error) {
        if (err.message.includes('413') || err.message.includes('Entity Too Large')) {
          error = 'Images are too large. They will be automatically resized, but if the error persists, try smaller images.';
        } else if (err.message.includes('400')) {
          error = 'Invalid request. Please check your input and try again.';
        } else {
          error = err.message;
        }
      } else {
        error = 'Failed to update profile';
      }
    } finally {
      saving = false;
    }
  }
</script>

{#if loading}
  <div class="animate-pulse">
    <div class="h-32 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
    <div class="h-20 w-20 bg-gray-300 dark:bg-gray-700 rounded-full mb-4"></div>
    <div class="space-y-3">
      <div class="h-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
      <div class="h-24 bg-gray-300 dark:bg-gray-700 rounded"></div>
    </div>
  </div>
{:else if error && !account}
  <div class="p-4 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded">
    {error}
  </div>
{:else}
  <form onsubmit={handleSubmit} class="space-y-6">
    {#if error}
      <div class="p-3 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded">
        {error}
      </div>
    {/if}
    
    {#if successMessage}
      <div class="p-3 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded">
        {successMessage}
      </div>
    {/if}
    
    <!-- Header image -->
    <div>
      <label class="block text-sm font-medium mb-2">Header Image</label>
      <div class="relative group h-32 bg-gray-200 dark:bg-gray-800 rounded overflow-hidden">
        {#if headerPreview}
          <img src={headerPreview} alt="Header preview" class="w-full h-full object-cover" />
        {/if}
        <input
          id="header-upload"
          type="file"
          accept="image/*"
          class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onchange={handleHeaderChange}
          bind:this={headerInputEl}
        />
        <div class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <span class="px-4 py-2 rounded-full bg-white dark:bg-gray-800 text-sm font-medium">Change Header</span>
        </div>
      </div>
      {#if headerFileInfo}
        <p class="text-sm text-gray-500 mt-1">{headerFileInfo} - Will be resized to 1500x500</p>
      {/if}
    </div>
    
    <!-- Avatar -->
    <div>
      <label class="block text-sm font-medium mb-2">Avatar</label>
      <div class="flex items-center gap-4">
        <div class="relative group">
          <img 
            src={avatarPreview} 
            alt="Avatar preview" 
            class="w-20 h-20 rounded-full object-cover"
          />
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onchange={handleAvatarChange}
            bind:this={avatarInputEl}
          />
          <div class="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
      </div>
      {#if avatarFileInfo}
        <p class="text-sm text-gray-500 mt-1">{avatarFileInfo} - Will be resized to 400x400</p>
      {/if}
    </div>
    
    <!-- Display name -->
    <div>
      <label for="display-name" class="block text-sm font-medium mb-1">
        Display Name
      </label>
      <input
        id="display-name"
        type="text"
        bind:value={displayName}
        maxlength="30"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
      />
    </div>
    
    <!-- Bio -->
    <div>
      <label for="bio" class="block text-sm font-medium mb-1">
        Bio
      </label>
      <textarea
        id="bio"
        bind:value={note}
        rows="4"
        maxlength="500"
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
      />
      <p class="text-sm text-gray-500 mt-1">{note.length}/500</p>
    </div>
    
    <!-- Metadata fields -->
    <div>
      <label class="block text-sm font-medium mb-2">
        Profile Metadata
      </label>
      <div class="space-y-2">
        {#each fields as field, i}
          <div class="flex gap-2">
            <input
              type="text"
              bind:value={field.name}
              placeholder="Label"
              maxlength="255"
              class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            />
            <input
              type="text"
              bind:value={field.value}
              placeholder="Content"
              maxlength="255"
              class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
            />
            {#if fields.length > 1}
              <button
                type="button"
                onclick={() => removeField(i)}
                class="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            {/if}
          </div>
        {/each}
        {#if fields.length < 4}
          <button
            type="button"
            onclick={addField}
            class="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            + Add field
          </button>
        {/if}
      </div>
    </div>
    
    <!-- Privacy settings -->
    <div class="space-y-3">
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          bind:checked={locked}
          class="rounded text-blue-600"
        />
        <span class="text-sm">Lock account (requires approval for followers)</span>
      </label>
      
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          bind:checked={bot}
          class="rounded text-blue-600"
        />
        <span class="text-sm">This is a bot account</span>
      </label>
      
      <label class="flex items-center gap-2">
        <input
          type="checkbox"
          bind:checked={discoverable}
          class="rounded text-blue-600"
        />
        <span class="text-sm">Suggest account to others</span>
      </label>
    </div>
    
    <!-- Submit button -->
    <div class="pt-4">
      <Button
        type="submit"
        loading={saving}
        disabled={saving}
        variant="primary"
      >
        Save Changes
      </Button>
    </div>
  </form>
{/if}
