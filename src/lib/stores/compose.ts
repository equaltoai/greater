/**
 * Compose state management using GraphQL
 * Handles drafts, media uploads, and post creation
 */

import { atom, map, computed } from 'nanostores';
import { persistentAtom, persistentMap } from '@nanostores/persistent';
import type { CreateStatusParams, MediaAttachment, CreatePollParams, Status } from '@/types/mastodon';
import { getGraphQLAdapter, uploadMediaAsset } from '@/lib/api/graphql-client';
import type { MediaCategory } from '@/lib/api/graphql-client';
import { inferMediaCategoryFromFile, mapGraphQLMediaToAttachment } from '@/lib/mappers/media';
import { logDebug } from '@/lib/utils/logger';

const MAX_DESCRIPTION_LENGTH = 1500;
const MAX_SPOILER_LENGTH = 200;
const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/'];
const ALLOWED_MIME_TYPES = new Set(['application/pdf']);

function isMimeTypeAllowed(mime: string | undefined): boolean {
  if (!mime) {
    return false;
  }
  if (ALLOWED_MIME_TYPES.has(mime.toLowerCase())) {
    return true;
  }
  return ALLOWED_MIME_PREFIXES.some((prefix) => mime.toLowerCase().startsWith(prefix));
}

// Current compose state
export const composeText$ = atom<string>('');
export const composeVisibility$ = atom<'public' | 'unlisted' | 'private' | 'direct'>('public');
export const composeSensitive$ = atom<boolean>(false);
export const composeSpoilerText$ = atom<string>('');
export const composeReplyTo$ = atom<string | null>(null);
export const composeMedia$ = atom<MediaAttachment[]>([]);
export const composePoll$ = atom<CreatePollParams | null>(null);
export const composeLanguage$ = atom<string | null>(null);
export const composeDefaultMediaType$ = atom<MediaCategory>('IMAGE');
export const composeMediaWarnings$ = atom<Record<string, string[]>>({});

// UI state
export const isComposing$ = atom<boolean>(false);
export const isUploading$ = atom<boolean>(false);
export const uploadProgress$ = atom<number>(0);
export const composeError$ = atom<string | null>(null);

// Drafts (persisted)
export interface Draft {
  id: string;
  text: string;
  visibility: 'public' | 'unlisted' | 'private' | 'direct';
  sensitive: boolean;
  spoilerText: string;
  replyTo: string | null;
  mediaIds: string[];
  poll: CreatePollParams | null;
  createdAt: number;
  updatedAt: number;
}

// Use persistentAtom with JSON serialization for complex objects
export const drafts$ = persistentAtom<Record<string, Draft>>('drafts', {}, {
  encode: JSON.stringify,
  decode: JSON.parse
});

// Computed values
export const currentDraftId$ = atom<string | null>(null);

export const currentDraft$ = computed([currentDraftId$, drafts$], (id, drafts) => {
  return id ? drafts[id] : null;
});

export const sortedDrafts$ = computed([drafts$], (drafts) => {
  return Object.values(drafts).sort((a, b) => b.updatedAt - a.updatedAt);
});

export const characterCount$ = computed([composeText$, composeSpoilerText$], (text, spoiler) => {
  return text.length + (spoiler ? spoiler.length : 0);
});

export const canPost$ = computed(
  [composeText$, composeMedia$, isComposing$, characterCount$],
  (text, media, isComposing, count) => {
    const hasContent = text.trim().length > 0 || media.length > 0;
    const withinLimit = count <= 500; // TODO: Get from instance config
    return hasContent && !isComposing && withinLimit;
  }
);

// Actions
export function saveDraft() {
  const id = currentDraftId$.get() || crypto.randomUUID();
  const now = Date.now();
  
  const draft: Draft = {
    id,
    text: composeText$.get(),
    visibility: composeVisibility$.get(),
    sensitive: composeSensitive$.get(),
    spoilerText: composeSpoilerText$.get(),
    replyTo: composeReplyTo$.get(),
    mediaIds: composeMedia$.get().map(m => m.id),
    poll: composePoll$.get(),
    createdAt: drafts$.get()[id]?.createdAt || now,
    updatedAt: now
  };
  
  drafts$.set({ ...drafts$.get(), [id]: draft });
  currentDraftId$.set(id);
  
  return id;
}

export function loadDraft(draftId: string) {
  const draft = drafts$.get()[draftId];
  if (!draft) return;
  
  composeText$.set(draft.text);
  composeVisibility$.set(draft.visibility);
  composeSensitive$.set(draft.sensitive);
  composeSpoilerText$.set(draft.spoilerText);
  composeReplyTo$.set(draft.replyTo);
  composePoll$.set(draft.poll);
  currentDraftId$.set(draftId);
  
  // TODO: Reload media attachments from IDs
  composeMedia$.set([]);
}

export function deleteDraft(draftId: string) {
  const drafts = { ...drafts$.get() };
  delete drafts[draftId];
  drafts$.set(drafts);
  
  if (currentDraftId$.get() === draftId) {
    clearCompose();
  }
}

