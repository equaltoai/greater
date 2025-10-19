# Search Store Migration Guide

## Overview

This guide shows how to migrate `src/lib/stores/search.svelte.ts` from REST to GraphQL. The backend infrastructure is already in place, making this a straightforward refactor.

## GraphQL Infrastructure

### Schema Definition
```graphql
# graph/schema.graphql:650
type Query {
  search(
    query: String!
    type: String      # Optional: 'ACCOUNT', 'STATUS', 'HASHTAG'
    first: Int
    after: Cursor
  ): SearchResult!
}

# graph/schema.graphql:440
type SearchResult {
  accounts: [Actor!]!
  statuses: [Object!]!
  hashtags: [Hashtag!]!
}
```

### Resolver Implementation
- **Location**: `graph/query_resolvers_notes.go:136`
- **Service**: Uses `pkg/services/search.Query`
- **Features**: Supports filtered search by type, pagination, and semantic search

### Adapter Method
```typescript
// Already available in LesserGraphQLAdapter
async search(variables: SearchQueryVariables): Promise<SearchResult> {
  const data = await this.query(SearchDocument, variables);
  return data.search;
}

// Variables type
type SearchQueryVariables = {
  query: string;
  type?: 'ACCOUNT' | 'STATUS' | 'HASHTAG';
  first?: number;
  after?: string;
};
```

## Migration Steps

### 1. Update Imports

**Before:**
```typescript
import type { MastodonClient } from '../api/client';
import type { Account, Status, Tag } from '../../types/mastodon';
```

**After:**
```typescript
import type { Account, Status, Tag } from '@/types/mastodon';
import { getGraphQLAdapter } from '@/lib/api/graphql-client';
```

### 2. Add Data Mapping Functions

Add these helper functions to the store (can be extracted to a shared utility later):

```typescript
/**
 * Map GraphQL Actor to Mastodon Account
 * (Can reuse from timeline/notification stores)
 */
function mapGraphQLToAccount(actor: any): Account {
  return {
    id: actor.id,
    username: actor.preferredUsername || actor.username,
    acct: actor.webfinger || `${actor.preferredUsername}@${new URL(actor.id).hostname}`,
    display_name: actor.name || actor.preferredUsername,
    locked: actor.manuallyApprovesFollowers || false,
    bot: actor.type === 'Service',
    created_at: actor.published || new Date().toISOString(),
    note: actor.summary || '',
    url: actor.url || actor.id,
    avatar: actor.icon?.url || '',
    avatar_static: actor.icon?.url || '',
    header: actor.image?.url || '',
    header_static: actor.image?.url || '',
    followers_count: actor.followers?.totalCount || 0,
    following_count: actor.following?.totalCount || 0,
    statuses_count: actor.outbox?.totalCount || 0,
    last_status_at: null,
    emojis: [],
    fields: (actor.attachment || [])
      .filter((a: any) => a.type === 'PropertyValue')
      .map((a: any) => ({
        name: a.name,
        value: a.value,
        verified_at: null,
      })),
    discoverable: true,
    group: false,
  };
}

/**
 * Map GraphQL Object to Mastodon Status
 * (Can reuse from timeline/notification stores)
 */
function mapGraphQLToStatus(obj: any): Status {
  return {
    id: obj.id,
    uri: obj.id,
    url: obj.id,
    created_at: obj.published || obj.createdAt || new Date().toISOString(),
    account: mapGraphQLToAccount(obj.attributedTo || obj.author),
    content: obj.content || '',
    visibility: (obj.visibility?.toLowerCase() || 'public') as any,
    sensitive: obj.sensitive || false,
    spoiler_text: obj.summary || '',
    media_attachments: (obj.attachments || []).map((a: any) => ({
      id: a.url,
      type: a.mediaType?.startsWith('image/') ? 'image' : 
            a.mediaType?.startsWith('video/') ? 'video' : 'unknown',
      url: a.url,
      preview_url: a.thumbnail?.url || a.url,
      remote_url: a.url,
      text_url: a.url,
      meta: {},
      description: a.name || '',
      blurhash: a.blurhash || null,
    })),
    mentions: [],
    tags: [],
    emojis: [],
    reblogs_count: obj.shares?.totalCount || obj.sharesCount || 0,
    favourites_count: obj.likes?.totalCount || obj.likesCount || 0,
    replies_count: obj.replies?.totalCount || obj.repliesCount || 0,
    reblogged: obj.userInteractions?.shared || false,
    favourited: obj.userInteractions?.liked || false,
    bookmarked: obj.userInteractions?.bookmarked || false,
    pinned: obj.userInteractions?.pinned || false,
    reblog: null,
    in_reply_to_id: obj.inReplyTo?.id || null,
    in_reply_to_account_id: null,
    application: null as any,
    language: obj.language || null,
    muted: false,
    poll: null,
    card: null,
    edited_at: obj.updated || null,
  };
}

/**
 * Map GraphQL Hashtag to Mastodon Tag
 */
function mapGraphQLToHashtag(hashtag: any): Tag {
  return {
    name: hashtag.name.replace(/^#/, ''), // Remove leading # if present
    url: hashtag.url || `https://${window.location.hostname}/tags/${hashtag.name}`,
    history: hashtag.history || [],
  };
}
```

### 3. Update Search Method

**Before (REST):**
```typescript
async search(client: MastodonClient, query: string): Promise<void> {
  if (!query.trim()) {
    this.results = null;
    this.error = null;
    return;
  }
  
  this.loading = true;
  this.error = null;
  
  try {
    // Search API v2 provides better results
    const results = await client.search({
      q: query,
      resolve: true,
      limit: 20
    });
    
    this.results = {
      accounts: results.accounts || [],
      statuses: results.statuses || [],
      hashtags: results.hashtags || []
    };
    this.loading = false;
    
    // Add to history
    this.addToHistory(query);
  } catch (error) {
    this.error = error instanceof Error ? error.message : 'Search failed';
    this.loading = false;
  }
}
```

**After (GraphQL):**
```typescript
async search(query: string, type?: 'all' | 'accounts' | 'statuses' | 'hashtags'): Promise<void> {
  if (!query.trim()) {
    this.results = null;
    this.error = null;
    return;
  }
  
  this.loading = true;
  this.error = null;
  
  try {
    const adapter = await getGraphQLAdapter();
    
    // Map activeTab to GraphQL type filter
    const graphqlType = type && type !== 'all' 
      ? type.toUpperCase().slice(0, -1) // 'accounts' -> 'ACCOUNT'
      : undefined;
    
    const response = await adapter.search({
      query: query,
      type: graphqlType as 'ACCOUNT' | 'STATUS' | 'HASHTAG' | undefined,
      first: 20,
      after: undefined
    });
    
    this.results = {
      accounts: response.accounts.map(mapGraphQLToAccount),
      statuses: response.statuses.map(mapGraphQLToStatus),
      hashtags: response.hashtags.map(mapGraphQLToHashtag)
    };
    this.loading = false;
    
    // Add to history
    this.addToHistory(query);
  } catch (error) {
    console.error('[Search Store] Error:', error);
    this.error = error instanceof Error ? error.message : 'Search failed';
    this.loading = false;
  }
}
```

### 4. Update Component Call Sites

**Before:**
```typescript
// In a component
import { searchStore } from '@/lib/stores/search.svelte';
import { getClient } from '@/lib/api/client';

