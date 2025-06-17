# Greater Client - Svelte Components Guide

## Overview

Greater uses Svelte exclusively for all interactive islands within the Astro framework. This decision provides consistency, performance, and an excellent developer experience.

## Why Svelte for Greater?

### Performance Benefits
- **No Virtual DOM**: Direct DOM manipulation means faster updates
- **Compile-time optimization**: Smaller runtime overhead (~10KB)
- **Built-in reactivity**: No need for complex state management libraries
- **Tree-shaking by default**: Unused code is eliminated at build time

### Developer Experience
- **Simple syntax**: Less boilerplate than React/Vue
- **Built-in stores**: State management without external dependencies
- **TypeScript support**: First-class TS integration
- **Scoped styles**: CSS encapsulation without CSS-in-JS
- **Transitions/animations**: Built-in motion capabilities

## Component Architecture

### Base Component Structure

```svelte
<!-- components/StatusCard.svelte -->
<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { fade, slide } from 'svelte/transition';
  import type { Status } from '$lib/types';
  import { currentUser } from '$lib/stores/auth';
  import { formatRelativeTime } from '$lib/utils/date';
  
  // Props
  export let status: Status;
  export let showThread = true;
  export let isDetailView = false;
  
  // Local state
  let isExpanded = false;
  let isReplying = false;
  
  // Event dispatcher
  const dispatch = createEventDispatcher<{
    reply: { status: Status };
    boost: { status: Status };
    favorite: { status: Status };
    bookmark: { status: Status };
  }>();
  
  // Reactive statements
  $: isBoosted = status.reblogged;
  $: isFavorited = status.favourited;
  $: isBookmarked = status.bookmarked;
  $: isOwnStatus = $currentUser?.id === status.account.id;
  
  // Methods
  async function handleBoost() {
    if (isBoosted) {
      await unboostStatus(status.id);
    } else {
      await boostStatus(status.id);
    }
    dispatch('boost', { status });
  }
  
  onMount(() => {
    // Any initialization logic
  });
</script>

<article 
  class="status-card"
  class:status-card--detail={isDetailView}
  transition:slide={{ duration: 200 }}
>
  {#if status.reblog}
    <div class="boost-indicator">
      <Icon name="boost" />
      <a href="/@{status.account.acct}">
        {status.account.display_name} boosted
      </a>
    </div>
  {/if}
  
  <div class="status-header">
    <Avatar account={status.account} />
    <div class="status-meta">
      <a href="/@{status.account.acct}" class="author-name">
        {status.account.display_name}
      </a>
      <span class="author-handle">@{status.account.acct}</span>
      <time datetime={status.created_at}>
        {formatRelativeTime(status.created_at)}
      </time>
    </div>
  </div>
  
  <div class="status-content">
    {@html status.content}
  </div>
  
  {#if status.media_attachments.length > 0}
    <MediaGallery attachments={status.media_attachments} />
  {/if}
  
  <div class="status-actions">
    <button 
      on:click={() => dispatch('reply', { status })}
      class="action-button"
      aria-label="Reply"
    >
      <Icon name="reply" />
      {#if status.replies_count > 0}
        <span>{status.replies_count}</span>
      {/if}
    </button>
    
    <button 
      on:click={handleBoost}
      class="action-button"
      class:active={isBoosted}
      aria-label={isBoosted ? 'Unboost' : 'Boost'}
    >
      <Icon name="boost" />
      {#if status.reblogs_count > 0}
        <span>{status.reblogs_count}</span>
      {/if}
    </button>
    
    <!-- More actions... -->
  </div>
</article>

<style>
  .status-card {
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    margin-bottom: var(--space-2);
  }
  
  .status-card--detail {
    border-radius: 0;
    margin-bottom: 0;
  }
  
  .status-header {
    display: flex;
    gap: var(--space-3);
    margin-bottom: var(--space-3);
  }
  
  .status-content {
    line-height: 1.5;
    word-wrap: break-word;
  }
  
  .status-content :global(a) {
    color: var(--color-primary);
    text-decoration: none;
  }
  
  .status-actions {
    display: flex;
    gap: var(--space-6);
    margin-top: var(--space-3);
  }
  
  .action-button {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    background: none;
    border: none;
    color: var(--color-text-muted);
    cursor: pointer;
    padding: var(--space-2);
    border-radius: var(--radius-sm);
    transition: all 0.2s;
  }
  
  .action-button:hover {
    background: var(--color-surface-hover);
  }
  
  .action-button.active {
    color: var(--color-primary);
  }
</style>
```

