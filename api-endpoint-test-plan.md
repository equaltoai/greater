# API Endpoint Test Plan

## Test Setup
- User 1: @aron (logged in)
- User 2: @aron2 (on same instance)
- Instance: https://lesser.host

## Endpoints to Test

### 1. Account Lookup
```bash
# Get @aron2's account info
curl -H "Authorization: Bearer TOKEN" \
  https://lesser.host/api/v1/accounts/lookup?acct=aron2
```
Expected: Full account object with avatar, header, bio, stats

### 2. Account Statuses
```bash
# Get @aron2's statuses
curl -H "Authorization: Bearer TOKEN" \
  https://lesser.host/api/v1/accounts/{aron2-id}/statuses
```
Expected: Array of statuses with content, created_at

### 3. Follow/Unfollow
```bash
# Follow @aron2
curl -X POST -H "Authorization: Bearer TOKEN" \
  https://lesser.host/api/v1/accounts/{aron2-id}/follow

# Unfollow @aron2  
curl -X POST -H "Authorization: Bearer TOKEN" \
  https://lesser.host/api/v1/accounts/{aron2-id}/unfollow
```
Expected: Relationship object with following=true/false

### 4. Status Actions (using @aron2's post ID)
```bash
# Favorite
curl -X POST -H "Authorization: Bearer TOKEN" \
  https://lesser.host/api/v1/statuses/{status-id}/favourite

# Unfavorite
curl -X POST -H "Authorization: Bearer TOKEN" \
  https://lesser.host/api/v1/statuses/{status-id}/unfavourite

# Bookmark
curl -X POST -H "Authorization: Bearer TOKEN" \
  https://lesser.host/api/v1/statuses/{status-id}/bookmark

# Unbookmark
curl -X POST -H "Authorization: Bearer TOKEN" \
  https://lesser.host/api/v1/statuses/{status-id}/unbookmark

# Boost (traditional)
curl -X POST -H "Authorization: Bearer TOKEN" \
  https://lesser.host/api/v1/statuses/{status-id}/reblog

# Unboost
curl -X POST -H "Authorization: Bearer TOKEN" \
  https://lesser.host/api/v1/statuses/{status-id}/unreblog
```
Expected: Updated status object with changed flags

### 5. Reply Context
```bash
# Get the reply's context (what it's replying to)
curl -H "Authorization: Bearer TOKEN" \
  https://lesser.host/api/v1/statuses/{reply-id}/context
```
Expected: ancestors array with the original status

### 6. Relationships
```bash
# Check relationship with @aron2
curl -H "Authorization: Bearer TOKEN" \
  "https://lesser.host/api/v1/accounts/relationships?id[]={aron2-id}"
```
Expected: Array with relationship object

## What to Check in Responses

### For Account/Status Responses:
- [ ] Is `content` field present and non-empty?
- [ ] Is `created_at` in valid ISO format?
- [ ] Are URLs (avatar, header) valid?
- [ ] Are counts accurate (statuses_count, followers_count)?

### For Action Responses:
- [ ] HTTP status code (200 vs 4xx/5xx)
- [ ] Error message if failed
- [ ] Updated flags (favourited, bookmarked, reblogged)

### For Greater Implementation:
- [ ] Are we calling the right endpoints?
- [ ] Are we parsing responses correctly?
- [ ] Are we handling errors properly?
- [ ] Is the UI reflecting the actual API state?

## Known Greater Issues to Fix First:
1. Bookmark button debug logging shows it might be calling wrong endpoint
2. Schema validation is failing - might be rejecting valid responses
3. Avatar URL handling has been problematic

Let's run these tests with actual curl commands to see raw API responses!