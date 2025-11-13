import type { AttachmentType, MediaAttachment } from '$lib/types/mastodon';
import type { MediaCategory } from '@equaltoai/greater-components/adapters';

type GraphQLMediaNode = {
  id?: string | null;
  url?: string | null;
  previewUrl?: string | null;
  remoteUrl?: string | null;
  textUrl?: string | null;
  description?: string | null;
  sensitive?: boolean | null;
  spoilerText?: string | null;
  mediaCategory?: MediaCategory | string | null;
  type?: MediaCategory | string | null;
  mimeType?: string | null;
  blurhash?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  size?: number | null;
};

type LegacyMediaNode = {
  preview_url?: string | null;
  remote_url?: string | null;
  text_url?: string | null;
  spoiler_text?: string | null;
};

const CATEGORY_TO_ATTACHMENT: Record<string, AttachmentType> = {
  IMAGE: 'image',
  VIDEO: 'video',
  AUDIO: 'audio',
  GIFV: 'gifv',
  DOCUMENT: 'unknown',
  UNKNOWN: 'unknown'
};

const VIDEO_EXTENSIONS = new Set(['mp4', 'mov', 'm4v', 'webm', 'mkv']);
const AUDIO_EXTENSIONS = new Set(['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a']);
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'bmp', 'heic', 'heif', 'avif']);
const DOCUMENT_EXTENSIONS = new Set(['pdf', 'txt', 'md']);

/**
 * Map a GraphQL media node into a Mastodon-style MediaAttachment.
 * Captures Lesser-specific metadata in the attachment meta bag.
 */
export function mapGraphQLMediaToAttachment(
  media: GraphQLMediaNode | null | undefined,
  warnings: string[] | null | undefined = undefined
): MediaAttachment {
  if (!media) {
    return {
      id: '',
      type: 'unknown',
      url: '',
      preview_url: '',
      remote_url: null,
      description: null,
      blurhash: null,
      meta: warnings?.length ? { warnings: [...warnings] } : undefined
    };
  }

  const legacy = media as LegacyMediaNode;
  const snakePreview = legacy.preview_url ?? undefined;
  const snakeRemote = legacy.remote_url ?? undefined;
  const snakeText = legacy.text_url ?? undefined;
  const snakeSpoiler = legacy.spoiler_text ?? undefined;

  const mediaUrl = typeof media.url === 'string' ? media.url : '';
  const previewUrl =
    (typeof media.previewUrl === 'string' && media.previewUrl.length > 0
      ? media.previewUrl
      : snakePreview) || mediaUrl;

  const resolvedCategory = normalizeMediaCategory(media.mediaCategory ?? media.type, media.mimeType);
  const attachmentType = CATEGORY_TO_ATTACHMENT[resolvedCategory] ?? 'unknown';

  const width = typeof media.width === 'number' ? media.width : null;
  const height = typeof media.height === 'number' ? media.height : null;
  const duration = typeof media.duration === 'number' ? media.duration : null;

  const originalMeta =
    width !== null || height !== null || duration !== null
      ? {
          width: width ?? 0,
          height: height ?? 0,
          size: width && height ? `${width}x${height}` : undefined,
          aspect: width && height ? width / height : undefined,
          duration: duration ?? undefined
        }
      : undefined;

  const meta: NonNullable<MediaAttachment['meta']> = {};

  if (originalMeta) {
    meta.original = originalMeta;
  }

  meta.media_category = resolvedCategory;

  if (media.mimeType) {
    meta.mime_type = media.mimeType;
  }

  if (typeof media.type === 'string') {
    meta.media_type = media.type;
  }

  if (warnings && warnings.length > 0) {
    meta.warnings = [...warnings];
  }

  return {
    id: typeof media.id === 'string' && media.id.length > 0 ? media.id : mediaUrl || `upload-${Date.now()}`,
    type: attachmentType,
    url: mediaUrl,
    preview_url: previewUrl || mediaUrl,
    remote_url: snakeRemote ?? media.remoteUrl ?? (mediaUrl || null),
    text_url: snakeText ?? media.textUrl ?? (mediaUrl || undefined),
    meta: Object.keys(meta).length > 0 ? meta : undefined,
    description: media.description ?? null,
    blurhash: media.blurhash ?? null,
    sensitive: typeof media.sensitive === 'boolean' ? media.sensitive : undefined,
    spoiler_text: media.spoilerText ?? snakeSpoiler ?? null
  };
}

/**
 * Attempt to infer the Lesser GraphQL media category from a File or Blob.
 */
export function inferMediaCategoryFromFile(
  file: Pick<File, 'type' | 'name'> | { type?: string; name?: string } | null | undefined
): MediaCategory | null {
  if (!file) return null;
  if (file.type) {
    return inferMediaCategoryFromMime(file.type);
  }
  if (file.name) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext) return null;
    if (IMAGE_EXTENSIONS.has(ext)) return 'IMAGE';
    if (ext === 'gif') return 'GIFV';
    if (VIDEO_EXTENSIONS.has(ext)) return 'VIDEO';
    if (AUDIO_EXTENSIONS.has(ext)) return 'AUDIO';
    if (DOCUMENT_EXTENSIONS.has(ext)) return 'DOCUMENT';
  }
  return null;
}

/**
 * Normalize GraphQL media category strings.
 */
export function normalizeMediaCategory(
  category: MediaCategory | string | null | undefined,
  mimeType?: string | null | undefined
): MediaCategory {
  const normalized = typeof category === 'string' ? category.toUpperCase() : null;
  if (normalized && CATEGORY_TO_ATTACHMENT[normalized]) {
    return normalized as MediaCategory;
  }
  if (mimeType) {
    return inferMediaCategoryFromMime(mimeType) ?? 'UNKNOWN';
  }
  return 'UNKNOWN';
}

function inferMediaCategoryFromMime(mime: string | null | undefined): MediaCategory | null {
  if (!mime) return null;
  const normalized = mime.toLowerCase();
  if (normalized.startsWith('image/')) {
    return normalized === 'image/gif' ? 'GIFV' : 'IMAGE';
  }
  if (normalized.startsWith('video/')) {
    return 'VIDEO';
  }
  if (normalized.startsWith('audio/')) {
    return 'AUDIO';
  }
  if (normalized === 'application/pdf' || normalized === 'text/plain' || normalized === 'text/markdown') {
    return 'DOCUMENT';
  }
  return null;
}
