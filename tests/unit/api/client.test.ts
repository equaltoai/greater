import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MastodonClient, APIError } from '@/lib/api/client';
import type { Status, Account } from '@/types/mastodon';

// Mock fetch
global.fetch = vi.fn();

describe('MastodonClient', () => {
  let client: MastodonClient;
  
  beforeEach(() => {
    vi.clearAllMocks();
    client = new MastodonClient('https://mastodon.social', 'test-token');
  });

  describe('Constructor', () => {
    it('should initialize with instance and token', () => {
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
      const mockResponse = { id: '1', content: 'Test' };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      const result = await client.getStatus('1');

      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v1/statuses/1',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token',
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' })
      } as Response);

      await expect(client.getStatus('1')).rejects.toThrow(APIError);
    });

    it('should cache GET requests', async () => {
      const mockResponse = { id: '1', content: 'Test' };
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      } as Response);

      // First call
      await client.getStatus('1');
      expect(fetch).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await client.getStatus('1');
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Timeline Methods', () => {
    it('should fetch home timeline', async () => {
      const mockStatuses: Status[] = [
        { id: '1', content: 'Test 1' } as Status,
        { id: '2', content: 'Test 2' } as Status
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatuses
      } as Response);

      const result = await client.getHomeTimeline({ limit: 20 });

      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v1/timelines/home?limit=20',
        expect.any(Object)
      );
      expect(result).toEqual(mockStatuses);
    });

    it('should fetch public timeline with local parameter', async () => {
      const mockStatuses: Status[] = [];
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatuses
      } as Response);

      await client.getLocalTimeline();

      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v1/timelines/public?local=true',
        expect.any(Object)
      );
    });
  });

  describe('Status Methods', () => {
    it('should create status', async () => {
      const mockStatus = { id: '1', content: 'New post' } as Status;
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus
      } as Response);

      const result = await client.createStatus({
        status: 'New post',
        visibility: 'public'
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v1/statuses',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            status: 'New post',
            visibility: 'public'
          })
        })
      );
      expect(result).toEqual(mockStatus);
    });

    it('should handle status actions', async () => {
      const mockStatus = { id: '1', favourited: true } as Status;
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus
      } as Response);

      const result = await client.favouriteStatus('1');

      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v1/statuses/1/favourite',
        expect.objectContaining({ method: 'POST' })
      );
      expect(result.favourited).toBe(true);
    });
  });

  describe('Account Methods', () => {
    it('should verify credentials', async () => {
      const mockAccount = { 
        id: '1', 
        username: 'test',
        acct: 'test@mastodon.social'
      } as Account;

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAccount
      } as Response);

      const result = await client.verifyCredentials();

      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v1/accounts/verify_credentials',
        expect.any(Object)
      );
      expect(result).toEqual(mockAccount);
    });

    it('should follow account', async () => {
      const mockRelationship = { 
        id: '1', 
        following: true 
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockRelationship
      } as Response);

      const result = await client.followAccount('1', { notify: true });

      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v1/accounts/1/follow',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ notify: true })
        })
      );
      expect(result.following).toBe(true);
    });
  });

  describe('Search', () => {
    it('should search with parameters', async () => {
      const mockResults = {
        accounts: [],
        statuses: [],
        hashtags: []
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults
      } as Response);

      const result = await client.search({ 
        q: 'test',
        type: 'accounts',
        resolve: true
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v2/search?q=test&type=accounts&resolve=true',
        expect.any(Object)
      );
      expect(result).toEqual(mockResults);
    });
  });

  describe('Media Upload', () => {
    it('should upload media file', async () => {
      const mockAttachment = {
        id: '1',
        type: 'image',
        url: 'https://example.com/image.jpg'
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAttachment
      } as Response);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await client.uploadMedia(file, {
        description: 'Test image'
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v2/media',
        expect.objectContaining({
          method: 'POST',
          // FormData body
        })
      );
      expect(result).toEqual(mockAttachment);
    });
  });

  describe('Streaming', () => {
    it('should create user stream', () => {
      const stream = client.streamUser();
      expect(stream).toBeInstanceOf(EventSource);
      expect(stream.url).toContain('/api/v1/streaming/user');
      expect(stream.url).toContain('access_token=test-token');
      stream.close();
    });

    it('should create public stream with parameters', () => {
      const stream = client.streamPublic({ local: true });
      expect(stream.url).toContain('/api/v1/streaming/public');
      expect(stream.url).toContain('local=true');
      stream.close();
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', async () => {
      const mockResponse = { id: '1' };
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      } as Response);

      // First call
      await client.getStatus('1');
      expect(fetch).toHaveBeenCalledTimes(1);

      // Clear cache
      client.clearCache();

      // Second call should fetch again
      await client.getStatus('1');
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});