# Greater/Lesser Integration - Help Needed

Hi Lesser team! We're working on fixing the Greater client integration and need guidance on handling account IDs correctly.

## Current Situation

We've successfully fixed the API client to use the correct instance (lesser.host), but we're running into issues with account ID formats when making API calls.

## What We're Seeing

### 1. Follow Button Fails with 404

When Greater tries to follow a user, we get:
```
POST https://lesser.host/api/v1/accounts/495433748435615/follow 404 (Not Found)
```

### 2. Account Data from Lesser API

From your API responses, we see accounts have URL-based IDs:
```json
{
  "id": "https://lesser.host/users/aron",
  "username": "aron",
  "display_name": "aron",
  ...
}
```

### 3. Console Logs Showing the Issue

```javascript
// From the browser console when clicking follow on @aron2's profile:
client.Dvej9Vvw.js:1 POST https://lesser.host/api/v1/accounts/495433748435615/follow 404 (Not Found)
UserProfile.B7wu6NRi.js:1 Follow/unfollow failed: APIError: Not Found
```

## Our Questions

### 1. How should Greater handle URL-based IDs?
- Should we URL-encode them when putting them in the API path?
- For example: `/api/v1/accounts/${encodeURIComponent('https://lesser.host/users/aron2')}/follow`?
- Or is there a different approach we should use?

### 2. Where is the numeric ID coming from?
- Greater is somehow transforming `https://lesser.host/users/aron2` into `495433748435615`
- Is this a hash that Lesser recognizes?
- Or is there a numeric ID field in the account data that we're missing?

### 3. What's the correct API call format?
- What should we put in place of `:id` in `/api/v1/accounts/:id/follow`?
- The URL-based ID directly?
- Some other identifier?

## Other Related Issues

### Quote Boost Empty Status ID
We're also seeing this error:
```
POST https://lesser.host/api/v1/statuses//reblog 405 (Method Not Allowed)
```
The status ID is missing (double slash). This might be a separate issue in Greater's code.

### Schema Validation Warnings
We see warnings like:
```
[Schema Validation] Failed for verifyCredentials: (7) [{…}, {…}, {…}, {…}, {…}, {…}, {…}]
```
But the data still works, so these are just warnings about schema mismatches.

## What We've Already Fixed

- ✅ API client now correctly uses lesser.host (not mastodon.social)
- ✅ Authentication and timeline loading work
- ✅ Basic display of posts and profiles works

## Files We've Modified

1. `src/lib/stores/timeline.svelte.ts` - Fixed to use correct instance
2. `src/components/islands/svelte/UserProfile.svelte` - Fixed to use correct instance
3. `src/components/islands/svelte/UserCard.svelte` - Fixed to use correct instance

## Request for Guidance

We want to make sure Greater works correctly with Lesser's API. Could you help us understand:

1. The correct way to handle your URL-based account IDs in API calls
2. Whether there's a numeric ID we should be using instead
3. Any other Lesser-specific API considerations we should know about

Any examples of correct API calls would be really helpful!

Thank you for your help!