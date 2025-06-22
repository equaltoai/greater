# Lesser API Bug Report

## Issue: /api/v1/accounts/{id}/statuses returns malformed status objects

### Description
The account statuses endpoint is returning status objects with empty string values for critical fields.

### Endpoint
`GET /api/v1/accounts/{id}/statuses`

### Expected Behavior
Should return properly formed status objects with valid IDs, timestamps, and content.

### Actual Behavior
Returns status objects with empty strings for required fields:

```json
{
  "id": "",
  "created_at": "",
  "content": "",
  // ... other fields
}
```

### Example Response
```json
[{
  "id": "",
  "created_at": "",
  "in_reply_to_id": null,
  "in_reply_to_account_id": null,
  "sensitive": false,
  "spoiler_text": "",
  "visibility": "public",
  "language": "en",
  "uri": "",
  "url": "",
  "replies_count": 0,
  "reblogs_count": 0,
  "favourites_count": 0,
  "favourited": false,
  "reblogged": false,
  "muted": false,
  "bookmarked": false,
  "pinned": false,
  "content": "",
  "reblog": null,
  "account": {
    "id": "256985697932157",
    "username": "aron",
    "acct": "aron",
    "display_name": "aron",
    "locked": false,
    "bot": false,
    "discoverable": true,
    "group": false,
    "created_at": "2025-06-22T04:04:59Z",
    "note": "New Lesser user",
    "url": "https://lesser.host/@aron",
    "avatar": "https://lesser.host/avatars/default.png",
    "avatar_static": "https://lesser.host/avatars/default.png",
    "header": "",
    "header_static": "",
    "followers_count": 0,
    "following_count": 0,
    "statuses_count": 0,
    "last_status_at": "",
    "emojis": [],
    "fields": []
  },
  "media_attachments": [],
  "mentions": [],
  "tags": [],
  "emojis": [],
  "card": null,
  "poll": null
}]
```

### Impact
- Profile pages cannot display user posts
- Invalid dates cause "Invalid Date" display
- Empty content makes posts appear blank

### Additional Issues
1. The avatar URL `https://lesser.host/avatars/default.png` returns 404
2. The `statuses_count` field shows 0 even though the API is returning a status

### Reproduction Steps
1. Create a user account
2. Post a status
3. Visit the user's profile page
4. Call `/api/v1/accounts/{id}/statuses` endpoint
5. Observe malformed response

### Environment
- Instance: lesser.host
- Client: Greater (dev.greater.website)