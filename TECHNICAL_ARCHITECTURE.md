# Greater Client - Technical Architecture

## Overview

Greater is built on a modern, edge-first architecture that prioritizes performance, developer experience, and user privacy. This document details the technical decisions and implementation strategies.

## Architecture Principles

### 1. **Edge-First Computing**
- All rendering happens at Cloudflare edge locations (175+ globally)
- API responses cached intelligently at the edge
- Media served from geographically distributed R2 storage
- Minimal round trips to origin servers

### 2. **Progressive Enhancement**
- Core functionality works without JavaScript
- Interactive features enhance the experience
- Graceful degradation for older browsers
- Offline-first with service worker support

### 3. **Protocol Compliance**
- 100% Mastodon API v1/v2 compatibility
- No proprietary extensions required
- Works with any Mastodon-compatible instance
- ActivityPub compliance for future features

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Browser                             │
├─────────────────────────────────────────────────────────────────┤
│  Service Worker │ Local Storage │ IndexedDB │ Cache API        │
└────────────────────┴──────────────┴──────────┴─────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Edge Network                      │
├─────────────────┬──────────────────┬─────────────────────────────┤
│   Pages (SSR)   │  Workers (API)   │  Storage Services          │
│  • Astro SSR    │  • API Proxy     │  • KV (Sessions)          │
│  • HTML Gen     │  • Auth Handler  │  • R2 (Media)             │
│  • Routing      │  • Cache Logic   │  • D1 (Analytics)         │
└─────────────────┴──────────────────┴─────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Mastodon Instance API                        │
├─────────────────────────────────────────────────────────────────┤
│  REST API │ Streaming API │ OAuth 2.0 │ Media Storage          │
└───────────┴───────────────┴───────────┴────────────────────────┘
```

## Component Architecture

### Frontend Components

```typescript
// Component hierarchy
const componentArchitecture = {
  // Page Components (Astro)
  pages: {
    static: {
      '/': 'Landing page with instance selector',
      '/about': 'About Greater and features',
      '/explore': 'Public timeline browser'
    },
    dynamic: {
      '/@[handle]': 'User profile pages',
      '/tags/[tag]': 'Hashtag timelines',
      '/status/[id]': 'Individual post pages'
    },
    protected: {
      '/home': 'Personal timeline',
      '/notifications': 'Notification center',
      '/settings': 'User preferences'
    }
  },

  // Interactive Islands - All Svelte for consistency
  islands: {
    svelte: {
      // Core Interactions
      ComposeBox: 'Post composition with drafts and rich text',
      NotificationBell: 'Real-time notification updates',
      MediaUploader: 'Drag-drop media handling with preview',
      
      // Timeline & Content
      Timeline: 'Infinite scroll timeline with virtual scrolling',
      StatusCard: 'Interactive status display with actions',
      ProfileCard: 'Interactive profile display',
      ThreadView: 'Conversation thread navigation',
      
      // Search & Discovery
      SearchBar: 'Instant search with suggestions',
      HashtagExplorer: 'Trending hashtags display',
      UserSuggestions: 'Follow recommendations',
      
      // User Interface
      SettingsPanel: 'Preference management',
      ThemeSwitcher: 'Real-time theme switching',
      LanguageSelector: 'i18n language picker',
      KeyboardShortcuts: 'Keyboard navigation',
      
      // Utilities
      LazyImage: 'Intersection observer image loading',
      InfiniteScroll: 'Scroll-based pagination',
      ContextMenu: 'Right-click context menus',
      Modal: 'Accessible dialog system',
      Toast: 'Notification toasts',
      Tooltip: 'Hover tooltips'
    }
  }
};
```

### Edge Worker Architecture

```typescript
// Worker request flow
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // 1. Authentication check
    const auth = await validateAuth(request, env);
    
    // 2. Route matching
    const route = matchRoute(url.pathname);
    
    // 3. Cache check
    if (route.cacheable && !auth) {
      const cached = await env.CACHE.get(getCacheKey(request));
      if (cached) return new Response(cached, {
        headers: { 'X-Cache': 'HIT' }
      });
    }
    
    // 4. Process request
    const response = await route.handler(request, env, auth);
    
    // 5. Cache response
    if (route.cacheable && response.ok) {
      await env.CACHE.put(
        getCacheKey(request),
        await response.clone().text(),
        { expirationTtl: route.ttl }
      );
    }
    
    return response;
  }
};
```

## Data Flow

### 1. **Authentication Flow**

```typescript
// OAuth 2.0 flow implementation
class AuthenticationFlow {
  async initiateLogin(instance: string): Promise<void> {
    // 1. Register application if needed
    const app = await this.registerApp(instance);
    
    // 2. Generate state and PKCE challenge
    const state = generateRandomString();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    
    // 3. Store in session
    await sessionStorage.setItem('auth_state', {
      state,
      codeVerifier,
      instance,
      appId: app.client_id,
      appSecret: app.client_secret
    });
    
    // 4. Redirect to authorization
    const params = new URLSearchParams({
      client_id: app.client_id,
      response_type: 'code',
      redirect_uri: `${window.location.origin}/auth/callback`,
      scope: 'read write follow push',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });
    
    window.location.href = `${instance}/oauth/authorize?${params}`;
  }
  
