/**
 * Authentication state management using Zustand
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { 
  AuthState, 
  AuthenticatedAccount, 
  MastodonAccount,
  OAuthToken,
  OAuthApp
} from '@/types/auth';
import { 
  buildAuthorizationUrl, 
  exchangeCodeForToken, 
  revokeToken,
  validateInstance 
} from '@/lib/auth/oauth';
import { AuthError } from '@/types/auth';
import { secureAuthClient } from '@/lib/auth/secure-client';

interface AuthStore extends AuthState {
  // Actions
  startLogin: (instance: string) => Promise<{ url: string; state: string }>;
  completeLogin: (code: string, state: string) => Promise<void>;
  logout: () => Promise<void>;
  switchAccount: (accountId: string) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  validateInstanceUrl: (instance: string) => Promise<boolean>;
  setError: (error: string | null) => void;
  clearError: () => void;
  restoreSession: () => Promise<void>;
}

// API helper to verify credentials
async function verifyCredentials(instance: string, token: string): Promise<MastodonAccount> {
  const response = await fetch(`${instance}/api/v1/accounts/verify_credentials`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new AuthError('Failed to verify credentials', 'VERIFY_FAILED', instance);
  }
  
  return response.json();
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentUser: null,
      currentInstance: null,
      accounts: [],
      isAuthenticated: false,
      isLoading: false,
      error: null,
      
      // Start OAuth login flow
      startLogin: async (instance: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Validate instance
          const isValid = await validateInstance(instance);
          if (!isValid) {
            throw new AuthError('Invalid instance URL', 'INVALID_INSTANCE', instance);
          }
          
          // Build authorization URL
          const { url, state } = await buildAuthorizationUrl({ instance });
          
          set({ isLoading: false });
          return { url, state };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ isLoading: false, error: message });
          throw error;
        }
      },
      
      // Complete OAuth login flow
      completeLogin: async (code: string, state: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Verify state and get stored data
          const stateData = sessionStorage.getItem(`oauth_state_${state}`);
          if (!stateData) {
            throw new AuthError('Invalid or expired state', 'INVALID_STATE');
          }
          
          const { instance, codeVerifier } = JSON.parse(stateData) as {
            instance: string;
            codeVerifier: string;
          };
          
          // Clean up state
          sessionStorage.removeItem(`oauth_state_${state}`);
          
          // Exchange code for token
          const token = await exchangeCodeForToken({
            instance,
            code,
            codeVerifier
          });
          
          // Get user info
          const user = await verifyCredentials(instance, token.access_token);
          
          // Get app info from sessionStorage (temporary during OAuth flow)
          const appData = sessionStorage.getItem(`app_${instance}`);
          if (!appData) {
            throw new AuthError('App data not found', 'APP_NOT_FOUND');
          }
          const app = JSON.parse(appData) as OAuthApp;
          
          // Store token securely in Cloudflare Worker
          await secureAuthClient.storeToken(instance, token);
          
          // Store app credentials securely (if not already stored)
          await secureAuthClient.storeApp(instance, app);
          
          // Clear app data from sessionStorage
          sessionStorage.removeItem(`app_${instance}`);
          
          // Create authenticated account (without token)
          const account: AuthenticatedAccount = {
            id: `${instance}:${user.id}`,
            instance,
            user,
            token: {} as OAuthToken, // Token is stored securely, not in memory
            app: {} as OAuthApp, // App data is stored securely, not in memory
            lastUsed: Date.now()
          };
          
          // Update state
          set(state => ({
            currentUser: user,
            currentInstance: instance,
            accounts: [...state.accounts.filter(a => a.id !== account.id), account],
            isAuthenticated: true,
            isLoading: false,
            error: null
          }));
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ isLoading: false, error: message });
          throw error;
        }
      },
      
      // Logout current user
      logout: async () => {
        const state = get();
        if (!state.currentInstance || !state.currentUser) {
          return;
        }
        
        set({ isLoading: true });
        
        try {
          // Find current account
          const account = state.accounts.find(
            a => a.instance === state.currentInstance && a.user.id === state.currentUser?.id
          );
          
          if (account) {
            // Get token from secure storage and revoke it
            const token = await secureAuthClient.getToken(account.instance);
            if (token) {
              await revokeToken(account.instance, token.access_token);
              await secureAuthClient.revokeToken(account.instance);
            }
            
            // Remove account
            const remainingAccounts = state.accounts.filter(a => a.id !== account.id);
            
            // Switch to another account if available
            const nextAccount = remainingAccounts[0];
            
            set({
              currentUser: nextAccount?.user || null,
              currentInstance: nextAccount?.instance || null,
              accounts: remainingAccounts,
              isAuthenticated: !!nextAccount,
              isLoading: false
            });
          }
        } catch (error) {
          // Logout error - continue with local cleanup
          // Still logout even if revoke fails
          set({
            currentUser: null,
            currentInstance: null,
            accounts: [],
            isAuthenticated: false,
            isLoading: false
          });
        }
      },
      
      // Switch between accounts
      switchAccount: async (accountId: string) => {
        const account = get().accounts.find(a => a.id === accountId);
        if (account) {
          // Verify token is still valid
          const token = await secureAuthClient.getToken(account.instance);
          if (!token) {
            // Token expired or revoked, remove account
            await get().removeAccount(accountId);
            throw new AuthError('Session expired', 'SESSION_EXPIRED');
          }
          
          // Update last used
          account.lastUsed = Date.now();
          
          set(state => ({
            currentUser: account.user,
            currentInstance: account.instance,
            accounts: state.accounts.map(a => 
              a.id === accountId ? { ...a, lastUsed: Date.now() } : a
            )
          }));
        }
      },
      
      // Remove an account
      removeAccount: async (accountId: string) => {
        const state = get();
        const account = state.accounts.find(a => a.id === accountId);
        
        if (!account) return;
        
        try {
          // Get token from secure storage and revoke it
          const token = await secureAuthClient.getToken(account.instance);
          if (token) {
            await revokeToken(account.instance, token.access_token);
            await secureAuthClient.revokeToken(account.instance);
          }
        } catch (error) {
          // Failed to revoke token - continue with account removal
        }
        
        // Remove account
        const remainingAccounts = state.accounts.filter(a => a.id !== accountId);
        
        // If removing current account, switch to another
        if (account.user.id === state.currentUser?.id) {
          const nextAccount = remainingAccounts[0];
          set({
            currentUser: nextAccount?.user || null,
            currentInstance: nextAccount?.instance || null,
            accounts: remainingAccounts,
            isAuthenticated: !!nextAccount
          });
        } else {
          set({ accounts: remainingAccounts });
        }
      },
      
      // Validate instance URL
      validateInstanceUrl: async (instance: string) => {
        return validateInstance(instance);
      },
      
      // Error management
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
      
      // Restore session from secure storage
      restoreSession: async () => {
        const state = get();
        if (!state.currentInstance || !state.isAuthenticated) {
          return;
        }
        
        try {
          // Check if we have a valid session
          const hasSession = await secureAuthClient.hasValidSession();
          if (!hasSession) {
            // Clear auth state if no valid session
            set({
              currentUser: null,
              currentInstance: null,
              accounts: [],
              isAuthenticated: false
            });
          }
        } catch (error) {
          // Failed to restore session - user needs to re-authenticate
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only store non-sensitive data
        accounts: state.accounts.map(a => ({
          id: a.id,
          instance: a.instance,
          user: a.user,
          lastUsed: a.lastUsed,
          // Exclude token and app data
          token: {} as OAuthToken,
          app: {} as OAuthApp
        })),
        currentUser: state.currentUser,
        currentInstance: state.currentInstance,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

// Helper function to get current access token from secure storage
export async function getAccessToken(): Promise<string | null> {
  const { currentInstance } = useAuthStore.getState();
  
  if (!currentInstance) {
    return null;
  }
  
  try {
    // Fetch token from secure storage
    const token = await secureAuthClient.getToken(currentInstance);
    return token?.access_token || null;
  } catch {
    return null;
  }
}

// Helper function to get access token for a specific instance
export async function getAccessTokenForInstance(instance: string): Promise<string | null> {
  const token = await secureAuthClient.getToken(instance);
  return token?.access_token || null;
}