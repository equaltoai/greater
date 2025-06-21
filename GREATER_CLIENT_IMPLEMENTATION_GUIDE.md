# Greater v1 Client Implementation Guide

## Overview

Greater is a Mastodon-compatible client that needs to work with both Mastodon servers and Lesser (your ActivityPub server). This guide shows how to properly implement account lookups and API calls.

## The Problem

Your current implementation is trying to use ActivityPub URLs as account IDs:
```
❌ GET /api/v1/accounts/https://lesser.host/users/aron/statuses
```

This doesn't work because:
1. Mastodon expects numeric account IDs in this endpoint
2. URLs in path parameters cause routing issues

## The Mastodon Way

Mastodon uses a two-step process for account operations:

### Step 1: Account Resolution
First, resolve the account to get its ID:

```javascript
// For local accounts (on the same server)
GET /api/v1/accounts/lookup?acct=aron

// For remote accounts (on other servers)
GET /api/v1/accounts/lookup?acct=aron@lesser.host

// Response:
{
  "id": "109348203984",
  "username": "aron",
  "acct": "aron",  // or "aron@lesser.host" for remote
  "url": "https://lesser.host/@aron",
  "display_name": "Aron Price",
  ...
}
```

### Step 2: Use the ID
Then use the returned `id` for subsequent API calls:

```javascript
GET /api/v1/accounts/109348203984/statuses
GET /api/v1/accounts/109348203984/followers
GET /api/v1/accounts/109348203984/following
```

## Greater v1 Implementation

Here's how to implement this properly in your client:

### 1. Account Service Class

