# Lesser Unified Boost API Implementation Guide for Greater

## Overview

Lesser now supports a unified boost system that handles both traditional boosts (reblogs) and quote boosts through a single API endpoint. This guide explains how Greater should implement support for this new functionality.

## API Endpoint

### POST `/api/v1/statuses/{id}/reblog`

The existing reblog endpoint has been enhanced to support optional commentary for quote boosts.

#### Request Format

```json
{
  "comment": "Optional commentary text for quote boost",
  "visibility": "public"  // Optional, defaults to "public"
}
```

- **No body or empty body**: Creates a traditional boost (pure reblog)
- **Body with `comment` field**: Creates a quote boost with commentary

#### Response Format

**Traditional Boost Response:**
```json
{
  "id": "status-id",
  "created_at": "2025-06-21T15:37:51Z",
  "reblogged": true,
  "reblogs_count": 5,
  "uri": "https://lesser.host/objects/original-status-id",
  "url": "https://lesser.host/objects/original-status-id",
  "content": "",
  "visibility": "public",
  "language": "en"
}
```

**Quote Boost Response:**
```json
{
  "id": "new-quote-status-id",
  "created_at": "2025-06-21T15:37:51Z",
  "content": "This is my commentary on the quoted post",
  "visibility": "public",
  "is_quote_boost": true,
  "quoted_status": {
    "id": "original-status-id",
    "uri": "https://lesser.host/objects/original-status-id",
    "url": "https://lesser.host/objects/original-status-id",
    "content": "Original post content"
  },
  "quoted_status_id": "https://lesser.host/objects/original-status-id",
  "account": { /* account object */ },
  "reblogs_count": 0,  // This is for the new quote post
  "favourites_count": 0,
  "replies_count": 0
}
```

## Implementation Steps for Greater

### 1. Update the Boost UI

Add a boost menu with two options:
- **Boost** - Traditional reblog (no commentary)
- **Quote** - Opens a compose dialog with the quoted post

```javascript
// Example boost menu handler
function handleBoostMenu(statusId) {
  showMenu([
    {
      label: 'Boost',
      icon: 'reblog',
      action: () => performTraditionalBoost(statusId)
    },
    {
      label: 'Quote',
      icon: 'quote',
      action: () => openQuoteCompose(statusId)
    }
  ]);
}
```

### 2. Traditional Boost Implementation

For traditional boosts, continue using the endpoint without a request body:

```javascript
async function performTraditionalBoost(statusId) {
  const response = await fetch(`/api/v1/statuses/${statusId}/reblog`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  if (response.ok) {
    const result = await response.json();
    // Update UI to show boosted state
    updateBoostState(statusId, true, result.reblogs_count);
  }
}
```

### 3. Quote Boost Implementation

For quote boosts, open a compose dialog and send the commentary:

```javascript
async function submitQuoteBoost(statusId, commentary, visibility = 'public') {
  const response = await fetch(`/api/v1/statuses/${statusId}/reblog`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      comment: commentary,
      visibility: visibility
    })
  });
  
  if (response.ok) {
    const newStatus = await response.json();
    // Add the new quote status to the timeline
    addStatusToTimeline(newStatus);
    // Close compose dialog
    closeQuoteComposeDialog();
  }
}
```

### 4. Displaying Quote Boosts in Timeline

Quote boosts appear as regular statuses with additional quote metadata:

```javascript
function renderStatus(status) {
  if (status.is_quote_boost && status.quoted_status) {
    return (
      <div className="status">
        <div className="status-content">
          {status.content}
        </div>
        <div className="quoted-status">
          <div className="quote-indicator">Quoting</div>
          <div className="quoted-content">
            <a href={`/@${status.quoted_status.account.username}`}>
              @{status.quoted_status.account.username}
            </a>
            <div>{status.quoted_status.content}</div>
          </div>
        </div>
      </div>
    );
  }
  // Regular status rendering...
}
```

### 5. Unified Boost Count

Both traditional boosts and quote boosts increment the same `reblogs_count`. The UI should:
- Show a single boost count that includes both types
- Optionally, show a breakdown when expanded (future enhancement)

### 6. Compose Dialog for Quotes

The quote compose dialog should:
- Show the post being quoted as context
- Provide a text area for commentary
- Include visibility settings
- Show character count for the commentary

```javascript
function QuoteComposeDialog({ quotedStatus, onSubmit, onCancel }) {
  const [commentary, setCommentary] = useState('');
  const [visibility, setVisibility] = useState('public');
  
  return (
    <Dialog>
      <h2>Quote Post</h2>
      <QuotedStatusPreview status={quotedStatus} />
      <textarea
        placeholder="Add your commentary..."
        value={commentary}
        onChange={(e) => setCommentary(e.target.value)}
        maxLength={500}
      />
      <VisibilitySelector value={visibility} onChange={setVisibility} />
      <div className="actions">
        <button onClick={onCancel}>Cancel</button>
        <button 
          onClick={() => onSubmit(commentary, visibility)}
          disabled={!commentary.trim()}
        >
          Post Quote
        </button>
      </div>
    </Dialog>
  );
}
```

## Migration Considerations

1. **Backwards Compatibility**: The endpoint remains backwards compatible. Existing boost functionality works unchanged.

2. **Feature Detection**: Check for `is_quote_boost` field support:
   ```javascript
   const supportsQuoteBoosts = serverVersion >= '2.0.0' || 
                               instanceFeatures.includes('quote_boosts');
   ```

3. **Unboost Handling**: The `/api/v1/statuses/{id}/unreblog` endpoint works for traditional boosts but not quote boosts (which are separate statuses that must be deleted).

## Error Handling

Handle these specific cases:
- **400 Bad Request**: Invalid request format
- **404 Not Found**: Status doesn't exist
- **422 Unprocessable Entity**: Cannot quote a private status
- **503 Service Unavailable**: Federation delivery issues

## Best Practices

1. **Character Limits**: Enforce the same character limit for quote commentary as regular posts
2. **Preview**: Show a preview of how the quote will appear before posting
3. **Accessibility**: Ensure screen readers can distinguish between commentary and quoted content
4. **Performance**: Cache quoted status data to avoid re-fetching

## Testing

Test these scenarios:
1. Traditional boost (no body)
2. Quote boost with short commentary
3. Quote boost with maximum length commentary
4. Quote boost with different visibility settings
5. Attempting to quote private/direct posts (should fail)
6. Network error handling
7. UI state updates after successful boost/quote

## Future Enhancements

Lesser may add these features in future updates:
- Separate quote count from boost count
- Quote threads (quoting a quote)
- Quote notifications settings
- Batch operations for quotes

## Questions?

If you need clarification or encounter issues, please:
1. Check the API responses for additional fields
2. Review the example implementation in `/docs/greater/examples/`
3. Contact the Lesser team with specific error messages

---

*Last updated: 2025-06-21*