export const clearCompose = () => {
  composeText$.set('');
  composeVisibility$.set('public');
  composeSensitive$.set(false);
  composeSpoilerText$.set('');
  composeReplyTo$.set(null);
  composeMedia$.set([]);
  composePoll$.set(null);
  composeLanguage$.set(null);
  composeMediaWarnings$.set({});
  currentDraftId$.set(null);
  composeError$.set(null);
};

/**
 * Upload media via GraphQL
 */
export const uploadMedia = async (
  file: File, 
  options?: {
    description?: string;
    focus?: { x: number; y: number };
    sensitive?: boolean;
    spoilerText?: string;
    mediaType?: MediaCategory | null;
  }
): Promise<MediaAttachment | null> => {
  if (composeMedia$.get().length >= 4) {
    composeError$.set('Maximum 4 media attachments allowed');
    return null;
  }
  
  isUploading$.set(true);
  uploadProgress$.set(0);
  composeError$.set(null);
  
  try {
    const detectedCategory = inferMediaCategoryFromFile(file);
    const defaultCategory = composeDefaultMediaType$.get() ?? 'IMAGE';
    const selectedMediaType = options?.mediaType ?? detectedCategory ?? defaultCategory ?? null;
    const selectedSensitive = options?.sensitive ?? composeSensitive$.get();
    const selectedSpoiler = options?.spoilerText ?? composeSpoilerText$.get();
    const trimmedDescription = options?.description?.trim();

    if (!isMimeTypeAllowed(file.type)) {
      composeError$.set(`Unsupported file type: ${file.type || 'unknown'}`);
      return null;
    }

    if (selectedSpoiler && selectedSpoiler.length > MAX_SPOILER_LENGTH) {
      composeError$.set(`Spoiler text cannot exceed ${MAX_SPOILER_LENGTH} characters`);
      return null;
    }

    if (trimmedDescription && trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
      composeError$.set(`Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters`);
      return null;
    }
    
    logDebug('[Compose] Uploading media:', {
      filename: file.name,
      type: file.type,
      size: file.size,
      sensitive: selectedSensitive,
      hasSpoiler: !!selectedSpoiler,
      mediaType: selectedMediaType,
    });
    
    const response = await uploadMediaAsset({
      file,
      filename: file.name,
      description: trimmedDescription,
      focus: options?.focus,
      sensitive: selectedSensitive,
      spoilerText: selectedSpoiler,
      mediaType: selectedMediaType,
    });
    
    logDebug('[Compose] Upload successful:', {
      uploadId: response.uploadId,
      mediaId: response.media.id,
      warnings: response.warnings,
    });
    
    // Map GraphQL media to MediaAttachment
    const attachment: MediaAttachment = mapGraphQLMediaToAttachment(response.media, response.warnings);
    
    composeMedia$.set([...composeMedia$.get(), attachment]);
    uploadProgress$.set(100);
    
    // Show warnings if any
    if (response.warnings?.length) {
      console.warn('[Compose] Upload warnings:', response.warnings);
    }

    const warningsMap = { ...composeMediaWarnings$.get() };
    if (response.warnings?.length) {
      warningsMap[attachment.id] = response.warnings;
    } else {
      delete warningsMap[attachment.id];
    }
    composeMediaWarnings$.set(warningsMap);
    
    return attachment;
  } catch (error) {
    console.error('[Compose] Upload error:', error);
    composeError$.set(error instanceof Error ? error.message : 'Upload failed');
    return null;
  } finally {
    isUploading$.set(false);
    uploadProgress$.set(0);
  }
};

export const removeMedia = (attachmentId: string) => {
  composeMedia$.set(composeMedia$.get().filter(m => m.id !== attachmentId));
  const warnings = { ...composeMediaWarnings$.get() };
  if (warnings[attachmentId]) {
    delete warnings[attachmentId];
    composeMediaWarnings$.set(warnings);
  }
};

/**
 * Map Mastodon visibility to GraphQL visibility
 */
function mapVisibilityToGraphQL(visibility: 'public' | 'unlisted' | 'private' | 'direct'): 'PUBLIC' | 'UNLISTED' | 'FOLLOWERS' | 'DIRECT' {
  const visibilityMap = {
    'public': 'PUBLIC' as const,
    'unlisted': 'UNLISTED' as const,
    'private': 'FOLLOWERS' as const,
    'direct': 'DIRECT' as const,
  };
  
  return visibilityMap[visibility];
}

/**
 * Map GraphQL response to Mastodon Status
 */
