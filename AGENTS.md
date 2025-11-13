# Repository Guidelines

## Project Structure & Module Organization
Client logic lives in `src/`—`pages/` for Astro routes, `components/` for Svelte islands, `lib/` for stores and helpers, `types/` for shared contracts. Styles reside in `styles/` and `app.css`; static assets belong in `public/`. Edge handlers are in `functions/`, deployment automation lives in `scripts/`. Tests live in `tests/unit`, `tests/e2e`, and `tests/e2e/puppeteer` with shared setup in `tests/setup.ts`.

## Build, Test, and Development Commands
- `npm run dev` serves Astro on port 4321; prefer `npm run dev:cf` when validating Cloudflare bindings.
- `npm run build` emits `dist/`; pair with `npm run preview` for a production smoke test.
- `npm run lint`, `npm run format:check`, and `npm run typecheck` guard style, formatting, and types; `npm run ci` bundles them.
- `npm run test`, `npm run test:coverage`, and `npm run test:e2e` cover unit, coverage, and Playwright suites; `npm run test:puppeteer` keeps legacy journeys green.

## Coding Style & Naming Conventions
Prettier (via `npm run format` or lint-staged) enforces two-space indentation, semicolons, and Tailwind ordering across `.astro`, `.svelte`, and `.ts`. Favor TypeScript with explicit returns, park shared logic in `src/lib`, and name Svelte components in PascalCase (`TimelineFeed.svelte`). Mirror features with `<feature>.test.ts`, and ensure `npm run lint:fix` clears all warnings.

## Testing Guidelines
Vitest covers unit and integration paths; place new specs in `tests/unit` and reuse mocks from `tests/setup.ts`. Keep statement and branch coverage above 80% using `npm run test:coverage`. Playwright flows live in `tests/e2e`; strip `.only` before pushing and guard lengthy journeys with feature flags. Touching edge/auth code should also refresh the puppeteer checks in `tests/e2e/puppeteer`.

## Commit & Pull Request Guidelines
Use Conventional Commits (`feat(auth): add token refresh`) with present-tense summaries under ~70 chars. Branch from `develop`, reserve `main` for hotfixes, and keep each PR scoped. Run `npm run ci` pre-push, link issues, and attach screenshots or recordings for UI deltas. Call out new env vars or rollout steps in the PR body, and default to squash merges unless coordinating multi-stage migrations.

## Security & Configuration Tips
Duplicate `env.example` to `.env` and supply Mastodon and Cloudflare credentials locally; never commit secrets. Keep `wrangler.toml` in sync with any environment variable changes used during deployment. Route outbound HTTP through the helpers in `src/lib/api` so Sentry instrumentation and sanitization remain consistent with existing expectations.

## Cross-Repo Coordination
The Greater client, `greater-components`, and Lesser backend evolve in lockstep. When tooling or schema gaps appear, escalate by updating `greater-components` and/or Lesser instead of adding local workarounds. Prefer filing or contributing upstream changes (e.g., new GraphQL fields, adapter helpers) so behaviour stays consistent across all apps.