  async handleCallback(code: string, state: string): Promise<void> {
    // 1. Verify state
    const session = await sessionStorage.getItem('auth_state');
    if (session.state !== state) throw new Error('Invalid state');
    
    // 2. Exchange code for token
    const token = await this.exchangeCodeForToken(
      session.instance,
      code,
      session.codeVerifier,
      session.appId,
      session.appSecret
    );
    
    // 3. Store securely
    await this.storeToken(session.instance, token);
    
    // 4. Redirect to app
    window.location.href = '/home';
  }
}
```

### 2. **Timeline Rendering**

```typescript
// Timeline data flow
class TimelineRenderer {
  private cache = new Map<string, CachedTimeline>();
  private streams = new Map<string, EventSource>();
  
  async renderTimeline(
    type: TimelineType,
    params: TimelineParams
  ): Promise<TimelineData> {
    // 1. Check memory cache
    const cacheKey = this.getCacheKey(type, params);
    const cached = this.cache.get(cacheKey);
    
    if (cached && !this.isStale(cached)) {
      return cached.data;
    }
    
    // 2. Fetch from API
    const timeline = await this.fetchTimeline(type, params);
    
    // 3. Cache result
    this.cache.set(cacheKey, {
      data: timeline,
      timestamp: Date.now(),
      etag: timeline.etag
    });
    
    // 4. Setup streaming updates
    if (params.streaming) {
      this.setupStreaming(type, params);
    }
    
    return timeline;
  }
  
  private setupStreaming(type: TimelineType, params: TimelineParams): void {
    const streamUrl = this.getStreamUrl(type, params);
    const stream = new EventSource(streamUrl);
    
    stream.addEventListener('update', (event) => {
      const status = JSON.parse(event.data);
      this.handleStreamUpdate(type, status);
    });
    
    stream.addEventListener('delete', (event) => {
      const statusId = event.data;
      this.handleStreamDelete(type, statusId);
    });
    
    this.streams.set(this.getCacheKey(type, params), stream);
  }
}
```

### 3. **Media Optimization**

```typescript
// Media handling pipeline
class MediaOptimizer {
  async optimizeImage(
    file: File,
    options: ImageOptions
  ): Promise<OptimizedImage> {
    // 1. Client-side validation
    if (file.size > MAX_FILE_SIZE) {
      throw new Error('File too large');
    }
    
    // 2. Generate blurhash preview
    const blurhash = await this.generateBlurhash(file);
    
    // 3. Create responsive variants
    const variants = await Promise.all([
      this.createVariant(file, { width: 400, quality: 85 }),
      this.createVariant(file, { width: 800, quality: 85 }),
      this.createVariant(file, { width: 1200, quality: 85 })
    ]);
    
    // 4. Upload to edge storage
    const urls = await Promise.all(
      variants.map(v => this.uploadToR2(v))
    );
    
    return {
      blurhash,
      variants: urls,
      original: file
    };
  }
  
  private async createVariant(
    file: File,
    options: VariantOptions
  ): Promise<Blob> {
    // Use browser Canvas API for resizing
    const img = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Calculate dimensions
    const scale = options.width / img.width;
    canvas.width = options.width;
    canvas.height = img.height * scale;
    
    // Draw and compress
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob!),
        'image/webp',
        options.quality / 100
      );
    });
  }
}
```

## State Management

### Global State (Zustand)

```typescript
// stores/app.store.ts
interface AppState {
  // Authentication
  currentInstance: string | null;
  accounts: Map<string, Account>;
  activeAccountId: string | null;
  
