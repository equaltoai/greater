# Greater Components Implementation Plan (v2.1.6)

This plan scopes the remaining work to finish the migration to `@equaltoai/greater-components` 2.x. Execute the phases sequentially; each phase lists concrete tasks, owners, exit criteria, and references. Keep `/home/aron/ai-workspace/codebases/greater-components` open while working to validate props/behaviour against upstream docs and the Playground.

---

## Prerequisites (Blocking)

| Item | Details | Owner | Status |
| --- | --- | --- | --- |
| ✅ Update pnpm to v10+ | `packageManager` already points to `pnpm@10.18.3`; ensure local CLI matches | DevEnv | ✅ |
| ⬜ Sync deps | `pnpm install` after editing imports so lockfile reflects the single umbrella package | Dev | ⬜ |
| ⬜ Local GC docs | Keep `greater-components` repo checked out for API references (`apps/docs`, `docs/api-reference.md`) | Dev | ⬜ |

---

## Phase 1 – Dependency & CSS Alignment

**Goal:** Stabilize the 2.x dependency footprint and import the unified CSS bundles exactly once.

**Tasks**
1. **Swap dashed package imports**  
   - Replace `@equaltoai/greater-components-{primitives,icons,...}` with the umbrella subpaths (e.g. `@equaltoai/greater-components/primitives`).  
   - Touch `src/lib/gc.ts`, `src/routes/auth/login/+page.svelte`, and any other file flagged by `rg -n "@equaltoai/greater-components-"`.
2. **Update CSS imports**  
   - In `src/routes/+layout.svelte`, import `@equaltoai/greater-components/tokens/theme.css`, `.../primitives/theme.css`, and `.../fediverse/theme.css` (drop the `app.css` duplication).  
   - Remove GC CSS imports from `src/app.css` once layout handles them.
3. **Adjust Vite config**  
   - Expand `optimizeDeps.include` to cover `@equaltoai/greater-components/{tokens,icons,utils}` and any Shiki/marked deps if they warn during dev.  
   - Keep `ssr.noExternal` set to `['@equaltoai/greater-components']`.
4. **Reinstall deps / lint**  
   - `pnpm install` then `pnpm run lint` to ensure types/modules resolve.

**Exit Criteria**
- No dashed package imports remain.
- Theme CSS loads once (verify via browser DevTools).
- `pnpm run dev` launches without Vite optimize warnings.

---

## Phase 2 – GraphQL Client & Token Provider

**Goal:** Adopt the official Lesser client so GC components can share auth, retry, and subscription logic.

**Tasks**
1. **Introduce `createLesserClient`**  
   - Rewrite `src/lib/api/graphql-client.ts` to use `createLesserClient` from `@equaltoai/greater-components/fediverse`.  
   - Keep the existing token/instance state, but expose `getToken`/`setToken` functions to hand to the client.
2. **Centralize token getter**  
   - Export an async `getCurrentToken()` that GC components (Compose, Timeline, Notifications) can call without duplicating `secureAuthClient` lookups.
3. **Add connection lifecycle helpers**  
   - Ensure the new client handles `enableSubscriptions`, retry limits, and cleanup via `onDestroy`.
4. **Smoke test**  
   - `pnpm run dev` and confirm timelines still fetch and subscriptions reconnect after a token refresh.

**Exit Criteria**
- No usage of `createLesserGraphQLAdapter` remains.
- Single source of truth for auth tokens.
- Timeline/notification API calls continue to succeed.

---

## Phase 3 – Timeline & Notifications Integration

**Goal:** Replace bespoke Nanostore plumbing with GC’s real-time stores and components.

**Tasks**
1. **Timeline store rewrite**  
   - Replace `src/lib/stores/timeline.svelte.ts` with `createLesserTimelineStore` + `createTimelineIntegration`.  
   - Remove manual GraphQL mappers (`mapGraphQLToStatus`, etc.) in favor of GC’s typed results.  
   - Preserve local conveniences (e.g., `gaps`, `refreshTimeline`) by wrapping the GC store where necessary.
2. **Home/Local/Federated routes**  
   - Update `src/routes/{+,home,local,federated}/+page.svelte` to pass the new integration object to `TimelineVirtualizedReactive`.  
   - Wire `StatusActionHandlers` to real adapter mutations (boost/favorite/reply/bookmark).
3. **Notifications**  
   - Swap `src/lib/stores/notifications.ts` for the GC notifications integration, then update `src/routes/Notifications.svelte` to remove the custom `notificationIntegration` builder.
