import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MastodonClient, APIError } from '@/lib/api/client';
import type { Status, Account } from '@/types/mastodon';
import type { OAuthToken } from '@/types/auth';
import { secureAuthClient } from '@/lib/auth/secure-client';
import { globalRateLimiter } from '@/lib/api/rate-limiter';

class MockEventSource {
  url: string;
  constructor(url: string) {
    this.url = url;
  }
  close() {
    // no-op for tests
  }
}

(globalThis as any).EventSource = MockEventSource;

const createMockAccount = (overrides: Partial<Account> = {}): Account => ({
  id: '1',
  username: 'test',
  acct: 'test',
  display_name: 'Test User',
  locked: false,
  bot: false,
  discoverable: true,
  group: false,
  created_at: new Date().toISOString(),
  note: '',
  url: 'https://mastodon.social/@test',
  avatar: 'https://example.com/avatar.png',
  avatar_static: 'https://example.com/avatar.png',
  header: 'https://example.com/header.png',
  header_static: 'https://example.com/header.png',
  followers_count: 0,
  following_count: 0,
  statuses_count: 0,
  last_status_at: null,
  emojis: [],
  fields: [],
  ...overrides,
});

const createMockStatus = (overrides: Partial<Status> = {}): Status => ({
  id: '1',
  created_at: new Date().toISOString(),
  in_reply_to_id: null,
  in_reply_to_account_id: null,
  sensitive: false,
  spoiler_text: '',
  visibility: 'public',
  language: 'en',
  uri: 'https://mastodon.social/@test/1',
  url: 'https://mastodon.social/@test/1',
  replies_count: 0,
  reblogs_count: 0,
  favourites_count: 0,
  edited_at: null,
  content: '<p>Test</p>',
  reblog: null,
  application: null,
  account: createMockAccount(),
  media_attachments: [],
  mentions: [],
  tags: [],
  emojis: [],
  card: null,
  poll: null,
  favourited: false,
  reblogged: false,
  muted: false,
  bookmarked: false,
  pinned: false,
  filtered: null,
  delivery_cost: undefined,
  community_notes: undefined,
  ai_analysis: undefined,
  ...overrides,
});

const mockToken: OAuthToken = {
  access_token: 'test-token',
  token_type: 'Bearer',
  scope: 'read write',
  created_at: Date.now(),
};

const mockJsonResponse = <T>(data: T, init: Partial<Response> = {}): Response =>
  ({
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => data,
    text: async () => JSON.stringify(data),
    ...init,
  }) as unknown as Response;

const mockErrorResponse = (status: number, body: unknown): Response =>
  ({
    ok: false,
    status,
    headers: new Headers(),
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  }) as unknown as Response;

