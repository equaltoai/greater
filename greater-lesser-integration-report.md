# Greater/Lesser Integration Test Report

## Executive Summary

After deploying the interaction fixes, several features are now attempting to work but are failing due to **data format mismatches** between what Lesser provides and what Greater expects.

## 🟢 What's Working

1. **Authentication Flow**
   - OAuth redirect works correctly
   - Auth tokens are stored and used
   - User data loads (avatar, username, etc.)

2. **Timeline Display**
   - Home timeline loads and displays posts
   - Status content renders correctly
   - User avatars and metadata display

3. **API Client Instance Fix**
   - All API calls now correctly go to `lesser.host` (not mastodon.social)
   - The fix we deployed is working as intended

## 🔴 What's Broken

### 1. **Follow Button - Account ID Mismatch**
```
POST https://lesser.host/api/v1/accounts/495433748435615/follow 404 (Not Found)
```

**Problem**: Greater is using a numeric ID (`495433748435615`) but Lesser uses URL-based IDs (`https://lesser.host/users/aron2`)

**Root Cause**: Greater appears to be hashing or transforming the account ID before making the API call.

### 2. **Quote Boost - Empty Status ID**
```
POST https://lesser.host/api/v1/statuses//reblog 405 (Method Not Allowed)
```

**Problem**: The status ID is missing (note the double slash `//`)

**Root Cause**: The quote boost functionality isn't properly passing the status ID to the reblog endpoint.

### 3. **Schema Validation Warnings**
```
[Schema Validation] Failed for verifyCredentials: (7) [{…}, {…}, {…}, {…}, {…}, {…}, {…}]
```

**Problem**: Lesser's API responses don't match the expected Mastodon schema exactly.

**Impact**: Data still works but generates console warnings.

## 🔍 Technical Analysis

### Account ID Issue

Lesser uses URL-based IDs:
- Format: `https://lesser.host/users/username`
- Example: `https://lesser.host/users/aron2`

Greater expects numeric IDs:
- Format: `123456789`
- Example: `495433748435615`

The number `495433748435615` appears to be a hash or transformation of the original ID.

### Status ID Format

Lesser status IDs:
- Format: `timestamp-randomString`
- Example: `1750535066-ddPWPAHK`

This format works fine for favorites/boosts when the ID is properly passed.

## 📋 API Call Analysis

### Working Calls
- `GET /api/v1/timelines/home` ✅
- `GET /api/v1/accounts/verify_credentials` ✅
- `GET /api/v1/instance` ✅

### Failing Calls
- `POST /api/v1/accounts/495433748435615/follow` ❌ (404)
- `POST /api/v1/statuses//reblog` ❌ (405, empty ID)

### Not Yet Tested
- `POST /api/v1/statuses/:id/favourite`
- `POST /api/v1/statuses/:id/bookmark`
- `POST /api/v1/statuses` (create post)

## 🚀 Recommendations

### Immediate Fixes Needed

1. **Account ID Handling**
   - Find where Greater transforms account IDs
   - Use the raw ID from Lesser without transformation
   - Check `UserProfile.svelte` and `UserCard.svelte` account handling

2. **Quote Boost Status ID**
   - Fix the quote boost handler in `ComposeBox.svelte`
   - Ensure status ID is properly passed to the reblog function

3. **Schema Validation**
   - Either update schemas to match Lesser's format
   - Or disable strict validation for Lesser instances

### Code Areas to Investigate

1. **Account ID transformation** - Likely in:
   - API client account methods
   - Account data parsing/storage
   - Follow button click handlers

2. **Quote boost** - Check:
   - `ComposeBox.svelte` quote boost handler
   - How quoted status is stored/passed

## 🎯 Next Steps

1. **Fix account ID handling** - This is blocking all follow functionality
2. **Fix quote boost** - Simple fix, just needs proper status ID passing
3. **Test other interactions** - Verify favorite/boost/bookmark actually work
4. **Add error handling** - Users need feedback when things fail

The good news is that the core infrastructure is working - we just need to fix these data format issues!