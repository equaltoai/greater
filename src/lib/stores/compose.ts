/**
 * Compose state management using Nanostores
 * Handles drafts, media uploads, and post creation
 */

import { atom, map, computed } from 'nanostores';
import { persistentAtom, persistentMap } from '@nanostores/persistent';
import type { CreateStatusParams, MediaAttachment, CreatePollParams } from '@/types/mastodon';
import { getClient } from '@/lib/api/client';

// Current compose state
export const composeText$ = atom<string>('');
export const composeVisibility$ = atom<'public' | 'unlisted' | 'private' | 'direct'>('public');
export const composeSensitive$ = atom<boolean>(false);
export const composeSpoilerText$ = atom<string>('');
export const composeReplyTo$ = atom<string | null>(null);
export const composeMedia$ = atom<MediaAttachment[]>([]);
export const composePoll$ = atom<CreatePollParams | null>(null);
export const composeLanguage$ = atom<string | null>(null);

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
  currentDraftId$.set(null);
  composeError$.set(null);
};

// Media upload
export const uploadMedia = async (file: File): Promise<MediaAttachment | null> => {
  if (composeMedia$.get().length >= 4) {
    composeError$.set('Maximum 4 media attachments allowed');
    return null;
  }
  
  isUploading$.set(true);
  uploadProgress$.set(0);
  composeError$.set(null);
  
  try {
    const client = getClient();
    
    // TODO: Add progress tracking
    const attachment = await client.uploadMedia(file);
    
    composeMedia$.set([...composeMedia$.get(), attachment]);
    uploadProgress$.set(100);
    
    return attachment;
  } catch (error) {
    composeError$.set(error instanceof Error ? error.message : 'Upload failed');
    return null;
  } finally {
    isUploading$.set(false);
    uploadProgress$.set(0);
  }
};

export const removeMedia = (attachmentId: string) => {
  composeMedia$.set(composeMedia$.get().filter(m => m.id !== attachmentId));
};

// Post creation
export const createPost = async (): Promise<boolean> => {
  if (!canPost$.get()) return false;
  
  isComposing$.set(true);
  composeError$.set(null);
  
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
  
  try {
    const client = getClient();
    
    // Check if online
    if (!navigator.onLine) {
      // Add to offline queue
      const { offlineStore } = await import('./offline');
      const postId = offlineStore.addPost(params);
      
      composeError$.set('You\'re offline. Your post will be sent when you\'re back online.');
      
      // Clear compose after queueing
      clearCompose();
      
      // Delete draft if it was saved
      const draftId = currentDraftId$.get();
      if (draftId) {
        deleteDraft(draftId);
      }
      
      return true;
    }
    
    await client.createStatus(params);
    
    // Clear compose on success
    clearCompose();
    
    // Delete draft if it was saved
    const draftId = currentDraftId$.get();
    if (draftId) {
      deleteDraft(draftId);
    }
    
    return true;
  } catch (error) {
    // If network error, add to offline queue
    if (error instanceof Error && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('Network request failed'))) {
      const { offlineStore } = await import('./offline');
      offlineStore.addPost(params);
      
      composeError$.set('Network error. Your post has been queued and will be sent when connection is restored.');
      
      // Clear compose after queueing
      clearCompose();
      
      return true;
    }
    
    composeError$.set(error instanceof Error ? error.message : 'Failed to post');
    return false;
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