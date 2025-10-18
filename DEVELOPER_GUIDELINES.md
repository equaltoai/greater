# Greater Client Developer Guidelines

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Development Philosophy](#development-philosophy)
3. [Getting Started](#getting-started)
4. [Project Structure](#project-structure)
5. [Coding Standards](#coding-standards)
6. [TypeScript Guidelines](#typescript-guidelines)
7. [Component Development](#component-development)
8. [State Management](#state-management)
9. [API Integration](#api-integration)
10. [Testing Requirements](#testing-requirements)
11. [Performance Standards](#performance-standards)
12. [Accessibility Requirements](#accessibility-requirements)
13. [Security Practices](#security-practices)
14. [Git Workflow](#git-workflow)
15. [Documentation Standards](#documentation-standards)
16. [Review Process](#review-process)

---

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. All contributors must adhere to our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Development Philosophy

### Core Principles

1. **Performance First**: Every feature must meet our performance budgets
2. **Accessibility Always**: WCAG 2.1 AA compliance is non-negotiable
3. **Privacy by Design**: No tracking without explicit consent
4. **Progressive Enhancement**: Core functionality works without JavaScript
5. **Mobile First**: Design for mobile, enhance for desktop
6. **Open Standards**: Strict adherence to ActivityPub/Mastodon API specs

### Technical Decisions

- **Framework**: Astro for optimal performance and developer experience
- **Islands**: Svelte exclusively for interactive components (no mixing frameworks)
- **Styling**: Tailwind CSS with custom design tokens
- **State**: Zustand for global state, Nanostores for component state
- **Testing**: Vitest for unit/integration, Playwright for E2E

---

## Getting Started

### Prerequisites

```bash
# Required versions
node >= 20.0.0
pnpm >= 9.0.0

# Optional but recommended
git >= 2.30.0
```

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/greater-website/greater.git
cd greater

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local

# Run development server
pnpm run dev
```

### Development Commands

```bash
pnpm run dev          # Start development server
pnpm run build        # Build for production
pnpm run preview      # Preview production build
pnpm run test         # Run all tests
pnpm run test:unit    # Run unit tests only
pnpm run test:e2e     # Run E2E tests
pnpm run lint         # Lint code
pnpm run format       # Format code
pnpm run typecheck    # Type check TypeScript
pnpm run analyze      # Analyze bundle size
```

---

## Project Structure

### Directory Organization

```
greater/
├── .github/                    # GitHub specific files
│   ├── workflows/             # CI/CD workflows
│   └── ISSUE_TEMPLATE/        # Issue templates
├── src/
│   ├── components/            # All components
│   │   ├── core/             # Static Astro components
│   │   │   ├── Button.astro
│   │   │   └── Card.astro
│   │   ├── islands/          # Interactive components
│   │   │   └── svelte/       # Svelte-only islands
│   │   │       ├── Timeline.svelte
│   │   │       └── ComposeBox.svelte
│   │   └── themes/           # Theme-specific overrides
│   ├── layouts/              # Page layouts
│   │   ├── BaseLayout.astro
│   │   └── TimelineLayout.astro
│   ├── pages/                # File-based routing
│   │   ├── index.astro       # Homepage
│   │   ├── @[handle]/        # Dynamic routes
│   │   └── api/              # API routes
│   ├── lib/                  # Business logic
│   │   ├── api/              # API client code
│   │   ├── auth/             # Authentication logic
│   │   ├── stores/           # State management
│   │   └── utils/            # Utility functions
│   ├── styles/               # Global styles
│   │   ├── global.css        # Global CSS
│   │   └── themes/           # Theme files
│   └── types/                # TypeScript types
│       ├── mastodon.d.ts     # Mastodon API types
│       └── app.d.ts          # Application types
├── public/                   # Static assets
│   ├── fonts/               # Web fonts
│   ├── icons/               # App icons
│   └── manifest.json        # PWA manifest
├── functions/               # Cloudflare Workers
│   ├── api/                 # API proxy functions
│   └── auth/                # Auth functions
├── tests/                   # Test files
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── e2e/                 # End-to-end tests
└── docs/                    # Documentation
    ├── api/                 # API documentation
    └── guides/              # User guides
```

### File Naming Conventions

```typescript
// Components
PascalCase.astro        // Astro components
PascalCase.svelte       // Svelte components

// Pages
kebab-case.astro        // Regular pages
[param].astro           // Dynamic routes
[...slug].astro         // Catch-all routes

// Scripts
camelCase.ts           // TypeScript files
camelCase.test.ts      // Test files
camelCase.spec.ts      // Spec files (alternative)

// Styles
kebab-case.css         // Style files
_partial.css           // Partial styles (imported)

// Config
kebab-case.json        // JSON configs
kebab-case.config.ts   // TS configs
```

---

## Coding Standards

### General Rules

1. **No Dead Code**: Remove commented code, unused imports, and variables
2. **Single Responsibility**: Each function/component does one thing well
3. **DRY Principle**: Don't Repeat Yourself, but don't over-abstract
4. **Early Returns**: Use guard clauses for cleaner code
5. **Meaningful Names**: Variables and functions should be self-documenting

### Code Style

```typescript
// ✅ Good: Descriptive names, early returns
export async function fetchUserTimeline(
  userId: string,
  options?: TimelineOptions
): Promise<Status[]> {
  if (!userId) {
    throw new Error('User ID is required');
  }

  const { limit = 20, sinceId } = options ?? {};
  
  try {
    const response = await api.get(`/users/${userId}/timeline`, {
      params: { limit, since_id: sinceId }
    });
    
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch timeline', { userId, error });
    throw new TimelineError('Could not load timeline');
  }
}

// ❌ Bad: Poor naming, no error handling
export async function get(id: string, opts: any) {
  const res = await api.get(`/users/${id}/timeline`, opts);
  return res.data;
}
```

### Import Organization

```typescript
// 1. Node/Deno built-ins
import { readFile } from 'node:fs/promises';

// 2. External dependencies
import { z } from 'zod';
import type { APIRoute } from 'astro';

// 3. Internal aliases
import { Button } from '@/components/core/Button';
import { api } from '@/lib/api';

// 4. Relative imports
import { formatDate } from './utils';
import type { User } from './types';

// 5. Style imports
import './styles.css';
```

---

## TypeScript Guidelines

### Strict Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### Type Definitions

```typescript
// ✅ Good: Explicit types, proper interfaces
interface TimelineOptions {
  limit?: number;
  sinceId?: string;
  maxId?: string;
  excludeReplies?: boolean;
  excludeReblogs?: boolean;
}

interface Status {
  id: string;
  content: string;
  createdAt: string;
  account: Account;
  reblog?: Status;
  mediaAttachments: MediaAttachment[];
}

// Use type for unions and intersections
type Visibility = 'public' | 'unlisted' | 'private' | 'direct';
type StatusWithRelationship = Status & { relationship: Relationship };

// ❌ Bad: Using 'any', weak types
interface Options {
  [key: string]: any;
}
```

### Utility Types

```typescript
// Use built-in utility types
type PartialStatus = Partial<Status>;
type RequiredStatus = Required<Status>;
type StatusKeys = keyof Status;

// Create custom utility types
type Nullable<T> = T | null;
type AsyncReturnType<T extends (...args: any) => Promise<any>> = 
  T extends (...args: any) => Promise<infer R> ? R : never;

// Const assertions for literals
const VISIBILITIES = ['public', 'unlisted', 'private', 'direct'] as const;
type Visibility = typeof VISIBILITIES[number];
```

---

## Component Development

### Astro Components (Static)

```astro
---
// src/components/core/Button.astro
import type { HTMLAttributes } from 'astro/types';

interface Props extends HTMLAttributes<'button'> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const { 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  class: className,
  ...attrs 
} = Astro.props;

const classes = [
  'btn',
  `btn-${variant}`,
  `btn-${size}`,
  fullWidth && 'btn-full',
  className
].filter(Boolean).join(' ');
---

<button class={classes} {...attrs}>
  <slot />
</button>

<style>
  .btn {
    @apply inline-flex items-center justify-center rounded-md font-medium transition-colors;
    @apply focus:outline-none focus:ring-2 focus:ring-offset-2;
  }
  
  .btn-primary {
    @apply bg-primary text-white hover:bg-primary-dark;
    @apply focus:ring-primary;
  }
  
  .btn-sm { @apply px-3 py-1.5 text-sm; }
  .btn-md { @apply px-4 py-2; }
  .btn-lg { @apply px-6 py-3 text-lg; }
  .btn-full { @apply w-full; }
</style>
```

### Svelte Components (Interactive)

```svelte
<!-- src/components/islands/svelte/Timeline.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { derived } from 'svelte/store';
  import { timeline$ } from '@/lib/stores/timeline';
  import { virtualList } from '@/lib/utils/virtual-list';
  import StatusCard from './StatusCard.svelte';
  import LoadingSpinner from './LoadingSpinner.svelte';
  import type { Status, TimelineType } from '@/types';
  
  export let type: TimelineType = 'home';
  export let accountId?: string;
  
  let container: HTMLElement;
  let scrollY = 0;
  
  const items = derived(timeline$, $timeline => 
    $timeline[type]?.items ?? []
  );
  
  const virtualItems = virtualList({
    items,
    itemHeight: 150,
    container: () => container,
    scrollY: () => scrollY
  });
  
  onMount(() => {
    timeline$.load(type, { accountId });
    
    const handleScroll = () => {
      scrollY = window.scrollY;
      
      // Load more when near bottom
      if (window.innerHeight + scrollY >= document.body.offsetHeight - 1000) {
        timeline$.loadMore(type);
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  });
</script>

<div class="timeline" bind:this={container}>
  {#if $items.length === 0}
    <LoadingSpinner />
  {:else}
    <ul class="timeline-list" role="feed" aria-label="Timeline">
      {#each $virtualItems as item (item.id)}
        <li class="timeline-item">
          <StatusCard status={item} />
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .timeline {
    @apply min-h-screen;
  }
  
  .timeline-list {
    @apply space-y-2;
  }
  
  .timeline-item {
    @apply bg-surface rounded-lg p-4 shadow-sm;
    @apply hover:shadow-md transition-shadow;
  }
</style>
```

### Component Guidelines

1. **Props Validation**: Always define and validate props
2. **Slots**: Use named slots for complex layouts
3. **Events**: Use CustomEvent for component communication
4. **Lifecycle**: Clean up subscriptions and event listeners
5. **Accessibility**: Include ARIA labels and keyboard support

---

## State Management

### Global State (Zustand)

```typescript
// src/lib/stores/auth.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';
import type { User, AuthState } from '@/types';

interface AuthStore extends AuthState {
  login: (instance: string, token: string) => Promise<void>;
  logout: () => void;
  switchAccount: (accountId: string) => void;
}

export const useAuth = create<AuthStore>()(
  persist(
    (set, get) => ({
      currentUser: null,
      accounts: [],
      isAuthenticated: false,
      
      login: async (instance, token) => {
        try {
          api.setInstance(instance);
          api.setToken(token);
          
          const user = await api.verifyCredentials();
          
          set(state => ({
            currentUser: user,
            accounts: [...state.accounts, { user, instance, token }],
            isAuthenticated: true
          }));
        } catch (error) {
          console.error('Login failed:', error);
          throw new AuthError('Invalid credentials');
        }
      },
      
      logout: () => {
        api.clearToken();
        set({ currentUser: null, isAuthenticated: false });
      },
      
      switchAccount: (accountId) => {
        const account = get().accounts.find(a => a.user.id === accountId);
        if (account) {
          api.setInstance(account.instance);
          api.setToken(account.token);
          set({ currentUser: account.user });
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        accounts: state.accounts,
        currentUser: state.currentUser
      })
    }
  )
);
```

### Component State (Nanostores)

```typescript
// src/lib/stores/compose.ts
import { atom, computed, action } from 'nanostores';
import type { MediaAttachment, Visibility } from '@/types';

export const composeText = atom<string>('');
export const composeVisibility = atom<Visibility>('public');
export const composeMedia = atom<MediaAttachment[]>([]);
export const composeCW = atom<string>('');

export const composeLength = computed(composeText, text => 
  text.length
);

export const canPost = computed(
  [composeText, composeMedia],
  (text, media) => text.trim().length > 0 || media.length > 0
);

export const addMedia = action(composeMedia, 'addMedia', (store, file: File) => {
  // Handle media upload
  const attachment = uploadFile(file);
  store.set([...store.get(), attachment]);
});

export const clearCompose = action(
  [composeText, composeMedia, composeCW],
  'clear',
  (...stores) => {
    stores.forEach(store => store.set(store === composeText ? '' : []));
  }
);
```

---

## API Integration

### API Client Structure

```typescript
// src/lib/api/client.ts
class MastodonClient {
  private instance: string;
  private token?: string;
  private cache = new Map<string, CacheEntry>();
  
  constructor(instance: string, token?: string) {
    this.instance = instance;
    this.token = token;
  }
  
  private async request<T>(
    method: string,
    path: string,
    options?: RequestOptions
  ): Promise<T> {
    const url = new URL(path, this.instance);
    
    // Check cache for GET requests
    if (method === 'GET' && !options?.skipCache) {
      const cached = this.cache.get(url.toString());
      if (cached && !this.isExpired(cached)) {
        return cached.data as T;
      }
    }
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': this.token ? `Bearer ${this.token}` : '',
        'Content-Type': 'application/json',
        ...options?.headers
      },
      body: options?.body ? JSON.stringify(options.body) : undefined
    });
    
    if (!response.ok) {
      throw new APIError(response.status, await response.text());
    }
    
    const data = await response.json();
    
    // Cache successful GET requests
    if (method === 'GET') {
      this.cache.set(url.toString(), {
        data,
        timestamp: Date.now(),
        maxAge: options?.cacheTime ?? 60000
      });
    }
    
    return data;
  }
  
  // Typed API methods
  async getTimeline(type: TimelineType, params?: TimelineParams) {
    return this.request<Status[]>('GET', `/api/v1/timelines/${type}`, {
      params
    });
  }
}
```

### Error Handling

```typescript
// src/lib/api/errors.ts
export class APIError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'APIError';
  }
  
  static isAPIError(error: unknown): error is APIError {
    return error instanceof APIError;
  }
}

export function handleAPIError(error: unknown): never {
  if (APIError.isAPIError(error)) {
    switch (error.status) {
      case 401:
        // Redirect to login
        window.location.href = '/auth/login';
        break;
      case 429:
        // Show rate limit message
        showToast('Rate limited. Please try again later.');
        break;
      default:
        // Show generic error
        showToast(`Error: ${error.message}`);
    }
  }
  
  throw error;
}
```

---

## Testing Requirements

### Test Structure

```typescript
// tests/unit/components/Button.test.ts
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Button from '@/components/islands/svelte/Button.svelte';

describe('Button Component', () => {
  it('renders with default props', () => {
    const { getByRole } = render(Button, {
      props: { children: 'Click me' }
    });
    
    const button = getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });
  
  it('applies variant classes', () => {
    const { getByRole } = render(Button, {
      props: { variant: 'danger' }
    });
    
    expect(getByRole('button')).toHaveClass('btn-danger');
  });
  
  it('handles click events', async () => {
    const handleClick = vi.fn();
    const { getByRole } = render(Button, {
      props: { onClick: handleClick }
    });
    
    await userEvent.click(getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### Testing Checklist

- [ ] Unit tests for all utilities and helpers
- [ ] Component tests for all interactive components
- [ ] Integration tests for API interactions
- [ ] E2E tests for critical user paths
- [ ] Accessibility tests with axe-core
- [ ] Visual regression tests for UI components
- [ ] Performance tests for bundle size
- [ ] Security tests for auth flows

### Test Coverage Requirements

```yaml
# vitest.config.ts thresholds
coverage:
  statements: 80
  branches: 80
  functions: 80
  lines: 80
  
  # Critical paths require 100%
  include:
    - 'src/lib/auth/**': 100
    - 'src/lib/api/client.ts': 100
```

---

## Performance Standards

### Performance Budgets

```javascript
// lighthouse.config.js
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          cpuSlowdownMultiplier: 1
        }
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.95 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        
        // Metrics
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        
        // Resource budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 100000 }],
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 50000 }],
        'resource-summary:image:size': ['error', { maxNumericValue: 200000 }],
        'resource-summary:total:size': ['error', { maxNumericValue: 500000 }]
      }
    }
  }
};
```

### Optimization Techniques

1. **Code Splitting**: Route-based and component-based splitting
2. **Tree Shaking**: Remove unused code
3. **Lazy Loading**: Images, components, and routes
4. **Caching**: Aggressive caching with proper invalidation
5. **Compression**: Brotli for text assets
6. **CDN**: Cloudflare's global edge network
7. **Preloading**: Critical resources
8. **Service Worker**: Offline support and caching

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

```svelte
<!-- Example: Accessible Button -->
<button
  class="btn"
  aria-label={ariaLabel}
  aria-pressed={isPressed}
  aria-disabled={disabled}
  disabled={disabled}
  on:click={handleClick}
  on:keydown={handleKeydown}
>
  {#if loading}
    <span class="sr-only">Loading</span>
    <LoadingSpinner aria-hidden="true" />
  {:else}
    <slot />
  {/if}
</button>

<style>
  /* Focus styles must be visible */
  .btn:focus-visible {
    @apply ring-2 ring-primary ring-offset-2;
  }
  
  /* Sufficient color contrast */
  .btn {
    /* AA requires 4.5:1 for normal text, 3:1 for large text */
    @apply bg-primary text-white; /* Ensure contrast ratio */
  }
</style>
```

### Accessibility Checklist

- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible and clear
- [ ] Color contrast meets WCAG standards
- [ ] Images have appropriate alt text
- [ ] Forms have proper labels and error messages
- [ ] ARIA labels for icon-only buttons
- [ ] Skip navigation links
- [ ] Proper heading hierarchy
- [ ] Screen reader announcements for dynamic content
- [ ] Reduced motion support

---

## Security Practices

### Input Validation

```typescript
// Always validate and sanitize user input
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

const StatusSchema = z.object({
  content: z.string().max(500).transform(val => 
    DOMPurify.sanitize(val, { ALLOWED_TAGS: [] })
  ),
  visibility: z.enum(['public', 'unlisted', 'private', 'direct']),
  sensitive: z.boolean().default(false),
  spoilerText: z.string().max(100).optional()
});

export function validateStatus(input: unknown) {
  return StatusSchema.parse(input);
}
```

### Authentication Security

```typescript
// Never store sensitive data in localStorage
// Use httpOnly cookies or sessionStorage for tokens

// ✅ Good: Secure token storage
export function storeToken(token: string) {
  // Store in memory for current session
  api.setToken(token);
  
  // Store encrypted in sessionStorage
  const encrypted = encrypt(token, SESSION_KEY);
  sessionStorage.setItem('auth_token', encrypted);
}

// ❌ Bad: Insecure storage
export function badStoreToken(token: string) {
  localStorage.setItem('token', token); // Vulnerable to XSS
}
```

### Content Security Policy

```typescript
// astro.config.mjs
export default defineConfig({
  security: {
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
        'style-src': ["'self'", "'unsafe-inline'"],
        'img-src': ["'self'", 'data:', 'https:'],
        'connect-src': ["'self'", 'https://*.mastodon.social'],
        'font-src': ["'self'"],
        'object-src': ["'none'"],
        'media-src': ["'self'", 'https:'],
        'frame-src': ["'none'"],
      }
    }
  }
});
```

---

## Git Workflow

### Branch Strategy

```bash
main          # Production-ready code
├── develop   # Integration branch
├── feature/* # New features
├── fix/*     # Bug fixes
├── chore/*   # Maintenance tasks
└── release/* # Release preparation
```

### Commit Messages

```bash
# Format: <type>(<scope>): <subject>

feat(timeline): add infinite scroll support
fix(auth): resolve token refresh race condition
docs(api): update endpoint documentation
style(button): improve focus states
refactor(store): simplify state management
test(timeline): add unit tests for virtual scrolling
chore(deps): update dependencies

# Breaking changes
feat(api)!: update to Mastodon v4 API

# Multi-line with body
fix(compose): prevent data loss on navigation

The compose form now saves drafts automatically when navigating away.
This prevents users from losing their work if they accidentally click
a link or press the back button.

Fixes #123
```

### Pull Request Process

1. **Create feature branch** from `develop`
2. **Write code** following all guidelines
3. **Write tests** for new functionality
4. **Run checks** locally: `pnpm run ci`
5. **Create PR** with description template
6. **Address feedback** from reviewers
7. **Squash and merge** when approved

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Accessibility tested
- [ ] Performance impact assessed

## Screenshots
If applicable, add screenshots

## Related Issues
Fixes #(issue)
```

---

## Documentation Standards

### Code Documentation

```typescript
/**
 * Fetches a user's timeline with pagination support.
 * 
 * @param userId - The ID of the user whose timeline to fetch
 * @param options - Optional parameters for filtering and pagination
 * @returns Promise resolving to array of Status objects
 * @throws {APIError} When the API request fails
 * @throws {ValidationError} When parameters are invalid
 * 
 * @example
 * ```ts
 * const timeline = await fetchUserTimeline('123', {
 *   limit: 20,
 *   excludeReplies: true
 * });
 * ```
 */
export async function fetchUserTimeline(
  userId: string,
  options?: TimelineOptions
): Promise<Status[]> {
  // Implementation
}
```

### README Standards

Every significant directory should have a README:

```markdown
# Component Name

## Purpose
Brief description of what this component does

## Usage
\```tsx
import { Component } from './Component';

<Component prop="value" />
\```

## Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| prop | string | - | Description |

## Examples
Link to Storybook or examples

## Notes
Any special considerations
```

---

## Review Process

### Code Review Checklist

#### Functionality
- [ ] Code performs the intended function
- [ ] Edge cases are handled
- [ ] Error handling is appropriate
- [ ] No regression in existing features

#### Code Quality
- [ ] Follows coding standards
- [ ] No code duplication
- [ ] Clear and meaningful names
- [ ] Appropriate comments where needed

#### Testing
- [ ] Unit tests cover new code
- [ ] Integration tests where appropriate
- [ ] No decrease in coverage
- [ ] Tests are meaningful, not just coverage

#### Performance
- [ ] No unnecessary re-renders
- [ ] Efficient algorithms used
- [ ] Bundle size impact checked
- [ ] Loading states implemented

#### Security
- [ ] Input validation implemented
- [ ] No sensitive data exposed
- [ ] Authentication properly handled
- [ ] XSS prevention measures

#### Accessibility
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Color contrast verified
- [ ] Focus management correct

### Review Etiquette

1. **Be constructive**: Suggest improvements, don't just criticize
2. **Be specific**: Point to exact lines and suggest alternatives
3. **Be timely**: Review within 24 hours
4. **Be thorough**: Check functionality, not just syntax
5. **Be kind**: Remember there's a human on the other side

---

## Continuous Improvement

This document is a living guide. Propose changes through:

1. **Discord Discussion**: For major changes
2. **GitHub Issues**: For specific problems
3. **Pull Requests**: For direct improvements

Regular reviews ensure guidelines stay relevant and helpful.

---

*Last updated: [Date]*
*Version: 1.0.0*