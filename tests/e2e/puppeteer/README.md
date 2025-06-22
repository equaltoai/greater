# Puppeteer E2E Tests for Greater/Lesser

These tests verify the integration between Greater (the frontend) and Lesser (the ActivityPub backend) using Puppeteer in headful mode to support WebAuthn authentication.

## Setup

1. **Environment Variables** (optional):
   ```bash
   export LESSER_INSTANCE=https://lesser.host
   export TEST_BASE_URL=http://localhost:4321
   ```

2. **Start the dev server**:
   ```bash
   npm run dev
   ```

3. **Run tests**:
   ```bash
   # Run all Puppeteer tests
   npm run test:puppeteer

   # Run in watch mode
   npm run test:puppeteer:watch

   # Run the basic test demo
   npx tsx tests/e2e/puppeteer/run-tests.ts
   ```

## Test Structure

- `config.ts` - Test configuration and constants
- `helpers/auth.ts` - Authentication helpers for WebAuthn/OAuth
- `timeline.test.ts` - Timeline and feed functionality tests
- `profile.test.ts` - Profile viewing and posting tests
- `run-tests.ts` - Simple demo script to verify setup

## Key Features Tested

1. **Timeline Integration**
   - Public timeline loading from Lesser
   - Authenticated home timeline
   - Status cards with author, content, timestamps
   - Infinite scroll pagination
   - Cost tracking via X-Cost-Total-Micros headers

2. **Profile Pages**
   - User profile display (@aron@lesser.host, @aron2@lesser.host)
   - Profile statistics (followers, following, posts)
   - User timeline on profile
   - Follow/unfollow functionality

3. **Posting Functionality**
   - Compose box when authenticated
   - Creating new posts
   - Post visibility options
   - Content warnings
   - Reply, boost, and favorite interactions

4. **Authentication**
   - WebAuthn support detection
   - Virtual authenticator for testing
   - OAuth fallback options
   - Mock authentication for faster testing

## WebAuthn Testing

Since WebAuthn requires user interaction, tests run in headful mode (not headless). The configuration includes:

- Virtual authenticator setup for automated testing
- Chrome flags for WebAuthn testing API
- Slower action timing to handle UI interactions

## Viewing API Interactions

All tests log API requests and responses to Lesser, including:
- Request method and URL
- Response status codes  
- Cost tracking headers (micros)

This helps verify the integration is working correctly and monitor performance.

## Troubleshooting

1. **WebAuthn not available**: Ensure Chrome is running with the correct flags
2. **Timeline not loading**: Check that Lesser instance is accessible
3. **Authentication failing**: Try using mock authentication for testing
4. **Slow tests**: Adjust `slowMo` in config.ts for faster execution

## Next Steps

- Add media upload tests
- Implement full WebAuthn flow testing
- Add performance benchmarks
- Test federation features (remote follows, etc.)