# Greater Client - Comprehensive Development Plan

**A full-featured, Astro-based, Cloudflare-hosted Mastodon/Lesser client application**

## Executive Summary

Greater is an independent, modern web client for Mastodon-compatible instances (including Lesser) that prioritizes performance, user experience, and open-source collaboration. Built with Astro and deployed on Cloudflare's edge network, it offers a lightning-fast, customizable, and cost-effective alternative to existing ActivityPub clients.

### Key Principles
- **Protocol First**: 100% Mastodon API compatible
- **Instance Agnostic**: Works with any Mastodon-compatible server
- **Performance Obsessed**: Sub-second load times globally
- **Privacy Focused**: No tracking, no analytics without consent
- **Open Source**: MIT licensed, community-driven development
- **Accessibility First**: WCAG 2.1 AA compliant

## Table of Contents

1. [Technical Architecture](#technical-architecture)
2. [Core Features](#core-features)
3. [Development Phases](#development-phases)
4. [Technology Stack](#technology-stack)
5. [Repository Structure](#repository-structure)
6. [API Integration](#api-integration)
7. [UI/UX Design](#uiux-design)
8. [Performance Strategy](#performance-strategy)
9. [Deployment Architecture](#deployment-architecture)
10. [Testing Strategy](#testing-strategy)
11. [Documentation Plan](#documentation-plan)
12. [Community & Governance](#community--governance)
13. [Cost Projections](#cost-projections)
14. [Success Metrics](#success-metrics)

## Technical Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Greater Web Client                          │
├─────────────────┬──────────────────┬─────────────────────────────┤
│  Static Assets  │  Dynamic Pages   │  Interactive Islands        │
│  • HTML/CSS/JS  │  • User Profiles │  • Compose Box              │
│  • Images       │  • Timelines     │  • Notifications            │
│  • Fonts        │  • Search        │  • Real-time Updates        │
└─────────────────┴──────────────────┴─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Cloudflare Edge Network                       │
├─────────────────┬──────────────────┬─────────────────────────────┤
│  Pages/Workers  │  KV Storage      │  R2 Storage                 │
│  • Rendering    │  • Cache         │  • Media Cache              │
│  • API Proxy    │  • Sessions      │  • User Uploads             │
│  • Auth         │  • Preferences   │  • Offline Assets           │
└─────────────────┴──────────────────┴─────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Mastodon-Compatible Instance API                   │
├─────────────────────────────────────────────────────────────────┤
│  • REST API (Mastodon v1/v2)                                   │
│  • Streaming API (WebSocket/SSE)                               │
│  • OAuth 2.0 Authentication                                    │
│  • ActivityPub Federation                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Component Architecture

```typescript
// Core application structure
const greaterArchitecture = {
  // Astro Pages (SSG/SSR)
  pages: {
    static: ['/', '/about', '/explore', '/local', '/federated'],
    dynamic: ['/@[handle]', '/tags/[tag]', '/status/[id]'],
    protected: ['/home', '/notifications', '/settings', '/compose']
  },
  
  // Interactive Components (Islands) - All Svelte for consistency
  islands: {
    svelte: [
      'ComposeBox',           // Post composition with drafts
      'NotificationBell',     // Real-time notification updates
      'MediaUploader',        // Drag-drop media handling
      'Timeline',             // Infinite scroll timeline
      'ProfileCard',          // Interactive profile display
      'SearchBar',            // Instant search with suggestions
      'SettingsPanel',        // Preference management
      'ThemeSwitcher',        // Real-time theme switching
      'LanguageSelector',     // Language preferences
      'LazyImage',            // Optimized image loading
      'InfiniteScroll',       // Scroll pagination
      'KeyboardShortcuts'     // Keyboard navigation
    ]
  },
  
  // Edge Functions
  workers: {
    api: 'API proxy with caching',
    auth: 'OAuth flow handling',
    media: 'Image optimization',
    realtime: 'WebSocket proxy'
  }
};
```

## Core Features

### 1. Authentication & Accounts
- **Multi-instance support**: Connect to multiple Mastodon instances
- **OAuth 2.0 flow**: Standard Mastodon authentication
- **Account switching**: Quick switch between accounts
- **Secure token storage**: Encrypted in Cloudflare KV
- **Session management**: Persistent sessions with refresh

### 2. Timeline Features
- **Home timeline**: Personal feed with real-time updates
- **Local timeline**: Instance-specific public posts
- **Federated timeline**: All known public posts
- **List timelines**: Custom curated feeds
- **Hashtag timelines**: Follow specific topics
- **Offline support**: Cache recent timelines

### 3. Post Composition
- **Rich text editor**: Markdown support with preview
- **Media attachments**: Images, videos, audio with optimization
- **Polls**: Create and vote on polls
- **Content warnings**: Sensitive content handling
- **Visibility controls**: Public, unlisted, followers, direct
- **Draft saving**: Auto-save and draft management
- **Scheduled posts**: Queue posts for later

### 4. Social Features
- **Follow/unfollow**: Manage connections
- **Boost/favorite**: Interact with posts
- **Reply threads**: Nested conversation view
- **Bookmarks**: Save posts for later
- **Lists management**: Create and manage lists
- **Mute/block**: User and keyword filtering
- **Reports**: Flag inappropriate content

### 5. Discovery
- **Search**: Users, hashtags, posts (where supported)
- **Trending**: Hashtags, links, posts
- **Suggestions**: Follow recommendations
- **Directory**: Browse instance users
- **Explore**: Curated content discovery

### 6. Notifications
- **Real-time updates**: WebSocket/SSE support
- **Notification types**: Mentions, follows, boosts, etc.
- **Filtering**: By type and user
- **Mark as read**: Bulk actions
- **Push notifications**: Web Push API support

### 7. User Experience
- **Themes**: Light, dark, and custom themes
- **Layouts**: Single, multi-column, compact views
- **Accessibility**: Screen reader support, keyboard navigation
- **Internationalization**: 20+ languages
- **Responsive design**: Mobile-first approach
- **Progressive Web App**: Installable on all platforms

### 8. Media Handling
- **Image optimization**: Automatic resizing and format conversion
- **Video player**: Custom player with subtitles
- **Audio player**: Podcast-friendly features
- **Gallery view**: Swipeable media galleries
- **Alt text**: Accessibility descriptions

### 9. Advanced Features
- **Translation**: Integrated translation API
- **Filters**: Advanced content filtering
- **Import/Export**: Data portability
- **Statistics**: Account insights
- **API playground**: Test API endpoints

## Development Phases

### Phase 1: Foundation (Weeks 1-4)
```typescript
const phase1 = {
  setup: {
    repository: 'Initialize GitHub repo with CI/CD',
    dependencies: 'Astro, TypeScript, Tailwind CSS',
    infrastructure: 'Cloudflare Pages setup',
    documentation: 'README, CONTRIBUTING, LICENSE'
  },
  
  core: {
    routing: 'Basic page structure',
    authentication: 'OAuth flow implementation',
    api_client: 'Mastodon API wrapper',
    state_management: 'Zustand/Nanostores setup'
  },
  
  deliverables: [
    'Working authentication',
    'Basic timeline display',
    'Profile pages',
    'Deployment pipeline'
  ]
};
```

### Phase 2: Essential Features (Weeks 5-8)
```typescript
const phase2 = {
  timelines: {
    home: 'Personal timeline with pagination',
    local: 'Instance timeline',
    federated: 'Known network timeline',
    streaming: 'Real-time updates'
  },
  
  composition: {
    editor: 'Basic post composer',
    media: 'Image upload support',
    visibility: 'Privacy controls',
    drafts: 'Local draft storage'
  },
  
  interactions: {
    boost: 'Reblog functionality',
    favorite: 'Like functionality',
    reply: 'Thread support',
    follow: 'User relationships'
  }
};
```

### Phase 3: Enhanced Experience (Weeks 9-12)
```typescript
const phase3 = {
  ui_polish: {
    themes: 'Theme system implementation',
    layouts: 'Multiple view options',
    animations: 'Smooth transitions',
    mobile: 'Touch optimizations'
  },
  
  advanced_features: {
    search: 'Full search implementation',
    filters: 'Content filtering',
    lists: 'List management',
    notifications: 'Real-time notifications'
  },
  
  performance: {
    caching: 'Intelligent cache strategies',
    offline: 'Service worker implementation',
    optimization: 'Bundle size reduction',
    lazy_loading: 'Component code splitting'
  }
};
```

### Phase 4: Community Features (Weeks 13-16)
```typescript
const phase4 = {
  social: {
    discovery: 'Explore and trending',
    recommendations: 'Follow suggestions',
    directory: 'User directory',
    statistics: 'Account insights'
  },
  
  accessibility: {
    screen_readers: 'ARIA improvements',
    keyboard: 'Full keyboard navigation',
    contrast: 'High contrast mode',
    motion: 'Reduced motion support'
  },
  
  internationalization: {
    translations: 'Multi-language support',
    rtl: 'Right-to-left languages',
    localization: 'Date/time formatting',
    content: 'Localized UI strings'
  }
};
```

### Phase 5: Polish & Launch (Weeks 17-20)
```typescript
const phase5 = {
  testing: {
    unit: 'Component testing',
    integration: 'API testing',
    e2e: 'User flow testing',
    performance: 'Load testing'
  },
  
  documentation: {
    user_guide: 'End-user documentation',
    api_docs: 'Developer documentation',
    deployment: 'Self-hosting guide',
    contributing: 'Contribution guidelines'
  },
  
  launch: {
    beta: 'Public beta release',
    feedback: 'User feedback collection',
    marketing: 'Launch announcement',
    community: 'Discord/Matrix setup'
  }
};
```

## Technology Stack

### Core Technologies
```typescript
const techStack = {
  // Frontend Framework
  framework: {
    name: 'Astro',
    version: '4.x',
    output: 'hybrid',
    features: ['SSG', 'SSR', 'Islands', 'View Transitions']
  },
  
  // UI Components
  components: {
    astro: 'Static components and layouts',
    svelte: 'All interactive islands (exclusive)',
    why_svelte: [
      'Minimal runtime overhead',
      'Excellent performance',
      'Simple, readable syntax',
      'Built-in stores for state management',
      'Smooth animations and transitions',
      'TypeScript support'
    ]
  },
  
  // Styling
  styling: {
    css: 'Tailwind CSS',
    preprocessor: 'PostCSS',
    themes: 'CSS Custom Properties',
    animations: 'Framer Motion'
  },
  
  // State Management
  state: {
    global: 'Zustand',
    local: 'Nanostores',
    server: 'TanStack Query',
    forms: 'React Hook Form'
  },
  
  // Development Tools
  tools: {
    language: 'TypeScript',
    bundler: 'Vite',
    linting: 'ESLint + Prettier',
    testing: 'Vitest + Playwright',
    ci_cd: 'GitHub Actions'
  }
};
```

### Cloudflare Services
```typescript
const cloudflareServices = {
  pages: {
    purpose: 'Static hosting and SSR',
    features: ['Git integration', 'Preview deployments', 'Analytics']
  },
  
  workers: {
    purpose: 'Edge computing',
    use_cases: ['API proxy', 'Auth handling', 'Image optimization']
  },
  
  kv: {
    purpose: 'Key-value storage',
    use_cases: ['Session storage', 'Cache', 'User preferences']
  },
  
  r2: {
    purpose: 'Object storage',
    use_cases: ['Media cache', 'Offline assets', 'Backups']
  },
  
  d1: {
    purpose: 'Edge SQL database',
    use_cases: ['Analytics', 'Search index', 'User data']
  },
  
  durable_objects: {
    purpose: 'Stateful edge computing',
    use_cases: ['WebSocket connections', 'Real-time sync']
  }
};
```

## Repository Structure

```
greater/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml              # Continuous integration
│   │   ├── deploy.yml          # Production deployment
│   │   └── preview.yml         # Preview deployments
│   └── ISSUE_TEMPLATE/
├── src/
│   ├── components/
│   │   ├── core/               # Static Astro components
│   │   ├── islands/            # Interactive components
│   │   │   ├── react/
│   │   │   ├── vue/
│   │   │   └── svelte/
│   │   └── themes/             # Theme-specific components
│   ├── layouts/
│   │   ├── BaseLayout.astro
│   │   ├── TimelineLayout.astro
│   │   └── SettingsLayout.astro
│   ├── pages/
│   │   ├── index.astro         # Landing page
│   │   ├── home.astro          # Home timeline
│   │   ├── local.astro         # Local timeline
│   │   ├── federated.astro     # Federated timeline
│   │   ├── @[handle]/          # User profiles
│   │   ├── tags/[tag].astro    # Hashtag timelines
│   │   └── settings/           # Settings pages
│   ├── lib/
│   │   ├── api/                # API client
│   │   ├── auth/               # Authentication
│   │   ├── utils/              # Utilities
│   │   └── stores/             # State management
│   ├── styles/
│   │   ├── global.css          # Global styles
│   │   ├── themes/             # Theme files
│   │   └── components/         # Component styles
│   └── types/
│       ├── mastodon.d.ts       # API types
│       └── app.d.ts            # App types
├── public/
│   ├── fonts/
│   ├── icons/
│   └── manifest.json           # PWA manifest
├── functions/                  # Cloudflare Workers
│   ├── api/
│   ├── auth/
│   └── media/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
│   ├── user-guide/
│   ├── developer/
│   └── api/
├── astro.config.mjs
├── wrangler.toml              # Cloudflare config
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── README.md
```

## API Integration

### Mastodon API Client
```typescript
// src/lib/api/client.ts
export class MastodonClient {
  constructor(
    private instanceUrl: string,
    private accessToken?: string
  ) {}

  // Instance information
  async getInstance(): Promise<Instance> {
    return this.get('/api/v1/instance');
  }

  // Timeline methods
  async getHomeTimeline(params?: TimelineParams): Promise<Status[]> {
    return this.get('/api/v1/timelines/home', params);
  }

  async getLocalTimeline(params?: TimelineParams): Promise<Status[]> {
    return this.get('/api/v1/timelines/public', { ...params, local: true });
  }

  async getFederatedTimeline(params?: TimelineParams): Promise<Status[]> {
    return this.get('/api/v1/timelines/public', params);
  }

  // Status methods
  async createStatus(status: CreateStatusParams): Promise<Status> {
    return this.post('/api/v1/statuses', status);
  }

  async getStatus(id: string): Promise<Status> {
    return this.get(`/api/v1/statuses/${id}`);
  }

  async deleteStatus(id: string): Promise<void> {
    return this.delete(`/api/v1/statuses/${id}`);
  }

  // Interaction methods
  async favoriteStatus(id: string): Promise<Status> {
    return this.post(`/api/v1/statuses/${id}/favourite`);
  }

  async reblogStatus(id: string): Promise<Status> {
    return this.post(`/api/v1/statuses/${id}/reblog`);
  }

  // Account methods
  async verifyCredentials(): Promise<Account> {
    return this.get('/api/v1/accounts/verify_credentials');
  }

  async getAccount(id: string): Promise<Account> {
    return this.get(`/api/v1/accounts/${id}`);
  }

  async followAccount(id: string): Promise<Relationship> {
    return this.post(`/api/v1/accounts/${id}/follow`);
  }

  // Search
  async search(q: string, params?: SearchParams): Promise<SearchResults> {
    return this.get('/api/v2/search', { q, ...params });
  }

  // WebSocket streaming
  streamUser(): EventSource {
    return this.stream('/api/v1/streaming/user');
  }

  streamPublic(): EventSource {
    return this.stream('/api/v1/streaming/public');
  }

  // HTTP methods
  private async get<T>(path: string, params?: any): Promise<T> {
    const url = new URL(path, this.instanceUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw new APIError(response.status, await response.text());
    }

    return response.json();
  }

  private async post<T>(path: string, data?: any): Promise<T> {
    const response = await fetch(new URL(path, this.instanceUrl).toString(), {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      throw new APIError(response.status, await response.text());
    }

    return response.json();
  }

  private stream(path: string): EventSource {
    const url = new URL(path, this.instanceUrl);
    url.searchParams.append('access_token', this.accessToken || '');
    return new EventSource(url.toString());
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {};
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }
}
```

### Instance Detection
```typescript
// src/lib/api/instance.ts
export async function detectInstanceCapabilities(instanceUrl: string) {
  try {
    const client = new MastodonClient(instanceUrl);
    const instance = await client.getInstance();
    
    return {
      // Basic info
      title: instance.title,
      description: instance.short_description,
      version: instance.version,
      
      // Capabilities
      features: {
        polls: versionSupports(instance.version, '2.8.0'),
        scheduling: versionSupports(instance.version, '2.7.0'),
        bookmarks: versionSupports(instance.version, '3.1.0'),
        lists: versionSupports(instance.version, '2.1.0'),
        filters: versionSupports(instance.version, '2.4.3'),
        reports: true, // Always available
        
        // Mastodon 4.0+ features
        editing: versionSupports(instance.version, '4.0.0'),
        translate: instance.configuration?.translation?.enabled || false,
        
        // Lesser-specific features (optional)
        costTracking: instance.version?.includes('lesser'),
        aiModeration: instance.pleroma?.metadata?.features?.includes('ai_moderation')
      },
      
      // Limits
      limits: {
        maxCharacters: instance.configuration?.statuses?.max_characters || 500,
        maxMediaAttachments: instance.configuration?.statuses?.max_media_attachments || 4,
        maxPollOptions: instance.configuration?.polls?.max_options || 4,
        maxPollCharacters: instance.configuration?.polls?.max_characters_per_option || 50,
        uploadLimit: instance.configuration?.media_attachments?.file_size_limit || 8388608
      },
      
      // Configuration
      configuration: {
        mediaTypes: instance.configuration?.media_attachments?.supported_mime_types || [],
        languages: instance.languages || [],
        registrations: instance.registrations?.enabled || false,
        approvalRequired: instance.registrations?.approval_required || false
      }
    };
  } catch (error) {
    console.error('Failed to detect instance capabilities:', error);
    return null;
  }
}
```

## UI/UX Design

### Design System
```typescript
const designSystem = {
  // Typography
  typography: {
    fonts: {
      sans: 'Inter, system-ui, sans-serif',
      mono: 'JetBrains Mono, monospace',
      serif: 'Lora, serif'
    },
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem'
    }
  },
  
  // Colors (CSS Custom Properties)
  colors: {
    // Semantic colors
    primary: 'var(--color-primary)',
    secondary: 'var(--color-secondary)',
    accent: 'var(--color-accent)',
    
    // UI colors
    background: 'var(--color-background)',
    surface: 'var(--color-surface)',
    border: 'var(--color-border)',
    
    // Text colors
    text: 'var(--color-text)',
    textMuted: 'var(--color-text-muted)',
    textInverse: 'var(--color-text-inverse)',
    
    // Status colors
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    error: 'var(--color-error)',
    info: 'var(--color-info)'
  },
  
  // Spacing
  spacing: {
    unit: '0.25rem',
    scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 56, 64]
  },
  
  // Components
  components: {
    button: {
      variants: ['primary', 'secondary', 'ghost', 'danger'],
      sizes: ['sm', 'md', 'lg'],
      states: ['default', 'hover', 'active', 'disabled']
    },
    
    card: {
      variants: ['elevated', 'outlined', 'filled'],
      padding: ['none', 'sm', 'md', 'lg']
    },
    
    input: {
      variants: ['default', 'filled', 'outlined'],
      sizes: ['sm', 'md', 'lg'],
      states: ['default', 'focus', 'error', 'disabled']
    }
  }
};
```

### Theme System
```css
/* src/styles/themes/default.css */
:root {
  /* Light theme */
  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  --color-secondary: #8b5cf6;
  --color-accent: #ec4899;
  
  --color-background: #ffffff;
  --color-surface: #f9fafb;
  --color-surface-hover: #f3f4f6;
  --color-border: #e5e7eb;
  
  --color-text: #111827;
  --color-text-muted: #6b7280;
  --color-text-inverse: #ffffff;
  
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}

/* Dark theme */
[data-theme="dark"] {
  --color-primary: #818cf8;
  --color-primary-hover: #6366f1;
  --color-secondary: #a78bfa;
  --color-accent: #f472b6;
  
  --color-background: #0f172a;
  --color-surface: #1e293b;
  --color-surface-hover: #334155;
  --color-border: #334155;
  
  --color-text: #f1f5f9;
  --color-text-muted: #94a3b8;
  --color-text-inverse: #0f172a;
}

/* High contrast theme */
[data-theme="high-contrast"] {
  --color-primary: #0000ff;
  --color-secondary: #ff00ff;
  --color-accent: #ff0000;
  
  --color-background: #ffffff;
  --color-surface: #ffffff;
  --color-border: #000000;
  
  --color-text: #000000;
  --color-text-muted: #333333;
}
```

### Layout System
```astro
---
// src/layouts/BaseLayout.astro
export interface Props {
  title: string;
  description?: string;
  image?: string;
  layout?: 'single' | 'multi' | 'focus';
}

const { title, description, image, layout = 'single' } = Astro.props;
---

<!DOCTYPE html>
<html lang="en" data-theme="auto" data-layout={layout}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} - Greater</title>
  <meta name="description" content={description}>
  
  <!-- Open Graph -->
  <meta property="og:title" content={title}>
  <meta property="og:description" content={description}>
  <meta property="og:image" content={image}>
  
  <!-- PWA -->
  <link rel="manifest" href="/manifest.json">
  <meta name="theme-color" content="#6366f1">
  
  <!-- Preloads -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preload" href="/fonts/inter-var.woff2" as="font" crossorigin>
  
  <ViewTransitions />
</head>
<body>
  <div class="app-container" data-layout={layout}>
    <Header />
    
    <main class="main-content">
      <slot />
    </main>
    
    <Navigation />
  </div>
  
  <script>
    // Theme detection
    const theme = localStorage.getItem('theme') || 'auto';
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light';
    } else {
      document.documentElement.dataset.theme = theme;
    }
  </script>
</body>
</html>
```

## Performance Strategy

### Optimization Techniques
```typescript
const performanceStrategy = {
  // Build-time optimizations
  buildTime: {
    prerendering: 'Static pages pre-rendered at build',
    compression: 'Brotli compression for all assets',
    minification: 'HTML, CSS, JS minification',
    treeshaking: 'Remove unused code',
    bundling: 'Optimized chunk splitting'
  },
  
  // Runtime optimizations
  runtime: {
    lazyLoading: 'Components loaded on demand',
    codeSpitting: 'Route-based code splitting',
    resourceHints: 'Preload, prefetch, preconnect',
    serviceWorker: 'Offline caching strategy',
    imageOptimization: 'Responsive images with WebP'
  },
  
  // Caching strategy
  caching: {
    static: 'Immutable cache for assets',
    api: 'Stale-while-revalidate for API',
    images: 'Long-term cache with purging',
    html: 'Short-term cache with etags'
  },
  
  // Monitoring
  monitoring: {
    webVitals: 'Core Web Vitals tracking',
    errors: 'Client-side error tracking',
    performance: 'Real User Monitoring',
    analytics: 'Privacy-respecting analytics'
  }
};
```

### Service Worker Strategy
```javascript
// public/sw.js
const CACHE_NAME = 'greater-v1';
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/fonts/inter-var.woff2'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // API calls - network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request);
        })
    );
    return;
  }
  
  // Static assets - cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request);
    })
  );
});
```

## Deployment Architecture

### Cloudflare Configuration
```toml
# wrangler.toml
name = "greater-client"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[site]
bucket = "./dist"

[build]
command = "npm run build"

[build.upload]
format = "service-worker"

# Environment variables
[env.production.vars]
ENVIRONMENT = "production"
API_VERSION = "v1"

# KV Namespaces
[[env.production.kv_namespaces]]
binding = "SESSIONS"
id = "session-storage-production"

[[env.production.kv_namespaces]]
binding = "CACHE"
id = "api-cache-production"

[[env.production.kv_namespaces]]
binding = "PREFERENCES"
id = "user-preferences-production"

# R2 Buckets
[[env.production.r2_buckets]]
binding = "MEDIA"
bucket_name = "greater-media-production"

# D1 Databases
[[env.production.d1_databases]]
binding = "ANALYTICS"
database_name = "greater-analytics"
database_id = "analytics-db-production"

# Durable Objects
[[env.production.durable_objects.bindings]]
name = "WEBSOCKET"
class_name = "WebSocketHandler"
script_name = "websocket-handler"
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Test
        run: npm run test
      
      - name: Build
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
        env:
          PUBLIC_COMMIT_SHA: ${{ github.sha }}
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=greater
```

## Testing Strategy

### Testing Pyramid
```typescript
const testingStrategy = {
  // Unit tests (70%)
  unit: {
    framework: 'Vitest',
    coverage: '80% minimum',
    focus: [
      'API client methods',
      'State management',
      'Utility functions',
      'Component logic'
    ]
  },
  
  // Integration tests (20%)
  integration: {
    framework: 'Vitest + MSW',
    focus: [
      'API integration',
      'Authentication flow',
      'State persistence',
      'Component interaction'
    ]
  },
  
  // E2E tests (10%)
  e2e: {
    framework: 'Playwright',
    browsers: ['chromium', 'firefox', 'webkit'],
    focus: [
      'Critical user paths',
      'Authentication',
      'Post composition',
      'Timeline navigation'
    ]
  },
  
  // Performance tests
  performance: {
    tools: ['Lighthouse CI', 'WebPageTest'],
    metrics: {
      lcp: '< 2.5s',
      fid: '< 100ms',
      cls: '< 0.1',
      ttfb: '< 600ms'
    }
  }
};
```

### Example Test
```typescript
// tests/unit/api/client.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MastodonClient } from '@/lib/api/client';

describe('MastodonClient', () => {
  let client: MastodonClient;
  
  beforeEach(() => {
    client = new MastodonClient('https://mastodon.social', 'test-token');
    global.fetch = vi.fn();
  });
  
  describe('getHomeTimeline', () => {
    it('should fetch home timeline', async () => {
      const mockStatuses = [
        { id: '1', content: 'Test post 1' },
        { id: '2', content: 'Test post 2' }
      ];
      
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatuses
      } as Response);
      
      const result = await client.getHomeTimeline({ limit: 20 });
      
      expect(fetch).toHaveBeenCalledWith(
        'https://mastodon.social/api/v1/timelines/home?limit=20',
        {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        }
      );
      
      expect(result).toEqual(mockStatuses);
    });
    
    it('should handle errors', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized'
      } as Response);
      
      await expect(client.getHomeTimeline()).rejects.toThrow('401');
    });
  });
});
```

## Documentation Plan

### Documentation Structure
```
docs/
├── user-guide/
│   ├── getting-started.md
│   ├── features/
│   │   ├── timelines.md
│   │   ├── posting.md
│   │   ├── interactions.md
│   │   └── settings.md
│   ├── troubleshooting.md
│   └── faq.md
├── developer/
│   ├── setup.md
│   ├── architecture.md
│   ├── api-reference.md
│   ├── contributing.md
│   └── plugins.md
├── deployment/
│   ├── cloudflare.md
│   ├── self-hosting.md
│   └── configuration.md
└── api/
    ├── rest-api.md
    ├── websocket.md
    └── types.md
```

### Documentation Standards
```markdown
# Feature Name

## Overview
Brief description of the feature and its purpose.

## Prerequisites
- Required knowledge
- System requirements
- Dependencies

## Usage

### Basic Example
\```typescript
// Code example
\```

### Advanced Usage
Detailed explanation with examples.

## Configuration
Available options and their defaults.

## Troubleshooting
Common issues and solutions.

## Related Topics
- Link to related documentation
- External resources
```

## Community & Governance

### Open Source Structure
```typescript
const governance = {
  // License
  license: 'MIT',
  
  // Contribution model
  contribution: {
    issues: 'GitHub Issues for bugs and features',
    prs: 'Pull requests with tests',
    discussions: 'GitHub Discussions for ideas',
    codeOfConduct: 'Contributor Covenant'
  },
  
  // Communication
  communication: {
    discord: 'Primary community chat',
    matrix: 'Federated alternative',
    github: 'Development discussion',
    mastodon: '@greater@mastodon.social'
  },
  
  // Decision making
  decisions: {
    model: 'Benevolent dictator for now',
    future: 'Core team with community input',
    rfcs: 'Request for Comments process'
  },
  
  // Funding
  funding: {
    donations: 'Open Collective',
    sponsors: 'GitHub Sponsors',
    grants: 'Apply for OSS grants'
  }
};
```

### Community Guidelines
```markdown
# Greater Community Guidelines

## Our Pledge
We pledge to make participation in our project a harassment-free experience for everyone.

## Our Standards
- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on what is best for the community
- Show empathy towards other community members

## Contribution Process
1. Check existing issues and discussions
2. Open an issue for significant changes
3. Fork the repository
4. Create a feature branch
5. Write tests for new functionality
6. Submit a pull request
7. Participate in code review

## Getting Help
- Documentation: Read the docs first
- Discord: Ask in #help channel
- GitHub Discussions: For longer topics
- Stack Overflow: Tag with 'greater-client'
```

## Cost Projections

### Development Costs
```typescript
const developmentCosts = {
  // Infrastructure (monthly)
  infrastructure: {
    cloudflare: {
      pages: 'Free (100k requests/month)',
      workers: '$5 (10M requests)',
      kv: '$0.50 (1M reads)',
      r2: '$0.015/GB stored',
      d1: '$5 (first 5GB)'
    },
    
    development: {
      github: 'Free (public repo)',
      ci_cd: 'Free (GitHub Actions)',
      monitoring: '$10 (Sentry)',
      analytics: 'Free (Plausible CE)'
    }
  },
  
  // Operational costs
  operational: {
    small: { // < 1k users
      monthly: '$0-10',
      requests: '< 1M/month',
      storage: '< 1GB',
      bandwidth: '< 10GB'
    },
    
    medium: { // 1k-10k users
      monthly: '$10-50',
      requests: '1M-10M/month',
      storage: '1-10GB',
      bandwidth: '10-100GB'
    },
    
    large: { // 10k+ users
      monthly: '$50-200',
      requests: '10M+/month',
      storage: '10GB+',
      bandwidth: '100GB+'
    }
  }
};
```

### Sustainability Model
```typescript
const sustainability = {
  // Revenue sources
  revenue: {
    donations: 'Community support',
    sponsors: 'Corporate sponsorship',
    hosted: 'Managed hosting service',
    premium: 'Premium features (optional)'
  },
  
  // Cost optimization
  optimization: {
    caching: 'Aggressive caching strategy',
    cdn: 'Cloudflare global CDN',
    compression: 'Brotli compression',
    lazy: 'Lazy loading everything'
  },
  
  // Growth strategy
  growth: {
    organic: 'Word of mouth',
    partnerships: 'Instance partnerships',
    marketing: 'Content marketing',
    community: 'Community building'
  }
};
```

## Success Metrics

### Key Performance Indicators
```typescript
const kpis = {
  // Technical metrics
  technical: {
    performance: {
      ttfb: '< 200ms globally',
      lcp: '< 1.5s on 3G',
      bundle: '< 100KB initial',
      lighthouse: '> 95 score'
    },
    
    reliability: {
      uptime: '99.9%',
      errorRate: '< 0.1%',
      crashRate: '< 0.01%'
    }
  },
  
  // User metrics
  user: {
    adoption: {
      downloads: '10k in first year',
      activeUsers: '1k daily active',
      retention: '> 60% monthly'
    },
    
    satisfaction: {
      nps: '> 50',
      reviews: '> 4.5 stars',
      support: '< 24h response'
    }
  },
  
  // Community metrics
  community: {
    contributors: '> 50 contributors',
    instances: '> 100 instances using',
    translations: '> 20 languages',
    accessibility: 'WCAG 2.1 AA'
  }
};
```

### Monitoring Dashboard
```typescript
// Cloudflare Analytics Integration
const analytics = {
  // Real User Monitoring
  rum: {
    webVitals: 'Track Core Web Vitals',
    errors: 'JavaScript error tracking',
    performance: 'Page load performance',
    userFlow: 'User journey tracking'
  },
  
  // Application metrics
  application: {
    apiCalls: 'API usage by endpoint',
    cacheHitRate: 'Cache effectiveness',
    activeUsers: 'Concurrent users',
    featureUsage: 'Feature adoption'
  },
  
  // Business metrics
  business: {
    growth: 'User growth rate',
    retention: 'User retention',
    engagement: 'Posts per user',
    satisfaction: 'User feedback'
  }
};
```

## Conclusion

Greater represents a new approach to ActivityPub clients: fast, beautiful, and truly independent. By leveraging Astro's performance, Cloudflare's global edge network, and the open Mastodon API, we can create a client that serves users better while remaining sustainable and community-driven.

The modular architecture ensures that Greater can evolve with user needs while maintaining its core principles of performance, privacy, and openness. With careful planning and community involvement, Greater can become the reference implementation for modern ActivityPub clients.

### Next Steps
1. **Community Feedback**: Share this plan for community input
2. **Team Formation**: Recruit initial contributors
3. **Prototype Development**: Build proof of concept
4. **Funding**: Apply for grants and set up donations
5. **Launch Planning**: Coordinate with instance admins

Together, we can build a better social web experience. 