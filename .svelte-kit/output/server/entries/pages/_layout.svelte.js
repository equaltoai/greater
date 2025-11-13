import { F as FILENAME, N as head } from "../../chunks/index.js";
import { T as ThemeProvider } from "../../chunks/auth.svelte.js";
import "isomorphic-dompurify";
import { persistentAtom } from "@nanostores/persistent";
import { atom, computed } from "nanostores";
import { g as getGraphQLAdapter } from "../../chunks/graphql-client.js";
import { p as prevent_snippet_stringification } from "../../chunks/validate.js";
import { p as push_element, a as pop_element } from "../../chunks/dev.js";
const LIGHT_THEME = {
  primary: "#2563eb",
  primaryLight: "#3b82f6",
  primaryDark: "#1d4ed8",
  accent1: "#8b5cf6",
  accent2: "#ec4899",
  background: "#ffffff",
  backgroundAlt: "#fafafa",
  surface: "#f3f4f6",
  surfaceHover: "#e5e7eb",
  border: "#d1d5db",
  borderHover: "#9ca3af",
  text: "#111827",
  textMuted: "#6b7280",
  textInverse: "#ffffff",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  boost: "#8b5cf6",
  favorite: "#ec4899"
};
const DARK_THEME = {
  primary: "#3b82f6",
  primaryLight: "#60a5fa",
  primaryDark: "#2563eb",
  accent1: "#a78bfa",
  accent2: "#f472b6",
  background: "#0f0f0f",
  backgroundAlt: "#0a0a0a",
  surface: "#1a1a1a",
  surfaceHover: "#262626",
  border: "#333333",
  borderHover: "#4d4d4d",
  text: "#f3f4f6",
  textMuted: "#9ca3af",
  textInverse: "#111827",
  success: "#34d399",
  warning: "#fbbf24",
  error: "#f87171",
  info: "#60a5fa",
  boost: "#a78bfa",
  favorite: "#f472b6"
};
const HIGH_CONTRAST_LIGHT = {
  primary: "#0000ff",
  primaryLight: "#3333ff",
  primaryDark: "#000099",
  accent1: "#ff00ff",
  accent2: "#ff0000",
  background: "#ffffff",
  backgroundAlt: "#f0f0f0",
  surface: "#e0e0e0",
  surfaceHover: "#d0d0d0",
  border: "#000000",
  borderHover: "#333333",
  text: "#000000",
  textMuted: "#333333",
  textInverse: "#ffffff",
  success: "#008000",
  warning: "#ff8c00",
  error: "#ff0000",
  info: "#0000ff",
  boost: "#ff00ff",
  favorite: "#ff0000"
};
const HIGH_CONTRAST_DARK = {
  primary: "#00ffff",
  primaryLight: "#66ffff",
  primaryDark: "#00cccc",
  accent1: "#ffff00",
  accent2: "#ff00ff",
  background: "#000000",
  backgroundAlt: "#0a0a0a",
  surface: "#1a1a1a",
  surfaceHover: "#2a2a2a",
  border: "#ffffff",
  borderHover: "#cccccc",
  text: "#ffffff",
  textMuted: "#cccccc",
  textInverse: "#000000",
  success: "#00ff00",
  warning: "#ffaa00",
  error: "#ff3333",
  info: "#00ccff",
  boost: "#ffff00",
  favorite: "#ff00ff"
};
const themeState = persistentAtom("theme-state", {
  mode: "system",
  preset: "default",
  customThemes: [],
  activeCustomThemeId: void 0
}, {
  encode: JSON.stringify,
  decode: JSON.parse
});
const systemTheme = atom("light");
if (typeof window !== "undefined") {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  systemTheme.set(mediaQuery.matches ? "dark" : "light");
  mediaQuery.addEventListener("change", (e) => {
    systemTheme.set(e.matches ? "dark" : "light");
  });
}
const currentTheme = computed([themeState, systemTheme], (state, system) => {
  const isDark = state.mode === "dark" || state.mode === "system" && system === "dark";
  if (state.preset === "custom" && state.activeCustomThemeId) {
    const customTheme = state.customThemes.find((t) => t.id === state.activeCustomThemeId);
    if (customTheme) {
      return customTheme.colors;
    }
  }
  if (state.preset === "high-contrast") {
    return isDark ? HIGH_CONTRAST_DARK : HIGH_CONTRAST_LIGHT;
  }
  return isDark ? DARK_THEME : LIGHT_THEME;
});
function applyTheme(colors) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    if (value) {
      const cssKey = key.replace(/([A-Z])/g, "-$1").toLowerCase();
      root.style.setProperty(`--color-${cssKey}`, value);
    }
  });
  root.style.setProperty("--color-shadow", colors.text + "20");
  root.style.setProperty("--color-overlay", colors.background + "cc");
}
if (typeof window !== "undefined") {
  currentTheme.subscribe((colors) => {
    applyTheme(colors);
  });
}
ThemeInitializer[FILENAME] = "src/lib/components/islands/svelte/ThemeInitializer.svelte";
function ThemeInitializer($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
    },
    ThemeInitializer
  );
}
ThemeInitializer.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
class OfflineDB {
  dbName = "greater-offline";
  version = 1;
  db = null;
  async open() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("offline-posts")) {
          db.createObjectStore("offline-posts", { keyPath: "id" });
        }
      };
    });
  }
  async savePost(post) {
    const db = await this.open();
    const tx = db.transaction("offline-posts", "readwrite");
    await tx.objectStore("offline-posts").put(post);
  }
  async deletePost(id) {
    const db = await this.open();
    const tx = db.transaction("offline-posts", "readwrite");
    await tx.objectStore("offline-posts").delete(id);
  }
  async getAllPosts() {
    const db = await this.open();
    const tx = db.transaction("offline-posts", "readonly");
    return new Promise((resolve, reject) => {
      const request = tx.objectStore("offline-posts").getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
class OfflineStore {
  posts = [];
  isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
  isSyncing = false;
  offlineDB = new OfflineDB();
  constructor() {
  }
  initialize() {
    if (typeof window === "undefined") return;
    const savedState = localStorage.getItem("offline-queue");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.state) {
          this.posts = parsed.state.posts || [];
        }
      } catch (e) {
        console.error("Failed to load offline state:", e);
      }
    }
    window.addEventListener("online", () => {
      this.setOnlineStatus(true);
    });
    window.addEventListener("offline", () => {
      this.setOnlineStatus(false);
    });
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data.type === "sync-complete") {
          this.removePost(event.data.postId);
        }
      });
    }
    this.offlineDB.getAllPosts().then((posts) => {
      this.posts = posts;
    }).catch(console.error);
  }
  persist() {
    if (typeof window === "undefined") return;
    const toPersist = { state: { posts: this.posts } };
    localStorage.setItem("offline-queue", JSON.stringify(toPersist));
  }
  addPost(data) {
    const id = `offline-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const post = { id, data, timestamp: Date.now(), retries: 0 };
    this.posts = [...this.posts, post];
    this.offlineDB.savePost(post).catch(console.error);
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.sync?.register("sync-posts").catch(console.error);
      });
    }
    return id;
  }
  removePost(id) {
    this.posts = this.posts.filter((post) => post.id !== id);
    this.offlineDB.deletePost(id).catch(console.error);
  }
  updatePost(id, updates) {
    this.posts = this.posts.map((post) => post.id === id ? { ...post, ...updates } : post);
  }
  setOnlineStatus(online) {
    this.isOnline = online;
    if (online && this.posts.length > 0) {
      this.syncPosts();
    }
  }
  async syncPosts() {
    if (!this.isOnline || this.posts.length === 0 || this.isSyncing) {
      return;
    }
    this.isSyncing = true;
    try {
      const adapter = await getGraphQLAdapter();
      for (const post of this.posts) {
        try {
          const variables = mapCreateStatusParamsToGraphQL(post.data);
          await adapter.createNote(variables);
          this.removePost(post.id);
        } catch (error) {
          this.updatePost(post.id, {
            retries: post.retries + 1,
            error: error instanceof Error ? error.message : "Failed to sync"
          });
          if (post.retries >= 3) {
            this.removePost(post.id);
          }
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }
  clearQueue() {
    const posts = this.posts;
    this.posts = [];
    posts.forEach((post) => {
      this.offlineDB.deletePost(post.id).catch(console.error);
    });
  }
}
const offlineStore = new OfflineStore();
function mapCreateStatusParamsToGraphQL(params) {
  const variables = {
    content: params.status ?? "",
    visibility: mapVisibilityToGraphQL(params.visibility ?? "public"),
    sensitive: params.sensitive ?? false
  };
  if (params.spoiler_text) {
    variables.summary = params.spoiler_text;
  }
  if (params.in_reply_to_id) {
    variables.inReplyToId = params.in_reply_to_id;
  }
  if (params.media_ids?.length) {
    variables.mediaIds = [...params.media_ids];
  }
  if (params.poll) {
    variables.poll = {
      options: [...params.poll.options],
      expiresIn: params.poll.expires_in,
      multiple: params.poll.multiple ?? false,
      hideTotals: params.poll.hide_totals ?? false
    };
  }
  if (params.language) {
    variables.language = params.language;
  }
  return variables;
}
function mapVisibilityToGraphQL(visibility) {
  const visibilityMap = {
    public: "PUBLIC",
    unlisted: "UNLISTED",
    private: "FOLLOWERS",
    direct: "DIRECT"
  };
  return visibilityMap[visibility] ?? "PUBLIC";
}
OfflineIndicator[FILENAME] = "src/lib/components/islands/svelte/OfflineIndicator.svelte";
function OfflineIndicator($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      offlineStore.posts.length;
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    },
    OfflineIndicator
  );
}
OfflineIndicator.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
_layout[FILENAME] = "src/routes/+layout.svelte";
function _layout($$renderer, $$props) {
  $$renderer.component(
    ($$renderer2) => {
      let { children } = $$props;
      head("12qhfyh", $$renderer2, ($$renderer3) => {
        $$renderer3.push(`<meta name="viewport" content="width=device-width, initial-scale=1.0"/>`);
        push_element($$renderer3, "meta", 21, 2);
        pop_element();
        $$renderer3.push(` <meta name="description" content="A modern, high-performance web client for Mastodon-compatible instances"/>`);
        push_element($$renderer3, "meta", 22, 2);
        pop_element();
      });
      ThemeProvider($$renderer2, {
        children: prevent_snippet_stringification(($$renderer3) => {
          ThemeInitializer($$renderer3);
          $$renderer3.push(`<!----> `);
          OfflineIndicator($$renderer3);
          $$renderer3.push(`<!----> `);
          children($$renderer3);
          $$renderer3.push(`<!---->`);
        })
      });
    },
    _layout
  );
}
_layout.render = function() {
  throw new Error("Component.render(...) is no longer valid in Svelte 5. See https://svelte.dev/docs/svelte/v5-migration-guide#Components-are-no-longer-classes for more information");
};
export {
  _layout as default
};