function mapGraphQLToStatus(obj: any): Status {
  const attachments = (obj.attachments || []).map((a: any) => mapGraphQLMediaToAttachment(a));

  return {
    id: obj.id,
    uri: obj.id,
    url: obj.id,
    created_at: obj.published || obj.createdAt || new Date().toISOString(),
    account: {
      id: obj.attributedTo?.id || obj.author?.id || 'unknown',
      username: obj.attributedTo?.preferredUsername || obj.author?.preferredUsername || 'unknown',
      acct: obj.attributedTo?.webfinger || obj.author?.webfinger || 'unknown',
      display_name: obj.attributedTo?.name || obj.author?.name || 'Unknown',
      avatar: obj.attributedTo?.icon?.url || obj.author?.icon?.url || '',
      header: obj.attributedTo?.image?.url || obj.author?.image?.url || '',
    } as any,
    content: obj.content || '',
    visibility: (obj.visibility?.toLowerCase() || 'public') as any,
    sensitive: obj.sensitive ?? false,
    spoiler_text: obj.summary ?? obj.spoilerText ?? '',
    media_attachments: attachments,
    mentions: [],
    tags: [],
    emojis: [],
    reblogs_count: obj.shares?.totalCount || obj.sharesCount || 0,
    favourites_count: obj.likes?.totalCount || obj.likesCount || 0,
    replies_count: obj.replies?.totalCount || obj.repliesCount || 0,
    reblogged: obj.userInteractions?.shared || false,
    favourited: obj.userInteractions?.liked || false,
    bookmarked: obj.userInteractions?.bookmarked || false,
    reblog: null,
    in_reply_to_id: obj.inReplyTo?.id || null,
    in_reply_to_account_id: null,
    application: null as any,
    language: obj.language || null,
    muted: false,
    poll: null,
    card: null,
    edited_at: obj.updated || null,
  };
}

// Post creation using GraphQL
export const createPost = async (): Promise<Status | null> => {
  if (!canPost$.get()) return null;
  
  isComposing$.set(true);
  composeError$.set(null);
  
  try {
    const adapter = await getGraphQLAdapter();
    
    // Check if online
    if (!navigator.onLine) {
      // Add to offline queue
      const { offlineStore } = await import('./offline.svelte');
      const params: CreateStatusParams = {
        status: composeText$.get(),
        visibility: composeVisibility$.get(),
        sensitive: composeSensitive$.get(),
        spoiler_text: composeSpoilerText$.get() || undefined,
        in_reply_to_id: composeReplyTo$.get() || undefined,
        media_ids: composeMedia$.get().map(m => m.id),
        language: composeLanguage$.get() || undefined,
        poll: composePoll$.get() || undefined
      };
      offlineStore.addPost(params);
      
      composeError$.set('You\'re offline. Your post will be sent when you\'re back online.');
      
      // Clear compose after queueing
      clearCompose();
      
      // Delete draft if it was saved
      const draftId = currentDraftId$.get();
      if (draftId) {
        deleteDraft(draftId);
      }
      
      return null; // Return null for offline posts
    }
    
    // Build GraphQL variables
    const variables: any = {
      content: composeText$.get(),
      visibility: mapVisibilityToGraphQL(composeVisibility$.get()),
      sensitive: composeSensitive$.get(),
    };
    
    if (composeSpoilerText$.get()) {
      variables.summary = composeSpoilerText$.get();
    }
    
    if (composeReplyTo$.get()) {
      variables.inReplyTo = composeReplyTo$.get();
    }
    
    if (composeMedia$.get().length > 0) {
      // Add media IDs to the create note variables
      variables.mediaIds = composeMedia$.get().map(m => m.id);
    }
    
    if (composePoll$.get()) {
      // Poll support - map to GraphQL format
      const poll = composePoll$.get()!;
      variables.poll = {
        options: poll.options,
        expiresIn: poll.expires_in,
        multiple: poll.multiple || false,
      };
    }
    
    if (composeLanguage$.get()) {
      variables.language = composeLanguage$.get();
    }
    
    // Create note via GraphQL
    const response = await adapter.createNote(variables);
    
    // Map response to Status
    const status = mapGraphQLToStatus(response.object);
    
    // Clear compose on success
    clearCompose();
    
    // Delete draft if it was saved
    const draftId = currentDraftId$.get();
    if (draftId) {
      deleteDraft(draftId);
    }
    
    return status;
  } catch (error) {
    console.error('[Compose] Error creating post:', error);
    
    // If network error, add to offline queue
    if (error instanceof Error && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('Network request failed') ||
         error.message.includes('NetworkError'))) {
      const { offlineStore } = await import('./offline.svelte');
      const params: CreateStatusParams = {
        status: composeText$.get(),
        visibility: composeVisibility$.get(),
        sensitive: composeSensitive$.get(),
        spoiler_text: composeSpoilerText$.get() || undefined,
        in_reply_to_id: composeReplyTo$.get() || undefined,
        media_ids: composeMedia$.get().map(m => m.id),
        language: composeLanguage$.get() || undefined,
        poll: composePoll$.get() || undefined
      };
      offlineStore.addPost(params);
      
      composeError$.set('Network error. Your post has been queued and will be sent when connection is restored.');
      
      // Clear compose after queueing
      clearCompose();
      
      return null;
    }
    
    composeError$.set(error instanceof Error ? error.message : 'Failed to post');
    return null;
  } finally {
    isComposing$.set(false);
  }
};

// Auto-save drafts
let autoSaveTimeout: number;

composeText$.subscribe(() => {
  clearTimeout(autoSaveTimeout);
  autoSaveTimeout = setTimeout(() => {
    if (composeText$.get().trim()) {
      saveDraft();
    }
  }, 2000) as unknown as number;
});
