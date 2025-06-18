import type { MastodonClient } from '../api/client';
import type { Account, Status, Tag } from '../../types/mastodon';

export interface SearchResults {
  accounts: Account[];
  statuses: Status[];
  hashtags: Tag[];
}

const MAX_HISTORY_ITEMS = 10;

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
        console.error('Failed to load search history:', e);
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
  async search(client: MastodonClient, query: string): Promise<void> {
    if (!query.trim()) {
      this.results = null;
      this.error = null;
      return;
    }
    
    this.loading = true;
    this.error = null;
    
    try {
      // Search API v2 provides better results
      const results = await client.search({
        q: query,
        resolve: true,
        limit: 20
      });
      
      this.results = {
        accounts: results.accounts || [],
        statuses: results.statuses || [],
        hashtags: results.hashtags || []
      };
      this.loading = false;
      
      // Add to history
      this.addToHistory(query);
    } catch (error) {
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
    const newHistory = [
      query,
      ...this.searchHistory.filter(q => q !== query)
    ].slice(0, MAX_HISTORY_ITEMS);
    
    this.searchHistory = newHistory;
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