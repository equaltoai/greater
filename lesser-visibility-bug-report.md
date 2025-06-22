# Lesser Bug Report: All Posts Being Created with "direct" Visibility

## Issue Summary
Lesser API is ignoring the `visibility` parameter when creating posts and forcing all posts to have "direct" visibility, making them invisible on public timelines.

## Expected Behavior
- When a post is created with `visibility: "public"`, it should be visible on public timelines
- Posts should respect the visibility parameter sent in the API request
- Default visibility should be "public" unless explicitly specified otherwise

## Actual Behavior
- All posts are being created with `visibility: "direct"` regardless of what's sent in the API request
- Public timelines appear empty because direct messages are correctly filtered out
- The API returns posts with `"visibility": "direct"` even when `"visibility": "public"` was sent

## Steps to Reproduce
1. Send a POST request to `/api/v1/statuses` with body:
   ```json
   {
     "status": "Test public post",
     "visibility": "public"
   }
   ```
2. Check the returned status object - it will have `"visibility": "direct"`
3. Visit `/api/v1/timelines/public?local=true` - the post won't appear
4. Check the database - all posts have visibility set to "direct"

## Evidence
API response showing posts incorrectly marked as direct:
```json
{
  "id": "1750535066-ddPWPAHK",
  "content": "hello lesser",
  "visibility": "direct",  // Should be "public"
  "account": { "username": "aron" }
}
```

## Impact
- Users cannot see any posts on public timelines
- All posts are effectively private/direct messages
- The platform is unusable for public communication
- This breaks Mastodon API compatibility

## Suspected Cause
The Lesser backend likely has one of these issues:
1. The visibility field is being hardcoded to "direct" during post creation
2. The visibility parameter is not being properly extracted from the request
3. There's a default value override setting all posts to "direct"

## Recommended Fix
Check the post creation endpoint in Lesser's codebase for:
- Where visibility is being set during status creation
- Whether the visibility parameter is being properly parsed from the request body
- Any hardcoded defaults that might be overriding the requested visibility