describe('MastodonClient', () => {
  let client: MastodonClient;

  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn();
    globalRateLimiter.clearAll();
    vi.spyOn(secureAuthClient, 'getToken').mockResolvedValue(mockToken);
    client = new MastodonClient('https://mastodon.social');
  });

  describe('Constructor', () => {
    it('should initialize with instance', () => {
      expect(client).toBeDefined();
    });

    it('should normalize instance URL', () => {
      const client1 = new MastodonClient('mastodon.social');
      const client2 = new MastodonClient('https://mastodon.social');
      expect(client1).toBeDefined();
      expect(client2).toBeDefined();
    });
  });

  describe('Request Method', () => {
    it('should make authenticated requests', async () => {
      const mockResponse = createMockStatus({ id: '1' });
      vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse(mockResponse));

      const result = await client.getStatus('1');

      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v1/statuses/1',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        mockErrorResponse(404, { error: 'Not found' }),
      );

      await expect(client.getStatus('1')).rejects.toThrow(APIError);
    });

    it('should cache GET requests', async () => {
      const mockResponse = createMockStatus({ id: '1' });
      vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse(mockResponse));

      await client.getStatus('1');
      expect(fetch).toHaveBeenCalledTimes(1);

      await client.getStatus('1');
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Timeline Methods', () => {
    it('should fetch home timeline', async () => {
      const mockStatuses: Status[] = [
        createMockStatus({ id: '1' }),
        createMockStatus({ id: '2' }),
      ];

      vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse(mockStatuses));

      const result = await client.getHomeTimeline({ limit: 20 });

      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v1/timelines/home?limit=20',
        expect.any(Object),
      );
      expect(result).toEqual(mockStatuses);
    });

    it('should fetch public timeline with local parameter', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse<Status[]>([]));

      await client.getLocalTimeline();

      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v1/timelines/public?local=true',
        expect.any(Object),
      );
    });
  });

  describe('Status Methods', () => {
    it('should create status', async () => {
      const mockStatus = createMockStatus({ id: '1', content: '<p>New post</p>' });
      vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse(mockStatus));

      const result = await client.createStatus({
        status: 'New post',
        visibility: 'public',
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v1/statuses',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            status: 'New post',
            visibility: 'public',
          }),
        }),
      );
      expect(result).toEqual(mockStatus);
    });

    it('should handle status actions', async () => {
      const mockStatus = createMockStatus({ id: '1', favourited: true });
      vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse(mockStatus));

      const result = await client.favouriteStatus('1');

      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v1/statuses/1/favourite',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result.favourited).toBe(true);
    });
  });

  describe('Account Methods', () => {
    it('should verify credentials', async () => {
      const mockAccount = createMockAccount({ id: '1' });
      vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse(mockAccount));

      const result = await client.verifyCredentials();

      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v1/accounts/verify_credentials',
        expect.any(Object),
      );
      expect(result).toEqual(mockAccount);
    });

    it('should follow account', async () => {
      const mockRelationship = {
        id: '1',
        following: true,
        showing_reblogs: true,
        notifying: false,
        languages: null,
        followed_by: false,
        blocking: false,
        blocked_by: false,
        muting: false,
        muting_notifications: false,
        requested: false,
        domain_blocking: false,
        endorsed: false,
        note: '',
      };

      vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse(mockRelationship));

      const result = await client.followAccount('1', { notify: true });

      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v1/accounts/1/follow',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ notify: true }),
        }),
      );
      expect(result.following).toBe(true);
    });
  });

  describe('Search', () => {
    it('should search with parameters', async () => {
      const mockResults = {
        accounts: [],
        statuses: [],
        hashtags: [],
      };

      vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse(mockResults));

      const result = await client.search({
        q: 'test',
        type: 'accounts',
        resolve: true,
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v2/search?q=test&type=accounts&resolve=true',
        expect.any(Object),
      );
      expect(result).toEqual(mockResults);
    });
  });

  describe('Media Upload', () => {
    it('should upload media file', async () => {
      const mockAttachment = {
        id: '1',
        type: 'image',
        url: 'https://example.com/image.jpg',
      };

      vi.mocked(fetch).mockResolvedValueOnce(mockJsonResponse(mockAttachment));

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await client.uploadMedia(file, {
        description: 'Test image',
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v2/media',
        expect.objectContaining({
          method: 'POST',
        }),
      );
      expect(result).toEqual(mockAttachment);
    });
  });

  describe('Streaming', () => {
    it('should create user stream', async () => {
      const stream = await client.streamUser();
      expect(stream).toBeInstanceOf(EventSource);
      expect(stream.url).toContain('/api/v1/streaming/user');
      expect(stream.url).toContain('access_token=test-token');
      stream.close();
    });

    it('should create public stream with parameters', async () => {
      const stream = await client.streamPublic({ local: true });
      expect(stream.url).toContain('/api/v1/streaming/public');
      expect(stream.url).toContain('local=true');
      stream.close();
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', async () => {
      const mockResponse = createMockStatus({ id: '1' });
      vi.mocked(fetch).mockResolvedValue(mockJsonResponse(mockResponse));

      await client.getStatus('1');
      expect(fetch).toHaveBeenCalledTimes(1);

      client.clearCache();

      await client.getStatus('1');
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});
