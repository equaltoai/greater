# Greater Components - Available Features

## Overview
Greater Components v1.0.26 is a COMPLETE fediverse UI toolkit with 127+ Svelte components, adapters, stores, and utilities. We should NOT be recreating what already exists.

## Package Structure

### 1. Fediverse Components (`@equaltoai/greater-components/fediverse`)

#### Ready-to-Use Components:
- **ComposeBox** - Full compose functionality
- **StatusCard** - Status/post rendering
- **TimelineVirtualized** / **TimelineVirtualizedReactive** - Virtualized timelines
- **NotificationsFeed** / **NotificationsFeedReactive** - Notification feeds
- **ProfileHeader** - User profile headers
- **ContentRenderer** - Renders fediverse content
- **ActionBar** - Post action buttons
- **SettingsPanel** - Settings UI

#### Compound Components:
- **Compose** - Root, Editor, Submit, CharacterCount, VisibilitySelect
- **Status** - Root, Header, Content, Media, Actions
- **Timeline** - Root, Item, LoadMore, EmptyState, ErrorState
- **Notifications** - Root, Item, Group, Filter

#### Patterns:
- **ThreadView** - Threaded conversations
- **ContentWarningHandler** - CW/spoiler handling
- **FederationIndicator** - Shows federation status
- **VisibilitySelector** - Post visibility picker
- **ModerationTools** - Moderation UI
- **InstancePicker** - Instance selection
- **CustomEmojiPicker** - Emoji picker
- **PollComposer** - Poll creation
- **MediaComposer** - Media upload/composition
- **BookmarkManager** - Bookmark management

#### Feature Modules:
- **Auth** - Authentication components
- **Profile** - Edit, Stats, Fields, Tabs, FollowersList, FollowingList, etc.
- **Search** - Search components and filters
- **Lists** - List management (Root, Editor, Manager, Timeline, etc.)
- **Messages** - Direct messaging
- **Filters** - Content filtering
- **Admin** - Admin panel components

### 2. Adapters (`@equaltoai/greater-components/adapters`)

#### Backend Adapters:
- **LesserAdapter** - Lesser GraphQL backend
- **MastodonAdapter** - Mastodon API
- **PleromaAdapter** - Pleroma API
- **autoDetectAdapter** - Auto-detect backend type
- **createAdapter** - Generic adapter factory

#### GraphQL:
- **GraphQLClient** / **createGraphQLClient**
- **LesserClient** / **createLesserClient**
- GraphQL cache and optimistic updates

#### Streaming/Real-time:
- **TransportManager** - Manages connections
- **WebSocketClient** - WebSocket transport
- **SseClient** - Server-Sent Events
- **HttpPollingClient** - HTTP polling fallback
- **WebSocketPool** - Connection pooling

#### Stores:
- **TimelineStore** - Timeline state management
- **NotificationStore** - Notification state management
- **presenceStore** - User presence
- **adminStreamingStore** - Admin real-time data

#### Integration Helpers:
- **createTimelineIntegration**
- **createNotificationIntegration**
- **createSharedTransport**
- **withRealtime** - HOC for real-time features
- **realtimeErrorBoundary**

### 3. Primitives (`@equaltoai/greater-components/primitives`)

UI primitives with Greater styling:
- **Button**
- **TextField**
- **TextArea**
- **Select**
- **Checkbox**
- **Switch**
- **FileUpload**
- **Avatar**
- **Tooltip**
- **Skeleton**
- **Menu**
- **Tabs**
- **Modal**
- **ThemeProvider**
- **ThemeSwitcher**

### 4. Icons (`@equaltoai/greater-components/icons`)

Full icon set (120+ icons) including:
- globe, lock, mail, users, x
- All common UI icons
- Fediverse-specific icons (boost, etc.)

Import: `import Globe from '@equaltoai/greater-components/icons/globe'`

### 5. Tokens (`@equaltoai/greater-components/tokens`)

Design tokens:
- `theme.css` - CSS custom properties
- Spacing, colors, typography, etc.

### 6. Utils (`@equaltoai/greater-components/utils`)

Utility functions for:
- Notification grouping
- Time formatting
- Content sanitization
- etc.

## How to Use

### Example: Timeline with Real-time Updates

```svelte
<script>
  import { TimelineVirtualizedReactive } from '@equaltoai/greater-components/fediverse';
  import { createLesserClient } from '@equaltoai/greater-components/fediverse';
  
  const client = createLesserClient({
    endpoint: 'https://api.lesser.occult.work/graphql'
  });
</script>

<TimelineVirtualizedReactive 
  client={client}
  timelineType="home"
/>
```

### Example: Compose Box

```svelte
<script>
  import { ComposeBox } from '@equaltoai/greater-components/fediverse';
</script>

<ComposeBox />
```

### Example: Using Primitives

```svelte
<script>
  import { Button, TextField } from '@equaltoai/greater-components/primitives';
</script>

<TextField label="Username" />
<Button variant="primary">Submit</Button>
```

## Key Insight

**WE SHOULD BE USING GREATER COMPONENTS, NOT RECREATING THEM!**

The entire `src/lib/components/islands/svelte/` directory is likely redundant. We should:
1. Delete redundant components
2. Import from Greater Components
3. Only create custom components when GC doesn't provide them
4. Use GC adapters for API communication
5. Use GC stores for state management

## Next Steps

1. Audit `src/lib/components/islands/svelte/` and identify what can be deleted
2. Update imports to use Greater Components
3. Remove custom implementations of Timeline, ComposeBox, StatusCard, etc.
4. Use GC's GraphQL adapters instead of custom implementations
5. Leverage GC's real-time streaming infrastructure
