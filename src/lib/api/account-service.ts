/**
 * Account resolution and caching service
 * Handles different account identifier formats and resolves them to Mastodon account objects
 */

import type { Account } from '@/types/mastodon';
import { getClient } from './client';

export class AccountService {
  private accountCache = new Map<string, Account>();
  
  /**
   * Resolve any account identifier to a Mastodon account object
   * Supports: numeric IDs, usernames, webfinger addresses, and ActivityPub URLs
   */
  async resolveAccount(identifier: string): Promise<Account> {
    if (!identifier) {
      throw new Error('Account identifier is required');
    }

    // Check cache first
    if (this.accountCache.has(identifier)) {
      return this.accountCache.get(identifier)!;
    }

    let account: Account;
    
    // Handle different identifier formats
    if (/^\d+$/.test(identifier)) {
      // Already a numeric ID
      account = await this.getAccountById(identifier);
    } else if (identifier.includes('@')) {
      // Webfinger format: user@domain
      account = await this.lookupAccount(identifier);
    } else if (identifier.startsWith('http')) {
      // ActivityPub URL - extract username and try to resolve
      account = await this.resolveActivityPubUrl(identifier);
    } else {
      // Plain username (local account)
      account = await this.lookupAccount(identifier);
    }

    // Cache the result with multiple keys
    if (account) {
      this.cacheAccount(account, identifier);
    }

    return account;
  }

  /**
   * Get account by numeric ID
   */
  private async getAccountById(id: string): Promise<Account> {
    const client = getClient();
    return client.getAccount(id);
  }

  /**
   * Lookup account by username or webfinger address
   */
  private async lookupAccount(acct: string): Promise<Account> {
    const client = getClient();
    return client.lookupAccount(acct);
  }

  /**
   * Resolve ActivityPub URL to account
   */
  private async resolveActivityPubUrl(url: string): Promise<Account> {
    // First, try to extract username from URL patterns
    const patterns = [
      /https?:\/\/[^/]+\/@([^/?#]+)/,        // Mastodon style: https://server/@username
      /https?:\/\/[^/]+\/users\/([^/?#]+)/,  // ActivityPub style: https://server/users/username
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const username = match[1];
        const domain = new URL(url).hostname;
        
        // Try local first, then remote
        try {
          return await this.lookupAccount(username);
        } catch {
          try {
            return await this.lookupAccount(`${username}@${domain}`);
          } catch {
            // Continue to search fallback
          }
        }
      }
    }

    // If no pattern matches, try searching for the URL
    return this.searchAccount(url);
  }

  /**
   * Search for account by URL or query
   */
  private async searchAccount(query: string): Promise<Account> {
    const client = getClient();
    const results = await client.search({
      q: query,
      type: 'accounts',
      limit: 1,
      resolve: true
    });
    
    if (!results.accounts || results.accounts.length === 0) {
      throw new Error('Account not found');
    }
    
    return results.accounts[0];
  }

  /**
   * Cache account with multiple keys for efficient lookups
   */
  private cacheAccount(account: Account, originalIdentifier: string): void {
    // Cache by original identifier
    this.accountCache.set(originalIdentifier, account);
    
    // Cache by ID
    this.accountCache.set(account.id, account);
    
    // Cache by acct (username or user@domain)
    this.accountCache.set(account.acct, account);
    
    // Cache by username (for local lookups)
    if (!account.acct.includes('@')) {
      this.accountCache.set(account.username, account);
    }
    
    // Cache by URL if available
    if (account.url) {
      this.accountCache.set(account.url, account);
    }
  }

  /**
   * Clear the account cache
   */
  clearCache(): void {
    this.accountCache.clear();
  }

  /**
   * Get cached account count (for debugging)
   */
  getCacheSize(): number {
    return this.accountCache.size;
  }
}

// Singleton instance
let accountService: AccountService | null = null;

export function getAccountService(): AccountService {
  if (!accountService) {
    accountService = new AccountService();
  }
  return accountService;
}

/**
 * Helper function to resolve account and get statuses
 */
export async function getAccountStatuses(identifier: string, params?: Record<string, unknown>) {
  const service = getAccountService();
  const account = await service.resolveAccount(identifier);
  
  const client = getClient();
  return client.getAccountStatuses(account.id, params);
}

/**
 * Helper function to resolve account and get followers
 */
export async function getAccountFollowers(identifier: string, params?: Record<string, unknown>) {
  const service = getAccountService();
  const account = await service.resolveAccount(identifier);
  
  const client = getClient();
  return client.getAccountFollowers(account.id, params);
}

/**
 * Helper function to resolve account and get following
 */
export async function getAccountFollowing(identifier: string, params?: Record<string, unknown>) {
  const service = getAccountService();
  const account = await service.resolveAccount(identifier);
  
  const client = getClient();
  return client.getAccountFollowing(account.id, params);
}