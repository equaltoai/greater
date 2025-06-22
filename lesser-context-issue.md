# Lesser API Issue: Status Context Returns Empty Descendants

## Issue Summary
The `/api/v1/statuses/:id/context` endpoint is returning empty arrays for descendants even when a status has replies.

## Observed Behavior
When calling the context endpoint for a status that has replies:
```json
{
  "ancestors": [],
  "descendants": []
}
```

## Expected Behavior
The context endpoint should return all replies (descendants) to the status:
```json
{
  "ancestors": [],
  "descendants": [
    {
      "id": "reply-id-1",
      "in_reply_to_id": "parent-status-id",
      // ... rest of status data
    },
    {
      "id": "reply-id-2", 
      "in_reply_to_id": "parent-status-id",
      // ... rest of status data
    }
  ]
}
```

## Impact
- Thread view shows no replies even when replies exist
- Users cannot see conversation threads
- Breaking core Mastodon API compatibility

## Evidence
1. Status "hello lesser" (ID: 1750512085-0UQB3duo) has 2 replies visible in the timeline
2. The status response shows `replies_count: 0` (which is also incorrect)
3. The context endpoint returns empty descendants array
4. Timeline view shows replies correctly when they're fetched as part of the main timeline

## Potential Root Causes
1. Context query in Lesser not properly joining on `in_reply_to_id`
2. Replies not being indexed properly for context lookups
3. DynamoDB query for descendants not configured correctly
4. The `replies_count` field not being incremented when replies are created

## Recommended Investigation
1. Check if replies have correct `in_reply_to_id` set in the database
2. Review the context endpoint implementation in Lesser
3. Verify the DynamoDB query for fetching descendants
4. Check if there's a GSI (Global Secondary Index) for querying by `in_reply_to_id`

## Related Issues
- `replies_count` showing 0 for statuses with replies
- This may be related to why replies weren't working properly in the compose flow

## Priority
High - This breaks a fundamental feature of social media (conversation threads)