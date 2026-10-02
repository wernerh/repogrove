import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * SEC-006 — regression test for `public/staticwebapp.config.json`.
 *
 * Next.js copies everything under `public/` into the static-export output
 * root (`out/`), which is exactly where Azure Static Web Apps' deploy job
 * (`output_location: "out"` in
 * `.github/workflows/azure-static-web-apps-orange-sea-032472e10.yml`) looks
 * for this file. Pinned here so a future edit can't silently drop a header
 * or — more importantly — silently add a `routes`/`navigationFallback`
 * block that changes real routing behaviour on the now-live production
 * site without that being a deliberate, reviewed decision (see
 * `docs/security/findings/SEC-006-missing-security-headers.md`: this fix
 * was deliberately scoped to `globalHeaders` only, nothing else, precisely
 * to avoid touching routing on a live deployment this lane can't inspect).
 */
describe("public/staticwebapp.config.json", () => {
  const configPath = path.resolve(__dirname, "../../public/staticwebapp.config.json");
  const raw = readFileSync(configPath, "utf-8");
  const config = JSON.parse(raw) as Record<string, unknown>;

  it("is valid JSON with no trailing surprises", () => {
    expect(config).toBeTypeOf("object");
  });

  it("only sets globalHeaders — no routes/navigationFallback/mimeTypes change in this fix", () => {
    // Deliberately narrow: this fix (SEC-006) is additive security headers
    // only. Any future routing-affecting key should be a conscious addition
    // with its own review, not a silent side effect of an unrelated edit.
    expect(Object.keys(config)).toEqual(["globalHeaders"]);
  });

  it("sets baseline anti-clickjacking and MIME-sniffing protection", () => {
    const headers = config.globalHeaders as Record<string, string>;
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("DENY");
  });

  it("sets a conservative Referrer-Policy", () => {
    const headers = config.globalHeaders as Record<string, string>;
    expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });

  it("locks down Permissions-Policy to features this site never uses", () => {
    const headers = config.globalHeaders as Record<string, string>;
    const policy = headers["Permissions-Policy"];
    expect(policy).toBeTypeOf("string");
    // The whole site is static-rendered editorial content (confirmed via
    // repo-wide grep: no next/image, no <script>/next/script, no
    // analytics, no camera/mic/geolocation use anywhere in src/) — every
    // powerful browser feature can be denied outright.
    for (const feature of ["camera", "microphone", "geolocation", "payment", "usb"]) {
      expect(policy).toContain(`${feature}=()`);
    }
  });

  it("sets only frame-ancestors in CSP — the rest is deliberately deferred (SEC-006)", () => {
    // Next.js App Router's static export injects inline hydration <script>
    // tags (RSC flight data) with no server available to mint per-request
    // nonces (output: "export" has no middleware/server at all) and at
    // least two components use inline style={{ width: ... }} attributes
    // (TrendBoard.tsx, GroveHeader.tsx) for progress-bar widths. A full CSP
    // written without inspecting a real built `out/` or the live site
    // (both out of reach this run — the sandbox's own font-fetch gap
    // blocks a local build, and this lane never touches live cloud
    // resources) risks shipping a script-src that silently breaks
    // hydration/interactivity on the real production site on the next
    // auto-deploy. `frame-ancestors` is independent of script-src/style-src
    // entirely (it only governs who may embed this page in a frame) and is
    // safely addable now — it reinforces X-Frame-Options: DENY and is the
    // modern replacement browsers prefer. The rest of the policy
    // (script-src/style-src/etc.) is left out, not guessed at.
    const headers = config.globalHeaders as Record<string, string>;
    expect(headers["Content-Security-Policy"]).toBe("frame-ancestors 'none'");
  });
});
