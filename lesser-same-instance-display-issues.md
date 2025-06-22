# Lesser Same-Instance User Display Issues

## Issue Summary
When viewing another user's profile on the same Lesser instance, posts are displayed with missing content and invalid dates. Additionally, interactions (follow, boost, favorite, bookmark) fail with errors.

## Observed Behavior

### Profile View Issues (@aron viewing @aron2)
1. **Missing Post Content**: Posts appear with empty content field
2. **Invalid Date**: All posts show "Invalid Date" instead of proper timestamps
3. **Wrong Post Count**: Profile shows "0 Posts" despite user having posts
4. **No Bio/Avatar**: Despite aron2 likely having a bio, it shows generic "New Lesser user"

### Timeline Issues
1. **Reply Without Context**: When @aron replies to @aron2, only the reply appears in @aron's timeline with no indication of what it's replying to
2. **Duplicate Posts**: @aron2's timeline shows the same post twice

### Interaction Failures
According to the report, all of these actions produce errors when @aron tries to interact with @aron2's posts:
- Follow button
- Boost button  
- Favorite button
- Bookmark button

## Expected Behavior
1. Posts should show their content when viewing another user's profile
2. Timestamps should display correctly (e.g., "5m ago")
3. Post count should reflect actual number of posts
4. Replies should show context or indication of what they're replying to
5. All interaction buttons should work between users on the same instance

## Screenshots Evidence
- `aron2-as-aron.png`: Shows empty post content and "Invalid Date"
- `aron-home-timeline.png`: Shows reply without context
- `aron2-home-timeline.png`: Shows duplicate posts

## Potential Root Causes
1. **API Response Format**: The account endpoint might be returning data in a different format than expected
2. **Date Parsing**: The `created_at` field might be in an unexpected format
3. **Content Field**: The content might be in a different field or require different parsing
4. **Permissions**: There might be visibility/permission issues even within the same instance

## Impact
- Users cannot properly view or interact with other users on the same instance
- Social features are broken within the instance
- Poor user experience when trying to discover and follow other users

## Recommended Investigation
1. Check what API endpoint is called when viewing `/@aron2`
2. Inspect the actual API response to see if content/date fields are present
3. Verify the date format being returned matches expected ISO format
4. Check if there are permission differences between viewing own posts vs others
5. Investigate why interaction endpoints fail for same-instance users

## Related Issues
- Context API returning empty descendants (lesser-context-issue.md)
- Avatar URLs returning empty (lesser-avatar-issue.md)

## Priority
High - This breaks core social functionality within a single instance