4. **Error/loading states**  
   - Leverage GC’s built-in status props (`isLoading`, `errorText`) rather than custom placeholders.

**Exit Criteria**
- No manual GraphQL-to-Mastodon mappers for statuses/notifications.
- Timeline and notifications auto-refresh via the GC stores.
- Action handlers call real adapter methods (verified via console/builder logs).

---

## Phase 4 – Compose & Media Experience

**Goal:** Adopt the Compose compound components end-to-end, including media upload, DropZone, Markdown, and Copy utilities.

**Tasks**
1. **Compose handlers**  
   - Move the TODO logic in `src/routes/+page.svelte` and `src/routes/Compose.svelte` to real `adapter.createStatus` calls. Use the centralized token getter and bubble success/failure states to the UI.
2. **Media upload replacement**  
   - Delete `src/lib/components/islands/svelte/MediaUpload.svelte` + `compose` Nanostores once `Compose.MediaUpload` + GC `DropZone` cover the feature set.  
   - Ensure the upload pathway supports spoiler text, sensitivity, and multiple attachments through GC props.
3. **Quote & Markdown rendering**  
   - Replace `QuotePreview.svelte`’s manual fetch/sanitization with `Status.Quote` or compose `StatusCard` snippets.  
   - Use `MarkdownRenderer` wherever we render user-generated markdown to inherit DOMPurify + marked.
4. **Clipboard helpers**  
   - Swap any ad-hoc copy buttons with GC’s `CopyButton` (especially in share dialogs).

**Exit Criteria**
- Compose flow posts successfully without `window.location.reload`.
- Media upload UI uses GC components only.
- No direct DOMPurify or clipboard helpers remain outside GC utilities.

---

## Phase 5 – Modules & Primitives Sweep

**Goal:** Remove remaining custom components that have 1:1 GC module replacements.

**Targets**
- Auth: `src/lib/components/islands/svelte/LoginForm*.svelte`, `RegistrationForm.svelte` → `Auth.LoginForm`, `Auth.Register`.
- Search: `SearchBar.svelte`, `SearchResults.svelte` → `Search.Bar`, `Search.Results`.
- Lists & Profiles: `ListManager.svelte`, `ListEditor.svelte`, `UserProfile.svelte`, `ProfileSettings.svelte` → `Lists.*`, `Profile.*`.
- Settings: `PreferencesSettings.svelte`, `NotificationSettings.svelte` → `SettingsPanel` + GC snippets.
- Primitives: Ensure shims in `src/lib/components/index.ts` are removed once all consumers import from `$lib/gc`.

**Process**
1. Replace components route-by-route, leveraging GC snippets to inject Greater-specific chrome.
2. Delete the old Svelte files once each replacement ships; run `rg` to ensure no lingering imports.
3. Update `COMPONENT_AUDIT.md` statuses to “Replaced” with PR links or commit hashes.

**Exit Criteria**
- No remaining TODOs referencing “GC bridge components”.
- Every custom component listed above is removed or reduced to a thin wrapper over GC modules.

---

## Phase 6 – Cleanup, Docs, and QA

**Goal:** Finalize the migration, update documentation, and ensure automated coverage matches the new flows.

**Tasks**
1. **Docs refresh**  
   - Update `MIGRATION_STATUS.md`, `GREATER_COMPONENTS_MIGRATION.md`, and `GC_ISSUES.md` with v2.1.6 details, real blockers, and resolved questions.  
   - Document the new token provider + store usage in `docs/` if needed.
2. **Testing**  
   - Add Vitest coverage for the new handler utilities (timeline, compose, notifications).  
   - Record Playwright journeys for login → compose → timeline interaction → notifications, ensuring no `GC` regressions.  
   - Run `pnpm run ci` before merging.
3. **Dead code removal**  
   - Delete unused Nanostores, helper utilities, and CSS tied to removed components.  
   - Verify bundle diff via `pnpm build && npx vite-bundle-visualizer`.

**Exit Criteria**
- Docs reflect the completed migration.  
- CI (lint, typecheck, unit, e2e) passes solely using GC components.  
- No obsolete GC bridge files remain in the repo.

---

## Tracking & Reporting

- Maintain progress in `MIGRATION_STATUS.md` and link PRs/issues.  
- Escalate missing GC features upstream via `GC_ISSUES.md` with reproduction steps.  
- Keep this plan updated after each phase so future contributors can resume without context loss.
