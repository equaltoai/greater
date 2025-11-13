/**
 * OAuth 2.0 client implementation for Mastodon
 * Implements PKCE (Proof Key for Code Exchange) for enhanced security
 */

import type { OAuthApp, OAuthToken, AuthorizeParams, TokenExchangeParams } from '$lib/types/auth';
import { secureAuthClient } from './secure-client';
import { logDebug } from '../utils/logger';

const OAUTH_SCOPES = 'read write follow push';

// Function to get the redirect URI based on the current environment
function getRedirectUri(): string {
  // In browser context, use the current origin
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }
  
  // In server context, use the environment variable or default
  return import.meta.env.PUBLIC_APP_URL 
    ? `${import.meta.env.PUBLIC_APP_URL}/auth/callback`
    : 'http://localhost:4321/auth/callback';
}

/**
 * Generate a cryptographically secure random string
 */
function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate PKCE code verifier
 */
export function generateCodeVerifier(): string {
  return generateRandomString(64);
}

/**
 * Generate PKCE code challenge from verifier
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to base64url
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Register OAuth application with a Mastodon instance
 */
export async function registerApp(instance: string): Promise<OAuthApp> {
  const instanceUrl = normalizeInstanceUrl(instance);
  
  const params = new URLSearchParams({
    client_name: 'Greater',
    redirect_uris: getRedirectUri(),
    scopes: OAUTH_SCOPES,
    website: 'https://greater.website'
  });

  const response = await fetch(`${instanceUrl}/api/v1/apps`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to register app: ${error}`);
  }

  const app = await response.json() as OAuthApp;
  
  // Store app credentials securely in Cloudflare Worker
  await secureAuthClient.storeApp(instanceUrl, app);
  
  return app;
}

/**
 * Get or create OAuth app for instance
 */
export async function getOrCreateApp(instance: string): Promise<OAuthApp> {
  const instanceUrl = normalizeInstanceUrl(instance);
  const currentRedirectUri = getRedirectUri();
  
  // Check if we have a stored app
  const storedKey = `app_${instanceUrl}_${currentRedirectUri}`;
  const stored = sessionStorage.getItem(storedKey);
  
  if (stored) {
    try {
      const app = JSON.parse(stored) as OAuthApp;
      logDebug('[OAuth] Using stored app for', instanceUrl);
      return app;
    } catch (e) {
      console.error('[OAuth] Failed to parse stored app:', e);
      sessionStorage.removeItem(storedKey);
    }
  }
  
  // Clear any old app registrations with different redirect URIs
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.startsWith(`app_${instanceUrl}_`) && key !== storedKey) {
      logDebug('[OAuth] Removing old app registration:', key);
      sessionStorage.removeItem(key);
    }
  });
  
  // Register new app
logDebug('[OAuth] Registering new app for', instanceUrl, 'with redirect URI:', currentRedirectUri);
  const app = await registerApp(instance);
  
  // Store with redirect URI in key to differentiate
  sessionStorage.setItem(storedKey, JSON.stringify(app));
  
  return app;
}

/**
 * Build authorization URL for OAuth flow
 */
export async function buildAuthorizationUrl(params: AuthorizeParams): Promise<{
  url: string;
  codeVerifier: string;
  state: string;
}> {
  const instanceUrl = normalizeInstanceUrl(params.instance);
  const app = await getOrCreateApp(params.instance);
  
  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  
  // Generate state for CSRF protection
  const state = generateRandomString(32);
  
  // Store state and verifier temporarily
  sessionStorage.setItem(`oauth_state_${state}`, JSON.stringify({
    instance: instanceUrl,
    codeVerifier,
    timestamp: Date.now(),
    appId: app.client_id,
    appName: app.name
  }));
  
  const authParams = new URLSearchParams({
    client_id: app.client_id,
    response_type: 'code',
    redirect_uri: getRedirectUri(),
    scope: params.scopes?.join(' ') || OAUTH_SCOPES,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state
  });
  
  if (params.force) {
    authParams.append('force_login', 'true');
  }
  
  return {
    url: `${instanceUrl}/oauth/authorize?${authParams.toString()}`,
    codeVerifier,
    state
  };
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(params: TokenExchangeParams): Promise<OAuthToken> {
  const instanceUrl = normalizeInstanceUrl(params.instance);
  const app = await getOrCreateApp(params.instance);
  
  const tokenParams = new URLSearchParams({
    client_id: app.client_id,
    client_secret: app.client_secret,
    redirect_uri: getRedirectUri(),
    grant_type: 'authorization_code',
    code: params.code,
    code_verifier: params.codeVerifier
  });
  
  const response = await fetch(`${instanceUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: tokenParams.toString()
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }
  
  const token = await response.json() as OAuthToken;
  return token;
}

/**
 * Revoke access token
 */
export async function revokeToken(instance: string, token: string): Promise<void> {
  const instanceUrl = normalizeInstanceUrl(instance);
  
  // Try to get app from sessionStorage first (during OAuth flow)
  let app: OAuthApp | null = null;
  const stored = sessionStorage.getItem(`app_${instanceUrl}`);
  if (stored) {
    app = JSON.parse(stored) as OAuthApp;
  }
  
  // If not in sessionStorage, we'll need to handle this differently
  // For now, we'll skip the revoke if we can't get the app
  if (!app) {
    // Silently skip revoke if app credentials not found - this is expected during OAuth flow
    return;
  }
  
  const params = new URLSearchParams({
    client_id: app.client_id,
    client_secret: app.client_secret,
    token
  });
  
  const response = await fetch(`${instanceUrl}/oauth/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
  });
  
  if (!response.ok) {
    // Token revocation failed - non-critical error, token may already be invalid
  }
}

/**
 * Verify OAuth state and retrieve stored data
 */
export function verifyOAuthState(state: string): {
  instance: string;
  codeVerifier: string;
  appId?: string;
  appName?: string;
} | null {
  const stored = sessionStorage.getItem(`oauth_state_${state}`);
  if (!stored) {
    return null;
  }
  
  const data = JSON.parse(stored) as {
    instance: string;
    codeVerifier: string;
    timestamp: number;
    appId?: string;
    appName?: string;
  };
  
  // Check if state is expired (5 minutes)
  if (Date.now() - data.timestamp > 5 * 60 * 1000) {
    sessionStorage.removeItem(`oauth_state_${state}`);
    return null;
  }
  
  // Clean up
  sessionStorage.removeItem(`oauth_state_${state}`);
  
  return {
    instance: data.instance,
    codeVerifier: data.codeVerifier,
    appId: data.appId,
    appName: data.appName
  };
}

/**
 * Normalize instance URL
 */
export function normalizeInstanceUrl(instance: string): string {
  let url = instance.trim().toLowerCase();
  
  // Remove protocol if present
  url = url.replace(/^https?:\/\//, '');
  
  // Remove trailing slash
  url = url.replace(/\/$/, '');
  
  // Add https protocol
  return `https://${url}`;
}

/**
 * Validate instance URL
 */
export async function validateInstance(instance: string): Promise<boolean> {
  try {
    const instanceUrl = normalizeInstanceUrl(instance);
    const response = await fetch(`${instanceUrl}/api/v1/instance`);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Clean up expired OAuth states
 */
export function cleanupExpiredStates(): void {
  const now = Date.now();
  const keys = Object.keys(sessionStorage);
  
  keys.forEach(key => {
    if (key.startsWith('oauth_state_')) {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        try {
          const data = JSON.parse(stored) as { timestamp?: number };
          // Clean up OAuth states after 5 minutes
          if (data.timestamp && now - data.timestamp > 5 * 60 * 1000) {
            sessionStorage.removeItem(key);
          }
        } catch {
          sessionStorage.removeItem(key);
        }
      }
    }
  });
}

/**
 * Clear all OAuth app registrations for a specific instance
 */
export function clearAppRegistrations(instance?: string): void {
  const keys = Object.keys(sessionStorage);
  keys.forEach(key => {
    if (key.startsWith('app_')) {
      if (!instance || key.includes(normalizeInstanceUrl(instance))) {
        logDebug('[OAuth] Clearing app registration:', key);
        sessionStorage.removeItem(key);
      }
    }
  });
}
