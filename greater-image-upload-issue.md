# Image Upload Issue - Account Update Credentials

## Issue Summary
The `/api/v1/accounts/update_credentials` endpoint is returning a 400 Bad Request error when attempting to update user profile with images (avatar and header).

## Root Cause
The multipart form data being sent includes file metadata but **no actual file content**. The request contains empty file bodies after the Content-Type headers.

### What's Being Sent
```
Content-Disposition: form-data; name="avatar"; filename="IMG_0680.jpeg"
Content-Type: image/jpeg

[EMPTY - No file data]
```

### What Should Be Sent
```
Content-Disposition: form-data; name="avatar"; filename="IMG_0680.jpeg"
Content-Type: image/jpeg

[ACTUAL BINARY IMAGE DATA]
```

## Technical Details

From the captured curl request:
- The multipart boundary is correctly set
- File metadata (filename, content-type) is properly formatted
- **Critical Issue**: The actual file binary data is missing between the headers and the boundary delimiter

## Impact
The Lesser API is likely:
1. Detecting the empty file content
2. Failing validation for the image fields
3. Returning a 400 Bad Request error

## Solutions for Greater Team

### Option 1: Fix File Upload in Greater Client
Ensure the file reading and multipart form construction properly includes the file binary data. Common issues:
- File not being read before form submission
- Async file reading not completing before request
- Incorrect FormData API usage

### Option 2: Make Image Fields Optional
If images aren't being uploaded, don't include the avatar/header fields in the form data at all.

### Option 3: Debug File Selection
Check if the file selection in the UI is actually capturing the files:
```javascript
// Example fix
const formData = new FormData();
const avatarFile = document.getElementById('avatar').files[0];
if (avatarFile) {
  formData.append('avatar', avatarFile); // This reads the actual file
}
```

## Testing the Fix

### Without Images (Immediate Test)
```bash
curl 'https://lesser.host/api/v1/accounts/update_credentials' \
  -X 'PATCH' \
  -H 'authorization: Bearer [TOKEN]' \
  -F 'display_name=aron' \
  -F 'note=New Lesser user' \
  -F 'locked=false' \
  -F 'bot=false' \
  -F 'discoverable=true'
```

### With Images (Proper Implementation)
```bash
curl 'https://lesser.host/api/v1/accounts/update_credentials' \
  -X 'PATCH' \
  -H 'authorization: Bearer [TOKEN]' \
  -F 'display_name=aron' \
  -F 'note=New Lesser user' \
  -F 'locked=false' \
  -F 'bot=false' \
  -F 'discoverable=true' \
  -F 'avatar=@/actual/path/to/image.jpg' \
  -F 'header=@/actual/path/to/header.jpg'
```

## Logs Reference
- Request timestamp: 2025-06-21T13:37:31.147Z
- Request ID: MhFQPiSzIAMEYJQ=
- Duration: 188.652012ms
- Status: 400
- Lambda: lesser-api-18ac9ee

## Next Steps
1. Check Greater's file upload implementation
2. Verify files are being properly read before form submission
3. Consider adding client-side validation to prevent empty file uploads
4. Add better error messages from the Lesser API to indicate empty file issues