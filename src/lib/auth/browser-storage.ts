/**
 * Browser-based auth storage
 * Replaces Cloudflare Worker KV storage with browser localStorage
 * 
 * Uses encrypted storage for sensitive data (tokens, app secrets)
 */

import type { OAuthApp, OAuthToken } from '$lib/types/auth';

const STORAGE_PREFIX = 'greater_auth_';
const APPS_KEY = `${STORAGE_PREFIX}apps`;
const TOKENS_KEY = `${STORAGE_PREFIX}tokens`;

/**
 * Simple encryption key derivation from device fingerprint
 * For production, consider more robust encryption
 */
async function getEncryptionKey(): Promise<string> {
  // Use a combination of user agent and screen resolution as seed
  const seed = `${navigator.userAgent}_${screen.width}x${screen.height}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(seed);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

/**
 * Simple XOR encryption (for demonstration)
 * For production, use Web Crypto API with AES-GCM
 */
function simpleEncrypt(text: string, key: string): string {
  const encrypted = Array.from(text).map((char, i) => 
    String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join('');
  return btoa(encrypted);
}

function simpleDecrypt(encrypted: string, key: string): string {
  const decoded = atob(encrypted);
  return Array.from(decoded).map((char, i) =>
    String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join('');
}

/**
 * Store OAuth app credentials
 */
export async function storeApp(instance: string, app: OAuthApp): Promise<void> {
  try {
    const key = await getEncryptionKey();
    const apps = await getApps();
    apps[instance] = app;
    
    const encrypted = simpleEncrypt(JSON.stringify(apps), key);
    localStorage.setItem(APPS_KEY, encrypted);
  } catch (error) {
    console.error('[Browser Storage] Failed to store app:', error);
    throw error;
  }
}

/**
 * Get OAuth app credentials
 */
export async function getApp(instance: string): Promise<OAuthApp | null> {
  try {
    const apps = await getApps();
    return apps[instance] || null;
  } catch (error) {
    console.error('[Browser Storage] Failed to get app:', error);
    return null;
  }
}

/**
 * Get all stored apps
 */
async function getApps(): Promise<Record<string, OAuthApp>> {
  try {
    const encrypted = localStorage.getItem(APPS_KEY);
    if (!encrypted) return {};
    
    const key = await getEncryptionKey();
    const decrypted = simpleDecrypt(encrypted, key);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('[Browser Storage] Failed to parse apps:', error);
    return {};
  }
}

/**
 * Store access token
 */
export async function storeToken(instance: string, token: OAuthToken): Promise<void> {
  try {
    const key = await getEncryptionKey();
    const tokens = await getTokens();
    tokens[instance] = token;
    
    const encrypted = simpleEncrypt(JSON.stringify(tokens), key);
    localStorage.setItem(TOKENS_KEY, encrypted);
  } catch (error) {
    console.error('[Browser Storage] Failed to store token:', error);
    throw error;
  }
}

/**
 * Get access token
 */
export async function getToken(instance: string): Promise<OAuthToken | null> {
  try {
    const tokens = await getTokens();
    return tokens[instance] || null;
  } catch (error) {
    console.error('[Browser Storage] Failed to get token:', error);
    return null;
  }
}

/**
 * Get all stored tokens
 */
async function getTokens(): Promise<Record<string, OAuthToken>> {
  try {
    const encrypted = localStorage.getItem(TOKENS_KEY);
    if (!encrypted) return {};
    
    const key = await getEncryptionKey();
    const decrypted = simpleDecrypt(encrypted, key);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('[Browser Storage] Failed to parse tokens:', error);
    return {};
  }
}

/**
 * Remove token
 */
export async function revokeToken(instance: string): Promise<void> {
  try {
    const key = await getEncryptionKey();
    const tokens = await getTokens();
    delete tokens[instance];
    
    const encrypted = simpleEncrypt(JSON.stringify(tokens), key);
    localStorage.setItem(TOKENS_KEY, encrypted);
  } catch (error) {
    console.error('[Browser Storage] Failed to revoke token:', error);
  }
}

/**
 * Clear all stored data
 */
export function clearAllStorage(): void {
  localStorage.removeItem(APPS_KEY);
  localStorage.removeItem(TOKENS_KEY);
}

/**
 * Browser storage client compatible with secure-client interface
 */
export const browserAuthStorage = {
  storeApp,
  getApp,
  storeToken,
  getToken,
  revokeToken,
  clearAll: clearAllStorage
};


