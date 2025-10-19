import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  uploadMedia,
  composeMedia$,
  composeMediaWarnings$,
  composeError$,
  composeSensitive$,
  composeSpoilerText$,
  composeDefaultMediaType$,
} from '@/lib/stores/compose';

import type { UploadMediaPayload } from '@/lib/api/graphql-client';

vi.mock('@/lib/api/graphql-client', () => ({
  uploadMediaAsset: vi.fn(),
}));

const { uploadMediaAsset } = await import('@/lib/api/graphql-client');
const uploadMediaAssetMock = uploadMediaAsset as unknown as ReturnType<typeof vi.fn>;

const createBlob = (type: string, name: string) =>
  Object.assign(new Blob(['test'], { type }), { name }) as File;

const mockPayload = (overrides: Partial<UploadMediaPayload['media']> = {}): UploadMediaPayload => ({
  uploadId: 'upload-1',
  warnings: ['low bitrate'],
  media: {
    id: 'media-1',
    url: 'https://cdn.example/media.mp4',
    previewUrl: 'https://cdn.example/media-preview.jpg',
    description: 'alt text',
    sensitive: true,
    spoilerText: 'cw',
    mediaCategory: 'VIDEO',
    type: 'VIDEO',
    mimeType: 'video/mp4',
    width: 1920,
    height: 1080,
    duration: 12,
    blurhash: 'hash',
    ...overrides,
  },
});

beforeEach(() => {
  vi.resetAllMocks();
  composeMedia$.set([]);
  composeMediaWarnings$.set({});
  composeError$.set(null);
  composeSensitive$.set(false);
  composeSpoilerText$.set('');
  composeDefaultMediaType$.set('IMAGE');
});

describe('uploadMedia', () => {
  it('uploads media with metadata and records warnings', async () => {
    const file = createBlob('video/mp4', 'clip.mp4');
    const payload = mockPayload();

    uploadMediaAssetMock.mockResolvedValue(payload);

    const attachment = await uploadMedia(file, {
      description: 'alt text',
      spoilerText: 'cw',
      sensitive: true,
      mediaType: 'VIDEO',
    });

    expect(uploadMediaAssetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        file,
        description: 'alt text',
        spoilerText: 'cw',
        sensitive: true,
        mediaType: 'VIDEO',
      })
    );

    expect(attachment).not.toBeNull();
    expect(composeMedia$.get()).toHaveLength(1);
    expect(composeMediaWarnings$.get()[payload.media.id]).toEqual(payload.warnings);
    expect(composeError$.get()).toBeNull();
  });

  it('rejects unsupported mime types', async () => {
    const file = createBlob('application/x-msdownload', 'malware.exe');

    const result = await uploadMedia(file);

    expect(result).toBeNull();
    expect(uploadMediaAssetMock).not.toHaveBeenCalled();
    expect(composeError$.get()).toMatch(/unsupported file type/i);
  });

  it('enforces spoiler and description limits', async () => {
    const file = createBlob('image/png', 'image.png');

    const longSpoiler = 'x'.repeat(205);
    const longDescription = 'y'.repeat(1600);

    const spoilerResult = await uploadMedia(file, { spoilerText: longSpoiler });
    expect(spoilerResult).toBeNull();
    expect(composeError$.get()).toMatch(/spoiler text cannot exceed/i);

    composeError$.set(null);

    const descriptionResult = await uploadMedia(file, { description: longDescription });
    expect(descriptionResult).toBeNull();
    expect(composeError$.get()).toMatch(/description cannot exceed/i);

    expect(uploadMediaAsset).not.toHaveBeenCalled();
  });
});
