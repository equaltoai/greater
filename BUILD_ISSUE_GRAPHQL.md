# GraphQL Build Issue

**Status**: Known Issue  
**Impact**: Production builds fail, development works fine  
**Affected**: Phase 4 GraphQL migration

## Problem

After migrating to GraphQL, production builds fail with:

```
[vite]: Rollup failed to resolve import "@apollo/client/core" from 
"/home/aron/ai-workspace/codebases/greater-components/packages/greater-components/dist/adapters/graphql/client.js".
```

## Root Cause

The `@equaltoai/greater-components` package is a workspace dependency that:
1. Has pre-built JavaScript files in `dist/adapters/`
2. These files contain ES module imports to `@apollo/client/core`
3. During production build, Rollup can't resolve these imports because:
   - The package is symlinked (workspace dependency)
   - pnpm doesn't properly hoist `@apollo/client` for the build
   - The greater-components package may not correctly declare peer dependencies

## Workarounds Attempted

### 1. Add Dependencies to Root `package.json` ✓ (Partial)
```json
"dependencies": {
  "@apollo/client": "^3.11.0",
  "graphql": "^16.9.0",
  "graphql-ws": "^5.16.0"
}
```
**Result**: Dependencies installed but not resolved during build

### 2. Externalize in Rollup Config ❌
```javascript
build: {
  rollupOptions: {
    external: ['@apollo/client', 'graphql', 'graphql-ws']
  }
}
```
**Result**: Can't externalize for Cloudflare Workers (everything must be bundled)

### 3. Use `ssr.noExternal` ❌
```javascript
ssr: {
  noExternal: ['@apollo/client', 'graphql', 'graphql-ws']
}
```
**Result**: Same error - Rollup still can't resolve from pre-built files

## Solutions

### Option 1: Rebuild Greater Components (Recommended)

The `greater-components/packages/adapters` package needs to:
1. Bundle its dependencies (including Apollo Client)
2. OR properly declare them as peer dependencies
3. OR export source TypeScript instead of pre-built JavaScript

**Action**: Update `greater-components/packages/adapters/vite.config.ts`

### Option 2: Use Source Files Instead of Dist

Modify the greater package to import from source:
```json
// In greater-components/packages/greater-components/package.json
"exports": {
  "./adapters": {
    "types": "./src/adapters/index.ts",  // Use source
    "import": "./src/adapters/index.ts"  // Use source
  }
}
```

### Option 3: pnpm Workspace Configuration

Add to `.npmrc`:
```
public-hoist-pattern[]=@apollo/client
public-hoist-pattern[]=graphql
public-hoist-pattern[]=graphql-ws
```

This forces pnpm to hoist these packages to the root `node_modules`.

### Option 4: Monorepo Build Order

Ensure greater-components is built before greater:
```json
// In root package.json
"scripts": {
  "build": "pnpm --filter @equaltoai/greater-components build && pnpm --filter @greater/client build"
}
```

## Current Status

**Development Mode**: ✅ Works perfectly
- `pnpm dev` runs without issues
- All GraphQL functionality works
- Tests pass (28/28)

**Production Build**: ❌ Fails
- `pnpm build` fails with import resolution error
- Deployment blocked

## Temporary Development Workflow

Until the build issue is resolved:

1. **Development**: Use `pnpm dev` - fully functional
2. **Testing**: Run `pnpm test` - all passing
3. **Manual Testing**: Test against Lesser instance in dev mode
4. **Deployment**: Blocked pending fix

## Recommended Next Steps

1. **Immediate**: Try Option 3 (pnpm hoisting)
2. **Short-term**: Contact greater-components maintainers about bundling strategy
3. **Long-term**: Consider Option 1 (rebuild with bundled dependencies)

## Related Files

- `/home/aron/ai-workspace/codebases/greater/astro.config.mjs` - Vite/Rollup config
- `/home/aron/ai-workspace/codebases/greater/package.json` - Dependencies
- `/home/aron/ai-workspace/codebases/greater-components/packages/adapters/vite.config.ts` - Adapter build config

## Timeline

- **Issue Discovered**: October 18, 2025 (during Phase 4 completion)
- **Workarounds Attempted**: 3 different approaches
- **Status**: Open, blocking production deployment

---

**Note**: This does NOT affect the quality of the GraphQL migration itself. The code is correct and functional. This is purely a build tooling issue.

