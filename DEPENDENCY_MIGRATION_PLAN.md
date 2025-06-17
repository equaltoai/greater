# Dependency Migration Plan

## Overview

This document outlines the breaking changes and migration steps required to update Greater's dependencies from Phase 1 to the latest versions.

## Major Version Updates with Breaking Changes

### 1. Astro v4 → v5

**Breaking Changes:**
- Node.js 18 minimum required (already satisfied)
- Changed default output format from `static` to `hybrid`
- Removed deprecated APIs
- Updated integration API
- Changes to content collections API

**Migration Steps:**
1. Update `astro.config.mjs` to specify output format explicitly
2. Review and update any custom integrations
3. Update content collection schemas if used
4. Test build process thoroughly

### 2. Svelte v4 → v5

**Breaking Changes:**
- Complete rewrite with new compiler architecture
- Runes API replaces stores (optional but recommended)
- Changed reactivity model
- Updated component syntax
- TypeScript improvements

**Migration Steps:**
1. Components can continue using Svelte 4 syntax initially
2. Migrate to runes API for better performance
3. Update state management patterns
4. Review and update reactive statements
5. Update TypeScript interfaces for components

### 3. TailwindCSS v3 → v4

**Breaking Changes:**
- Oxide engine by default
- Changed configuration format
- Updated plugin API
- Performance improvements
- New features require config updates

**Migration Steps:**
1. Update `tailwind.config.js` to new format
2. Review custom plugins and utilities
3. Update any deprecated class names
4. Test responsive designs thoroughly

### 4. ESLint v8 → v9

**Breaking Changes:**
- Flat config system (eslint.config.js) replaces .eslintrc
- Updated rule configurations
- Changed plugin loading mechanism
- Node.js 18.18.0+ required

**Migration Steps:**
1. Convert `.eslintrc.json` to `eslint.config.js`
2. Update plugin configurations
3. Review and update custom rules
4. Update lint scripts if needed

### 5. Vite v5 → v6

**Breaking Changes:**
- Node.js 18+ required
- Updated plugin API
- Changed default behaviors
- Removed deprecated features

**Migration Steps:**
1. Review vite configuration in `astro.config.mjs`
2. Update any custom vite plugins
3. Test hot module replacement
4. Verify build optimizations

### 6. Vitest v1 → v3

**Breaking Changes:**
- Updated configuration format
- Changed API for some utilities
- Improved TypeScript support
- New coverage reporting

**Migration Steps:**
1. Update `vitest.config.ts`
2. Review test utilities usage
3. Update coverage configuration
4. Verify all tests pass

### 7. TypeScript ESLint v6 → v8

**Breaking Changes:**
- Requires ESLint v8.57.0 or v9
- Updated rule configurations
- TypeScript 5.0+ required
- Changed parser options

**Migration Steps:**
1. Update ESLint configuration for new parser
2. Review TypeScript-specific rules
3. Update any custom lint rules
4. Test with strict type checking

### 8. Zustand v4 → v5

**Breaking Changes:**
- Removed deprecated APIs
- Updated TypeScript types
- Changed middleware API
- Performance improvements

**Migration Steps:**
1. Review store definitions
2. Update middleware usage
3. Test state persistence
4. Verify TypeScript types

### 9. Nanostores v0.9 → v1.0

**Breaking Changes:**
- API refinements
- TypeScript improvements
- Updated persistent store API

**Migration Steps:**
1. Review store implementations
2. Update persistent store configurations
3. Test cross-component reactivity

## Phase 1 Code Migration Checklist

### 1. Configuration Files
- [ ] Convert `.eslintrc.json` to `eslint.config.js` (flat config)
- [ ] Update `astro.config.mjs` for Astro v5
- [ ] Update `tailwind.config.js` for v4
- [ ] Update `vitest.config.ts` for v3
- [ ] Update `tsconfig.json` if needed

### 2. Component Updates
- [ ] Review all Svelte components for v5 compatibility
- [ ] Update store usage to Svelte 5 patterns (gradual migration)
- [ ] Update Astro components for v5 changes
- [ ] Test component interactions

### 3. State Management
- [ ] Update Zustand stores for v5
- [ ] Update Nanostores implementations
- [ ] Review persistent storage configurations
- [ ] Test state synchronization

### 4. Build & Development
- [ ] Test development server with new versions
- [ ] Verify build process works correctly
- [ ] Update CI/CD configurations
- [ ] Test Cloudflare deployment

### 5. Testing
- [ ] Update test configurations
- [ ] Fix any failing tests
- [ ] Update test utilities
- [ ] Verify coverage reporting

### 6. Linting & Formatting
- [ ] Migrate to ESLint flat config
- [ ] Update prettier plugins
- [ ] Fix any new linting errors
- [ ] Update pre-commit hooks

## Recommended Migration Approach

1. **Phase 1: Non-breaking updates**
   - Update minor versions first
   - Test thoroughly between updates
   - Fix any deprecation warnings

2. **Phase 2: Infrastructure updates**
   - ESLint v9 migration
   - Vite v6 and build tools
   - Development environment setup

3. **Phase 3: Framework updates**
   - Astro v5 migration
   - Test all routes and pages
   - Update integration configurations

4. **Phase 4: Component library updates**
   - Svelte v5 (maintain v4 syntax initially)
   - TailwindCSS v4
   - Component testing

5. **Phase 5: State and utilities**
   - Zustand v5
   - Nanostores v1
   - Testing framework updates

## Potential Issues and Solutions

### Issue 1: Svelte 5 Reactivity
**Problem:** Svelte 5's new reactivity system may break existing patterns
**Solution:** Use Svelte 4 mode initially, migrate gradually to runes

### Issue 2: ESLint Configuration
**Problem:** Flat config is significantly different from .eslintrc
**Solution:** Use migration guide and test incrementally

### Issue 3: Build Performance
**Problem:** New versions may have different performance characteristics
**Solution:** Profile builds, adjust configurations as needed

### Issue 4: Type Errors
**Problem:** Updated TypeScript definitions may reveal type issues
**Solution:** Fix type errors incrementally, use strict mode carefully

## Testing Strategy

1. Create comprehensive test suite before migration
2. Test each major update in isolation
3. Use feature branches for major updates
4. Maintain rollback capability
5. Test in staging environment before production

## Timeline Estimate

- Week 1: Setup and minor updates
- Week 2: ESLint and build tool migrations
- Week 3: Astro v5 migration and testing
- Week 4: Svelte v5 and TailwindCSS v4
- Week 5: State management and final testing
- Week 6: Production deployment preparation

## Rollback Plan

1. Keep current `package-lock.json` backed up
2. Tag current working version in git
3. Test each major update in separate branch
4. Document any configuration changes
5. Maintain ability to revert each phase