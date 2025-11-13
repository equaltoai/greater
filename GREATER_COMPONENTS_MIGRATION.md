# Greater Components Migration Guide

## Overview

This guide documents the migration from custom implementations to @equaltoai/greater-components v1.0.27. The goal is to maximize use of GC's 127+ components, adapters, and utilities while removing redundant custom code.

## Current State Analysis

### Already Correct ✅
- SvelteKit with static adapter for S3/CloudFront deployment
- @equaltoai/greater-components v1.0.27 installed
- Vite + Svelte 5 setup with runes enabled
- Basic theming with GC ThemeProvider

### Needs Migration ⚠️

#### 1. **Redundant Components** (50+ files in `src/lib/components/islands/svelte/`)

| Custom Component | GC Replacement | Priority |
|-----------------|----------------|----------|
| `Timeline.svelte` | `TimelineVirtualizedReactive` from `@equaltoai/greater-components/fediverse` | HIGH |
| `ComposeBox.svelte` | `ComposeBox` from `@equaltoai/greater-components/fediverse` | HIGH |
| `StatusCard.svelte` | `StatusCard` from `@equaltoai/greater-components/fediverse` | HIGH |
| `NotificationList.svelte` | `NotificationsFeedReactive` from `@equaltoai/greater-components/fediverse` | HIGH |
| `ProfileHeader.svelte` | `ProfileHeader` from `@equaltoai/greater-components/fediverse` | HIGH |
| `Button.svelte` | `Button` from `@equaltoai/greater-components/primitives` | MEDIUM |
| `SearchBar.svelte` | `Search.Root` from `@equaltoai/greater-components/fediverse` | MEDIUM |
| `UserProfile.svelte` | `Profile.Root` from `@equaltoai/greater-components/fediverse` | MEDIUM |
| `LoginForm.svelte` | `Auth.LoginForm` from `@equaltoai/greater-components/fediverse` | MEDIUM |
| `MediaGallery.svelte` | Built-in to GC StatusCard | LOW |
| `MediaUpload.svelte` | `MediaComposer` from `@equaltoai/greater-components/fediverse` | LOW |
| `ThemeToggle.svelte` | `ThemeSwitcher` from `@equaltoai/greater-components/primitives` | LOW |

#### 2. **Auth System Migration**

**Current:** Custom OAuth + Cloudflare KV token storage  
**Target:** GC Auth module + browser-local encrypted storage

```typescript
// OLD: Custom implementation with Cloudflare Workers
import { secureAuthClient } from '$lib/auth/secure-client';
await secureAuthClient.storeToken(instance, token);

// NEW: GC Auth with browser storage
import * as Auth from '@equaltoai/greater-components/fediverse/Auth';

const authHandlers = {
  onLogin: async (credentials) => {
    // Store in encrypted localStorage/IndexedDB
    return { user, token };
  }
};
```

#### 3. **GraphQL Adapter Consolidation**

**Current:** Mix of custom GraphQL client and GC adapters  
**Target:** Pure GC adapters

```typescript
// OLD: Custom graphql-client.ts
import { LesserGraphQLAdapter } from './graphql-client';

// NEW: GC adapters
import { createLesserClient } from '@equaltoai/greater-components/fediverse';

const client = createLesserClient({
  endpoint: import.meta.env.VITE_GRAPHQL_ENDPOINT,
  token: () => getAuthToken(), // Token getter function
});
```

## Migration Phases

### Phase 1: Setup & Configuration
- [x] Audit greater-components exports
- [ ] Configure Vite for optimal GC imports
- [ ] Set up CSS imports (theme.css, style.css)
- [ ] Create GC import aliases

### Phase 2: Replace Core Components
- [ ] Replace Timeline with TimelineVirtualizedReactive
- [ ] Replace ComposeBox with GC ComposeBox
- [ ] Replace StatusCard with GC StatusCard
- [ ] Replace NotificationList with NotificationsFeedReactive
- [ ] Test each replacement individually

### Phase 3: Replace Primitives
- [ ] Replace custom Button with GC Button
- [ ] Replace custom Modal with GC Modal
- [ ] Replace custom form fields with GC TextField/TextArea
- [ ] Replace ThemeToggle with GC ThemeSwitcher

### Phase 4: Auth Migration
- [ ] Implement browser-based token storage (encrypted localStorage)
- [ ] Integrate GC Auth.LoginForm
- [ ] Migrate OAuth flow to use GC Auth context
- [ ] Remove Cloudflare Workers auth endpoints
- [ ] Update authStore to use new storage

### Phase 5: Adapter Consolidation
- [ ] Replace custom GraphQL client with GC createLesserClient
- [ ] Update all API calls to use GC adapters
- [ ] Remove redundant API client code
- [ ] Set up GC streaming/real-time features

### Phase 6: Cleanup
- [ ] Delete redundant custom components
- [ ] Remove unused dependencies
- [ ] Update documentation
- [ ] Run full test suite

## Component Import Guide

### Fediverse Components

```svelte
<script>
  // Timeline
  import { TimelineVirtualizedReactive } from '@equaltoai/greater-components/fediverse';
  
  // Compose
  import { ComposeBox } from '@equaltoai/greater-components/fediverse';
  
  // Status
  import { StatusCard } from '@equaltoai/greater-components/fediverse';
  
  // Notifications
  import { NotificationsFeedReactive } from '@equaltoai/greater-components/fediverse';
  
  // Profile
  import * as Profile from '@equaltoai/greater-components/fediverse/Profile';
  
  // Auth
  import * as Auth from '@equaltoai/greater-components/fediverse/Auth';
  
  // Search
  import * as Search from '@equaltoai/greater-components/fediverse/Search';
</script>
```

