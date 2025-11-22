import type { ComposeHandlers, ComposeAttachment, PostVisibility } from '$lib/gc';
import { getGraphQLAdapter, uploadMediaAsset } from '$lib/api/graphql-client';
import { logDebug, logError } from '$lib/utils/logger';
import type { MediaCategory } from '@equaltoai/greater-components/adapters';

export interface ComposeHandlerOptions {
  onSuccess?: (status: unknown) => void | Promise<void>;
  onError?: (error: Error) => void;
}

// Define the structure based on the type error hint
interface ComposeSubmitData {
  content: string;
  visibility: PostVisibility;
  contentWarning?: string;
  mediaAttachments?: ComposeAttachment[];
  inReplyTo?: string;
  quoteUrl?: string;
  [key: string]: any; 
}

export function createGraphQLComposeHandlers(options: ComposeHandlerOptions = {}): ComposeHandlers {
  return {
    onSubmit: async (data: ComposeSubmitData) => {
      try {
        const adapter = await getGraphQLAdapter();
        
        const visibilityMap: Record<PostVisibility, 'PUBLIC' | 'UNLISTED' | 'FOLLOWERS' | 'DIRECT'> = {
          public: 'PUBLIC',
          unlisted: 'UNLISTED',
          private: 'FOLLOWERS',
          direct: 'DIRECT',
        };

        // Ensure media IDs are strings
        const mediaIds = data.mediaAttachments?.map(m => m.id || '').filter(id => id !== '') ?? [];

        const input: any = {
          content: data.content,
          visibility: visibilityMap[data.visibility] || 'PUBLIC',
          sensitive: !!data.contentWarning,
          spoilerText: data.contentWarning || undefined,
          mediaIds: mediaIds.length > 0 ? mediaIds : undefined,
          language: data.language || undefined,
        };
        
        if (data.inReplyTo) {
            input.inReplyToId = data.inReplyTo;
        }

        if (data.poll) {
            input.poll = {
                options: data.poll.options,
                expiresIn: data.poll.expiresIn,
                multiple: data.poll.multiple,
                hideTotals: data.poll.hideTotals,
            };
        }

        logDebug('[Compose] Submitting post', input);
        const result = await adapter.createNote(input);
        
        if (options.onSuccess) {
          await options.onSuccess(result.object);
        }
      } catch (error) {
        logError('[Compose] Submit failed', error);
        if (options.onError && error instanceof Error) {
          options.onError(error);
        }
        throw error;
      }
    },
    // Use any to bypass strict type check on MediaAttachment import location
    onMediaUpload: async (file: File): Promise<any> => {
      try {
        logDebug('[Compose] Uploading file', file.name);
        // Infer category or let backend handle it
        let mediaType: MediaCategory = 'IMAGE';
        if (file.type.startsWith('video')) mediaType = 'VIDEO';
        if (file.type.startsWith('audio')) mediaType = 'AUDIO';

        const result = await uploadMediaAsset({
          file,
          mediaType
        });

        return {
            id: result.media.id,
            type: String(result.media.type).toUpperCase() === 'VIDEO' ? 'video' : 'image',
            url: result.media.url || '',
            previewUrl: result.media.previewUrl || result.media.url || '',
            description: result.media.description || '',
            // Map other fields if necessary, currently matching ComposeAttachment
            blurhash: result.media.blurhash,
        };
      } catch (error) {
        logError('[Compose] Upload failed', error);
        throw error;
      }
    },
    onMediaRemove: async (id: string) => {
      logDebug('[Compose] Media removed', id);
    },
  };
}