  // UI State
  theme: Theme;
  layout: Layout;
  locale: string;
  
  // Data
  timelines: Map<string, Timeline>;
  notifications: Notification[];
  
  // Actions
  setTheme: (theme: Theme) => void;
  switchAccount: (accountId: string) => void;
  updateTimeline: (type: string, statuses: Status[]) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Initial state
  currentInstance: null,
  accounts: new Map(),
  activeAccountId: null,
  theme: 'auto',
  layout: 'single',
  locale: 'en',
  timelines: new Map(),
  notifications: [],
  
  // Actions
  setTheme: (theme) => {
    set({ theme });
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  },
  
  switchAccount: (accountId) => {
    const account = get().accounts.get(accountId);
    if (account) {
      set({
        activeAccountId: accountId,
        currentInstance: account.instance
      });
    }
  },
  
  updateTimeline: (type, statuses) => {
    const timelines = new Map(get().timelines);
    const existing = timelines.get(type) || { statuses: [], hasMore: true };
    
    timelines.set(type, {
      statuses: [...statuses, ...existing.statuses],
      hasMore: existing.hasMore,
      lastFetch: Date.now()
    });
    
    set({ timelines });
  }
}));
```

### Local State (Nanostores)

```typescript
// stores/compose.store.ts
import { atom, map } from 'nanostores';

// Compose box state
export const composeText = atom<string>('');
export const composeVisibility = atom<Visibility>('public');
export const composeAttachments = atom<Attachment[]>([]);
export const composePoll = atom<Poll | null>(null);

// Draft management
export const drafts = map<Record<string, Draft>>({});

export function saveDraft(id: string): void {
  drafts.setKey(id, {
    text: composeText.get(),
    visibility: composeVisibility.get(),
    attachments: composeAttachments.get(),
    poll: composePoll.get(),
    savedAt: Date.now()
  });
}

export function loadDraft(id: string): void {
  const draft = drafts.get()[id];
  if (draft) {
    composeText.set(draft.text);
    composeVisibility.set(draft.visibility);
    composeAttachments.set(draft.attachments);
    composePoll.set(draft.poll);
  }
}
```

## Performance Optimizations

### 1. **Bundle Optimization**

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - Svelte only
          'svelte-vendor': ['svelte', 'svelte/store', 'svelte/motion', 'svelte/transition'],
          'ui-vendor': ['@rgossiaux/svelte-headlessui', 'svelte-sonner'],
          
          // Feature chunks
          'editor': ['@tiptap/core', '@tiptap/starter-kit'],
          'media': ['blurhash', 'browser-image-compression'],
          'date': ['date-fns', 'date-fns-tz'],
          'i18n': ['svelte-i18n']
        }
      }
    },
    
    // Optimize dependencies
    optimizeDeps: {
      include: ['svelte', 'svelte/store'],
      exclude: ['@astrojs/svelte']
    }
  }
});
```

### 2. **Image Loading Strategy**

```typescript
// components/LazyImage.astro
---
export interface Props {
  src: string;
  alt: string;
  blurhash?: string;
  width: number;
  height: number;
}

const { src, alt, blurhash, width, height } = Astro.props;
const aspectRatio = (height / width) * 100;
---

<div 
  class="lazy-image-wrapper" 
  style={`padding-bottom: ${aspectRatio}%`}
>
  {blurhash && (
    <canvas
      class="lazy-image-placeholder"
      width="32"
      height="32"
      data-blurhash={blurhash}
    />
  )}
  
  <img
    class="lazy-image"
    data-src={src}
    alt={alt}
    width={width}
    height={height}
    loading="lazy"
  />
</div>

<script>
  // Blurhash decoder
  import { decode } from 'blurhash';
  
  // Intersection Observer for lazy loading
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src!;
        img.classList.add('loaded');
        imageObserver.unobserve(img);
      }
    });
  });
  
  // Initialize
  document.querySelectorAll('.lazy-image').forEach(img => {
    imageObserver.observe(img);
  });
  
  // Decode blurhashes
  document.querySelectorAll('[data-blurhash]').forEach(canvas => {
    const ctx = (canvas as HTMLCanvasElement).getContext('2d')!;
    const pixels = decode(canvas.dataset.blurhash!, 32, 32);
    const imageData = ctx.createImageData(32, 32);
    imageData.data.set(pixels);
    ctx.putImageData(imageData, 0, 0);
  });
</script>
```

