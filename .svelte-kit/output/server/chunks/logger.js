const STORAGE_PREFIX = "greater_auth_";
const APPS_KEY = `${STORAGE_PREFIX}apps`;
const TOKENS_KEY = `${STORAGE_PREFIX}tokens`;
async function getEncryptionKey() {
  const seed = `${navigator.userAgent}_${screen.width}x${screen.height}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(seed);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}
function simpleEncrypt(text, key) {
  const encrypted = Array.from(text).map(
    (char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join("");
  return btoa(encrypted);
}
function simpleDecrypt(encrypted, key) {
  const decoded = atob(encrypted);
  return Array.from(decoded).map(
    (char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
  ).join("");
}
async function storeApp(instance, app) {
  try {
    const key = await getEncryptionKey();
    const apps = await getApps();
    apps[instance] = app;
    const encrypted = simpleEncrypt(JSON.stringify(apps), key);
    localStorage.setItem(APPS_KEY, encrypted);
  } catch (error) {
    console.error("[Browser Storage] Failed to store app:", error);
    throw error;
  }
}
async function getApp(instance) {
  try {
    const apps = await getApps();
    return apps[instance] || null;
  } catch (error) {
    console.error("[Browser Storage] Failed to get app:", error);
    return null;
  }
}
async function getApps() {
  try {
    const encrypted = localStorage.getItem(APPS_KEY);
    if (!encrypted) return {};
    const key = await getEncryptionKey();
    const decrypted = simpleDecrypt(encrypted, key);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("[Browser Storage] Failed to parse apps:", error);
    return {};
  }
}
async function storeToken(instance, token) {
  try {
    const key = await getEncryptionKey();
    const tokens = await getTokens();
    tokens[instance] = token;
    const encrypted = simpleEncrypt(JSON.stringify(tokens), key);
    localStorage.setItem(TOKENS_KEY, encrypted);
  } catch (error) {
    console.error("[Browser Storage] Failed to store token:", error);
    throw error;
  }
}
async function getToken(instance) {
  try {
    const tokens = await getTokens();
    return tokens[instance] || null;
  } catch (error) {
    console.error("[Browser Storage] Failed to get token:", error);
    return null;
  }
}
async function getTokens() {
  try {
    const encrypted = localStorage.getItem(TOKENS_KEY);
    if (!encrypted) return {};
    const key = await getEncryptionKey();
    const decrypted = simpleDecrypt(encrypted, key);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error("[Browser Storage] Failed to parse tokens:", error);
    return {};
  }
}
async function revokeToken(instance) {
  try {
    const key = await getEncryptionKey();
    const tokens = await getTokens();
    delete tokens[instance];
    const encrypted = simpleEncrypt(JSON.stringify(tokens), key);
    localStorage.setItem(TOKENS_KEY, encrypted);
  } catch (error) {
    console.error("[Browser Storage] Failed to revoke token:", error);
  }
}
function clearAllStorage() {
  localStorage.removeItem(APPS_KEY);
  localStorage.removeItem(TOKENS_KEY);
}
class SecureAuthClient {
  static instance;
  tokenCache = /* @__PURE__ */ new Map();
  CACHE_TTL = 5 * 60 * 1e3;
  // 5 minutes
  constructor() {
  }
  static getInstance() {
    if (!SecureAuthClient.instance) {
      SecureAuthClient.instance = new SecureAuthClient();
    }
    return SecureAuthClient.instance;
  }
  /**
   * Store OAuth app credentials in browser storage
   */
  async storeApp(instance, app) {
    await storeApp(instance, app);
  }
  /**
   * Get OAuth app credentials from browser storage
   */
  async getApp(instance) {
    return await getApp(instance);
  }
  /**
   * Store OAuth token in browser storage
   */
  async storeToken(instance, token) {
    await storeToken(instance, token);
    this.tokenCache.delete(instance);
  }
  /**
   * Get OAuth token from browser storage (with caching)
   */
  async getToken(instance) {
    const cached = this.tokenCache.get(instance);
    if (cached && cached.expires > Date.now()) {
      return cached.token;
    }
    const token = await getToken(instance);
    if (token) {
      this.tokenCache.set(instance, {
        token,
        expires: Date.now() + this.CACHE_TTL
      });
    }
    return token;
  }
  /**
   * Revoke OAuth token
   */
  async revokeToken(instance) {
    await revokeToken(instance);
    this.tokenCache.delete(instance);
  }
  /**
   * Check if session exists for instance
   */
  async checkSession(instance) {
    const token = await this.getToken(instance);
    return token !== null;
  }
  /**
   * Clear all auth data
   */
  clearAll() {
    clearAllStorage();
    this.tokenCache.clear();
  }
}
const secureAuthClient = SecureAuthClient.getInstance();
const isDebugEnvironment = typeof import.meta !== "undefined" && Boolean(true) || process.env.NODE_ENV === "development";
function logDebug(message, ...metadata) {
  if (isDebugEnvironment) {
    console.warn(message, ...metadata);
  }
}
export {
  logDebug as l,
  secureAuthClient as s
};
