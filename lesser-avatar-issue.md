# Lesser API Issue: Empty Avatar URLs for Users with Avatars

## Issue Summary
The Lesser API is returning empty avatar URLs (`avatar: ""`) for users who have successfully uploaded avatars. This occurs when calling `/api/v1/accounts/verify_credentials` and other account-related endpoints.

## Observed Behavior
1. User uploads avatar through the UI (visible in screenshot)
2. API returns account data with empty avatar field:
   ```javascript
   {
     id: 'https://lesser.host/users/aron',
     username: 'aron',
     display_name: 'aron',
     avatar: '',  // Empty despite user having avatar
     avatar_static: '',
     // ... other fields
   }
   ```
3. Greater client falls back to showing initials instead of avatar image

## Expected Behavior
The API should return the full URL to the avatar image:
```javascript
{
  avatar: 'https://lesser.host/media/avatars/aron_avatar.jpg',
  avatar_static: 'https://lesser.host/media/avatars/aron_avatar_static.jpg',
  // ... other fields
}
```

## Impact
- Users with avatars appear without them in the UI
- Greater client must implement workarounds or fallbacks
- Poor user experience as profile pictures don't display

## Evidence
From browser console logs:
```
[Auth] Fresh user data from API: {id: 'https://lesser.host/users/aron', username: 'aron', display_name: 'aron', email: '', email_verified: true, …}
[Auth] Avatar URL from API: 
[Auth] Avatar after update: 
```

Screenshot shows user clearly has an avatar set, but API returns empty string.

## Potential Root Causes
1. Avatar URL generation issue in Lesser backend
2. Media storage path not being correctly resolved
3. Database storing empty strings instead of NULL for missing avatars
4. Avatar upload succeeding but URL not being saved to user record

## Recommended Investigation Steps
1. Check DynamoDB user records to see if avatar URLs are stored
2. Verify S3/media storage contains the uploaded avatars
3. Review the account serialization logic in the API
4. Check if this affects all users or specific cases

## Related Issues
- Previous issue with avatar upload returning 400 errors (see `greater-image-upload-issue.md`)
- This may be a consequence of partial avatar upload success

## Priority
High - This breaks a core user experience feature and affects all authenticated users trying to display avatars.