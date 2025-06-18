# Greater App Functionality Plan

This document outlines the current state of the Greater Mastodon client and provides a roadmap for missing functionality with references to existing code.

## 🚀 Recent Progress (June 18, 2025)
- ✅ **Preferences System**: Fully implemented with comprehensive UI for timeline, posting, notification, and accessibility settings
- ✅ **Appearance Settings**: Complete theme customization with color wheel, harmony algorithms, and Tailwind v4 integration
- ✅ **Profile Headers**: Fixed display issue for custom profile headers
- ✅ **Layout Improvements**: Created dedicated layouts for settings and profile pages with proper desktop width
- ✅ **Modern Tailwind v4**: Integrated dynamic CSS variables with Tailwind's `@theme` directive
- ✅ **Notification Settings**: Dedicated notifications page with browser/push notification management and type filtering

## 📋 Table of Contents
1. [Currently Implemented Features](#currently-implemented-features)
2. [Priority 1: Core Missing Features](#priority-1-core-missing-features)
3. [Priority 2: User Experience](#priority-2-user-experience)
4. [Priority 3: Technical Improvements](#priority-3-technical-improvements)
5. [Code Architecture Reference](#code-architecture-reference)

---

## ✅ Currently Implemented Features

### Authentication & OAuth
- **OAuth 2.0 flow with PKCE**: `src/lib/auth/oauth.ts:23-89`
- **Multi-account support**: `src/lib/stores/auth.svelte.ts:14-25`
- **Secure token storage**: `src/pages/auth/store-token.ts`, `src/pages/auth/get-token.ts`
- **Login/logout**: `src/components/islands/svelte/LoginFormSafe.svelte`, `src/components/islands/svelte/UserMenu.svelte:70-78`

### Timeline Features
- **Home timeline**: `src/pages/home.astro`, `src/lib/stores/timeline.svelte.ts:225-251`
- **Local timeline**: `src/pages/local.astro`
- **Federated timeline**: `src/pages/federated.astro`
- **Hashtag timelines**: `src/pages/tags/[tag].astro`
- **List timelines**: `src/pages/lists/[id].astro`, `src/components/islands/svelte/ListTimeline.svelte`
- **Real-time streaming**: `src/lib/api/client.ts:1425-1495`
- **Pagination**: `src/lib/stores/timeline.svelte.ts:83-121`
- **Timeline caching**: `src/lib/stores/timeline.svelte.ts:36-49`

### Status/Post Features
- **Compose box**: `src/components/islands/svelte/ComposeBox.svelte`
- **Media uploads**: `src/components/islands/svelte/MediaUpload.svelte`, `src/lib/api/client.ts:889-935`
- **Post interactions**: `src/components/islands/svelte/StatusCard.svelte:594-802`
  - Favorite: lines 594-621
  - Boost: lines 622-649
  - Bookmark: lines 650-677
  - Delete: lines 741-764
- **Status threads**: `src/pages/status/[id].astro`, `src/components/islands/svelte/StatusThread.svelte`
- **Draft saving**: `src/lib/stores/compose.ts:20-79`

### User Features ✅ ENHANCED
- **User profiles**: ✅ `src/pages/@[handle].astro`, `src/components/islands/svelte/UserProfile.svelte` - WORKING
  - Fixed header image display (removed problematic condition check)
  - Increased header height for better visual impact
  - Full profile display with metadata, fields, and verification badges
- **Profile editing**: ✅ `src/pages/settings/profile.astro`, `src/components/islands/svelte/ProfileSettings.svelte` - WORKING
- **Follow/unfollow**: ✅ `src/lib/api/client.ts:560-577` - WORKING in UserProfile and UserCard components
- **Account relationships**: ✅ `src/lib/api/client.ts:541-558` - WORKING (shows followed_by, blocking, muting status)
- **Followers/Following pages**: ✅ `/@[handle]/followers`, `/@[handle]/following` - WORKING
  - Updated to use ProfileLayout for consistent width
  - Proper responsive design for desktop viewing

### Search Functionality
- **Full-text search**: `src/pages/search.astro`, `src/components/islands/svelte/SearchResults.svelte`
- **Search history**: `src/lib/stores/search.svelte.ts:12-44`
- **Search API**: `src/lib/api/client.ts:785-806`

### Notifications ✅ ENHANCED
- **Notification list**: `src/pages/notifications.astro`, `src/components/islands/svelte/NotificationList.svelte`
- **Real-time updates**: `src/lib/stores/notifications.ts:45-75`
- **Browser notifications**: `src/lib/stores/notifications.ts:175-207`
- **Notification API**: `src/lib/api/client.ts:675-731`
- **Notification Settings**: ✅ `src/pages/settings/notifications.astro`, `src/components/islands/svelte/NotificationSettings.svelte` - WORKING
  - Push notification support with service worker integration
  - Desktop notification toggle with permission management
  - Notification sounds toggle
  - Type filtering (follows, boosts, favorites, mentions, polls)
  - Test notification functionality
  - No email support (considered legacy technology)

### Lists Management
- **CRUD operations**: `src/lib/stores/lists.svelte.ts`
- **List editor**: `src/components/islands/svelte/ListEditor.svelte`
- **Lists API**: `src/lib/api/client.ts:1119-1272`

### Theme & UI ✅ FULLY IMPLEMENTED
- **Theme system**: `src/lib/stores/theme.ts` - Complete theme management with custom theme support
- **Theme components**: `src/components/islands/svelte/ThemeToggle.svelte`, `src/components/islands/svelte/ThemeSettings.svelte`
- **Color harmonics**: `src/lib/theme/color-harmonics.ts` - Advanced color harmony algorithms
- **Appearance Settings**: `src/pages/settings/appearance.astro` - Full theme customization UI with:
  - Light/Dark/System mode selection
  - High contrast mode
  - Custom theme creator with interactive color wheel
  - Color harmony selection (dyad, triad, tetrad)
  - Theme saving, exporting, and management
  - Live preview of theme changes
- **Modern Tailwind v4 Integration**: 
  - Dynamic CSS variables in `src/styles/global.css`
  - Custom color classes defined in `src/app.css` using `@theme` directive
  - Full integration between theme store and Tailwind classes
- **Layouts**: 
  - `src/layouts/SettingsLayout.astro` - Dedicated layout for settings pages
  - `src/layouts/ProfileLayout.astro` - Dedicated layout for profile pages

### Preferences & Settings ✅ COMPLETED
- **Preferences Store**: `src/lib/stores/preferences.ts` - Complete implementation with all preference categories
- **Preferences UI**: `src/pages/settings/preferences.astro`, `src/components/islands/svelte/PreferencesSettings.svelte`
- **Settings Navigation**: `src/components/islands/svelte/SettingsNav.svelte` - Horizontal tab navigation for settings
- **Settings Overview**: `src/pages/settings/index.astro` - Main settings page with card-based navigation

### Performance & Offline
- **Service worker**: `public/sw.js`
- **Offline queue**: `src/lib/stores/offline.svelte.ts`
- **Virtual scrolling**: `src/components/islands/svelte/VirtualizedTimeline.svelte`

---

## 🎯 Priority 1: Core Missing Features

### 1. Profile & Account Management

#### Edit Profile ✅ COMPLETED
**Implemented in:** `src/components/islands/svelte/ProfileSettings.svelte`
- Full profile editing with display name, bio, avatar, header, metadata fields
- Privacy settings (locked, bot, discoverable)
- Successfully saves and updates UI in real-time
- Fixed FormData handling in API client for proper file uploads
- Profile metadata verification display with green checkmarks

**API:** `src/lib/api/client.ts:343-368` (`updateCredentials`) - WORKING

#### Account Preferences ✅ COMPLETED
**Implemented in:** `src/pages/settings/preferences.astro`, `src/components/islands/svelte/PreferencesSettings.svelte`
- Full preferences management UI with all settings categories
- Timeline preferences: auto-refresh, show replies/boosts, media preview, font size
- Posting preferences: default visibility, sensitive media, draft saving, preview
- Notification preferences: desktop notifications, sounds, filters for different types
- Accessibility preferences: reduce motion, high contrast, large text, captions, keyboard shortcuts
- Settings persist to localStorage using existing preferences store
- Graceful fallback when server preferences API is not available
- Custom toggle switch components with proper styling
- Created dedicated SettingsLayout for full-width settings pages

**Store:** `src/lib/stores/preferences.ts` - Fully functional nanostores implementation
**API:** `src/lib/api/client.ts:getPreferences()` - Attempts to load server preferences but gracefully handles failures

#### Import/Export
**Implementation needed in:** New page `src/pages/settings/import-export.astro`
**Reference:** Would use similar pattern to `src/components/islands/svelte/ListManager.svelte`

### 2. Enhanced Posting

#### Polls
**Implementation needed in:** `src/components/islands/svelte/ComposeBox.svelte`
```typescript
// Add to compose options around line 400
interface PollOption {
  text: string;
}
let pollOptions: PollOption[] = [];
let pollExpiry: number = 86400; // 24 hours default
```

**API support needed in:** `src/lib/api/client.ts:268` (add poll parameter to createStatus)

#### Scheduled Posts
**Implementation needed in:** `src/components/islands/svelte/ComposeBox.svelte`
```typescript
// Add scheduled_at parameter support around line 520
if (scheduledAt) {
  params.scheduled_at = scheduledAt.toISOString();
}
```

#### Edit Posts (Mastodon 4.0+)
**Implementation needed in:** `src/components/islands/svelte/StatusCard.svelte`
```typescript
// Add edit function around line 800
async function editStatus() {
  // Need to add editStatus method to API client
  await client.editStatus(status.id, newContent);
}
```

**API needed in:** `src/lib/api/client.ts` (add editStatus method)

### 3. Moderation Tools

#### Block/Mute Management
**Implementation needed in:** New page `src/pages/settings/blocks-mutes.astro`
**Reference existing API:** 
- `src/lib/api/client.ts:594-631` (block/unblock/mute/unmute)
- `src/lib/api/client.ts:632-673` (getBlocks/getMutes)

#### Filter Management
**Implementation needed in:** New component `src/components/islands/svelte/FilterManager.svelte`
**Reference existing API:** `src/lib/api/client.ts:1340-1397` (filters CRUD)

---

## 🚀 Priority 2: User Experience

### 4. Notifications Enhancement

#### Notification Grouping
**Implementation needed in:** `src/components/islands/svelte/NotificationList.svelte`
```typescript
// Modify around line 50 to group notifications
function groupNotifications(notifications: Notification[]) {
  // Group by type and target status/account
  return notifications.reduce((groups, notif) => {
    // Grouping logic here
  }, {});
}
```

#### Push Notifications
**Implementation needed in:** `src/lib/stores/notifications.ts`
**Reference:** Extend existing browser notification code at lines 175-207

#### Clear All Notifications
**Implementation needed in:** `src/components/islands/svelte/NotificationList.svelte`
**API already exists:** `src/lib/api/client.ts:731` (`clearNotifications`)

### 5. Search Improvements

#### Search Within User
**Implementation needed in:** `src/components/islands/svelte/UserProfile.svelte`
```typescript
// Add search within user posts around line 150
async function searchUserPosts(query: string) {
  const results = await client.searchAccount(account.id, query);
  // Display results
}
```

#### Advanced Search Filters
**Implementation needed in:** `src/components/islands/svelte/SearchBar.svelte`
**Reference:** Extend existing search at `src/lib/stores/search.svelte.ts:46-84`

#### Trending
**Implementation needed in:** New component `src/components/islands/svelte/TrendingPanel.svelte`
**API already exists:** `src/lib/api/client.ts:1398-1423` (getTrends)

### 6. Timeline Features

#### Timeline Position Restoration
**Implementation needed in:** `src/lib/stores/timeline.svelte.ts`
```typescript
// Add to TimelineState interface around line 20
lastReadId?: string;
scrollPosition?: number;

// Save/restore position in existing methods
```

#### Multiple Column Layout
**Implementation needed in:** New layout `src/layouts/MultiColumnLayout.astro`
**Reference:** Use existing `src/components/islands/svelte/VirtualizedTimeline.svelte` for each column

---

## 🔧 Priority 3: Technical Improvements

### 7. Performance & Optimization

#### Server-side Media Optimization
**Implementation needed in:** `functions/media/[[path]].ts` (currently empty)
```typescript
export async function onRequest(context: EventContext) {
  // Implement image resizing/optimization
  // Use Cloudflare Image Resizing API
}
```

#### Better Error Boundaries
**Implementation needed in:** Wrap components with error boundaries
**Reference:** `src/components/core/ErrorBoundary.astro` pattern

#### Improved Offline Queue
**Enhance existing:** `src/lib/stores/offline.svelte.ts`
```typescript
// Add retry logic with exponential backoff around line 80
async function retryFailedPosts() {
  // Implement retry strategy
}
```

### 8. Accessibility

#### Keyboard Navigation
**Implementation needed across:** All interactive components
**Reference pattern:** `src/components/islands/svelte/Navigation.svelte:250-300`

#### Screen Reader Announcements
**Implementation needed in:** `src/lib/stores/announcements.ts` (create new)
```typescript
// Live region announcements for dynamic content
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
  // Implementation
}
```

#### High Contrast Mode
**Implementation needed in:** `src/lib/stores/theme.svelte.ts`
**Reference:** Extend existing theme system at lines 180-220

### 9. Developer Experience

#### API Response Caching
**Implementation needed in:** `src/lib/api/client.ts`
```typescript
// Add caching layer around line 100
private cache = new Map<string, {data: any, timestamp: number}>();
private cacheTimeout = 5 * 60 * 1000; // 5 minutes
```

#### Better Error Logging
**Implementation needed in:** `src/lib/utils/logger.ts` (create new)
**Reference:** Use Sentry integration at `src/lib/utils/monitoring.ts`

---

## 🏗️ Code Architecture Reference

### Key Stores
- **Auth**: `src/lib/stores/auth.svelte.ts` - Authentication state
- **Timeline**: `src/lib/stores/timeline.svelte.ts` - Timeline management
- **Compose**: `src/lib/stores/compose.ts` - Post composition
- **Theme**: `src/lib/stores/theme.svelte.ts` - Theme management
- **Notifications**: `src/lib/stores/notifications.ts` - Notification state
- **Lists**: `src/lib/stores/lists.svelte.ts` - List management
- **Offline**: `src/lib/stores/offline.svelte.ts` - Offline queue

### API Client
- **Main client**: `src/lib/api/client.ts` - All Mastodon API methods
- **OAuth**: `src/lib/auth/oauth.ts` - OAuth implementation
- **Secure client**: `src/lib/auth/secure-client.ts` - Token management

### Components Structure
- **Islands**: `src/components/islands/svelte/` - Interactive Svelte components
- **Core**: `src/components/core/` - Static Astro components
- **Layouts**: `src/layouts/` - Page layouts

### Pages Structure
- **Auth**: `src/pages/auth/` - Authentication pages and API routes
- **Settings**: `src/pages/settings/` - Settings pages
- **Dynamic routes**: `src/pages/@[handle].astro`, `src/pages/status/[id].astro`, etc.

### Cloudflare Integration
- **Workers**: API routes in `src/pages/auth/*.ts`
- **KV Namespaces**: SESSIONS, CACHE, PREFERENCES, OFFLINE, OAUTH_APPS
- **R2 Buckets**: MEDIA, STATIC
- **D1 Database**: ANALYTICS

This plan provides a clear roadmap for implementing missing features while leveraging the existing robust architecture.