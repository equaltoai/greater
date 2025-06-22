/**
 * Authentication state management using Svelte 5 runes
 */

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

// Create auth state with Svelte 5 runes
class AuthStore {
  currentUser = $state<MastodonAccount | null>(null);
  currentInstance = $state<string | null>(null);
  accounts = $state<AuthenticatedAccount[]>([]);
  isAuthenticated = $state(false);
  isLoading = $state(false);
  error = $state<string | null>(null);
  
  private _initialized = false;
  
  constructor() {
    // Constructor is empty to avoid SSR issues
  }
  
  private persist() {
    if (typeof window === 'undefined') return;
    
    const toPersist = {
      state: {
        accounts: this.accounts.map(a => ({
          id: a.id,
          instance: a.instance,
          user: a.user,
          lastUsed: a.lastUsed,
          token: {} as OAuthToken,
          app: {} as OAuthApp
        })),
        currentUser: this.currentUser,
        currentInstance: this.currentInstance,
        isAuthenticated: this.isAuthenticated
      }
    };
    localStorage.setItem('auth-storage', JSON.stringify(toPersist));
  }
  
  /**
   * Initialize the auth store - must be called from client-side code
   */
  initialize() {
    if (typeof window === 'undefined' || this._initialized) return;
    this._initialized = true;
    
    // Load persisted state from localStorage
    const savedState = localStorage.getItem('auth-storage');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.state) {
          this.currentUser = parsed.state.currentUser;
          this.currentInstance = parsed.state.currentInstance;
          this.accounts = parsed.state.accounts || [];
          this.isAuthenticated = parsed.state.isAuthenticated || false;
          
          // Refresh current user data to get fresh avatar URL
          if (this.isAuthenticated && this.currentInstance) {
            this.refreshCurrentUser().catch(err => 
              console.error('[Auth] Failed to refresh user on init:', err)
            );
          }
        }
      } catch (e) {
        console.error('Failed to load auth state:', e);
      }
    }
  }

  async startLogin(instance: string): Promise<{ url: string; state: string }> {
    this.isLoading = true;
    this.error = null;
    
    try {
          // Validate instance
          const isValid = await validateInstance(instance);
          if (!isValid) {
            throw new AuthError('Invalid instance URL', 'INVALID_INSTANCE', instance);
          }
          
          // Build authorization URL
          const { url, state } = await buildAuthorizationUrl({ instance });
          
      this.isLoading = false;
      return { url, state };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      this.isLoading = false;
      this.error = message;
      throw error;
    }
  }
      
  async completeLogin(code: string, state: string): Promise<void> {
    this.isLoading = true;
    this.error = null;
        
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
          
          // Try to find app info from sessionStorage
          // Look for any app data for this instance (with any redirect URI)
          let appData = null;
          let appKey = null;
          const keys = Object.keys(sessionStorage);
          for (const key of keys) {
            if (key.startsWith(`app_${instance}_`)) {
              appData = sessionStorage.getItem(key);
              appKey = key;
              break;
            }
          }
          
          if (!appData) {
            console.error('[Auth] No app data found for instance:', instance);
            console.error('[Auth] Available keys:', keys.filter(k => k.startsWith('app_')));
            // Don't throw error - app registration is optional for token storage
            // The app will be re-registered on next login attempt
          }
          
          let app = null;
          if (appData) {
            try {
              app = JSON.parse(appData) as OAuthApp;
              // Store app credentials securely (if not already stored)
              await secureAuthClient.storeApp(instance, app);
              // Clear app data from sessionStorage
              if (appKey) {
                sessionStorage.removeItem(appKey);
              }
            } catch (e) {
              console.error('[Auth] Failed to parse app data:', e);
            }
          }
          
          // Store token securely in Cloudflare Worker
          await secureAuthClient.storeToken(instance, token);
          
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
      this.currentUser = user;
      this.currentInstance = instance;
      this.accounts = [...this.accounts.filter(a => a.id !== account.id), account];
      this.isAuthenticated = true;
      this.isLoading = false;
      this.error = null;
      
      // Persist the auth state
      this.persist();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      this.isLoading = false;
      this.error = message;
      throw error;
    }
  }
      
  async logout(): Promise<void> {
    if (!this.currentInstance || !this.currentUser) {
      return;
    }
    
    this.isLoading = true;
    
    // Clean up notifications
    const { cleanupNotifications } = await import('./notifications');
    cleanupNotifications();
        
    try {
      // Find current account
      const account = this.accounts.find(
        a => a.instance === this.currentInstance && a.user.id === this.currentUser?.id
      );
          
          if (account) {
            // Get token from secure storage and revoke it
            const token = await secureAuthClient.getToken(account.instance);
            if (token) {
              await revokeToken(account.instance, token.access_token);
              await secureAuthClient.revokeToken(account.instance);
            }
            
        // Remove account
        const remainingAccounts = this.accounts.filter(a => a.id !== account.id);
        
        // Switch to another account if available
        const nextAccount = remainingAccounts[0];
        
        this.currentUser = nextAccount?.user || null;
        this.currentInstance = nextAccount?.instance || null;
        this.accounts = remainingAccounts;
        this.isAuthenticated = !!nextAccount;
        this.isLoading = false;
        this.persist();
          }
    } catch (error) {
      // Logout error - continue with local cleanup
      // Still logout even if revoke fails
      this.currentUser = null;
      this.currentInstance = null;
      this.accounts = [];
      this.isAuthenticated = false;
      this.isLoading = false;
      this.persist();
    }
  }
      
  async switchAccount(accountId: string): Promise<void> {
    const account = this.accounts.find(a => a.id === accountId);
        if (account) {
          // Verify token is still valid
          const token = await secureAuthClient.getToken(account.instance);
      if (!token) {
        // Token expired or revoked, remove account
        await this.removeAccount(accountId);
        throw new AuthError('Session expired', 'SESSION_EXPIRED');
      }
      
      // Update last used
      account.lastUsed = Date.now();
      
      this.currentUser = account.user;
      this.currentInstance = account.instance;
      this.accounts = this.accounts.map(a => 
        a.id === accountId ? { ...a, lastUsed: Date.now() } : a
      );
    }
  }
      
  async removeAccount(accountId: string): Promise<void> {
    const account = this.accounts.find(a => a.id === accountId);
        
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
    const remainingAccounts = this.accounts.filter(a => a.id !== accountId);
    
    // If removing current account, switch to another
    if (account.user.id === this.currentUser?.id) {
      const nextAccount = remainingAccounts[0];
      this.currentUser = nextAccount?.user || null;
      this.currentInstance = nextAccount?.instance || null;
      this.accounts = remainingAccounts;
      this.isAuthenticated = !!nextAccount;
    } else {
      this.accounts = remainingAccounts;
    }
  }
      
  async validateInstanceUrl(instance: string): Promise<boolean> {
    return validateInstance(instance);
  }
  
  setError(error: string | null): void {
    this.error = error;
  }
  
  clearError(): void {
    this.error = null;
  }
      
  async restoreSession(): Promise<void> {
    if (!this.currentInstance || !this.isAuthenticated) {
      return;
    }
    
    try {
      // Check if we have a valid session
      const hasSession = await secureAuthClient.hasValidSession();
      if (!hasSession) {
        // Clear auth state if no valid session
        this.currentUser = null;
        this.currentInstance = null;
        this.accounts = [];
        this.isAuthenticated = false;
      }
    } catch (error) {
      // Failed to restore session - user needs to re-authenticate
    }
  }
  
  updateAccount(updatedAccount: MastodonAccount): void {
    // Update the current user
    this.currentUser = updatedAccount;
    
    // Update the account in the accounts list
    this.accounts = this.accounts.map(account => {
      if (account.user.id === updatedAccount.id && account.instance === this.currentInstance) {
        return {
          ...account,
          user: updatedAccount
        };
      }
      return account;
    });
    
    // Persist the changes
    this.persist();
  }
  
  async refreshCurrentUser(): Promise<void> {
    if (!this.currentInstance || !this.isAuthenticated) {
      return;
    }
    
    try {
      // Just make a direct API call to get the ACTUAL data
      const response = await fetch(`${this.currentInstance}/api/v1/accounts/verify_credentials`, {
        headers: {
          'Authorization': `Bearer ${await getAccessToken()}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const freshUserData = await response.json();
      
      console.log('[Auth] Fresh user data from API:', freshUserData);
      console.log('[Auth] Avatar URL from API:', freshUserData.avatar);
      
      // Update the account
      this.updateAccount(freshUserData);
      
      console.log('[Auth] Current user after update:', this.currentUser);
      console.log('[Auth] Avatar after update:', this.currentUser?.avatar);
    } catch (error) {
      console.error('[Auth] Failed to refresh current user:', error);
    }
  }
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

// Create singleton instance
export const authStore = new AuthStore();

// Helper function to get current access token from secure storage
export async function getAccessToken(): Promise<string | null> {
  const { currentInstance } = authStore;
  
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