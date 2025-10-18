# Feedback for @equaltoai/greater-components Team

## Issue: CSS Files Cannot Be Imported from Primitives Package

### Summary
The `@equaltoai/greater-components` package exports configuration prevents importing CSS files from the `/primitives` subpath, blocking consumers from using the provided base styles and utilities.

### Current Behavior
**Attempting to import CSS fails:**
```css
@import "@equaltoai/greater-components/primitives/styles.css";
```

**Error:**
```
Package path ./primitives/styles.css is not exported from package 
@equaltoai/greater-components (see exports field in package.json)
```

### Root Cause
The `package.json` exports field restricts primitives to only JS/TS files:

```json
"./primitives/*": {
  "types": "./dist/primitives/*.d.ts",
  "import": "./dist/primitives/*.js"
}
```

This prevents importing the CSS files that exist in `dist/primitives/`:
- `styles.css` - Base component styles and utilities
- `style.css` - Alternative style file

### Impact

**High Priority** - Affects all consumers trying to use Greater Components' design system comprehensively:

1. **Missing Base Styles**: Consumers can't import foundational CSS for:
   - Component resets (`.gr-button`, `.gr-modal`, etc.)
   - Utility classes (`.gr-sr-only`, `.gr-visually-hidden`)
   - Focus management styles (`.gr-focus-trap`)
   - Animation utilities (`prefers-reduced-motion`)

2. **Inconsistent Pattern**: The `/tokens` export correctly allows CSS imports:
   ```json
   "./tokens/*": "./dist/tokens/*"  // ✅ Works - allows all file types
   ```
   But `/primitives` doesn't follow the same pattern.

3. **Workaround Required**: Consumers must either:
   - Skip importing the CSS (losing utilities)
   - Copy CSS into their own codebase (duplication)
   - Manually reference files via node_modules path (fragile)

### Proposed Solution

**Change the primitives export to match the tokens pattern:**

```json
{
  "exports": {
    "./primitives": {
      "types": "./dist/primitives/index.d.ts",
      "import": "./dist/primitives/index.js"
    },
    "./primitives/*": "./dist/primitives/*",  // ✅ Allow all file types
    // ... other exports
  }
}
```

This allows:
- ✅ `import { Button } from '@equaltoai/greater-components/primitives'` (JS)
- ✅ `@import '@equaltoai/greater-components/primitives/styles.css'` (CSS)
- ✅ Direct component imports remain unchanged

### Alternative Solutions

If there's a reason to restrict file types, consider:

1. **Explicit CSS exports:**
   ```json
   "./primitives/styles.css": "./dist/primitives/styles.css",
   "./primitives/style.css": "./dist/primitives/style.css"
   ```

2. **Separate CSS export path:**
   ```json
   "./primitives/styles": "./dist/primitives/styles.css"
   ```

### Additional Context

**From Greater client integration (Phase 2):**
- Successfully imported `@equaltoai/greater-components/tokens/theme.css` ✅
- Blocked on `@equaltoai/greater-components/primitives/styles.css` ❌
- Components work via JS imports, but missing global utilities
- Build succeeds with CSS import commented out

**Files affected in greater-components:**
- `packages/greater-components/package.json` - Needs export update
- `dist/primitives/styles.css` - Exists but not importable
- `dist/primitives/style.css` - Also not importable

### Testing

After making the change, verify:
```bash
# In a consumer project
@import "@equaltoai/greater-components/primitives/styles.css";
@import "@equaltoai/greater-components/primitives/style.css";
```

Both should resolve without errors.

### Benefits

1. **Consistent API**: Primitives exports match tokens exports
2. **Complete Design System**: Consumers get full access to styles and utilities
3. **Better DX**: No workarounds needed, clear documentation path
4. **Flexibility**: Consumers choose which CSS to import (if any)

---

## Additional Nice-to-Haves

While reviewing the package, here are some other suggestions:

### 1. Fediverse CSS Export
Similar issue exists for fediverse styles:
```json
"./fediverse/*": "./dist/fediverse/*"  // Allow fediverse/style.css
```

### 2. Package Documentation
Consider documenting the import patterns:
```typescript
// JS/TS imports
import { Button } from '@equaltoai/greater-components/primitives';

// CSS imports
@import '@equaltoai/greater-components/tokens/theme.css';
@import '@equaltoai/greater-components/primitives/styles.css';
@import '@equaltoai/greater-components/fediverse/style.css';
```

### 3. TypeScript Path Mapping Example
For better IDE support in consumer projects:
```json
{
  "compilerOptions": {
    "paths": {
      "@equaltoai/greater-components/*": ["node_modules/@equaltoai/greater-components/dist/*"]
    }
  }
}
```

---

## Questions?

If you need any clarification or have concerns about this change, happy to discuss:
- Security implications?
- Breaking change considerations?
- Alternative approaches?

**Contact**: Greater client integration team
**Status**: Phase 2 complete, ready for Phase 3 once CSS imports are available