function handleSearch(query: string) {
  const client = getClient();
  searchStore.search(client, query);
}
```

**After:**
```typescript
// In a component
import { searchStore } from '@/lib/stores/search.svelte';

function handleSearch(query: string) {
  searchStore.search(query); // Client no longer needed!
}
```

### 5. Add Type Filter Support (Optional Enhancement)

You can enhance the search to respect the active tab:

```typescript
// In the component
function handleSearch() {
  const query = searchStore.query;
  const type = searchStore.activeTab;
  searchStore.search(query, type);
}
```

This will send filtered queries to the backend, improving performance:
- `type: 'ACCOUNT'` - Only search accounts
- `type: 'STATUS'` - Only search statuses  
- `type: 'HASHTAG'` - Only search hashtags
- `type: undefined` - Search all (default)

## Testing Checklist

- [ ] Search for accounts returns results
- [ ] Search for statuses returns results
- [ ] Search for hashtags returns results
- [ ] Empty query clears results
- [ ] Search history persists
- [ ] Type filtering works (when implemented)
- [ ] Error handling displays properly
- [ ] Loading state shows during search
- [ ] Results render correctly in UI
- [ ] Pagination works (if needed)

## Pagination Support (Future Enhancement)

The GraphQL search supports cursor-based pagination:

```typescript
// Store the endCursor from the response
let endCursor: string | null = null;

async search(query: string, loadMore = false): Promise<void> {
  const response = await adapter.search({
    query: query,
    first: 20,
    after: loadMore ? endCursor : undefined
  });
  
  // Update cursor for next page
  endCursor = response.pageInfo?.endCursor || null;
  
  // Append results if loading more, replace otherwise
  if (loadMore) {
    this.results = {
      accounts: [...(this.results?.accounts || []), ...response.accounts.map(mapGraphQLToAccount)],
      statuses: [...(this.results?.statuses || []), ...response.statuses.map(mapGraphQLToStatus)],
      hashtags: [...(this.results?.hashtags || []), ...response.hashtags.map(mapGraphQLToHashtag)]
    };
  } else {
    this.results = {
      accounts: response.accounts.map(mapGraphQLToAccount),
      statuses: response.statuses.map(mapGraphQLToStatus),
      hashtags: response.hashtags.map(mapGraphQLToHashtag)
    };
  }
}
```

## Advanced: Semantic Search Support

Lesser's search resolver supports semantic search through the backend service. This works transparently with the same GraphQL query - no client changes needed. The backend automatically determines whether to use:

- **Exact match**: For usernames, hashtags, URLs
- **Full-text search**: For status content
- **Semantic search**: For natural language queries (if enabled on the instance)

## Migration Estimate

**Total Time**: 1-2 hours

1. **Update imports and add mapping functions**: 15 minutes
2. **Refactor search method**: 30 minutes
3. **Update component call sites**: 15 minutes
4. **Testing**: 30 minutes
5. **Optional enhancements** (filtering, pagination): 30 minutes

## Related Files

- `src/lib/stores/search.svelte.ts` - Main search store
- `src/components/islands/svelte/SearchBar.svelte` - Search input component
- `src/pages/search.astro` - Search results page (if exists)

## Notes

- The GraphQL search is **already fully functional** on the backend
- No schema changes needed
- No adapter changes needed
- This is purely a client-side refactor
- Can be done incrementally (REST fallback possible during migration)

