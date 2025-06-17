import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  normalizeInstanceUrl,
  validateInstance,
  buildAuthorizationUrl,
  registerApp
} from '@/lib/auth/oauth';

// Mock fetch
global.fetch = vi.fn();

describe('OAuth Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  describe('PKCE Generation', () => {
    it('should generate code verifier of correct length', () => {
      const verifier = generateCodeVerifier();
      expect(verifier).toHaveLength(128); // 64 bytes = 128 hex chars
    });

    it('should generate different verifiers each time', () => {
      const verifier1 = generateCodeVerifier();
      const verifier2 = generateCodeVerifier();
      expect(verifier1).not.toBe(verifier2);
    });

    it('should generate valid code challenge', async () => {
      const verifier = generateCodeVerifier();
      const challenge = await generateCodeChallenge(verifier);
      
      // Base64url encoded SHA256 should be 43 chars (no padding)
      expect(challenge).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(challenge.length).toBeGreaterThanOrEqual(43);
      expect(challenge).not.toContain('+');
      expect(challenge).not.toContain('/');
      expect(challenge).not.toContain('=');
    });
  });

  describe('Instance URL Normalization', () => {
    it('should normalize various URL formats', () => {
      expect(normalizeInstanceUrl('mastodon.social')).toBe('https://mastodon.social');
      expect(normalizeInstanceUrl('https://mastodon.social')).toBe('https://mastodon.social');
      expect(normalizeInstanceUrl('http://mastodon.social')).toBe('https://mastodon.social');
      expect(normalizeInstanceUrl('mastodon.social/')).toBe('https://mastodon.social');
      expect(normalizeInstanceUrl('MASTODON.SOCIAL')).toBe('https://mastodon.social');
      expect(normalizeInstanceUrl('  mastodon.social  ')).toBe('https://mastodon.social');
    });
  });

  describe('Instance Validation', () => {
    it('should validate valid instance', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ uri: 'mastodon.social' })
      } as Response);

      const isValid = await validateInstance('mastodon.social');
      expect(isValid).toBe(true);
      expect(fetch).toHaveBeenCalledWith('https://mastodon.social/api/v1/instance');
    });

    it('should reject invalid instance', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404
      } as Response);

      const isValid = await validateInstance('invalid.instance');
      expect(isValid).toBe(false);
    });

    it('should handle network errors', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

      const isValid = await validateInstance('mastodon.social');
      expect(isValid).toBe(false);
    });
  });

  describe('App Registration', () => {
    it('should register app successfully', async () => {
      const mockApp = {
        id: '1',
        name: 'Greater',
        client_id: 'test_client_id',
        client_secret: 'test_client_secret',
        redirect_uri: 'http://localhost:4321/auth/callback'
      };

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockApp
      } as Response);

      const app = await registerApp('mastodon.social');
      
      expect(app).toEqual(mockApp);
      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v1/apps',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
      );
      
      // Check if app was stored
      const stored = sessionStorage.getItem('app_https://mastodon.social');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(mockApp);
    });

    it('should handle registration failure', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        text: async () => 'Invalid request'
      } as Response);

      await expect(registerApp('mastodon.social')).rejects.toThrow('Failed to register app');
    });
  });

  describe('Authorization URL', () => {
    it('should build valid authorization URL', async () => {
      const mockApp = {
        client_id: 'test_client_id',
        client_secret: 'test_client_secret'
      };

      sessionStorage.setItem(
        'app_https://mastodon.social',
        JSON.stringify(mockApp)
      );

      const result = await buildAuthorizationUrl({
        instance: 'mastodon.social'
      });

      expect(result.url).toContain('https://mastodon.social/oauth/authorize');
      expect(result.url).toContain('client_id=test_client_id');
      expect(result.url).toContain('response_type=code');
      expect(result.url).toContain('code_challenge_method=S256');
      expect(result.codeVerifier).toHaveLength(128);
      expect(result.state).toHaveLength(64);

      // Check state was stored
      const storedState = sessionStorage.getItem(`oauth_state_${result.state}`);
      expect(storedState).toBeTruthy();
      const stateData = JSON.parse(storedState!);
      expect(stateData.instance).toBe('https://mastodon.social');
      expect(stateData.codeVerifier).toBe(result.codeVerifier);
    });

    it('should include custom scopes', async () => {
      sessionStorage.setItem(
        'app_https://mastodon.social',
        JSON.stringify({ client_id: 'test' })
      );

      const result = await buildAuthorizationUrl({
        instance: 'mastodon.social',
        scopes: ['read', 'write']
      });

      expect(result.url).toContain('scope=read+write');
    });

    it('should include force_login parameter', async () => {
      sessionStorage.setItem(
        'app_https://mastodon.social',
        JSON.stringify({ client_id: 'test' })
      );

      const result = await buildAuthorizationUrl({
        instance: 'mastodon.social',
        force: true
      });

      expect(result.url).toContain('force_login=true');
    });
  });
});