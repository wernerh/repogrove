import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { Result } from "axe-core";
import { mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Design lane's screenshot + accessibility harness. See playwright.config.ts and
 * docs/adr/ADR-007-design-screenshot-a11y-harness.md.
 *
 * One route per page family that exists today (Phase 1 walking skeleton, #7) —
 * extend ROUTES as new pages land. Each route runs once per project (defined in
 * playwright.config.ts: desktop/tablet/mobile × light/dark), producing:
 *   - a full-page screenshot under docs/design/screenshots/ (small, synthetic
 *     example-content pages only — see CLAUDE.md rule 1 and this lane's brief:
 *     "commit only small synthetic-data screenshots")
 *   - an axe-core WCAG 2.1 A/AA scan, asserted to have zero violations
 *
 * A failure here is a real regression to fix (or a documented, dated exception),
 * never something to skip or loosen the tag list to get green (CLAUDE.md rule 7).
 */
const ROUTES: { path: string; name: string }[] = [
  { path: "/", name: "home" },
  { path: "/grove/ai", name: "grove-ai" },
  { path: "/repo/ollama", name: "repo-ollama" },
];

const SCREENSHOT_DIR = path.join(process.cwd(), "docs/design/screenshots");

test.beforeAll(async () => {
  await mkdir(SCREENSHOT_DIR, { recursive: true });
});

for (const route of ROUTES) {
  test(`${route.name} — screenshot + a11y scan`, async ({ page }, testInfo) => {
    const response = await page.goto(route.path);
    // Guards against a false-green run: if the static server 404s (stale/missing
    // `out/`, wrong route, etc.), axe-core would find ~0 violations on an empty error
    // page and this suite would "pass" without testing anything real. Every real
    // RepoGrove page renders the site header (`src/app/layout.tsx`), so require both
    // a real 2xx response and that header to be present before scoring accessibility.
    expect(response?.ok(), `expected a 2xx response for ${route.path}`).toBe(true);
    await expect(page.getByRole("link", { name: /RepoGrove/ })).toBeVisible();
    await page.waitForLoadState("networkidle");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, `${route.name}__${testInfo.project.name}.png`),
      fullPage: true,
    });

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      results.violations,
      formatViolations(route.path, testInfo.project.name, results.violations),
    ).toEqual([]);
  });
}

function formatViolations(routePath: string, projectName: string, violations: Result[]): string {
  if (violations.length === 0) return "";
  const lines = violations.map(
    (v) =>
      `  [${v.impact ?? "unknown"}] ${v.id}: ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? "" : "s"})`,
  );
  return `axe-core found ${violations.length} violation(s) on ${routePath} (${projectName}):\n${lines.join("\n")}`;
}
