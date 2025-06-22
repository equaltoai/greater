# Issue: Local Timeline Shows External Posts Instead of Local-Only Content

## Summary
The `/api/v1/timelines/public?local=true` endpoint is returning posts from external instances (mastodon.social) instead of filtering to show only posts from the local instance (lesser.host).

## Expected Behavior
When requesting the local timeline with `local=true` parameter, the API should return only posts from users on the same instance (lesser.host).

## Actual Behavior
The API is returning posts from external federated instances. In the provided data sample, all 20 posts are from mastodon.social accounts, including:
- @SimpsonsFrames@mastodon.social
- @jazzfm@mastodon.social
- @khabari24@mastodon.social
- @nesbotot@mastodon.social
- @Headline_News_Bot@mastodon.social
- @enlightenedferalboy@mastodon.social
- @paulpalinkas@mastodon.social
- @Ulfh3dnar@mastodon.social
- @narfnra@mastodon.social
- @oknewsme@mastodon.social
- @PemudapancasilaFM@mastodon.social
- @arcadespot@mastodon.social
- @openletterbot@mastodon.social
- @SpiritusNox@mastodon.social
- @epood@mastodon.social
- @SoLSec@mastodon.social
- @TUKOcoke@mastodon.social
- @GripNews@mastodon.social
- @KylieJennerJet@mastodon.social
- @audubonballroon@mastodon.social

## Steps to Reproduce
1. Make a GET request to `https://lesser.host/api/v1/timelines/public?local=true`
2. Observe that returned posts include `"uri": "https://mastodon.social/..."` instead of only `"uri": "https://lesser.host/..."`

## Impact
- Users cannot see posts from their local instance community
- The local timeline feature is effectively non-functional
- This breaks Mastodon API compatibility for the local timeline endpoint
- Users see the same content on both "Local" and "Federated" timelines

## Technical Details
- **API Endpoint**: `/api/v1/timelines/public`
- **Parameter**: `local=true`
- **Expected filter**: Should only return posts where the account URI domain matches the instance domain
- **Current behavior**: Appears to be ignoring the `local` parameter entirely

## Example Data Structure
Each post in the response contains account information like:
```json
{
  "account": {
    "uri": "https://mastodon.social/users/SimpsonsFrames",
    "url": "https://mastodon.social/@SimpsonsFrames",
    "acct": "SimpsonsFrames"
  }
}
```

For local accounts, this should be:
```json
{
  "account": {
    "uri": "https://lesser.host/users/username",
    "url": "https://lesser.host/@username", 
    "acct": "username"  // Note: no domain for local accounts
  }
}
```

## Suggested Fix
The backend should filter posts where:
1. The post's `account.uri` starts with the instance's base URL (e.g., `https://lesser.host/`)
2. OR check if `account.acct` does not contain '@' (local accounts don't have domain in acct field)
3. Include boosts/reblogs by local users even if the original post is from another instance

## Priority
**High** - This is a core Mastodon API feature that affects the user experience and community building on the instance.

## Additional Notes
- The federated timeline (`/api/v1/timelines/public` without `local=true`) appears to be working correctly
- This issue makes it impossible for users to discover content from their own instance
- The Greater client is correctly passing the `local=true` parameter, so this is definitely a backend issue