## State Management Patterns

### 1. **Component State**

```svelte
<script lang="ts">
  // Local component state
  let isLoading = false;
  let error: Error | null = null;
  let data: any[] = [];
  
  // Derived state
  $: hasData = data.length > 0;
  $: isEmpty = !isLoading && !hasData;
  
  // State updates
  async function loadData() {
    isLoading = true;
    error = null;
    
    try {
      data = await fetchData();
    } catch (e) {
      error = e as Error;
    } finally {
      isLoading = false;
    }
  }
</script>
```

### 2. **Global Stores**

```typescript
// stores/auth.ts
import { writable, derived } from 'svelte/store';
import type { User, Instance } from '$lib/types';

// Writable stores
export const currentUser = writable<User | null>(null);
export const currentInstance = writable<Instance | null>(null);
export const accessToken = writable<string | null>(null);

// Derived stores
export const isAuthenticated = derived(
  [currentUser, accessToken],
  ([$user, $token]) => !!$user && !!$token
);

// Store methods
export const auth = {
  async login(instance: string, token: string) {
    accessToken.set(token);
    const user = await fetchCurrentUser(token);
    currentUser.set(user);
    currentInstance.set(instance);
  },
  
  logout() {
    currentUser.set(null);
    accessToken.set(null);
    currentInstance.set(null);
  }
};
```

### 3. **Context API**

```svelte
<!-- TimelineProvider.svelte -->
<script lang="ts">
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  
  const timeline = writable({
    statuses: [],
    hasMore: true,
    isLoading: false
  });
  
  setContext('timeline', {
    timeline,
    loadMore: async () => {
      // Load more logic
    },
    refresh: async () => {
      // Refresh logic
    }
  });
</script>

<slot />

<!-- TimelineItem.svelte -->
<script lang="ts">
  import { getContext } from 'svelte';
  
  const { timeline, loadMore } = getContext('timeline');
  
  $: statuses = $timeline.statuses;
</script>
```

## Component Patterns

### 1. **Compound Components**

```svelte
<!-- Modal.svelte -->
<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { fade, scale } from 'svelte/transition';
  
  export let open = false;
  
  const dispatch = createEventDispatcher();
  
  function handleClose() {
    open = false;
    dispatch('close');
  }
</script>

{#if open}
  <div 
    class="modal-backdrop"
    on:click={handleClose}
    transition:fade={{ duration: 200 }}
  >
    <div 
      class="modal-content"
      on:click|stopPropagation
      transition:scale={{ duration: 200, start: 0.95 }}
    >
      <slot name="header" />
      <slot />
      <slot name="footer" />
    </div>
  </div>
{/if}

<!-- Usage -->
<Modal bind:open={showSettings}>
  <svelte:fragment slot="header">
    <h2>Settings</h2>
  </svelte:fragment>
  
  <SettingsPanel />
  
  <svelte:fragment slot="footer">
    <button on:click={() => showSettings = false}>Close</button>
  </svelte:fragment>
</Modal>
```

### 2. **Render Props Pattern**

