# Greater Components - Issues & Feedback

This document tracks issues, missing features, bugs, and improvement suggestions discovered during the migration from custom components to @equaltoai/greater-components.

**Package Version:** v1.0.27

---

## 🐛 Bugs

### None Yet
(Will be filled as bugs are discovered during migration)

---

## ✨ Feature Requests

### 1. Timeline Store Integration Documentation

**Priority:** HIGH  
**Component:** `TimelineVirtualizedReactive`

**Issue:**
The `TimelineVirtualizedReactive` component accepts an `integration` prop for real-time updates, but there's limited documentation on how to create/configure this integration with existing stores.

**Current Behavior:**
- Component expects `TimelineIntegrationConfig` type
- Not clear how to bridge existing custom timeline stores to GC integration pattern
- `createTimelineIntegration` helper exists but usage examples are sparse

**Expected Behavior:**
- Clear documentation on how to integrate with existing timeline stores
- Example of migrating from custom store to GC timeline integration
- Type documentation for `TimelineIntegrationConfig`

**Workaround:**
Currently investigating `createTimelineIntegration` from `'../lib/integration'` in GC source

**Impact:**
Blocks migration of Timeline component from custom implementation to GC

---

### 2. ComposeBox Token Provider Pattern

**Priority:** MEDIUM  
**Component:** `ComposeBox` and auth-related components

**Issue:**
Need clarity on how auth tokens should be provided to GC components. Is there a context provider pattern? Direct prop? Token getter function?

**Questions:**
- How should auth tokens be passed to ComposeBox for posting?
- Is there an Auth context provider in GC?
- Should we use GC's Auth module or can we integrate our existing auth?

**Current Approach:**
Our app uses `secureAuthClient.getToken(instance)` to retrieve tokens

**Desired:**
- Documentation on auth integration patterns
- Examples of token provision to fediverse components
- Guidance on whether to use GC Auth module vs custom auth

---

### 3. StatusCard Prop Documentation

**Priority:** MEDIUM  
**Component:** `StatusCard`

**Issue:**
Need complete prop documentation for StatusCard to understand what features are available:
- Does it handle quotes?
- Does it support threading/replies?
- What action handlers are available?
- Can we customize the action bar?

**Workaround:**
Reading TypeScript types directly from node_modules

---

## 📝 Documentation Improvements

### 1. Migration Guide

**Priority:** HIGH

**Request:**
A migration guide for apps transitioning from custom components to GC would be incredibly helpful, covering:
- How to integrate GC with existing stores
- Pattern for token/auth integration
- How to customize component behavior
- Performance best practices
- CSR vs SSR considerations

### 2. Real-time Integration Examples

**Priority:** HIGH

**Request:**
More examples showing:
- How to set up GraphQL subscriptions with `createLesserClient`
- How `TimelineVirtualizedReactive` integration works
- WebSocket connection management
- Optimistic updates

### 3. Component API Reference

**Priority:** MEDIUM

**Request:**
Complete API reference for each component showing:
- All available props with descriptions
- Event handlers/callbacks
- Snippet slots
- TypeScript types
- Usage examples

---

## 🔧 API Improvements

### 1. Adapter Token Getter Function

**Priority:** MEDIUM

**Suggestion:**
Allow adapters to accept a token getter function instead of static token:

```typescript
// Current (assumed):
const client = createLesserClient({
  endpoint: 'https://api.lesser.example.com/graphql',
  token: 'static-token-string'
});

// Proposed:
const client = createLesserClient({
  endpoint: 'https://api.lesser.example.com/graphql',
  token: async () => {
    const token = await getToken();
    return token.access_token;
  }
});
```

**Benefit:**
- Handles token refresh automatically
- Works better with encrypted/async storage
- More flexible for different auth strategies

---

### 2. Timeline Store Adapter Pattern

**Priority:** HIGH

**Suggestion:**
Provide an adapter/bridge pattern for integrating custom stores with GC components:

```typescript
import { createTimelineAdapter } from '@equaltoai/greater-components/adapters';

const timelineAdapter = createTimelineAdapter({
  getItems: () => myCustomStore.statuses,
  onLoadMore: () => myCustomStore.loadMore(),
  onRefresh: () => myCustomStore.refresh(),
  // ... other store methods
});

// Then use with GC components
<TimelineVirtualizedReactive integration={timelineAdapter} />
```

**Benefit:**
- Easier migration path for existing apps
- Maintain existing store logic during migration
- Gradual adoption of GC features

---

### 3. Component Composition Clarity

**Priority:** LOW

**Suggestion:**
Clarify when to use deprecated simple components (ComposeBox, StatusCard) vs new compound components (Compose.*, Status.*):

- When is each pattern recommended?
- Performance differences?
- Migration path from deprecated to compound?
- Will deprecated components be removed in future versions?

---

### 4. Lesser GraphQL Client Coverage (Resolved)

**Priority:** —  
**Status:** GC already exposes the needed APIs via `createLesserGraphQLAdapter` (see `packages/adapters/src/graphql/LesserGraphQLAdapter.ts`).

- Media uploads, timeline variants, list CRUD, relationships, thread context, notification controls, and push subscription helpers are all available through the adapter layer.
- Action: Greater now instantiates both `createLesserClient` (for future high-level integrations) and `createLesserGraphQLAdapter` (for advanced operations) from the GC packages.
- No upstream changes requested; this entry remains as documentation for where to find the relevant helpers.

---

## 🎨 Styling/Theming

### None Yet
(Will be filled as theming questions arise)

---

## 🧪 Testing

### None Yet
(Will be filled as testing needs are discovered)

---

## ⚡ Performance

### None Yet
(Will be filled as performance observations are made)

---

## 💬 Questions

### 1. Store Integration Pattern

**Q:** What's the recommended pattern for integrating existing app stores with GC components?

**Status:** ✅ Resolved (2025-11-23) – timelines/notifications now use the GC integrations via `src/lib/integrations/realtime.ts` and shared layout context, so no bespoke Nanostores remain.

### 2. Auth Strategy

**Q:** Should we migrate to GC's Auth module completely, or can we integrate our existing auth?

**Context:**
- We have working OAuth flow with Mastodon instances
- Currently store tokens in browser (migrating from Cloudflare KV)
- Not sure if GC Auth module fits our needs or if we should wrap it

### 3. GraphQL Client Setup

**Q:** How should we structure GraphQL client initialization for use across all GC components?

**Context:**
- Using `createLesserClient` from GC
- Need to pass client/adapter to multiple components
- Should we use a context provider? Global instance? Per-component creation?

---

## 📊 Migration Progress

### Phase 1: Setup ✅
- [x] Configure CSS imports
- [x] Set up Vite optimizeDeps
- [x] Create GC import helpers

### Phase 2: Core Components 🔄
- [ ] Timeline → TimelineVirtualizedReactive (BLOCKED: need integration docs)
- [ ] ComposeBox → GC ComposeBox (BLOCKED: need auth pattern)
- [ ] StatusCard → GC StatusCard (IN PROGRESS)
- [ ] NotificationsFeed → GC NotificationsFeedReactive

### Phase 3: Primitives
- [x] Button (already shimmed)
- [ ] Other primitives

---

## Notes

- Will update this document as migration progresses
- All feedback is constructive and aims to improve GC for everyone
- Happy to contribute PRs for documentation improvements
- Open to pair programming sessions to resolve integration questions

---

**Last Updated:** 2025-11-11  
**Reporter:** @aron (Greater maintainer)  
**Contact:** [GitHub Issues](https://github.com/equaltoai/greater-components/issues)
