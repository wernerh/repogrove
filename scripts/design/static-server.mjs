#!/usr/bin/env node
/**
 * Minimal static file server for the design lane's Playwright screenshot + axe-core
 * harness (`tests/design/screenshots.spec.ts`).
 *
 * RepoGrove builds as a fully static export (`output: "export"`, ADR-002/RG-2 — Azure
 * Storage static-website hosting has no server runtime), so `next start` cannot serve
 * it. This avoids pulling in a new dependency (e.g. `serve`) just to serve a directory
 * of already-built HTML/CSS/JS: Node's built-in `http`/`fs` modules are enough for a
 * local, single-purpose test server. Not used anywhere outside this harness.
 *
 * Usage: node scripts/design/static-server.mjs [--dir out] [--port 4310]
 */
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize, sep } from "node:path";

const args = process.argv.slice(2);
function argValue(flag, fallback) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const rootDir = normalize(join(process.cwd(), argValue("--dir", "out")));
const port = Number(argValue("--port", "4310"));

// Fail loudly (non-zero exit) rather than serving 404s for every route, which would
// otherwise let the Playwright suite "pass" (axe-core finds ~0 violations on an empty
// 404 page) without ever actually testing a real page. Run `npm run build` first.
if (!existsSync(rootDir) || !existsSync(join(rootDir, "index.html"))) {
  console.error(
    `design static server: "${rootDir}" doesn't exist or has no index.html — run ` +
      `\`npm run build\` first (it produces this static export; see next.config.ts's ` +
      `output: "export"). Refusing to start and silently 404 every route.`,
  );
  process.exit(1);
}

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

async function resolveFile(urlPath) {
  const cleanPath = urlPath.split("?")[0];
  const candidates = [
    join(rootDir, cleanPath),
    join(rootDir, cleanPath, "index.html"),
    join(rootDir, `${cleanPath}.html`),
  ];
  for (const candidate of candidates) {
    const resolved = normalize(candidate);
    // True containment check, not a bare prefix match: `resolved.startsWith(rootDir)`
    // alone would wrongly accept a sibling directory that merely shares rootDir as a
    // string prefix (e.g. rootDir "/x/out" would accept "/x/out-evil/secret"). Require
    // an exact match or a path separator right after rootDir.
    if (resolved !== rootDir && !resolved.startsWith(rootDir + sep)) continue;
    try {
      const info = await stat(resolved);
      if (info.isFile()) return resolved;
    } catch {
      // try the next candidate
    }
  }
  return null;
}

// SEC-004 (docs/security/findings/SEC-004-static-server-malformed-uri-dos.md): the
// whole handler body is wrapped in try/catch. `decodeURIComponent` throws a `URIError`
// on a malformed percent-encoding (e.g. a bare "%" — trivially sendable by any raw TCP
// client, `curl` included; `fetch()`/browsers normalize or reject it before it reaches
// the wire, which is why this went unnoticed). That throw happened inside an `async`
// request-handler callback that `http.Server` never awaits, so it became an unhandled
// promise rejection — fatal by default in Node — and took the whole server down on a
// single bad request instead of just that one connection. Only ever localhost-only CI
// test-harness traffic reaches this server, so this was never a remote-exploitable
// issue, but an uncaught exception silently killing a shared CI process for every other
// route/test still running behind it is a real availability bug worth the two-line fix.
// See tests/scripts/design-static-server.test.ts for the regression test (a raw-socket request,
// since normal HTTP clients don't let you send a malformed "%").
const server = createServer(async (req, res) => {
  try {
    const file = await resolveFile(decodeURIComponent(req.url ?? "/"));
    if (!file) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const body = await readFile(file);
    const contentType = CONTENT_TYPES[extname(file)] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(body);
  } catch (err) {
    if (err instanceof URIError) {
      res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Bad request");
      return;
    }
    console.error(`design static server: unexpected error handling ${req.url}:`, err);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal server error");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`design static server serving ${rootDir} at http://127.0.0.1:${port}`);
});
