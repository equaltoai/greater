/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Search state management with GraphQL
 * Handles account, status, and hashtag search
 */

import type { Account, Status, Tag } from '$lib/types/mastodon';
import { getGraphQLAdapter } from '$lib/api/graphql-client';
import { mapGraphQLMediaToAttachment } from '$lib/mappers/media';
import { logDebug } from '$lib/utils/logger';
import { mapGraphQLActorToAccount } from '$lib/api/account-service';
import {
  resolveBookmarkedFlag,
  resolveFavouritedFlag,
  resolvePinnedFlag,
  resolveRebloggedFlag,
} from '$lib/utils/interactions';

export interface SearchResults {
  accounts: Account[];
  statuses: Status[];
  hashtags: Tag[];
}

const MAX_HISTORY_ITEMS = 10;

/**
 * Map GraphQL Object to Mastodon Status
 */
function mapGraphQLToStatus(obj: any): Status {
  return {
    id: obj.id,
    uri: obj.id,
    url: obj.id,
    created_at: obj.published || obj.createdAt || new Date().toISOString(),
    account: mapGraphQLActorToAccount(
      (obj.actor || obj.attributedTo || obj.author) ?? { id: obj.id }
    ),
    content: obj.content || '',
    visibility: (obj.visibility?.toLowerCase() || 'public') as any,
    sensitive: obj.sensitive ?? false,
    spoiler_text: obj.summary ?? obj.spoilerText ?? '',
    media_attachments: (obj.attachments || []).map((a: any) => mapGraphQLMediaToAttachment(a)),
    mentions: [],
    tags: [],
    emojis: [],
    reblogs_count: obj.shares?.totalCount || obj.sharesCount || 0,
    favourites_count: obj.likes?.totalCount || obj.likesCount || 0,
    replies_count: obj.replies?.totalCount || obj.repliesCount || 0,
    reblogged: resolveRebloggedFlag(obj),
    favourited: resolveFavouritedFlag(obj),
    bookmarked: resolveBookmarkedFlag(obj),
    pinned: resolvePinnedFlag(obj),
    reblog: obj.shareOf ? mapGraphQLToStatus(obj.shareOf) : null,
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

/**
 * Map GraphQL Hashtag to Mastodon Tag
 */
function mapGraphQLToHashtag(hashtag: any): Tag {
  if (!hashtag) {
    return { name: '', url: '', history: [] };
  }

  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

  return {
    name: hashtag.name?.replace(/^#/, '') || '', // Remove leading # if present
    url: hashtag.url || `https://${hostname}/tags/${hashtag.name}`,
    history: hashtag.history || [],
  };
}

// Search state management with Svelte 5 runes
class SearchStore {
  query = $state('');
  results = $state<SearchResults | null>(null);
  loading = $state(false);
  error = $state<string | null>(null);
  searchHistory = $state<string[]>([]);
  activeTab = $state<'all' | 'accounts' | 'statuses' | 'hashtags'>('all');

  constructor() {
    // Constructor is empty to avoid SSR issues
  }

  initialize() {
    if (typeof window === 'undefined') return;

    // Load search history from localStorage
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        this.searchHistory = JSON.parse(savedHistory);
      } catch (e) {
        console.error('[Search Store] Failed to load search history:', e);
      }
    }
  }

  private persist() {
    if (typeof window === 'undefined') return;
    localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
  }

  setQuery(query: string): void {
    this.query = query;
  }

  setActiveTab(tab: 'all' | 'accounts' | 'statuses' | 'hashtags'): void {
    this.activeTab = tab;
  }

  async search(query: string, type?: 'all' | 'accounts' | 'statuses' | 'hashtags'): Promise<void> {
    if (!query.trim()) {
      this.results = null;
      this.error = null;
      return;
    }

    this.loading = true;
    this.error = null;

    try {
      const adapter = await getGraphQLAdapter();

      // Map activeTab to GraphQL type filter
      // 'accounts' -> 'ACCOUNT', 'statuses' -> 'STATUS', 'hashtags' -> 'HASHTAG'
      let graphqlType: 'ACCOUNT' | 'STATUS' | 'HASHTAG' | undefined;
      if (type && type !== 'all') {
        const typeMap: Record<string, 'ACCOUNT' | 'STATUS' | 'HASHTAG'> = {
          accounts: 'ACCOUNT',
          statuses: 'STATUS',
          hashtags: 'HASHTAG',
        };
        graphqlType = typeMap[type];
      }

      logDebug('[Search Store] Searching:', {
        query,
        type: graphqlType || 'all',
      });

      const response = await adapter.search({
        query: query,
        type: graphqlType,
        first: 20,
        after: undefined,
      });

      logDebug('[Search Store] Results:', {
        accounts: response.accounts?.length || 0,
        statuses: response.statuses?.length || 0,
        hashtags: response.hashtags?.length || 0,
      });

      this.results = {
        accounts: (response.accounts || []).map((actor) =>
          mapGraphQLActorToAccount(actor ?? { id: 'unknown' })
        ),
        statuses: (response.statuses || []).map(mapGraphQLToStatus),
        hashtags: (response.hashtags || []).map(mapGraphQLToHashtag),
      };
      this.loading = false;

      // Add to history
      this.addToHistory(query);
    } catch (error) {
      console.error('[Search Store] Error:', error);
      this.error = error instanceof Error ? error.message : 'Search failed';
      this.loading = false;
    }
  }

  clearResults(): void {
    this.results = null;
    this.query = '';
    this.error = null;
  }

  addToHistory(query: string): void {
    const newHistory = [query, ...this.searchHistory.filter((q) => q !== query)].slice(
      0,
      MAX_HISTORY_ITEMS
    );

    this.searchHistory = newHistory;
    this.persist();
  }

  clearHistory(): void {
    this.searchHistory = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('searchHistory');
    }
  }
}

// Create singleton instance
export const searchStore = new SearchStore();
