# Greater/Lesser Integration Gap Analysis (Revised)

## Critical Insight: Authentication IS Working

Since posts were successfully created ("hello lesser", "@aron hello greater", "@aron2 hi"), this proves:
- ✅ Authentication tokens ARE valid
- ✅ API client CAN make authenticated requests
- ✅ The secure token storage IS functioning
- ✅ POST /api/v1/statuses endpoint works

## 🔴 The Real Problems

### 1. **Interaction Endpoints Not Wired Correctly**

Looking at the evidence:
- **Posting works**: Uses `POST /api/v1/statuses`
- **Interactions don't work**: Should use `POST /api/v1/statuses/:id/favourite`, etc.

**Likely Issue**: The status ID format from Lesser might not match what Greater expects.

### 2. **Status ID Mismatch**

From the screenshots, Lesser status IDs appear to be in format: `1750535066-ddPWPAHK`

The Greater code might be expecting different ID formats, causing:
```javascript
// This might fail if ID format is unexpected
await client.favouriteStatus(status.id); // status.id = "1750535066-ddPWPAHK"
```

### 3. **Missing Response Handling**

The interaction methods in `timeline.svelte.ts` might not be handling Lesser's response format correctly:

```typescript
// Greater expects standard Mastodon response
const updatedStatus = await client.favouriteStatus(statusId);
// But Lesser might return a different structure
```

### 4. **Store Update Logic Issues**

Even if the API call succeeds, the store might not update correctly:
```typescript
// This update logic might not work with Lesser's response
statuses[index] = updatedStatus;
```

## 🔍 Debugging Steps to Confirm

1. **Open Browser DevTools Console** and try:
```javascript
// Check what status IDs look like
document.querySelector('[data-testid="status-card"]')?.__svelte__?.status

// Try manually calling the API
const statusId = "1750535066-ddPWPAHK"; // Use a real ID from the page
await fetch(`https://lesser.host/api/v1/statuses/${statusId}/favourite`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + (await getToken()),
    'Content-Type': 'application/json'
  }
});
```

2. **Check Network Tab** while clicking interaction buttons:
- Are requests being made but failing?
- What's the exact error response?

## 🎯 Most Likely Root Causes

### 1. **Status Object Structure Mismatch**
Lesser might return status objects with different field names or structures than standard Mastodon.

**Example**:
```javascript
// Mastodon standard
{
  "id": "123",
  "favourited": true,
  "favourites_count": 1
}

// Lesser might return
{
  "id": "1750535066-ddPWPAHK",
  "favorited": true,  // Different spelling
  "favorites_count": 1 // Different field name
}
```

### 2. **Endpoint Path Issues**
The API client might be constructing incorrect URLs:
```javascript
// Expected: https://lesser.host/api/v1/statuses/1750535066-ddPWPAHK/favourite
// Actual: might be encoding the ID incorrectly or using wrong path
```

### 3. **Response Status Handling**
Lesser might return different HTTP status codes than expected:
```javascript
// Greater expects 200 OK
// Lesser might return 201 Created or 204 No Content
```

## 📋 Specific Feature Analysis

### ✅ What Works
- **Posting**: Creates new statuses successfully
- **Timeline Loading**: Fetches and displays statuses
- **Basic Auth**: OAuth flow and token storage

### ❌ What's Broken (and likely why)

1. **Favorite Button**
   - Likely issue: Field name mismatch (`favourited` vs `favorited`)
   - API might succeed but UI doesn't update

2. **Boost Button**
   - Likely issue: Field name mismatch (`reblogged` vs `boosted`)
   - May need different endpoint path

3. **Reply Button**
   - Should navigate to compose with `in_reply_to_id`
   - Navigation logic might be broken

4. **Bookmark Button**
   - Lesser might not implement bookmarks (Mastodon v4 feature)
   - Could return 404 or 501 Not Implemented

5. **Follow Button**
   - Account ID format might be different
   - Relationship endpoint might return different structure

### 🔧 Profile Page Issues
The profile shows but with incomplete data because:
- Account endpoint returns basic info
- But related endpoints might fail:
  - `/api/v1/accounts/:id/statuses` (user timeline)
  - `/api/v1/accounts/relationships` (follow state)

## 🚀 Recommended Debugging Actions

### 1. Add Verbose Logging
```javascript
// In StatusCard.svelte handleFavorite()
async function handleFavorite() {
  console.log('=== FAVORITE DEBUG ===');
  console.log('Status:', displayStatus);
  console.log('Current favorited state:', displayStatus.favourited);
  
  try {
    const result = await timelineStore.favoriteStatus(displayStatus.id);
    console.log('API Result:', result);
  } catch (error) {
    console.error('Favorite failed:', error);
    console.error('Response:', error.response);
  }
}
```

### 2. Check API Response Format
```javascript
// Temporarily modify the API client to log responses
async favouriteStatus(id: string) {
  const response = await this.request(`/api/v1/statuses/${id}/favourite`, {
    method: 'POST',
  });
  console.log('Lesser favourite response:', response);
  return response;
}
```

### 3. Verify Field Names
Compare Lesser's actual API responses with what Greater expects:
- `favourited` vs `favorited`
- `favourites_count` vs `favorites_count`
- `reblogged` vs `boosted`
- `reblogs_count` vs `boosts_count`

## 📊 Hypothesis Priority

1. **Field name mismatches** (90% likely) - Different spellings between Lesser and Mastodon standard
2. **ID format issues** (70% likely) - Lesser's composite IDs might need special handling
3. **Missing endpoints** (50% likely) - Some features might not be implemented in Lesser
4. **Response format differences** (40% likely) - Structure might be different
5. **HTTP status code mismatches** (20% likely) - Different success codes

## 🎯 Quick Test

Run this in the browser console while on the Greater site:
```javascript
// Get the first status on the page
const statusEl = document.querySelector('[data-testid="status-card"]');
const status = statusEl?.__svelte__?.status || {};
console.log('Status object:', status);
console.log('ID format:', status.id);
console.log('Favorited field:', status.favourited, status.favorited);
console.log('Boost field:', status.reblogged, status.boosted);
```

This will immediately reveal if there are field name mismatches!