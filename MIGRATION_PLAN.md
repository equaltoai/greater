# Greater SPA Migration Plan

Target state: a plain Vite + Svelte 5 single-page application, styled via Greater Components (no Tailwind), served as static assets (e.g., S3 + CloudFront). Astro, Cloudflare workers, and serverless functions are removed entirely.

---

## 1. Repository Reset
1. Remove Astro-specific files: `astro.config*.mjs`, all `.astro` components/layouts/pages, and any references in docs/scripts.
2. Delete Cloudflare-specific artifacts: `functions/`, `wrangler.toml`, deployment scripts pointing to Workers/Pages, CF-specific env docs.
3. Update `package.json` scripts to drop `astro`, `wrangler`, `functions` commands.

## 2. Tooling & Base App
1. Scaffold a Vite + Svelte 5 project (no Tailwind) in-place:
   - `npm create vite@latest` equivalent or manual `vite.config.ts`, `svelte.config.js`, `tsconfig.json`.
   - Use `@sveltejs/vite-plugin-svelte` + `vite` latest major.
2. Move shared assets (`public/`, `src/styles`) to match Vite expectations.
3. Update ESLint/Prettier configs to drop Astro plugins and align with Svelte/Vite.

## 3. Routing & Layout
1. Adopt a client-side router (e.g., `@sveltejs/router`, `svelte-spa-router`, or custom) to replace `src/pages/*.astro` routes.
2. Convert former Astro layouts (BaseLayout, TimelineLayout, SettingsLayout, etc.) into Svelte components used by routes.
3. Recreate meta tags/OpenGraph logic using Vite’s `index.html` + per-route Svelte head management (e.g., `svelte-meta-tags` or manual `<svelte:head>` blocks).

## 4. Component Migration
1. Move every Svelte island under `src/components/islands/svelte/` into a regular component hierarchy (`src/routes`, `src/lib/components`, etc.).
2. Convert any remaining Astro-only components (`src/components/core/*.astro`, lazy loaders, etc.) into Svelte components.
3. Ensure Greater Components shims (`src/lib/components/index.ts`) remain usable; update imports if path aliases change.

## 5. State & Stores
1. Keep existing Svelte store modules (`src/lib/stores/*.ts`) with minimal changes—ensure they initialize in CSR context only.
2. Replace any Astro runtime references (`Astro.locals`, `Astro.cookies`) with browser APIs or new client-side helpers.
3. Remove server-dependent helpers (`src/lib/server/*`), replacing KV usage with localStorage/indexedDB or direct API calls.

## 6. Authentication Refactor
1. Delete `/auth/*` API routes and the Cloudflare KV-based token storage model.
2. Rework `secureAuthClient` and `authStore` to persist tokens locally (e.g., encrypted localStorage) or via a lightweight browser-only vault.
3. Update OAuth flow:
   - Register apps and exchange tokens directly from the browser (as today) but store results locally.
   - Remove fetches to `/auth/register-app`, `/auth/store-token`, `/auth/get-token`, `/auth/revoke-token`, `/auth/check-session`.
4. Audit all call sites (compose, notifications, GraphQL adapter) to ensure they pull tokens from the new storage path.

## 7. API & GraphQL Hooks
1. Confirm `src/lib/api/graphql-client.ts` and REST clients work in a pure CSR context (handle CORS, credentials, etc.).
2. Drop any reliance on `Astro.locals.runtime`, Cloudflare bindings, or server-specific environment detection.
3. If needed, introduce a lightweight proxy or environment config for local dev vs. production endpoints.

## 8. Styling & Theming
1. Remove Tailwind (`@tailwindcss/vite`, `tailwindcss` imports, `@theme` blocks). Clean up `src/app.css` to rely solely on Greater Components tokens + custom CSS.
2. Ensure global styles import `@equaltoai/greater-components/tokens/theme.css` and any primitive styles.
3. Replace Tailwind utility classes in components with Equivalent utility CSS classes or GC primitives (audit ComposeBox, Header, etc.).

## 9. Routing-Specific Pages
1. Rebuild major routes as Svelte components:
   - `/home`, `/local`, `/federated`
   - `/settings/*`, `/tags/:tag`, `/status/:id`, `/lists/:id`, `/@handle/*`
   - `/auth/login`, `/auth/callback`
2. Implement guards (AuthGuard, OfflineIndicator) within Svelte router logic.
3. Handle redirects client-side (e.g., if not authenticated, push to `/auth/login`).

## 10. Build & Deployment
1. Update `package.json` scripts: `dev` (Vite), `build` (Vite build), `preview` (Vite preview), `lint`, `test`.
2. Remove `wrangler` references; replace deploy scripts with instructions for uploading `dist/` to S3/CloudFront (sync or CI pipeline).
3. Ensure environment variables (API base URLs, feature flags) use Vite’s `import.meta.env.VITE_*`.

## 11. Testing & QA
1. Adjust vitest config to drop Astro plugin usage; ensure unit tests import from the new component paths.
2. Update Playwright/e2e setup to point at the SPA dev server.
3. Re-run lint/test suites to validate the new stack; address any TypeScript fallout from removed types (Astro types, etc.).

## 12. Documentation & Cleanup
1. Rewrite README, CONTRIBUTING, AGENTS, and deployment guides to describe the SPA stack and S3/CloudFront deployment pattern.
2. Remove references to Cloudflare, Workers, Astro-specific CLI commands.
3. Document the new authentication/token storage strategy and any security implications.

---

### Notes & Open Questions
- Decide on the client-side router (native, svelte-spa-router, Routify, etc.) before porting pages.
- Determine the local token storage strategy (plain localStorage, IndexedDB, WebCrypto-encrypted blob, etc.).
- Evaluate whether any Cloudflare-specific features (KV fallbacks, runtime env) need replacements (e.g., data caching).
- Confirm that Lesser/Greater APIs allow browser-origin requests without Worker mediation (CORS, rate limits).
