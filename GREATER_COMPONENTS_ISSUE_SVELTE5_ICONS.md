# Greater Components Issue: Icons Not Compatible with Svelte 5 Runes Mode

## Summary
All icon components in `@equaltoai/greater-components` are using `$$props` which is not compatible with Svelte 5 runes mode, causing build failures when `runes: true` is enabled.

## Environment
- **Greater Components Version**: 1.0.26
- **Svelte Version**: 5.43.6
- **Build Tool**: Vite 7.2.2 / SvelteKit 2.48.4
- **Configuration**: `runes: true` in `svelte.config.js`

## Error Messages
```
Cannot use $$props in runes mode

Examples:
- node_modules/@equaltoai/greater-components/dist/icons/src/icons/wifi-low.svelte
- node_modules/@equaltoai/greater-components/dist/icons/src/icons/wifi-off.svelte
- node_modules/@equaltoai/greater-components/dist/icons/src/icons/x.svelte
- node_modules/@equaltoai/greater-components/dist/icons/src/icons/globe.svelte
- ... (all 120+ icon components affected)
```

## Root Cause
Icon components are using Svelte 4 syntax with `$$props` for prop spreading:

```svelte
<!-- Current (Svelte 4 style) -->
<script>
  export let size = 24;
  export let color = 'currentColor';
  export let strokeWidth = 2;
  // other props
</script>

<svg {...$$props}>
  <!-- icon paths -->
</svg>
```

In Svelte 5 runes mode, `$$props` is deprecated and must be replaced with the `$props()` rune.

## Required Fix
All icon components need to be migrated to Svelte 5 runes syntax:

```svelte
<!-- Fixed (Svelte 5 runes style) -->
<script lang="ts">
  let { 
    size = 24, 
    color = 'currentColor', 
    strokeWidth = 2,
    class: className,
    ...rest 
  } = $props();
</script>

<svg 
  width={size} 
  height={size} 
  stroke={color}
  stroke-width={strokeWidth}
  class={className}
  {...rest}
>
  <!-- icon paths -->
</svg>
```

### Key Changes Required:
1. Replace `export let` with `let { ... } = $props()`
2. Explicitly destructure props with defaults
3. Replace `$$props` spreading with explicit `{...rest}` spreading
4. Handle special props like `class` (rename to avoid reserved word collision)
5. Add `lang="ts"` to script tags for proper typing

## Affected Components
- **All icons** in `dist/icons/src/icons/*.svelte` (~120+ files)
- Examples include:
  - globe.svelte
  - lock.svelte
  - mail.svelte
  - users.svelte
  - x.svelte
  - wifi-*.svelte
  - zap-*.svelte
  - zoom-*.svelte
  - (complete list via: `find node_modules/@equaltoai/greater-components/dist/icons/src/icons -name "*.svelte"`)

## Impact
- **Severity**: Critical - blocks adoption in Svelte 5 runes projects
- **Scope**: All Greater Components icons
- **Workaround**: None - cannot disable runes mode globally without breaking other Svelte 5 features
- **Affects**: Greater app and any other project using Greater Components with Svelte 5

## Reproduction Steps
1. Create a SvelteKit project with `runes: true` in `svelte.config.js`
2. Install `@equaltoai/greater-components@1.0.26`
3. Import any icon: `import Globe from '@equaltoai/greater-components/icons/globe'`
4. Run `pnpm dev` or `pnpm build`
5. Observe compilation errors: `Cannot use $$props in runes mode`

## Proposed Solution
Create a script or manual migration to update all icon components:

### Option 1: Automated Migration Script
```bash
# Find all icon files and apply transformation
find src/icons -name "*.svelte" -exec sed -i 's/export let \(.*\) = \(.*\);/let { \1 = \2, ...rest } = $props();/g' {} \;
```

### Option 2: Manual Template
Create a standard template for all icons:

```svelte
<script lang="ts">
  import type { SVGAttributes } from 'svelte/elements';

  interface Props extends SVGAttributes<SVGSVGElement> {
    size?: number | string;
    color?: string;
    strokeWidth?: number | string;
    class?: string;
  }

  let { 
    size = 24, 
    color = 'currentColor', 
    strokeWidth = 2,
    class: className,
    ...rest 
  }: Props = $props();
</script>

<svg 
  xmlns="http://www.w3.org/2000/svg"
  width={size} 
  height={size} 
  viewBox="0 0 24 24"
  fill="none"
  stroke={color}
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  class={className}
  {...rest}
>
  <!-- icon-specific paths -->
</svg>
```

## Testing Checklist
After fixing:
- [ ] All icons compile without errors in runes mode
- [ ] Props (size, color, strokeWidth) work correctly
- [ ] Class attribute applies properly
- [ ] Rest props spread correctly to SVG element
- [ ] TypeScript types are correct
- [ ] No regression in non-runes mode projects (if backward compatibility needed)

## Priority
**Critical** - This blocks Greater Components from being used in any Svelte 5 project with runes enabled, which is the default for new Svelte 5 projects and the recommended configuration going forward.

## Related
- Svelte 5 Migration Guide: https://svelte.dev/docs/svelte/v5-migration-guide
- Runes documentation: https://svelte.dev/docs/svelte/$props
- This affects Greater app migration from Astro to SvelteKit
