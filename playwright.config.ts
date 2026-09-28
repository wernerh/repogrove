import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "node:fs";

/**
 * Design lane's screenshot + accessibility harness (docs/design/DESIGN-SYSTEM.md,
 * docs/adr/ADR-007-design-screenshot-a11y-harness.md). Not part of `npm test`
 * (vitest) and not wired into `.github/workflows/ci.yml` — see the ADR for why this
 * stays a design-lane-run, opt-in check for now.
 *
 * Runs against the static-exported production build (`next build` → `out/`, per
 * `next.config.ts`'s `output: "export"`), served locally by
 * `scripts/design/static-server.mjs` since RepoGrove has no server runtime
 * (ADR-002/RG-2) and `next start` doesn't work with a static export.
 *
 * Uses the sandbox's pre-installed Chromium via `executablePath` rather than
 * `playwright install`, per this environment's setup notes — the bundled browser
 * revision `@playwright/test` expects may differ slightly from what's pre-installed;
 * CDP stays compatible across adjacent Chromium revisions for the plain
 * navigate/screenshot/axe-inject usage this harness does.
 */
const PORT = 4310;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Prefer a pre-installed Chromium (this sandbox's setup — see the header comment
// above) via PLAYWRIGHT_CHROMIUM_EXECUTABLE or the sandbox's known path, but only if
// it actually exists. Outside that sandbox (the owner's machine, a future CI job),
// fall back to `undefined`, which tells Playwright to resolve its own managed
// browser install (`playwright install`) the normal way — hardcoding a path that
// doesn't exist there would otherwise fail every run outright.
const SANDBOX_CHROMIUM = "/opt/pw-browsers/chromium";
const CHROMIUM_EXECUTABLE =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ??
  (existsSync(SANDBOX_CHROMIUM) ? SANDBOX_CHROMIUM : undefined);

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 },
} as const;

export default defineConfig({
  testDir: "./tests/design",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  timeout: 30_000,
  webServer: {
    command: `node scripts/design/static-server.mjs --dir out --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 15_000,
  },
  use: {
    baseURL: BASE_URL,
    launchOptions: {
      executablePath: CHROMIUM_EXECUTABLE,
    },
  },
  projects: [
    {
      name: "desktop-light",
      use: { ...devices["Desktop Chrome"], viewport: VIEWPORTS.desktop, colorScheme: "light" },
    },
    {
      name: "desktop-dark",
      use: { ...devices["Desktop Chrome"], viewport: VIEWPORTS.desktop, colorScheme: "dark" },
    },
    {
      name: "tablet-light",
      use: { ...devices["Desktop Chrome"], viewport: VIEWPORTS.tablet, colorScheme: "light" },
    },
    {
      name: "tablet-dark",
      use: { ...devices["Desktop Chrome"], viewport: VIEWPORTS.tablet, colorScheme: "dark" },
    },
    {
      name: "mobile-light",
      use: { ...devices["Desktop Chrome"], viewport: VIEWPORTS.mobile, colorScheme: "light" },
    },
    {
      name: "mobile-dark",
      use: { ...devices["Desktop Chrome"], viewport: VIEWPORTS.mobile, colorScheme: "dark" },
    },
  ],
});
