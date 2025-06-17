import type { List, Account } from '@/types/mastodon';
import { getClient } from '@/lib/api/client';

interface ListMember extends Account {
  addedAt?: string;
}

// Lists state management with Svelte 5 runes
class ListsStore {
  lists = $state<List[]>([]);
  listMembers = $state<Record<string, ListMember[]>>({});
  isLoading = $state(false);
  error = $state<string | null>(null);
  
  constructor() {
    // Load persisted state from localStorage
    if (typeof window !== 'undefined') {
      const savedState = localStorage.getItem('lists-storage');
      if (savedState) {
        try {
          const parsed = JSON.parse(savedState);
          if (parsed.state) {
            this.lists = parsed.state.lists || [];
            this.listMembers = parsed.state.listMembers || {};
          }
        } catch (e) {
          console.error('Failed to load lists state:', e);
        }
      }
      
      // Persist state changes to localStorage
      $effect(() => {
        const toPersist = {
          state: {
            lists: this.lists,
            listMembers: this.listMembers
          }
        };
        localStorage.setItem('lists-storage', JSON.stringify(toPersist));
      });
    }
  }

  async fetchLists(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      const client = getClient();
      const lists = await client.getLists();
      this.lists = lists;
      this.isLoading = false;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to fetch lists';
      this.isLoading = false;
    }
  }

  async createList(title: string, repliesPolicy: 'followed' | 'list' | 'none' = 'list'): Promise<List> {
    this.isLoading = true;
    this.error = null;
    try {
      const client = getClient();
      const newList = await client.createList(title, { replies_policy: repliesPolicy });
      this.lists = [...this.lists, newList];
      this.isLoading = false;
      return newList;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to create list';
      this.isLoading = false;
      throw error;
    }
  }

  async updateList(id: string, title: string, repliesPolicy?: 'followed' | 'list' | 'none'): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      const client = getClient();
      const updated = await client.updateList(id, title, repliesPolicy ? { replies_policy: repliesPolicy } : undefined);
      this.lists = this.lists.map(list => list.id === id ? updated : list);
      this.isLoading = false;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to update list';
      this.isLoading = false;
      throw error;
    }
  }

  async deleteList(id: string): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      const client = getClient();
      await client.deleteList(id);
      this.lists = this.lists.filter(list => list.id !== id);
      delete this.listMembers[id];
      this.isLoading = false;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to delete list';
      this.isLoading = false;
      throw error;
    }
  }

  async fetchListMembers(listId: string): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      const client = getClient();
      const members = await client.getListAccounts(listId, { limit: 80 });
      this.listMembers[listId] = members;
      this.isLoading = false;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to fetch list members';
      this.isLoading = false;
    }
  }

  async addAccountsToList(listId: string, accountIds: string[]): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      const client = getClient();
      await client.addAccountsToList(listId, accountIds);
      
      // Fetch updated member list
      await this.fetchListMembers(listId);
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to add accounts to list';
      this.isLoading = false;
      throw error;
    }
  }

  async removeAccountsFromList(listId: string, accountIds: string[]): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      const client = getClient();
      await client.removeAccountsFromList(listId, accountIds);
      
      // Update local state immediately
      if (this.listMembers[listId]) {
        this.listMembers[listId] = this.listMembers[listId].filter(
          member => !accountIds.includes(member.id)
        );
      }
      this.isLoading = false;
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'Failed to remove accounts from list';
      this.isLoading = false;
      throw error;
    }
  }

  getListById(id: string): List | undefined {
    return this.lists.find(list => list.id === id);
  }

  isAccountInList(listId: string, accountId: string): boolean {
    const members = this.listMembers[listId];
    return members?.some(member => member.id === accountId) || false;
  }

  clearError(): void {
    this.error = null;
  }
}

// Create singleton instance
export const listsStore = new ListsStore();