```javascript
class AccountService {
  constructor(apiBase, token) {
    this.apiBase = apiBase;
    this.token = token;
    this.accountCache = new Map(); // Cache resolved accounts
  }

  // Resolve any account identifier to a Mastodon account object
  async resolveAccount(identifier) {
    // Check cache first
    if (this.accountCache.has(identifier)) {
      return this.accountCache.get(identifier);
    }

    let account;
    
    // Handle different identifier formats
    if (identifier.match(/^\d+$/)) {
      // Already a numeric ID
      account = await this.getAccountById(identifier);
    } else if (identifier.includes('@')) {
      // Webfinger format: user@domain
      account = await this.lookupAccount(identifier);
    } else if (identifier.startsWith('http')) {
      // ActivityPub URL - extract username
      account = await this.resolveActivityPubUrl(identifier);
    } else {
      // Plain username (local account)
      account = await this.lookupAccount(identifier);
    }

    // Cache the result
    if (account) {
      this.accountCache.set(identifier, account);
      this.accountCache.set(account.id, account);
      this.accountCache.set(account.acct, account);
    }

    return account;
  }

  async getAccountById(id) {
    const response = await fetch(`${this.apiBase}/api/v1/accounts/${id}`, {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error('Account not found');
    return response.json();
  }

  async lookupAccount(acct) {
    const response = await fetch(
      `${this.apiBase}/api/v1/accounts/lookup?acct=${encodeURIComponent(acct)}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) throw new Error('Account not found');
    return response.json();
  }

  async resolveActivityPubUrl(url) {
    // First, try to extract username from URL patterns
    const patterns = [
      /https?:\/\/[^\/]+\/@([^\/]+)/,        // Mastodon style: https://server/@username
      /https?:\/\/[^\/]+\/users\/([^\/]+)/,  // ActivityPub style: https://server/users/username
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        const username = match[1];
        const domain = new URL(url).hostname;
        
        // Try local first, then remote
        try {
          return await this.lookupAccount(username);
        } catch (e) {
          return await this.lookupAccount(`${username}@${domain}`);
        }
      }
    }

    // If no pattern matches, try searching for the URL
    return this.searchAccount(url);
  }

  async searchAccount(query) {
    const response = await fetch(
      `${this.apiBase}/api/v2/search?q=${encodeURIComponent(query)}&type=accounts&limit=1&resolve=true`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) throw new Error('Search failed');
    const data = await response.json();
    return data.accounts?.[0];
  }

  // Get account statuses using proper ID
  async getAccountStatuses(identifier, params = {}) {
    const account = await this.resolveAccount(identifier);
    if (!account) throw new Error('Account not found');

    const queryParams = new URLSearchParams(params);
    const response = await fetch(
      `${this.apiBase}/api/v1/accounts/${account.id}/statuses?${queryParams}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) throw new Error('Failed to fetch statuses');
    return response.json();
  }
}
```

### 2. Usage Examples

```javascript
// Initialize the service
const accountService = new AccountService('https://lesser.host', authToken);

// Different ways to get account statuses
try {
  // Using username (for local accounts)
  const statuses1 = await accountService.getAccountStatuses('aron', { limit: 20 });
  
  // Using Webfinger address
  const statuses2 = await accountService.getAccountStatuses('aron@lesser.host', { limit: 20 });
  
  // Using ActivityPub URL (your current approach - now handled correctly)
  const statuses3 = await accountService.getAccountStatuses(
    'https://lesser.host/users/aron', 
    { limit: 20 }
  );
  
  // Using numeric ID (if you already have it)
  const statuses4 = await accountService.getAccountStatuses('109348203984', { limit: 20 });
  
} catch (error) {
  console.error('Failed to fetch statuses:', error);
}
```

### 3. React Hook Example

```jsx
import { useState, useEffect } from 'react';

function useAccountStatuses(accountIdentifier, options = {}) {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const accountService = new AccountService(API_BASE, authToken);
    
    async function fetchStatuses() {
      try {
        setLoading(true);
        const data = await accountService.getAccountStatuses(accountIdentifier, options);
        setStatuses(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        setStatuses([]);
      } finally {
        setLoading(false);
      }
    }

    fetchStatuses();
  }, [accountIdentifier, JSON.stringify(options)]);

  return { statuses, loading, error };
}

// Usage in component
function AccountTimeline({ accountUrl }) {
  const { statuses, loading, error } = useAccountStatuses(accountUrl, { limit: 20 });
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {statuses.map(status => (
        <StatusCard key={status.id} status={status} />
      ))}
    </div>
  );
}
```

## Best Practices

1. **Always cache account lookups** - Account IDs don't change, so cache them to avoid repeated lookups

2. **Handle different server types** - Your client should work with:
   - Mastodon servers (numeric IDs)
   - Pleroma/Akkoma (string IDs that look like numbers)
   - Other ActivityPub servers

3. **Graceful fallbacks** - If one lookup method fails, try others:
   ```javascript
   // Try in order:
   // 1. Local username lookup
   // 2. Webfinger lookup
   // 3. Search with resolve=true
   ```

4. **Use the search endpoint for URLs** - When given an ActivityPub URL:
   ```javascript
   GET /api/v2/search?q=https://lesser.host/users/aron&type=accounts&resolve=true
   ```

5. **Store both ID and acct** - Keep both for different use cases:
   ```javascript
   {
     id: "109348203984",        // Use for API calls
     acct: "aron@lesser.host",   // Use for display
     url: "https://lesser.host/@aron"  // Use for links
   }
   ```

## Testing Your Implementation

Test with different account formats:

```javascript
const testCases = [
  'aron',                                    // Local username
  'aron@lesser.host',                       // Webfinger
  'https://lesser.host/users/aron',         // ActivityPub URL
  'https://lesser.host/@aron',              // Mastodon profile URL
  'https://mastodon.social/@Gargron',      // Remote Mastodon
  '109348203984'                            // Numeric ID
];

for (const testCase of testCases) {
  try {
    const statuses = await accountService.getAccountStatuses(testCase);
    console.log(`✓ ${testCase}: Found ${statuses.length} statuses`);
  } catch (error) {
    console.error(`✗ ${testCase}: ${error.message}`);
  }
}
```

## Summary

The key to Mastodon compatibility is:
1. Never put URLs directly in the path
2. Always resolve accounts to get their ID first
3. Use the ID for all subsequent API calls
4. Cache aggressively to minimize lookups

This approach ensures your Greater client works with any Mastodon-compatible server while providing a smooth user experience.