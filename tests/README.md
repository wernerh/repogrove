# /tests

Automated tests for the app in `/src`. Run with `npm test` (Vitest, jsdom environment —
see `vitest.config.ts`). Tests are proportional to risk (per `CLAUDE.md` principles):

- `lib/content.test.ts` — unit tests for the `/content` loader (`src/lib/content.ts`):
  parses the real `content/groves/*.md` and `content/repos/*.md` fixtures, and separately
  unit-tests the malformed-frontmatter paths (missing field, invalid `status`, duplicate
  `github` value) against crafted data so a bad content PR fails the build with a clear
  error instead of shipping.
- `app/home.test.tsx`, `app/grove-page.test.tsx`, `app/repo-page.test.tsx` — render smoke
  tests for the three Phase 1 pages. Each asserts against real fixture values (not just
  "renders without crashing") so a change that accidentally hardcodes a string in place
  of real content data would fail the test.

Ingestion (Phase 2) will add tests around snapshot idempotency and GitHub API
rate-limit handling once that job exists.