### 3. **Service Worker Caching**

```javascript
// service-worker.js
const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
  static: `static-${CACHE_VERSION}`,
  dynamic: `dynamic-${CACHE_VERSION}`,
  images: `images-${CACHE_VERSION}`,
  api: `api-${CACHE_VERSION}`
};

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.static).then((cache) => {
      return cache.addAll([
        '/',
        '/offline',
        '/manifest.json',
        '/css/app.css',
        '/js/app.js'
      ]);
    })
  );
});

// Fetch strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // API calls - Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, CACHE_NAMES.api));
    return;
  }
  
  // Images - Cache first, network fallback
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, CACHE_NAMES.images));
    return;
  }
  
  // HTML - Network first for freshness
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, CACHE_NAMES.dynamic));
    return;
  }
  
  // Everything else - Cache first
  event.respondWith(cacheFirst(request, CACHE_NAMES.static));
});

// Caching strategies
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Not Found', { status: 404 });
  }
}
```

## Security Architecture

### 1. **Content Security Policy**

```typescript
// middleware/security.ts
export function securityHeaders(): MiddlewareHandler {
  return (request, env, ctx) => {
    const response = ctx.next();
    
    // Content Security Policy
    response.headers.set('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' wss: https:",
      "media-src 'self' https:",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '));
    
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    return response;
  };
}
```

### 2. **Token Storage**

```typescript
// lib/auth/token-storage.ts
class SecureTokenStorage {
  private readonly STORAGE_KEY = 'greater_auth';
  
  async storeToken(instance: string, token: TokenResponse): Promise<void> {
    // Encrypt sensitive data
    const encrypted = await this.encrypt({
      instance,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: Date.now() + (token.expires_in * 1000)
    });
    
    // Store in secure storage
    if ('storage' in navigator && 'persist' in navigator.storage) {
      await navigator.storage.persist();
    }
    
    localStorage.setItem(this.STORAGE_KEY, encrypted);
  }
  
  async getToken(instance: string): Promise<Token | null> {
    const encrypted = localStorage.getItem(this.STORAGE_KEY);
    if (!encrypted) return null;
    
    const decrypted = await this.decrypt(encrypted);
    
    // Check expiration
    if (decrypted.expiresAt < Date.now()) {
      // Try to refresh
      return this.refreshToken(instance, decrypted.refreshToken);
    }
    
    return decrypted;
  }
  
  private async encrypt(data: any): Promise<string> {
    // Use Web Crypto API
    const key = await this.getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(JSON.stringify(data));
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }
}
```

## Monitoring & Analytics

### Performance Monitoring

```typescript
// lib/monitoring/performance.ts
class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  initialize(): void {
    // Web Vitals
    if ('web-vital' in window) {
      import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
        getCLS(this.reportMetric.bind(this));
        getFID(this.reportMetric.bind(this));
        getFCP(this.reportMetric.bind(this));
        getLCP(this.reportMetric.bind(this));
        getTTFB(this.reportMetric.bind(this));
      });
    }
    
    // Custom metrics
    this.measureApiCalls();
    this.measureRenderTime();
    this.measureCacheHitRate();
  }
  
  private reportMetric(metric: Metric): void {
    // Store locally
    const values = this.metrics.get(metric.name) || [];
    values.push(metric.value);
    this.metrics.set(metric.name, values);
    
    // Report to edge analytics
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics', JSON.stringify({
        metric: metric.name,
        value: metric.value,
        timestamp: Date.now()
      }));
    }
  }
  
  private measureApiCalls(): void {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const start = performance.now();
      const url = args[0] instanceof Request ? args[0].url : args[0];
      
      try {
        const response = await originalFetch(...args);
        const duration = performance.now() - start;
        
        this.reportMetric({
          name: 'api-call-duration',
          value: duration,
          id: url.toString()
        });
        
        return response;
      } catch (error) {
        this.reportMetric({
          name: 'api-call-error',
          value: 1,
          id: url.toString()
        });
        throw error;
      }
    };
  }
}
```

