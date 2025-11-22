# Greater Components – Execution Plan

This plan captures the remaining work required to finish the Greater Components (GC) rollout in the Greater client. It builds on the v2.1.6 implementation roadmap and breaks each phase into actionable tasks with owners, dependencies, verification steps, and tracking hooks.

---

## 1. Goal & Scope

- **Goal:** Ship a GC-only UI/logic stack across timeline, compose, notifications, auth, lists, and primitives without custom GraphQL plumbing or bridge components.
- **Scope:** Frontend client at `/home/aron/ai-workspace/codebases/greater`, using GC `@equaltoai/greater-components` v2.1.6 and newer.
- **Constraints:**
  - No local GraphQL workarounds—use `createLesserGraphQLAdapter` and `createLesserClient`.
  - Preserve existing auth/token storage in `secureAuthClient`.
  - Document progress in `MIGRATION_STATUS.md` and surface upstream issues in `GC_ISSUES.md`.

---

## 2. Current State Snapshot (2025-11-22)

| Area | Status | Notes |
| --- | --- | --- |
| Phase 1 – Dependencies & CSS | ✅ Complete | Unified CSS imports + Vite deps aligned. |
| Phase 2 – GraphQL Client | ✅ Complete | `src/lib/api/graphql-client.ts` centralized; stores updated. |
| Phase 3 – Timeline/Notifications | ✅ Complete | Realtime integrations wired, action handlers implemented, tests added. |
| Phase 4 – Compose & Media | ✅ Complete | Compose handlers wired, media upload updated, sanitize utils removed. |

---

## 3. Phase Breakdown

### Phase 2 – GraphQL Client & Token Provider

**Status (2025-11-23):** ✅ Phase 2 complete.

### Phase 3 – Timeline & Notifications Integration

**Status (2025-11-24):** ✅ Phase 3 complete.

### Phase 4 – Compose & Media Experience

**Status (2025-11-24):** ✅ Phase 4 complete.
- `createGraphQLComposeHandlers` implemented in `src/lib/stores/compose.ts`.
- `Compose.DropZone` and `Compose.MediaUpload` added to all timeline and compose routes.
- `MediaUpload.svelte` removed.
- `QuotePreview.svelte` and `src/lib/utils/sanitize.ts` removed; replaced with GC `sanitizeHtml` and local `stripHtml`.
- Checked for manual clipboard usage; none found needing migration.

---

### Phase 5 – Modules & Primitives Sweep

| Area | Action Items |
| --- | --- |
| Auth | Replace `LoginForm`, `RegistrationForm`, etc., with GC Auth modules. Remove legacy Svelte files. |
| Search | Swap `SearchBar`, `SearchResults` for GC Search components. |
| Lists & Profiles | Use GC Lists/Profile modules, delete custom managers. |
| Settings | Adopt GC Settings panels, ensure `src/lib/components/index.ts` drops shim exports. |

**Process:** For each module, update routes, delete legacy Svelte files, re-run `rg` to confirm no dangling imports, document status in `COMPONENT_AUDIT.md`.

---

### Phase 6 – Cleanup, Docs, QA

1. **Docs Refresh:** Finalize `MIGRATION_STATUS.md`, `GREATER_COMPONENTS_MIGRATION.md`, `GC_ISSUES.md` with outcomes, blockers, and references to GC commits.
2. **Testing:** Run `pnpm run ci`; add Vitest coverage for timeline/notifications/composer helpers; update Playwright journeys for login → compose → timeline → notifications.
3. **Dead Code Removal:** Delete unused Nanostores/utilities, stale CSS, and any GC bridge components. Validate bundle diff via `pnpm build && npx vite-bundle-visualizer`.
4. **Release Prep:** Ensure env vars documented, capture screenshots for PR, align wrangler bindings if needed.

---

## 4. Risk & Mitigation Log

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Token refresh desync between adapter/client | Subscriptions drop or stuck auth | Shared `updateGraphQLToken`; add logging/alerts in `graphql-client.ts`. |
| Missing GC feature parity | Blocked routes/components | Continue logging in `GC_ISSUES.md` immediately; coordinate upstream patches. |
| Increased bundle size | Perf regressions | Run bundle visualizer during Phase 6; leverage GC tree-shaking (import via `$lib/gc`). |
| Test gaps | Undetected regressions | Add Vitest + Playwright checks per phase; track coverage in CI. |

---

## 5. Reporting & Tracking

- **Daily logging:** Update `MIGRATION_STATUS.md` after completing a task; cite relevant commit hashes/PRs.
- **Issue escalation:** Use `GC_ISSUES.md` for upstream blockers (include repro steps, expected vs actual).
- **Plan upkeep:** Revisit this file and `GREATER_COMPONENTS_IMPLEMENTATION_PLAN.md` at the end of each phase; mark tasks as complete/blocked with dated notes.
