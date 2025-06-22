# Lesser API Integration Guide for Greater

This guide helps the Greater team resolve integration issues with the Lesser API, specifically around account ID handling and API calls.

## Quick Fix Summary

**Use usernames instead of numeric IDs in API calls:**
```javascript
// ❌ Don't use numeric IDs:
POST https://lesser.host/api/v1/accounts/495433748435615/follow

// ✅ Use usernames directly:
POST https://lesser.host/api/v1/accounts/aron2/follow
```

## Understanding Lesser's Account ID System

### Three Supported Formats

Lesser's API accepts account IDs in three formats:

1. **Username** (Recommended)
   - Format: `aron` or `aron2`
   - Example: `/api/v1/accounts/aron/follow`
   - Most reliable option

2. **Numeric ID** (Generated hash)
   - Format: `495433748435615` (15-digit number)
   - Example: `/api/v1/accounts/495433748435615/follow`
   - May not exist for all accounts

3. **Full ActivityPub URL**
   - Format: `https://lesser.host/users/aron`
   - Example: `/api/v1/accounts/https://lesser.host/users/aron/follow`
   - Requires URL encoding in practice

### Why You're Getting 404 Errors

The numeric ID `495433748435615` that Greater generates might not have a corresponding mapping in Lesser's database. Lesser generates these IDs using SHA256 hashing, but the mapping must exist in the database for the lookup to work.

## Recommended Solutions

### Solution 1: Use Username from Account Object (Simplest)

When you have an account object from Lesser's API:
```json
{
  "id": "https://lesser.host/users/aron2",
  "username": "aron2",
  "display_name": "aron",
  ...
}
```

Use the `username` field directly in API calls:
```javascript
// In your follow function
async function followUser(account) {
  const response = await fetch(`${API_BASE}/api/v1/accounts/${account.username}/follow`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}
```

### Solution 2: Extract Username from ID URL

If you only have the URL-based ID:
```javascript
function extractUsername(accountId) {
  // accountId format: "https://lesser.host/users/username"
  const match = accountId.match(/\/users\/([^\/]+)$/);
  return match ? match[1] : null;
}

// Usage
const username = extractUsername("https://lesser.host/users/aron2");
const followUrl = `/api/v1/accounts/${username}/follow`;
```

### Solution 3: Update Your API Client

Modify your API client to handle Lesser's ID format:
```javascript
class LesserAPIClient {
  async followAccount(account) {
    // Prefer username if available
    const identifier = account.username || this.extractUsername(account.id);
    
    if (!identifier) {
      throw new Error('Could not determine account identifier');
    }
    
    return this.post(`/api/v1/accounts/${identifier}/follow`);
  }
  
  extractUsername(accountId) {
    if (!accountId.startsWith('http')) return accountId;
    const match = accountId.match(/\/users\/([^\/]+)$/);
    return match ? match[1] : null;
  }
}
```

## Fixing Other Issues

### Empty Status ID in Quote Boost

The error:
```
POST https://lesser.host/api/v1/statuses//reblog 405 (Method Not Allowed)
```

This happens when the status ID is missing. Ensure the status object has an ID:
```javascript
async function reblogStatus(status) {
  if (!status?.id) {
    console.error('Status ID is missing');
    return;
  }
  
  // Extract just the ID if it's a URL
  const statusId = status.id.split('/').pop();
  
  return fetch(`${API_BASE}/api/v1/statuses/${statusId}/reblog`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
}
```

### Schema Validation Warnings

These warnings are non-critical:
```
[Schema Validation] Failed for verifyCredentials: (7) [{…}, {…}, {…}, {…}, {…}, {…}, {…}]
```

Lesser includes additional fields that Mastodon's schema doesn't expect. These won't break functionality and can be safely ignored.

## Complete Example: Updated Follow Button

Here's how to update your UserProfile component:

```javascript
// UserProfile.svelte or similar
async function handleFollow() {
  try {
    // Use username instead of numeric ID
    const response = await fetch(`https://lesser.host/api/v1/accounts/${user.username}/follow`, {
      method: following ? 'DELETE' : 'POST',
      headers: {
        'Authorization': `Bearer ${$authStore.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    following = result.following;
  } catch (error) {
    console.error('Follow/unfollow failed:', error);
  }
}
```

## Testing Your Fixes

1. **Test with a known account**: Try following `@aron` or `@aron2`
2. **Check the network tab**: Ensure API calls use usernames, not numeric IDs
3. **Verify the response**: Lesser should return the updated relationship status

## Need More Help?

If you encounter other issues:

1. Check if the account exists: `GET /api/v1/accounts/aron`
2. Verify your auth token is valid: `GET /api/v1/accounts/verify_credentials`
3. Look for any Lesser-specific fields in API responses that might help

## Summary

- **Always use usernames** from the `username` field when making API calls
- **Avoid relying on numeric IDs** as they may not have database mappings
- **Extract usernames from URL-based IDs** when needed
- **Handle missing IDs gracefully** in reblog/boost operations

This approach will ensure Greater works reliably with Lesser's API implementation.