## Testing Architecture

### Component Testing

```typescript
// tests/components/Timeline.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Timeline } from '@/components/Timeline';
import { mockStatuses } from '../mocks/statuses';

describe('Timeline Component', () => {
  it('renders timeline with statuses', async () => {
    render(<Timeline type="home" />);
    
    await waitFor(() => {
      expect(screen.getByTestId('timeline')).toBeInTheDocument();
    });
    
    mockStatuses.forEach(status => {
      expect(screen.getByText(status.content)).toBeInTheDocument();
    });
  });
  
  it('loads more on scroll', async () => {
    const user = userEvent.setup();
    render(<Timeline type="home" />);
    
    const timeline = screen.getByTestId('timeline');
    
    // Scroll to bottom
    await user.scroll(timeline, { top: timeline.scrollHeight });
    
    await waitFor(() => {
      expect(screen.getByText('Loading more...')).toBeInTheDocument();
    });
  });
  
  it('handles real-time updates', async () => {
    render(<Timeline type="home" streaming />);
    
    // Simulate WebSocket message
    const ws = await screen.findByTestId('websocket');
    ws.dispatchEvent(new MessageEvent('message', {
      data: JSON.stringify({
        event: 'update',
        payload: mockStatuses[0]
      })
    }));
    
    await waitFor(() => {
      expect(screen.getAllByTestId('status')).toHaveLength(
        mockStatuses.length + 1
      );
    });
  });
});
```

### API Integration Testing

```typescript
// tests/api/mastodon-client.test.ts
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { MastodonClient } from '@/lib/api/client';

const server = setupServer(
  rest.get('https://mastodon.social/api/v1/timelines/home', (req, res, ctx) => {
    return res(ctx.json([
      { id: '1', content: 'Test status 1' },
      { id: '2', content: 'Test status 2' }
    ]));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('MastodonClient', () => {
  it('fetches home timeline', async () => {
    const client = new MastodonClient('https://mastodon.social', 'test-token');
    const timeline = await client.getHomeTimeline();
    
    expect(timeline).toHaveLength(2);
    expect(timeline[0].content).toBe('Test status 1');
  });
  
  it('handles pagination', async () => {
    const client = new MastodonClient('https://mastodon.social', 'test-token');
    const timeline = await client.getHomeTimeline({ max_id: '100' });
    
    expect(timeline).toBeDefined();
  });
});
```

## Deployment Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    types: [opened, synchronize]

env:
  NODE_VERSION: '20'
  CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
  CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Unit tests
        run: npm run test:unit
      
      - name: Component tests
        run: npm run test:components
      
      - name: Build
        run: npm run build

  e2e:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

  deploy:
    needs: [test, e2e]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build for production
        run: npm run build
        env:
          PUBLIC_COMMIT_SHA: ${{ github.sha }}
          PUBLIC_BUILD_TIME: ${{ github.event.head_commit.timestamp }}
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ env.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ env.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=greater
      
      - name: Purge CDN cache
        run: |
          curl -X POST "https://api.cloudflare.com/client/v4/zones/${{ secrets.CLOUDFLARE_ZONE_ID }}/purge_cache" \
            -H "Authorization: Bearer ${{ env.CLOUDFLARE_API_TOKEN }}" \
            -H "Content-Type: application/json" \
            --data '{"purge_everything":true}'
      
      - name: Notify deployment
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.repos.createDeploymentStatus({
              owner: context.repo.owner,
              repo: context.repo.repo,
              deployment_id: context.payload.deployment.id,
              state: 'success',
              environment_url: 'https://greater.app'
            });
```

## Conclusion

This architecture provides a solid foundation for building a modern, performant, and scalable Mastodon client. The edge-first approach ensures global performance, while the modular component architecture allows for rapid development and easy maintenance.

Key architectural benefits:
- **Performance**: Sub-second load times globally
- **Scalability**: Handles millions of requests at minimal cost
- **Developer Experience**: Modern tooling and TypeScript throughout
- **User Experience**: Offline support, real-time updates, beautiful UI
- **Maintainability**: Clear separation of concerns, comprehensive testing

The architecture is designed to evolve with user needs while maintaining backward compatibility with the Mastodon API ecosystem. 