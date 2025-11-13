import type { List, Account } from '$lib/types/mastodon';
import { getGraphQLAdapter } from '$lib/api/graphql-client';

interface ListMember extends Account {
  addedAt?: string;
}

/**
 * Map GraphQL list response to Mastodon List format
 */
function mapGraphQLToList(graphqlList: any): List {
  return {
    id: graphqlList.id || graphqlList.listId,
    title: graphqlList.title || graphqlList.name,
    replies_policy: graphqlList.repliesPolicy?.toLowerCase() || 'list',
    // Note: exclusive field not in Mastodon List type, omitting
  };
}

/**
 * Map GraphQL actor to Mastodon Account format for list members
 */
function mapGraphQLToAccount(actor: any): Account {
  return {
    id: actor.id,
    username: actor.preferredUsername || actor.username,
    acct: actor.webfinger || actor.acct || actor.preferredUsername,
    display_name: actor.name || actor.displayName || actor.preferredUsername,
    locked: actor.manuallyApprovesFollowers || false,
    bot: actor.type === 'Service',
    discoverable: actor.discoverable || true,
    group: actor.type === 'Group',
    created_at: actor.published || actor.createdAt || new Date().toISOString(),
    note: actor.summary || '',
    url: actor.url || actor.id,
    avatar: actor.icon?.url || '',
    avatar_static: actor.icon?.url || '',
    header: actor.image?.url || '',
    header_static: actor.image?.url || '',
    followers_count: actor.followers?.totalCount || 0,
    following_count: actor.following?.totalCount || 0,
    statuses_count: actor.outbox?.totalCount || 0,
    last_status_at: null,
    emojis: [],
    fields: actor.attachment?.filter((a: any) => a.type === 'PropertyValue').map((a: any) => ({
      name: a.name,
      value: a.value,
      verified_at: null
    })) || [],
  };
}

// Lists state management with Svelte 5 runes
class ListsStore {
  lists = $state<List[]>([]);
  listMembers = $state<Record<string, ListMember[]>>({});
  isLoading = $state(false);
  error = $state<string | null>(null);
  
  constructor() {
    // Constructor is empty to avoid SSR issues
  }
  
  initialize() {
    if (typeof window === 'undefined') return;
    
    // Load persisted state from localStorage
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
  }
  
  private persist() {
    if (typeof window === 'undefined') return;
    
    const toPersist = {
      state: {
        lists: this.lists,
        listMembers: this.listMembers
      }
    };
    localStorage.setItem('lists-storage', JSON.stringify(toPersist));
  }

  async fetchLists(): Promise<void> {
    this.isLoading = true;
    this.error = null;
    try {
      const adapter = await getGraphQLAdapter();
      const graphqlLists = await adapter.getLists();
      this.lists = graphqlLists.map(mapGraphQLToList);
      this.persist();
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
      const adapter = await getGraphQLAdapter();
      const graphqlList = await adapter.createList({
        title,
        repliesPolicy: repliesPolicy.toUpperCase() as 'FOLLOWED' | 'LIST' | 'NONE',
        exclusive: false
      });
      const newList = mapGraphQLToList(graphqlList);
      this.lists = [...this.lists, newList];
      this.persist();
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
      const adapter = await getGraphQLAdapter();
      const updateInput: any = { title };
      if (repliesPolicy) {
        updateInput.repliesPolicy = repliesPolicy.toUpperCase();
      }
      const graphqlList = await adapter.updateList(id, updateInput);
      const updated = mapGraphQLToList(graphqlList);
      this.lists = this.lists.map(list => list.id === id ? updated : list);
      this.persist();
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
      const adapter = await getGraphQLAdapter();
      await adapter.deleteList(id);
      this.lists = this.lists.filter(list => list.id !== id);
      delete this.listMembers[id];
      this.persist();
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
      const adapter = await getGraphQLAdapter();
      const graphqlMembers = await adapter.getListAccounts(listId);
      this.listMembers[listId] = graphqlMembers.map(mapGraphQLToAccount);
      this.persist();
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
      const adapter = await getGraphQLAdapter();
      await adapter.addAccountsToList(listId, accountIds);
      
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
      const adapter = await getGraphQLAdapter();
      await adapter.removeAccountsFromList(listId, accountIds);
      
      // Update local state immediately
      if (this.listMembers[listId]) {
        this.listMembers[listId] = this.listMembers[listId].filter(
          member => !accountIds.includes(member.id)
        );
      }
      this.persist();
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