### Primitives

```svelte
<script>
  import { 
    Button, 
    TextField, 
    TextArea,
    Modal,
    ThemeProvider,
    ThemeSwitcher,
    Avatar,
    Tooltip,
    Skeleton
  } from '@equaltoai/greater-components/primitives';
</script>
```

### Adapters

```typescript
// GraphQL Client
import { 
  createLesserClient,
  createGraphQLClient 
} from '@equaltoai/greater-components/fediverse';

// Platform Adapters
import {
  LesserAdapter,
  MastodonAdapter,
  autoDetectAdapter
} from '@equaltoai/greater-components/fediverse';
```

### Icons

```svelte
<script>
  // Import specific icons
  import Globe from '@equaltoai/greater-components/icons/globe';
  import Lock from '@equaltoai/greater-components/icons/lock';
  import Mail from '@equaltoai/greater-components/icons/mail';
</script>

<Globe />
<Lock />
<Mail />
```

### Tokens & Styles

```css
/* Import in +layout.svelte or app.css */
@import '@equaltoai/greater-components/tokens/theme.css';
@import '@equaltoai/greater-components/primitives/style.css';
@import '@equaltoai/greater-components/fediverse/greater-components-fediverse.css';
```

## Browser-Based Auth Strategy

Since we're removing Cloudflare Workers, auth tokens need browser-local storage:

### Option 1: Encrypted localStorage (Recommended)

```typescript
import { encrypt, decrypt } from 'crypto-js/aes';

const AUTH_KEY = 'greater_auth_encrypted';
const SECRET = await deriveKey(); // From user password or device fingerprint

export const browserAuthStorage = {
  async setToken(instance: string, token: OAuthToken) {
    const data = { instance, token, timestamp: Date.now() };
    const encrypted = encrypt(JSON.stringify(data), SECRET);
    localStorage.setItem(AUTH_KEY, encrypted);
  },
  
  async getToken(instance: string): Promise<OAuthToken | null> {
    const encrypted = localStorage.getItem(AUTH_KEY);
    if (!encrypted) return null;
    
    const decrypted = decrypt(encrypted, SECRET);
    const data = JSON.parse(decrypted);
    
    if (data.instance !== instance) return null;
    return data.token;
  },
  
  async revokeToken(instance: string) {
    localStorage.removeItem(AUTH_KEY);
  }
};
```

### Option 2: IndexedDB with Web Crypto API

```typescript
// More secure, uses native Web Crypto API
const dbName = 'greater_auth';
const storeName = 'tokens';

export const indexedDBAuthStorage = {
  async init() {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },
  
  async setToken(instance: string, token: OAuthToken) {
    const db = await this.init();
    const tx = db.transaction([storeName], 'readwrite');
    const store = tx.objectStore(storeName);
    
    // Encrypt token with Web Crypto API
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: generateIV() },
      await getKey(),
      new TextEncoder().encode(JSON.stringify(token))
    );
    
    store.put(encrypted, instance);
    return tx.complete;
  }
};
```

## Breaking Changes & Migration Path

### 1. Auth State Management

**Before:**
```typescript
// Cloudflare Worker-based
import { authStore } from '$lib/stores/auth.svelte';
await authStore.initialize();
```

**After:**
```typescript
// Browser-based with GC Auth
import * as Auth from '@equaltoai/greater-components/fediverse/Auth';
import { browserAuthStorage } from '$lib/auth/browser-storage';

const authHandlers = {
  onLogin: async (credentials) => {
    const { instance, username, password } = credentials;
    // OAuth flow...
    await browserAuthStorage.setToken(instance, token);
    return { user, token };
  },
  onLogout: async () => {
    await browserAuthStorage.revokeToken(currentInstance);
  }
};
```

### 2. Timeline Components

**Before:**
```svelte
<Timeline timelineType="home" />
```

**After:**
```svelte
<TimelineVirtualizedReactive 
  client={lesserClient}
  timelineType="home"
/>
```

### 3. Compose Box

**Before:**
```svelte
<ComposeBox />
```

**After:**
```svelte
<ComposeBox 
  adapter={lesserAdapter}
  onPost={handlePost}
/>
```

## Testing Strategy

1. **Component-by-component migration** - Replace and test each component individually
2. **Feature flags** - Use environment variables to toggle between old/new implementations
3. **Visual regression testing** - Screenshot comparison before/after
4. **E2E tests** - Update Playwright tests for GC components
5. **Performance benchmarks** - Ensure GC components don't regress performance

## Rollback Plan

If migration causes issues:

1. Git branches: `main` (stable), `migrate-gc` (migration in progress)
2. Feature flags: `VITE_USE_GC_COMPONENTS=true/false`
3. Incremental deployment: Test each phase on staging before production
4. Keep custom components temporarily for fallback

## Success Metrics

- [ ] Reduce `src/lib/components/islands/svelte/` from 50+ files to <10 custom-only components
- [ ] Remove all Cloudflare Workers/KV dependencies
- [ ] 100% usage of GC for standard fediverse features
- [ ] Maintain or improve performance (FCP, LCP, TTI)
- [ ] Zero breaking changes for end users
- [ ] All tests passing

## Timeline

- **Phase 1-2:** 2-3 days (setup + core components)
- **Phase 3:** 1 day (primitives)
- **Phase 4:** 2-3 days (auth migration - most complex)
- **Phase 5:** 1-2 days (adapters)
- **Phase 6:** 1 day (cleanup)

**Total: ~7-10 days** for complete migration

## Next Steps

1. ✅ Create this migration guide
2. → Start Phase 1: Configure Vite and CSS imports
3. → Begin Phase 2: Replace Timeline component (highest priority)