```svelte
<!-- VirtualList.svelte -->
<script lang="ts">
  export let items: any[];
  export let itemHeight: number;
  export let overscan = 3;
  
  let scrollTop = 0;
  let containerHeight = 0;
  
  $: visibleStart = Math.floor(scrollTop / itemHeight);
  $: visibleEnd = Math.ceil((scrollTop + containerHeight) / itemHeight);
  $: startIndex = Math.max(0, visibleStart - overscan);
  $: endIndex = Math.min(items.length, visibleEnd + overscan);
  $: visibleItems = items.slice(startIndex, endIndex);
  $: offsetY = startIndex * itemHeight;
</script>

<div 
  class="virtual-list"
  bind:scrollTop
  bind:clientHeight={containerHeight}
>
  <div style="height: {items.length * itemHeight}px">
    <div style="transform: translateY({offsetY}px)">
      {#each visibleItems as item, i (item.id)}
        <div style="height: {itemHeight}px">
          <slot {item} index={startIndex + i} />
        </div>
      {/each}
    </div>
  </div>
</div>

<!-- Usage -->
<VirtualList items={statuses} itemHeight={120}>
  <StatusCard status={item} />
</VirtualList>
```

### 3. **Action Directives**

```typescript
// actions/clickOutside.ts
export function clickOutside(node: HTMLElement, callback: () => void) {
  function handleClick(event: MouseEvent) {
    if (!node.contains(event.target as Node)) {
      callback();
    }
  }
  
  document.addEventListener('click', handleClick, true);
  
  return {
    destroy() {
      document.removeEventListener('click', handleClick, true);
    }
  };
}

// actions/lazyLoad.ts
export function lazyLoad(node: HTMLImageElement) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        node.src = node.dataset.src!;
        observer.unobserve(node);
      }
    });
  });
  
  observer.observe(node);
  
  return {
    destroy() {
      observer.disconnect();
    }
  };
}
```

```svelte
<!-- Using actions -->
<script>
  import { clickOutside, lazyLoad } from '$lib/actions';
  
  let showMenu = false;
</script>

<div use:clickOutside={() => showMenu = false}>
  <button on:click={() => showMenu = !showMenu}>Menu</button>
  {#if showMenu}
    <nav>...</nav>
  {/if}
</div>

<img 
  use:lazyLoad
  data-src="/path/to/image.jpg"
  alt="Lazy loaded image"
/>
```

## Testing Svelte Components

### Unit Testing with Vitest

```typescript
// StatusCard.test.ts
import { render, fireEvent } from '@testing-library/svelte';
import { vi } from 'vitest';
import StatusCard from './StatusCard.svelte';
import { currentUser } from '$lib/stores/auth';

describe('StatusCard', () => {
  const mockStatus = {
    id: '1',
    content: '<p>Test status</p>',
    account: {
      id: '2',
      acct: 'testuser',
      display_name: 'Test User'
    },
    created_at: new Date().toISOString(),
    reblogged: false,
    favourited: false,
    bookmarked: false,
    replies_count: 5,
    reblogs_count: 10,
    favourites_count: 20
  };
  
  test('renders status content', () => {
    const { getByText } = render(StatusCard, {
      props: { status: mockStatus }
    });
    
    expect(getByText('Test status')).toBeInTheDocument();
    expect(getByText('Test User')).toBeInTheDocument();
  });
  
  test('dispatches reply event', async () => {
    const { getByLabelText, component } = render(StatusCard, {
      props: { status: mockStatus }
    });
    
    const handleReply = vi.fn();
    component.$on('reply', handleReply);
    
    await fireEvent.click(getByLabelText('Reply'));
    
    expect(handleReply).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: { status: mockStatus }
      })
    );
  });
  
  test('shows boost state correctly', () => {
    currentUser.set({ id: '3' });
    
    const { getByLabelText, rerender } = render(StatusCard, {
      props: { status: { ...mockStatus, reblogged: true } }
    });
    
    const boostButton = getByLabelText('Unboost');
    expect(boostButton).toHaveClass('active');
  });
});
```

## Performance Optimization

### 1. **Lazy Loading Components**

```svelte
<!-- LazyComponent.svelte -->
<script>
  import { onMount } from 'svelte';
  
  export let component;
  export let props = {};
  
  let Component;
  let loading = true;
  
  onMount(async () => {
    Component = (await component()).default;
    loading = false;
  });
</script>

{#if loading}
  <div class="skeleton-loader" />
{:else if Component}
  <svelte:component this={Component} {...props} />
{/if}

<!-- Usage -->
<LazyComponent 
  component={() => import('./HeavyComponent.svelte')}
  props={{ data: someData }}
/>
```

