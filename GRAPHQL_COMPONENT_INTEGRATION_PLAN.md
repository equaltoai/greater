# Greater GraphQL & Component Integration Plan

## Phase 1 – Prepare Workspace & Tooling
- [x] Convert to pnpm with `.npmrc` (`package-manager=pnpm@9`) and add root `pnpm-workspace.yaml` covering `.` and `../greater-components`.
- [x] Run `pnpm install` to generate `pnpm-lock.yaml` and remove `package-lock.json`.
- [x] Update scripts, docs, and automation (`deploy-action.yml`, Cloudflare flows, etc.) to use `pnpm` commands.
- [x] Ensure CI pipelines call `pnpm install --frozen-lockfile` and cache the pnpm store.
- [x] Smoke test with `pnpm lint`, `pnpm test`, and `pnpm build`; verify Husky/lint-staged via `pnpm exec`.

## Phase 2 – Introduce Component Library Dependencies
- [x] Add a workspace dependency on `@equaltoai/greater-components` and use its subpath exports (`@equaltoai/greater-components/primitives`, `/tokens`, `/icons`, `/fediverse`, `/adapters`) throughout the client.
- [x] Import shared styles (e.g., `@equaltoai/greater-components/primitives/styles.css` or `@equaltoai/greater-components/tokens/theme.css`) into the Astro entry point and align existing theming with token variables.
- [x] Create shims in `src/lib/components` that wrap library primitives to match current prop signatures.
- [x] Rely on the generated GraphQL artifacts bundled with `@equaltoai/greater-components` and remove local `@graphql-codegen/*` dependencies (no separate codegen step required).
- [x] Validate `pnpm dev` renders without regressions and note any styling or layout discrepancies.

## Phase 3 – Replace Core UI Primitives
- [ ] Swap legacy Button, Modal, TextField, Avatar, menu, and tooltip components with wrapped primitives from `@equaltoai/greater-components/primitives`.
- [ ] Update consuming islands to match new event/prop APIs and remove redundant local styles.
- [ ] Audit all Svelte islands against available Greater Components primitives and plan replacements so only thin wrappers remain where behavior deviates.
- [ ] Refresh Svelte/Vitest unit tests impacted by the replacement and confirm `pnpm test` passes.

## Phase 4 – Integrate Lesser GraphQL Adapter
- [ ] Configure Lesser GraphQL HTTP/WS endpoints and tokens in `env.example`, `wrangler.toml`, and Pulumi stack files.
- [ ] Implement `src/lib/api/graphql-client.ts` that instantiates `LesserGraphQLAdapter` from `@equaltoai/greater-components/adapters` and exposes timeline/notification stores.
- [ ] Refactor `src/lib/stores` to consume GraphQL data while keeping REST fallbacks behind feature flags.
- [ ] Replace existing WebSocket/SSE logic with adapter subscriptions for timelines, notifications, and cost metrics.
- [ ] Validate with `pnpm test`, `pnpm test:e2e`, and manual Lesser instance sessions for data parity.

## Phase 5 – Expand Feature Parity & Cleanup
- [ ] Migrate composer, lists, hashtags, moderation/admin views to `@equaltoai/greater-components/fediverse` modules and remove REST-only code paths.
- [ ] Delete superseded custom UI modules once their Greater Components equivalents are live to keep the client aligned with the shared library.
- [ ] Add integration tests using fixtures from `greater-components/packages/fediverse/src/adapters/graphql/fixtures`.
- [ ] Update `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, and onboarding docs with pnpm, GraphQL, and component usage notes.
- [ ] Run full `pnpm ci`, Playwright suite, and verify bundle sizes before enabling the new stack by default.
- [ ] Document rollback procedures and confirm deployment artifacts handle new environment variables.
