import { create } from 'zustand';
import type { MastodonClient } from '../api/client';
import type { Account, Status, Tag } from '../../types/mastodon';

export interface SearchResults {
  accounts: Account[];
  statuses: Status[];
  hashtags: Tag[];
}

interface SearchState {
  query: string;
  results: SearchResults | null;
  loading: boolean;
  error: string | null;
  searchHistory: string[];
  activeTab: 'all' | 'accounts' | 'statuses' | 'hashtags';
  
  // Actions
  setQuery: (query: string) => void;
  setActiveTab: (tab: 'all' | 'accounts' | 'statuses' | 'hashtags') => void;
  search: (client: MastodonClient, query: string) => Promise<void>;
  clearResults: () => void;
  addToHistory: (query: string) => void;
  clearHistory: () => void;
}

const MAX_HISTORY_ITEMS = 10;

export const useSearchStore = create<SearchState>((set, get) => ({
  query: '',
  results: null,
  loading: false,
  error: null,
  searchHistory: JSON.parse(localStorage.getItem('searchHistory') || '[]'),
  activeTab: 'all',
  
  setQuery: (query) => set({ query }),
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  search: async (client, query) => {
    if (!query.trim()) {
      set({ results: null, error: null });
      return;
    }
    
    set({ loading: true, error: null });
    
    try {
      // Search API v2 provides better results
      const results = await client.search(query, {
        resolve: true,
        limit: 20
      });
      
      set({ 
        results: {
          accounts: results.accounts || [],
          statuses: results.statuses || [],
          hashtags: results.hashtags || []
        },
        loading: false 
      });
      
      // Add to history
      get().addToHistory(query);
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Search failed',
        loading: false 
      });
    }
  },
  
  clearResults: () => set({ results: null, query: '', error: null }),
  
  addToHistory: (query) => {
    const { searchHistory } = get();
    const newHistory = [
      query,
      ...searchHistory.filter(q => q !== query)
    ].slice(0, MAX_HISTORY_ITEMS);
    
    set({ searchHistory: newHistory });
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  },
  
  clearHistory: () => {
    set({ searchHistory: [] });
    localStorage.removeItem('searchHistory');
  }
}));