### 2. **Memoization**

```svelte
<script lang="ts">
  import { derived } from 'svelte/store';
  
  export let items: Item[];
  export let searchTerm: string;
  
  // Memoized filtered results
  const filteredItems = derived(
    [items, searchTerm],
    ([$items, $search]) => {
      if (!$search) return $items;
      
      return $items.filter(item => 
        item.name.toLowerCase().includes($search.toLowerCase())
      );
    }
  );
</script>
```

### 3. **Debouncing**

```svelte
<script lang="ts">
  import { debounce } from '$lib/utils';
  
  let searchValue = '';
  
  const handleSearch = debounce((value: string) => {
    // Perform search
    performSearch(value);
  }, 300);
  
  $: handleSearch(searchValue);
</script>

<input bind:value={searchValue} placeholder="Search..." />
```

## Best Practices

### 1. **Component Organization**

```
components/
├── common/           # Shared components
│   ├── Button.svelte
│   ├── Icon.svelte
│   └── Avatar.svelte
├── timeline/         # Feature-specific
│   ├── Timeline.svelte
│   ├── StatusCard.svelte
│   └── StatusActions.svelte
├── compose/          # Composition
│   ├── ComposeBox.svelte
│   ├── MediaUploader.svelte
│   └── EmojiPicker.svelte
└── layout/           # Layout components
    ├── Header.svelte
    ├── Navigation.svelte
    └── Sidebar.svelte
```

### 2. **TypeScript Integration**

```svelte
<script lang="ts">
  import type { Status, Account } from '$lib/types';
  
  // Typed props
  export let status: Status;
  export let showActions = true;
  export let onReply: ((status: Status) => void) | undefined = undefined;
  
  // Typed events
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher<{
    boost: { status: Status; boosted: boolean };
    favorite: { status: Status; favorited: boolean };
  }>();
</script>
```

### 3. **Accessibility**

```svelte
<script>
  export let label: string;
  export let pressed = false;
  
  let buttonId = `button-${Math.random().toString(36).substr(2, 9)}`;
</script>

<button
  {id}={buttonId}
  aria-label={label}
  aria-pressed={pressed}
  on:click
  class:pressed
>
  <slot />
</button>
```

## Migration Guide

### From React

```jsx
// React
function Component({ title, onUpdate }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    console.log('Count changed:', count);
  }, [count]);
  
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
}
```

```svelte
<!-- Svelte -->
<script>
  export let title;
  export let onUpdate = () => {};
  
  let count = 0;
  
  $: console.log('Count changed:', count);
</script>

<div>
  <h1>{title}</h1>
  <button on:click={() => count++}>
    Count: {count}
  </button>
</div>
```

### From Vue

```vue
<!-- Vue -->
<template>
  <div>
    <h1>{{ title }}</h1>
    <button @click="increment">
      Count: {{ count }}
    </button>
  </div>
</template>

<script>
export default {
  props: ['title'],
  data() {
    return { count: 0 };
  },
  methods: {
    increment() {
      this.count++;
    }
  },
  watch: {
    count(newVal) {
      console.log('Count changed:', newVal);
    }
  }
};
</script>
```

```svelte
<!-- Svelte -->
<script>
  export let title;
  
  let count = 0;
  
  function increment() {
    count++;
  }
  
  $: console.log('Count changed:', count);
</script>

<div>
  <h1>{title}</h1>
  <button on:click={increment}>
    Count: {count}
  </button>
</div>
```

## Resources

- [Svelte Documentation](https://svelte.dev/docs)
- [Svelte Tutorial](https://svelte.dev/tutorial)
- [SvelteKit](https://kit.svelte.dev/) (for reference)
- [Svelte Society](https://sveltesociety.dev/)
- [Awesome Svelte](https://github.com/TheComputerM/awesome-svelte)