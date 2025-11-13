/**
 * Secure authentication client
 * MIGRATED: Now uses browser-local encrypted storage instead of Cloudflare KV
 */

import type { OAuthToken, OAuthApp } from '$lib/types/auth';
import * as browserStorage from './browser-storage';

export class SecureAuthClient {
  private static instance: SecureAuthClient;
  private tokenCache: Map<string, { token: OAuthToken; expires: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  static getInstance(): SecureAuthClient {
    if (!SecureAuthClient.instance) {
      SecureAuthClient.instance = new SecureAuthClient();
    }
    return SecureAuthClient.instance;
  }

  /**
   * Store OAuth app credentials in browser storage
   */
  async storeApp(instance: string, app: OAuthApp): Promise<void> {
    await browserStorage.storeApp(instance, app);
  }
  
  /**
   * Get OAuth app credentials from browser storage
   */
  async getApp(instance: string): Promise<OAuthApp | null> {
    return await browserStorage.getApp(instance);
  }

  /**
   * Store OAuth token in browser storage
   */
  async storeToken(instance: string, token: OAuthToken): Promise<void> {
    await browserStorage.storeToken(instance, token);
    // Clear cache for this instance
    this.tokenCache.delete(instance);
  }

  /**
   * Get OAuth token from browser storage (with caching)
   */
  async getToken(instance: string): Promise<OAuthToken | null> {
    // Check cache first
    const cached = this.tokenCache.get(instance);
    if (cached && cached.expires > Date.now()) {
      return cached.token;
    }

    const token = await browserStorage.getToken(instance);
    
    if (token) {
      // Cache the token
      this.tokenCache.set(instance, {
        token,
        expires: Date.now() + this.CACHE_TTL
      });
    }

    return token;
  }

  /**
   * Revoke OAuth token
   */
  async revokeToken(instance: string): Promise<void> {
    await browserStorage.revokeToken(instance);
    this.tokenCache.delete(instance);
  }

  /**
   * Check if session exists for instance
   */
  async checkSession(instance: string): Promise<boolean> {
    const token = await this.getToken(instance);
    return token !== null;
  }
  
  /**
   * Clear all auth data
   */
  clearAll(): void {
    browserStorage.clearAllStorage();
    this.tokenCache.clear();
  }
}

// Export singleton instance
export const secureAuthClient = SecureAuthClient.getInstance();
