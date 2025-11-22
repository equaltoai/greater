import { l as logDebug, s as secureAuthClient } from "./logger.js";
const PREFERENCES_KEY = "gr-preferences-v1";
const DEFAULT_PREFERENCES = {
  colorScheme: "auto",
  density: "comfortable",
  fontSize: "medium",
  motion: "normal",
  customColors: {
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    accent: "#ec4899"
  },
  highContrastMode: false,
  fontScale: 1
};
function clonePreferences(preferences) {
  return {
    ...preferences,
    customColors: {
      ...preferences.customColors
    }
  };
}
function mergePreferences(base, updates) {
  const next = {
    ...base,
    ...updates
  };
  next.customColors = {
    ...base.customColors,
    ...updates.customColors ?? {}
  };
  return clonePreferences(next);
}
class PreferencesStore {
  constructor() {
    this._preferences = clonePreferences(DEFAULT_PREFERENCES);
    this._systemColorScheme = "light";
    this._systemMotion = "normal";
    this._systemHighContrast = false;
    this.loadPreferences();
    this.setupSystemPreferenceDetection();
    this.applyTheme();
  }
  // Getters using $derived for computed values
  get preferences() {
    return clonePreferences(this._preferences);
  }
  get state() {
    const { customColors, ...rest } = this._preferences;
    return {
      ...rest,
      customColors: {
        ...customColors
      },
      systemColorScheme: this._systemColorScheme,
      systemMotion: this._systemMotion,
      systemHighContrast: this._systemHighContrast,
      resolvedColorScheme: this.resolvedColorScheme
    };
  }
  get resolvedColorScheme() {
    if (this._preferences.highContrastMode || this._systemHighContrast) {
      return "high-contrast";
    }
    if (this._preferences.colorScheme === "auto") {
      return this._systemColorScheme;
    }
    if (this._preferences.colorScheme === "high-contrast") {
      return "high-contrast";
    }
    return this._preferences.colorScheme;
  }
  get resolvedMotion() {
    if (this._systemMotion === "reduced") {
      return "reduced";
    }
    return this._preferences.motion;
  }
  // Methods to update preferences
  setColorScheme(scheme) {
    this._preferences.colorScheme = scheme;
    this.saveAndApply();
  }
  setDensity(density) {
    this._preferences.density = density;
    this.saveAndApply();
  }
  setFontSize(size) {
    this._preferences.fontSize = size;
    this.saveAndApply();
  }
  setFontScale(scale) {
    this._preferences.fontScale = Math.max(0.85, Math.min(1.5, scale));
    this.saveAndApply();
  }
  setMotion(motion) {
    this._preferences.motion = motion;
    this.saveAndApply();
  }
  setCustomColors(colors) {
    this._preferences.customColors = {
      ...this._preferences.customColors,
      ...colors
    };
    this.saveAndApply();
  }
  setHighContrastMode(enabled) {
    this._preferences.highContrastMode = enabled;
    this.saveAndApply();
  }
  updatePreferences(updates) {
    this._preferences = mergePreferences(this._preferences, updates);
    this.saveAndApply();
  }
  // Reset to defaults
  reset() {
    this._preferences = clonePreferences(DEFAULT_PREFERENCES);
    this.saveAndApply();
  }
  // Export current preferences as JSON
  export() {
    return JSON.stringify(this._preferences, null, 2);
  }
  // Import preferences from JSON
  import(json) {
    try {
      const imported = JSON.parse(json);
      if (this.validatePreferences(imported)) {
        this._preferences = mergePreferences(DEFAULT_PREFERENCES, imported);
        this.saveAndApply();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
  // Private methods
  loadPreferences() {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (this.validatePreferences(parsed)) {
          this._preferences = mergePreferences(DEFAULT_PREFERENCES, parsed);
        }
      }
    } catch (error) {
      console.warn("Failed to load preferences from localStorage:", error);
    }
  }
  savePreferences() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(this._preferences));
    } catch (error) {
      console.warn("Failed to save preferences to localStorage:", error);
    }
  }
  saveAndApply() {
    this.savePreferences();
    this.applyTheme();
  }
  validatePreferences(prefs) {
    const validColorSchemes = ["light", "dark", "high-contrast", "auto"];
    const validDensities = ["compact", "comfortable", "spacious"];
    const validFontSizes = ["small", "medium", "large"];
    const validMotion = ["normal", "reduced"];
    if (prefs.colorScheme && !validColorSchemes.includes(prefs.colorScheme)) {
      return false;
    }
    if (prefs.density && !validDensities.includes(prefs.density)) {
      return false;
    }
    if (prefs.fontSize && !validFontSizes.includes(prefs.fontSize)) {
      return false;
    }
    if (prefs.motion && !validMotion.includes(prefs.motion)) {
      return false;
    }
    return true;
  }
  setupSystemPreferenceDetection() {
    if (typeof window === "undefined") return;
    this.darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    this._systemColorScheme = this.darkModeQuery.matches ? "dark" : "light";
    this.darkModeQuery.addEventListener("change", (e) => {
      this._systemColorScheme = e.matches ? "dark" : "light";
      if (this._preferences.colorScheme === "auto") {
        this.applyTheme();
      }
    });
    this.reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    this._systemMotion = this.reducedMotionQuery.matches ? "reduced" : "normal";
    this.reducedMotionQuery.addEventListener("change", (e) => {
      this._systemMotion = e.matches ? "reduced" : "normal";
      this.applyTheme();
    });
    this.highContrastQuery = window.matchMedia("(prefers-contrast: high)");
    this._systemHighContrast = this.highContrastQuery.matches;
    this.highContrastQuery.addEventListener("change", (e) => {
      this._systemHighContrast = e.matches;
      this.applyTheme();
    });
  }
  applyTheme() {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    root.setAttribute("data-theme", this.resolvedColorScheme);
    root.setAttribute("data-density", this._preferences.density);
    root.setAttribute("data-font-size", this._preferences.fontSize);
    root.setAttribute("data-motion", this.resolvedMotion);
    this.applyCustomProperties();
  }
  applyCustomProperties() {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    if (this._preferences.customColors.primary) {
      root.style.setProperty("--gr-custom-primary", this._preferences.customColors.primary);
    }
    if (this._preferences.customColors.secondary) {
      root.style.setProperty("--gr-custom-secondary", this._preferences.customColors.secondary);
    }
    if (this._preferences.customColors.accent) {
      root.style.setProperty("--gr-custom-accent", this._preferences.customColors.accent);
    }
    root.style.setProperty("--gr-font-scale", String(this._preferences.fontScale));
    const densityScale = {
      compact: 0.85,
      comfortable: 1,
      spacious: 1.2
    };
    root.style.setProperty("--gr-density-scale", String(densityScale[this._preferences.density]));
  }
  // Cleanup method
  destroy() {
    if (this.darkModeQuery) ;
  }
}
new PreferencesStore();
const PUBLIC_VERSION = "5";
if (typeof window !== "undefined") {
  ((window.__svelte ??= {}).v ??= /* @__PURE__ */ new Set()).add(PUBLIC_VERSION);
}
class AdapterCache {
  constructor(options = {}) {
    this.cache = /* @__PURE__ */ new Map();
    this.accessOrder = [];
    this.maxSize = options.maxSize ?? 1e3;
    this.defaultTTL = options.defaultTTL ?? 3e5;
    this.debug = options.debug ?? false;
    this.hits = 0;
    this.misses = 0;
    this.logger = options.logger;
  }
  /**
   * Get value from cache
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      this.log("miss", key);
      return void 0;
    }
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.misses++;
      this.log("expired", key);
      return void 0;
    }
    this.updateAccessOrder(key);
    this.hits++;
    this.log("hit", key);
    return entry.value;
  }
  /**
   * Set value in cache
   */
  set(key, value, ttl) {
    const entry = {
      value,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTTL,
      size: this.estimateSize(value)
    };
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }
    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    this.log("set", key, `ttl=${entry.ttl}ms`);
  }
  /**
   * Check if key exists and is not expired
   */
  has(key) {
    return this.get(key) !== void 0;
  }
  /**
   * Delete entry from cache
   */
  delete(key) {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.removeFromAccessOrder(key);
      this.log("delete", key);
    }
    return deleted;
  }
  /**
   * Clear all entries
   */
  clear() {
    this.cache.clear();
    this.accessOrder = [];
    this.hits = 0;
    this.misses = 0;
    this.log("clear", "all");
  }
  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / (this.hits + this.misses) || 0
    };
  }
  /**
   * Invalidate entries matching a pattern
   */
  invalidate(pattern) {
    const regex = typeof pattern === "string" ? new RegExp(pattern) : pattern;
    const patternStr = pattern.toString();
    let count = 0;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.delete(key);
        count++;
      }
    }
    this.log("invalidate", patternStr, `${count} entries`);
    return count;
  }
  /**
   * Update access order (LRU tracking)
   */
  updateAccessOrder(key) {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }
  /**
   * Remove from access order
   */
  removeFromAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index !== -1) {
      this.accessOrder.splice(index, 1);
    }
  }
  /**
   * Evict least recently used entry
   */
  evictLRU() {
    if (this.accessOrder.length === 0) return;
    const lruKey = this.accessOrder[0];
    if (lruKey === void 0) return;
    this.cache.delete(lruKey);
    this.accessOrder.shift();
    this.log("evict", lruKey);
  }
  /**
   * Estimate size of value (rough approximation)
   */
  estimateSize(value) {
    try {
      return JSON.stringify(value).length;
    } catch {
      return 1e3;
    }
  }
  /**
   * Debug logging
   */
  log(action, key, extra) {
    if (!this.debug) {
      return;
    }
    const stats = this.getStats();
    const entry = {
      scope: "cache",
      action,
      message: `${key}${extra ? ` ${extra}` : ""}`.trim(),
      stats
    };
    if (this.logger) {
      this.logger(entry);
    } else if (typeof console !== "undefined" && typeof console.warn === "function") {
      console.warn(
        `[Cache] ${action} key="${key}" ${extra || ""} (${stats.size}/${stats.maxSize}, hit rate: ${(stats.hitRate * 100).toFixed(1)}%)`
      );
    }
  }
}
new AdapterCache({
  maxSize: 1e3,
  defaultTTL: 3e5,
  // 5 minutes
  debug: false
});
const OAUTH_SCOPES = "read write follow push";
function getRedirectUri() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }
  return "http://localhost:4321/auth/callback";
}
function generateRandomString(length) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function generateCodeVerifier() {
  return generateRandomString(64);
}
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
async function registerApp(instance) {
  const instanceUrl = normalizeInstanceUrl(instance);
  const params = new URLSearchParams({
    client_name: "Greater",
    redirect_uris: getRedirectUri(),
    scopes: OAUTH_SCOPES,
    website: "https://greater.website"
  });
  const response = await fetch(`${instanceUrl}/api/v1/apps`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to register app: ${error}`);
  }
  const app = await response.json();
  await secureAuthClient.storeApp(instanceUrl, app);
  return app;
}
async function getOrCreateApp(instance) {
  const instanceUrl = normalizeInstanceUrl(instance);
  const currentRedirectUri = getRedirectUri();
  const storedKey = `app_${instanceUrl}_${currentRedirectUri}`;
  const stored = sessionStorage.getItem(storedKey);
  if (stored) {
    try {
      const app2 = JSON.parse(stored);
      logDebug("[OAuth] Using stored app for", instanceUrl);
      return app2;
    } catch (e) {
      console.error("[OAuth] Failed to parse stored app:", e);
      sessionStorage.removeItem(storedKey);
    }
  }
  const keys = Object.keys(sessionStorage);
  keys.forEach((key) => {
    if (key.startsWith(`app_${instanceUrl}_`) && key !== storedKey) {
      logDebug("[OAuth] Removing old app registration:", key);
      sessionStorage.removeItem(key);
    }
  });
  logDebug("[OAuth] Registering new app for", instanceUrl, "with redirect URI:", currentRedirectUri);
  const app = await registerApp(instance);
  sessionStorage.setItem(storedKey, JSON.stringify(app));
  return app;
}
async function buildAuthorizationUrl(params) {
  const instanceUrl = normalizeInstanceUrl(params.instance);
  const app = await getOrCreateApp(params.instance);
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateRandomString(32);
  sessionStorage.setItem(`oauth_state_${state}`, JSON.stringify({
    instance: instanceUrl,
    codeVerifier,
    timestamp: Date.now(),
    appId: app.client_id,
    appName: app.name
  }));
  const authParams = new URLSearchParams({
    client_id: app.client_id,
    response_type: "code",
    redirect_uri: getRedirectUri(),
    scope: params.scopes?.join(" ") || OAUTH_SCOPES,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    state
  });
  if (params.force) {
    authParams.append("force_login", "true");
  }
  return {
    url: `${instanceUrl}/oauth/authorize?${authParams.toString()}`,
    codeVerifier,
    state
  };
}
async function exchangeCodeForToken(params) {
  const instanceUrl = normalizeInstanceUrl(params.instance);
  const app = await getOrCreateApp(params.instance);
  const tokenParams = new URLSearchParams({
    client_id: app.client_id,
    client_secret: app.client_secret,
    redirect_uri: getRedirectUri(),
    grant_type: "authorization_code",
    code: params.code,
    code_verifier: params.codeVerifier
  });
  const response = await fetch(`${instanceUrl}/oauth/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: tokenParams.toString()
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }
  const token = await response.json();
  return token;
}
async function revokeToken(instance, token) {
  const instanceUrl = normalizeInstanceUrl(instance);
  let app = null;
  const stored = sessionStorage.getItem(`app_${instanceUrl}`);
  if (stored) {
    app = JSON.parse(stored);
  }
  if (!app) {
    return;
  }
  const params = new URLSearchParams({
    client_id: app.client_id,
    client_secret: app.client_secret,
    token
  });
  const response = await fetch(`${instanceUrl}/oauth/revoke`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: params.toString()
  });
  if (!response.ok) ;
}
function normalizeInstanceUrl(instance) {
  let url = instance.trim().toLowerCase();
  url = url.replace(/^https?:\/\//, "");
  url = url.replace(/\/$/, "");
  return `https://${url}`;
}
async function validateInstance(instance) {
  try {
    const instanceUrl = normalizeInstanceUrl(instance);
    const response = await fetch(`${instanceUrl}/api/v1/instance`);
    return response.ok;
  } catch {
    return false;
  }
}
class AuthError extends Error {
  constructor(message, code, instance) {
    super(message);
    this.code = code;
    this.instance = instance;
    this.name = "AuthError";
  }
}
class AuthStore {
  currentUser = null;
  currentInstance = null;
  accounts = [];
  isAuthenticated = false;
  isLoading = false;
  error = null;
  _initialized = false;
  constructor() {
  }
  persist() {
    if (typeof window === "undefined") return;
    const toPersist = {
      state: {
        accounts: this.accounts.map((a) => ({
          id: a.id,
          instance: a.instance,
          user: a.user,
          lastUsed: a.lastUsed,
          token: {},
          app: {}
        })),
        currentUser: this.currentUser,
        currentInstance: this.currentInstance,
        isAuthenticated: this.isAuthenticated
      }
    };
    localStorage.setItem("auth-storage", JSON.stringify(toPersist));
  }
  /**
   * Initialize the auth store - must be called from client-side code
   */
  initialize() {
    if (typeof window === "undefined" || this._initialized) return;
    this._initialized = true;
    const savedState = localStorage.getItem("auth-storage");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.state) {
          this.currentUser = parsed.state.currentUser;
          this.currentInstance = parsed.state.currentInstance;
          this.accounts = parsed.state.accounts || [];
          this.isAuthenticated = !!(parsed.state.currentUser && parsed.state.currentInstance);
          if (this.isAuthenticated && this.currentInstance) {
            this.refreshCurrentUser().catch((err) => {
              console.error("[Auth] Failed to refresh user on init:", err);
              this.isAuthenticated = false;
              this.currentUser = null;
              this.persist();
            });
          }
        }
      } catch (e) {
        console.error("[Auth] Failed to load auth state:", e);
        this.isAuthenticated = false;
        localStorage.removeItem("auth-storage");
      }
    } else {
      this.isAuthenticated = false;
      this.currentUser = null;
      this.currentInstance = null;
      this.accounts = [];
    }
  }
  async startLogin(instance) {
    this.isLoading = true;
    this.error = null;
    try {
      const isValid = await validateInstance(instance);
      if (!isValid) {
        throw new AuthError("Invalid instance URL", "INVALID_INSTANCE", instance);
      }
      const { url, state } = await buildAuthorizationUrl({ instance });
      this.isLoading = false;
      return { url, state };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      this.isLoading = false;
      this.error = message;
      throw error;
    }
  }
  async completeLogin(code, state) {
    this.isLoading = true;
    this.error = null;
    try {
      const stateData = sessionStorage.getItem(`oauth_state_${state}`);
      if (!stateData) {
        throw new AuthError("Invalid or expired state", "INVALID_STATE");
      }
      const { instance, codeVerifier } = JSON.parse(stateData);
      sessionStorage.removeItem(`oauth_state_${state}`);
      const token = await exchangeCodeForToken({ instance, code, codeVerifier });
      const user = await verifyCredentials(instance, token.access_token);
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
        console.error("[Auth] No app data found for instance:", instance);
        console.error("[Auth] Available keys:", keys.filter((k) => k.startsWith("app_")));
      }
      let app = null;
      if (appData) {
        try {
          app = JSON.parse(appData);
          await secureAuthClient.storeApp(instance, app);
          if (appKey) {
            sessionStorage.removeItem(appKey);
          }
        } catch (e) {
          console.error("[Auth] Failed to parse app data:", e);
        }
      }
      await secureAuthClient.storeToken(instance, token);
      const account = {
        id: `${instance}:${user.id}`,
        instance,
        user,
        token: {},
        // Token is stored securely, not in memory
        app: {},
        // App data is stored securely, not in memory
        lastUsed: Date.now()
      };
      this.currentUser = user;
      this.currentInstance = instance;
      this.accounts = [...this.accounts.filter((a) => a.id !== account.id), account];
      this.isAuthenticated = true;
      this.isLoading = false;
      this.error = null;
      this.persist();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      this.isLoading = false;
      this.error = message;
      throw error;
    }
  }
  async logout() {
    if (!this.currentInstance || !this.currentUser) {
      return;
    }
    this.isLoading = true;
    const { cleanupNotifications } = await import("./notifications.js").then((n) => n.n);
    cleanupNotifications();
    try {
      const account = this.accounts.find((a) => a.instance === this.currentInstance && a.user.id === this.currentUser?.id);
      if (account) {
        const token = await secureAuthClient.getToken(account.instance);
        if (token) {
          await revokeToken(account.instance, token.access_token);
          await secureAuthClient.revokeToken(account.instance);
        }
        const remainingAccounts = this.accounts.filter((a) => a.id !== account.id);
        const nextAccount = remainingAccounts[0];
        this.currentUser = nextAccount?.user || null;
        this.currentInstance = nextAccount?.instance || null;
        this.accounts = remainingAccounts;
        this.isAuthenticated = !!nextAccount;
        this.isLoading = false;
        this.persist();
      }
    } catch (error) {
      this.currentUser = null;
      this.currentInstance = null;
      this.accounts = [];
      this.isAuthenticated = false;
      this.isLoading = false;
      this.persist();
    }
  }
  async switchAccount(accountId) {
    const account = this.accounts.find((a) => a.id === accountId);
    if (account) {
      const token = await secureAuthClient.getToken(account.instance);
      if (!token) {
        await this.removeAccount(accountId);
        throw new AuthError("Session expired", "SESSION_EXPIRED");
      }
      account.lastUsed = Date.now();
      this.currentUser = account.user;
      this.currentInstance = account.instance;
      this.accounts = this.accounts.map((a) => a.id === accountId ? { ...a, lastUsed: Date.now() } : a);
    }
  }
  async removeAccount(accountId) {
    const account = this.accounts.find((a) => a.id === accountId);
    if (!account) return;
    try {
      const token = await secureAuthClient.getToken(account.instance);
      if (token) {
        await revokeToken(account.instance, token.access_token);
        await secureAuthClient.revokeToken(account.instance);
      }
    } catch (error) {
    }
    const remainingAccounts = this.accounts.filter((a) => a.id !== accountId);
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
  async validateInstanceUrl(instance) {
    return validateInstance(instance);
  }
  setError(error) {
    this.error = error;
  }
  clearError() {
    this.error = null;
  }
  async restoreSession() {
    if (!this.currentInstance || !this.isAuthenticated) {
      return;
    }
    try {
      const hasSession = await secureAuthClient.hasValidSession();
      if (!hasSession) {
        this.currentUser = null;
        this.currentInstance = null;
        this.accounts = [];
        this.isAuthenticated = false;
      }
    } catch (error) {
    }
  }
  updateAccount(updatedAccount) {
    this.currentUser = updatedAccount;
    this.accounts = this.accounts.map((account) => {
      if (account.user.id === updatedAccount.id && account.instance === this.currentInstance) {
        return { ...account, user: updatedAccount };
      }
      return account;
    });
    this.persist();
  }
  async refreshCurrentUser() {
    if (!this.currentInstance || !this.isAuthenticated) {
      return;
    }
    try {
      const response = await fetch(`${this.currentInstance}/api/v1/accounts/verify_credentials`, {
        headers: { "Authorization": `Bearer ${await getAccessToken()}` }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const freshUserData = await response.json();
      logDebug("[Auth] Fresh user data from API:", freshUserData);
      logDebug("[Auth] Avatar URL from API:", freshUserData.avatar);
      const accountData = freshUserData.user || freshUserData;
      if (!accountData.acct && accountData.username) {
        accountData.acct = accountData.username;
      }
      logDebug("[Auth] Account data to use:", accountData);
      logDebug("[Auth] Account username:", accountData.username);
      logDebug("[Auth] Account acct:", accountData.acct);
      this.updateAccount(accountData);
      logDebug("[Auth] Current user after update:", this.currentUser);
      logDebug("[Auth] Avatar after update:", this.currentUser?.avatar);
    } catch (error) {
      console.error("[Auth] Failed to refresh current user:", error);
    }
  }
}
async function verifyCredentials(instance, token) {
  const response = await fetch(`${instance}/api/v1/accounts/verify_credentials`, { headers: { "Authorization": `Bearer ${token}` } });
  if (!response.ok) {
    throw new AuthError("Failed to verify credentials", "VERIFY_FAILED", instance);
  }
  const data = await response.json();
  const accountData = data.user || data;
  if (!accountData.acct && accountData.username) {
    accountData.acct = accountData.username;
  }
  return accountData;
}
const authStore = new AuthStore();
async function getAccessToken() {
  const { currentInstance } = authStore;
  if (!currentInstance) {
    return null;
  }
  try {
    const token = await secureAuthClient.getToken(currentInstance);
    return token?.access_token || null;
  } catch {
    return null;
  }
}
export {
  authStore as a
};
