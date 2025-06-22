# Unified Boost System Proposal for Lesser

## Executive Summary
We propose enhancing Lesser's boost functionality to support both traditional boosts and quote-style boosts with commentary, unified under a single interaction model and count. This maintains backwards compatibility while providing users more expressive options.

## Current Limitations

### Mastodon's Approach
- Boost = instant reshare, no commentary allowed
- No quote tweet functionality (by design)
- Users work around this with screenshots or reply chains
- Limits meaningful discourse and context-adding

### Current Greater/Lesser Implementation
- Following Mastodon's restrictive model
- Users cannot add context when sharing
- Boost count only reflects pure reshares, not commentary shares

## Proposed Solution: Unified Boost System

### Core Concept
One boost button, one boost count, two modes:
1. **Pure Boost**: Share without commentary (Mastodon-compatible)
2. **Quote Boost**: Share with commentary (enhanced functionality)

Both increment the same `reblogs_count` as they serve the same purpose: amplifying content.

### User Flow
1. User clicks boost button → Composer opens with original post URL
2. User can either:
   - Submit immediately (empty text) → Pure boost
   - Add commentary and submit → Quote boost
3. Both actions increment the boost count
4. Both appear in timelines as amplification of the original

### API Design

#### Enhanced Reblog Endpoint
```
POST /api/v1/statuses/:id/reblog
Content-Type: application/json

{
  "comment": "Optional commentary text"
}
```

**Behavior:**
- If `comment` is null/empty → Traditional boost (ActivityPub `Announce`)
- If `comment` has text → Create new status with special metadata linking to original

#### Response
```json
{
  "id": "new-status-id",
  "reblog": { /* original status */ },
  "content": "Commentary text (if provided)",
  "is_quote_boost": true,
  // ... standard status fields
}
```

#### Database Considerations
- Add `boost_type` field to track pure vs quote boosts
- Add `original_status_id` reference for quote boosts
- Increment `reblogs_count` for both types
- Enable querying all boosts (both types) for a status

### Federation & Compatibility

#### Outgoing (Lesser → Mastodon)
- Pure boosts → Standard `Announce` activity
- Quote boosts → `Create` activity with content including URL
- Both preserve thread context

#### Incoming (Mastodon → Lesser)
- Accept standard `Announce` activities as pure boosts
- Detect `Create` activities with status URLs as potential quote boosts
- Unify counts for better metrics

### Implementation Requirements

#### Backend (Lesser)
1. Modify `/reblog` endpoint to accept optional comment
2. Update status creation logic to handle quote boosts
3. Ensure both types increment `reblogs_count`
4. Add GraphQL support for the enhanced functionality
5. Update streaming API to handle both boost types

#### Frontend (Greater)
1. Modify boost button to open composer
2. Track boost intent in composer
3. Call appropriate API based on whether text was added
4. Display both boost types appropriately in timelines

### Benefits

1. **User Expression**: Users can add valuable context when sharing
2. **Backwards Compatible**: Works with existing Mastodon instances
3. **Unified Metrics**: One count shows true amplification
4. **Reduced Workarounds**: No need for screenshot quotes or reply chains
5. **Better Discourse**: Enables thoughtful commentary on shared content

### Migration Path

1. **Phase 1**: Implement enhanced endpoint alongside existing
2. **Phase 2**: Update Greater to use new endpoint
3. **Phase 3**: Migrate existing boosts to unified system
4. **Phase 4**: Deprecate separate tracking (if any)

### Example Use Cases

**Pure Boost** (Mastodon-style):
- User clicks boost
- Composer opens with URL
- User immediately submits
- Shows as "User boosted" in timeline

**Quote Boost** (Enhanced):
- User clicks boost  
- Composer opens with URL
- User adds: "This is exactly the problem we need to solve!"
- Shows as user's post with embedded/linked original
- Still counts as a boost

### Future Enhancements
- Boost attribution in quote boosts ("via @original_author")
- Boost analytics showing pure vs quote ratio
- Option to convert between boost types
- Nested quote boosts handling

## Questions for Lesser Team

1. Are there any DynamoDB schema changes needed for tracking boost relationships?
2. Should we implement boost type filtering in timeline queries?
3. How should we handle boost cycles (A quotes B quotes A)?
4. Should the GraphQL API expose boost type information?
5. Any concerns about the unified count approach for analytics?

## Next Steps

1. Lesser team reviews and provides feedback
2. Agree on API contract details
3. Lesser implements backend changes
4. Greater updates frontend to use new API
5. Test federation with Mastodon instances
6. Deploy with feature flag for gradual rollout

This proposal maintains Lesser's philosophy of improving on Mastodon while ensuring compatibility and user freedom.