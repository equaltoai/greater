import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { List, Account } from '@/types/mastodon';
import { getClient } from '@/lib/api/client';

interface ListMember extends Account {
  addedAt?: string;
}

interface ListsState {
  lists: List[];
  listMembers: Record<string, ListMember[]>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchLists: () => Promise<void>;
  createList: (title: string, repliesPolicy?: 'followed' | 'list' | 'none') => Promise<List>;
  updateList: (id: string, title: string, repliesPolicy?: 'followed' | 'list' | 'none') => Promise<void>;
  deleteList: (id: string) => Promise<void>;
  
  // List members
  fetchListMembers: (listId: string) => Promise<void>;
  addAccountsToList: (listId: string, accountIds: string[]) => Promise<void>;
  removeAccountsFromList: (listId: string, accountIds: string[]) => Promise<void>;
  
  // Utilities
  getListById: (id: string) => List | undefined;
  isAccountInList: (listId: string, accountId: string) => boolean;
  clearError: () => void;
}

export const useListsStore = create<ListsState>()(
  devtools(
    persist(
      (set, get) => ({
        lists: [],
        listMembers: {},
        isLoading: false,
        error: null,

        fetchLists: async () => {
          set({ isLoading: true, error: null });
          try {
            const client = getClient();
            const lists = await client.lists();
            set({ lists, isLoading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch lists',
              isLoading: false 
            });
          }
        },

        createList: async (title, repliesPolicy = 'list') => {
          set({ isLoading: true, error: null });
          try {
            const client = getClient();
            const newList = await client.createList(title, repliesPolicy);
            set(state => ({ 
              lists: [...state.lists, newList],
              isLoading: false 
            }));
            return newList;
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to create list',
              isLoading: false 
            });
            throw error;
          }
        },

        updateList: async (id, title, repliesPolicy) => {
          set({ isLoading: true, error: null });
          try {
            const client = getClient();
            const updated = await client.updateList(id, title, repliesPolicy);
            set(state => ({
              lists: state.lists.map(list => list.id === id ? updated : list),
              isLoading: false
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to update list',
              isLoading: false 
            });
            throw error;
          }
        },

        deleteList: async (id) => {
          set({ isLoading: true, error: null });
          try {
            const client = getClient();
            await client.deleteList(id);
            set(state => ({
              lists: state.lists.filter(list => list.id !== id),
              listMembers: { ...state.listMembers, [id]: undefined },
              isLoading: false
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to delete list',
              isLoading: false 
            });
            throw error;
          }
        },

        fetchListMembers: async (listId) => {
          set({ isLoading: true, error: null });
          try {
            const client = getClient();
            const members = await client.listAccounts(listId, { limit: 80 });
            set(state => ({
              listMembers: { ...state.listMembers, [listId]: members },
              isLoading: false
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to fetch list members',
              isLoading: false 
            });
          }
        },

        addAccountsToList: async (listId, accountIds) => {
          set({ isLoading: true, error: null });
          try {
            const client = getClient();
            await client.addAccountsToList(listId, accountIds);
            
            // Fetch updated member list
            await get().fetchListMembers(listId);
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to add accounts to list',
              isLoading: false 
            });
            throw error;
          }
        },

        removeAccountsFromList: async (listId, accountIds) => {
          set({ isLoading: true, error: null });
          try {
            const client = getClient();
            await client.removeAccountsFromList(listId, accountIds);
            
            // Update local state immediately
            set(state => ({
              listMembers: {
                ...state.listMembers,
                [listId]: state.listMembers[listId]?.filter(
                  member => !accountIds.includes(member.id)
                ) || []
              },
              isLoading: false
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Failed to remove accounts from list',
              isLoading: false 
            });
            throw error;
          }
        },

        getListById: (id) => {
          return get().lists.find(list => list.id === id);
        },

        isAccountInList: (listId, accountId) => {
          const members = get().listMembers[listId];
          return members?.some(member => member.id === accountId) || false;
        },

        clearError: () => set({ error: null })
      }),
      {
        name: 'lists-storage',
        partialize: (state) => ({
          lists: state.lists,
          listMembers: state.listMembers
        })
      }
    )
  )
);