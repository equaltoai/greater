# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Greater is a high-performance web client for Mastodon-compatible instances built with Astro, Svelte, and Cloudflare edge infrastructure. It emphasizes speed, privacy, and accessibility.

## Essential Commands

### Development
```bash
# Start development server
npm run dev

# Run tests
npm run test          # All tests
npm run test:unit     # Unit tests only
npm run test:e2e      # E2E tests only

# Code quality
npm run lint          # ESLint
npm run format        # Prettier
npm run typecheck     # TypeScript check

# Build and deploy
npm run build         # Production build
npm run preview       # Preview production build
npm run deploy        # Deploy to Cloudflare
```

## Architecture Overview

### Technology Stack
- **Framework**: Astro 5.9.4 (SSG/SSR)
- **Interactive UI**: Svelte 5.34.3 (islands architecture)
- **Styling**: Tailwind CSS v4
- **State**: Zustand (global), Nanostores (component)
- **Edge**: Cloudflare Pages/Workers

### Key Directories
- `src/components/core/` - Static Astro components
- `src/components/islands/` - Interactive Svelte components
- `src/lib/api/` - Mastodon API client implementation
- `src/lib/stores/` - State management (auth, timeline, preferences)
- `src/pages/` - File-based routing

### Critical Implementation Patterns

1. **Component Architecture**: Use Astro for static content, Svelte only for interactive islands
2. **API Calls**: All Mastodon API interactions go through `src/lib/api/client.ts`
3. **Authentication**: OAuth 2.0 with PKCE, tokens stored in `authStore`
4. **State Management**: 
   - Global state in Zustand stores (`src/lib/stores/`)
   - Component state with Nanostores
5. **Error Handling**: Use `handleError` utility from `src/lib/utils/error.ts`

### Performance Requirements
- Lighthouse score must be 95+
- Initial bundle < 100KB
- Time to Interactive < 1s
- All images must use blurhash placeholders

### Testing Strategy
- Unit tests for all utilities and API methods
- Integration tests for store interactions
- E2E tests for critical user flows
- Coverage: 80% minimum, 100% for auth/api code

## Development Guidelines

### When Adding Features
1. Check if similar components exist in `src/components/`
2. Follow existing patterns for API integration
3. Add TypeScript types to `src/types/`
4. Include tests for new functionality
5. Update relevant documentation

### Before Committing
1. Run `npm run lint` and fix issues
2. Run `npm run typecheck` to ensure type safety
3. Run `npm run test` to verify tests pass
4. Check bundle size impact with `npm run build`

### Cloudflare Integration
- Workers handle API proxying and edge logic
- KV stores sessions and cache
- Use `wrangler` CLI for local Cloudflare development
- Environment variables in `.env` for local, `wrangler.toml` for production

## Current Development Status

**Implemented**: OAuth auth, timelines, profiles, posting, media uploads, notifications, search

**In Progress**: Real-time updates, multiple accounts, offline support

**Architecture Decisions**:
- Edge-first for global performance
- Islands architecture for optimal loading
- Privacy by default (no analytics without consent)
- Progressive enhancement approach

## API Integration

Greater is designed to work with Lesser, a 100% Mastodon-compatible API with enhanced features:

### Lesser API Overview
- **REST API**: Full Mastodon v1 compatibility 
- **GraphQL API**: Modern alternative (note: GraphQL docs not yet available)
- **WebSocket**: Real-time streaming support
- **OAuth 2.0**: Complete implementation with PKCE
- **Base URL**: `https://your-instance.example.com`

### Key API Patterns
1. **Authentication**: Bearer token in Authorization header
2. **Rate Limiting**: 300 req/5min (auth), 100 req/5min (unauth)
3. **Cost Tracking**: Every response includes `X-Cost-Total-Micros` header
4. **Error Handling**: Standard Mastodon error responses

### Lesser Enhancements
Beyond standard Mastodon API, Lesser adds:
- **Trust Indicators**: User trust scores and badges
- **Cost Transparency**: Per-operation cost tracking
- **AI Features**: Semantic search, content analysis
- **Community Notes**: Crowd-sourced fact-checking
- **Advanced Moderation**: Consensus-based decisions

### Important Endpoints
- **Timelines**: `/api/v1/timelines/home`, `/api/v1/timelines/public`
- **Statuses**: `/api/v1/statuses` (create), `/api/v1/statuses/:id` (read)
- **Accounts**: `/api/v1/accounts/:id`, `/api/v1/accounts/update_credentials`
- **Search**: `/api/v2/search` with semantic search support
- **Streaming**: `wss://instance.com/api/v1/streaming`

For complete API documentation, see `lesser-api.md` in this repository.

## Known Issues

### Profile Image Upload (Avatar/Header)
**Issue**: Empty file content when uploading images via `/api/v1/accounts/update_credentials`
**Symptoms**: 400 Bad Request when including avatar/header in profile updates
**Root Cause**: File binary data not being properly included in multipart form data
**Workaround**: 
1. Ensure files are fully read before form submission
2. Omit image fields if not uploading
3. Verify FormData properly includes file content:
```javascript
const formData = new FormData();
const avatarFile = document.getElementById('avatar').files[0];
if (avatarFile) {
  formData.append('avatar', avatarFile); // Must include actual file, not just metadata
}
```
See `greater-image-upload-issue.md` for full details.

## Lesser Backend Context

Greater is designed to work with Lesser, a revolutionary serverless ActivityPub server:

### Lesser Key Features
- **100% Mastodon API compatible** - All v1 endpoints implemented
- **Serverless architecture** - AWS Lambda + DynamoDB
- **Cost-efficient** - $1-10/month for hundreds of users
- **AI-powered features** - Semantic search via AWS Bedrock
- **Real-time cost tracking** - Every API call returns cost data
- **Built in 5 days** - Using AI assistance (Cursor/Claude)

### Important Implementation Notes
1. **Cost Headers**: All API responses include `X-Cost-Total-Micros`
2. **AI Features**: Semantic search available via `semantic=true` param
3. **GraphQL Alternative**: Available at `/graphql` endpoint
4. **WebSocket Streaming**: Real-time updates at `wss://instance.com/api/v1/streaming`
5. **Trust System**: Community-driven moderation with trust scores

See `lesser-readme.md` for full Lesser documentation.