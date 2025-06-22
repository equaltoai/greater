# 🐛 Greater/Lesser Integration Bug Fix

## The Bug

**All interaction buttons (favorite, boost, bookmark, follow) are broken** because they're sending API requests to the wrong instance.

## Root Cause

In `src/lib/stores/timeline.svelte.ts`, the interaction methods are calling `getClient()` without passing the current instance:

```typescript
// ❌ WRONG (current code)
async favoriteStatus(statusId: string): Promise<void> {
  const client = getClient(); // <-- Uses default instance (mastodon.social)
  const updatedStatus = await client.favouriteStatus(statusId);
  // ...
}

// ✅ CORRECT (how it should be)
async favoriteStatus(statusId: string): Promise<void> {
  const client = getClient(authStore.currentInstance || undefined);
  const updatedStatus = await client.favouriteStatus(statusId);
  // ...
}
```

## Why This Happens

1. User authenticates with `lesser.host`
2. Timeline loads correctly because `loadTimeline()` passes the instance:
   ```typescript
   const client = getClient(authStore.currentInstance || undefined); // ✅ Correct
   ```
3. But when clicking favorite/boost/bookmark, it uses:
   ```typescript
   const client = getClient(); // ❌ Wrong - defaults to mastodon.social
   ```
4. The API call goes to the wrong instance and fails

## The Fix

Update these 6 methods in `src/lib/stores/timeline.svelte.ts`:

1. **favoriteStatus** (line ~297)
2. **unfavoriteStatus** (line ~326)
3. **reblogStatus** (line ~354)
4. **unreblogStatus** (line ~384)
5. **bookmarkStatus** (line ~413)
6. **unbookmarkStatus** (line ~429)

Change each from:
```typescript
const client = getClient();
```

To:
```typescript
const client = getClient(authStore.currentInstance || undefined);
```

## Why Posts Work But Interactions Don't

- **Posting works** because it's likely using a different code path that correctly passes the instance
- **Interactions fail** because they use the buggy methods in timeline.svelte.ts

## Additional Fixes Needed

### 1. Profile Follow Button
In the profile components, ensure the follow/unfollow actions also use the correct instance.

### 2. Error Feedback
Add user-visible error messages when API calls fail:
```typescript
try {
  const updatedStatus = await client.favouriteStatus(statusId);
  // ...
} catch (error) {
  console.error('Failed to favorite:', error);
  // Show toast notification to user
  showError('Failed to favorite post. Please try again.');
}
```

### 3. Loading States
Add loading indicators while API calls are in progress:
```typescript
isInteracting = true;
try {
  // ... API call
} finally {
  isInteracting = false;
}
```

## Verification

After fixing, test:
1. ✅ Favorite a post
2. ✅ Unfavorite a post
3. ✅ Boost a post
4. ✅ Unboost a post
5. ✅ Bookmark a post
6. ✅ Unbookmark a post
7. ✅ Follow a user
8. ✅ Unfollow a user

## One-Line Fix

If you want to fix all 6 methods at once, run this in the project root:

```bash
sed -i '' 's/const client = getClient();/const client = getClient(authStore.currentInstance || undefined);/g' src/lib/stores/timeline.svelte.ts
```

This single line change should make all the interaction buttons work immediately!