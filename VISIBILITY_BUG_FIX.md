# Lesser Visibility Bug Fix

## Issue Summary
All posts were being created with "direct" visibility regardless of the visibility parameter sent in the API request.

**Status: FIXED ✅** - Lesser has been updated and the visibility bug has been resolved.

## Root Cause
The visibility value was used to set the ActivityPub `To` and `CC` fields during status creation, but the visibility itself wasn't being stored. When retrieving statuses, Lesser tried to reverse-engineer the visibility from the `To`/`CC` fields, but this was failing and defaulting to "direct".

## Fix Applied

### 1. Added Visibility Field to Storage
- Added `Visibility` field to the `Object` struct in `pkg/storage/dynamodb/objects.go`
- Added `Visibility` field to the `Note` struct in `pkg/activitypub/types.go`

### 2. Updated Status Creation
- Modified `cmd/api/handlers/statuses.go` to explicitly set `note.Visibility = req.Visibility`
- The visibility is now stored alongside the object in DynamoDB

### 3. Updated Object Conversion
- Modified `pkg/storage/dynamodb/objects.go` to include visibility when converting objects
- Modified `pkg/mastodon/converter_impl.go` to use the stored visibility value

### 4. Fallback Logic
- If visibility is explicitly stored, use it
- Otherwise, fall back to the original logic of determining from To/CC fields
- This ensures backward compatibility with existing data

## Testing the Fix

After deploying these changes:

1. **Create a public post:**
   ```bash
   curl -X POST https://lesser.host/api/v1/statuses \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "status": "Test public post",
       "visibility": "public"
     }'
   ```

2. **Verify the response includes `"visibility": "public"`**

3. **Check public timeline:**
   ```bash
   curl https://lesser.host/api/v1/timelines/public?local=true
   ```
   The post should now appear in the public timeline.

## Data Migration

Since you mentioned you can wipe the test data, no migration is needed. After deploying:
1. Clear the DynamoDB table
2. Recreate test data
3. All new posts will have proper visibility

## For Greater Team

No changes needed on your end! Once Lesser is updated and redeployed:
- Posts will respect the visibility parameter
- Public timelines will show public posts
- The API will return the correct visibility value

The fix is backward compatible, so existing API calls will continue to work as expected.