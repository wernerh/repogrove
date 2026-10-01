import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { Result } from "axe-core";
import { mkdir } from "node:fs/promises";
import path from "node:path";

/**
 * Design lane's screenshot + accessibility harness. See playwright.config.ts and
 * docs/adr/ADR-007-design-screenshot-a11y-harness.md.
 *
 * One route per page family that exists today — extend ROUTES as new pages land.
 * Each route runs once per project (defined in playwright.config.ts:
 * desktop/tablet/mobile × light/dark), producing:
 *   - a full-page screenshot under docs/design/screenshots/ (small, synthetic
 *     example-content pages only — see CLAUDE.md rule 1 and this lane's brief:
 *     "commit only small synthetic-data screenshots")
 *   - an axe-core WCAG 2.1 A/AA scan, asserted to have zero violations
 *
 * A failure here is a real regression to fix (or a documented, dated exception),
 * never something to skip or loosen the tag list to get green (CLAUDE.md rule 7).
 *
 * Extended design run 13 (2026-09-30) to add every route Phase 2/3 shipped since
 * this file was last touched (design run 9, RankedList extraction) but that never
 * got its own entry here: /trending and /rising (#19/#20, share RankedList/
 * RankingRow — one of each is enough to catch a shared-component regression),
 * /alternative/notion (#61, AlternativesTable's sibling single-column pattern),
 * /compare/ollama/vllm (#62, the at-a-glance comparison table), and /search (#63,
 * SearchBox — a Client Component with interactive, JS-driven results, unlike every
 * route already covered). "/" (home) already existed but is re-screenshotted by
 * this same route entry now that #71 added the newsletter signup section to it.
 */
const ROUTES: { path: string; name: string }[] = [
  { path: "/", name: "home" },
  { path: "/grove/ai", name: "grove-ai" },
  { path: "/repo/ollama", name: "repo-ollama" },
  { path: "/trending", name: "trending" },
  { path: "/rising", name: "rising" },
  { path: "/alternative/notion", name: "alternative-notion" },
  { path: "/compare/ollama/vllm", name: "compare-ollama-vllm" },
  { path: "/search", name: "search" },
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

    // UX-2026-006 (design run 18 re-diagnosis): the project's own
    // `commit-screenshots` CI job found zero pixel diff after that issue's
    // first fix merged — the real regression was a silently clipping
    // `overflow-x-auto` wrapper (a horizontally scrollable container with no
    // visual affordance), which neither the axe-core scan below nor a
    // class-presence unit test can detect, since nothing about it is a WCAG
    // violation or a missing Tailwind class — the element is scrollable
    // exactly as authored, just with real content silently cut off at its
    // visible edge by default. This asserts, for every route at every
    // viewport this harness covers, that no such wrapper is actually
    // overflowing right now — the generic version of the check that would
    // have caught UX-2026-006's first (ineffective) fix immediately instead
    // of only on the next run's manual screenshot review.
    const overflowingScrollers = await page.evaluate(() => {
      const offenders: { selector: string; scrollWidth: number; clientWidth: number }[] = [];
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("*"))) {
        const style = getComputedStyle(el);
        if (style.overflowX !== "auto" && style.overflowX !== "scroll") continue;
        // 1px tolerance for sub-pixel layout rounding, not a real overflow.
        if (el.scrollWidth > el.clientWidth + 1) {
          offenders.push({
            selector: el.tagName.toLowerCase() + (el.className ? `.${el.className.toString().split(" ").join(".")}` : ""),
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
          });
        }
      }
      return offenders;
    });
    expect(
      overflowingScrollers,
      `found ${overflowingScrollers.length} horizontally-overflowing scroll container(s) on ${route.path} with no visual scroll affordance: ${JSON.stringify(overflowingScrollers)}`,
    ).toEqual([]);

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
