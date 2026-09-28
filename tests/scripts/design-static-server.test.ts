// @vitest-environment node
// Regression test for SEC-004 (docs/security/findings/SEC-004-static-server-malformed-uri-dos.md):
// the design lane's local screenshot-harness server (scripts/design/static-server.mjs)
// used to crash its whole Node process on a single malformed-percent-encoding request
// (`decodeURIComponent` throwing inside an async request handler is an unhandled
// rejection Node treats as fatal). Exercises the real script as a child process and
// sends a raw, deliberately malformed request line over a TCP socket — `fetch()`
// constructs requests through the URL Standard's parser, which normalizes or rejects an
// invalid `%` sequence client-side before it ever reaches the wire (unlike `curl`, which
// happily sends a literal `%` as-is — see the finding doc's Evidence section, reproduced
// with plain `curl`); a raw socket is the most direct, client-independent way to
// reproduce exactly what a misbehaving/arbitrary client can put on the wire.
import { spawn, type ChildProcessByStdio } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import net from "node:net";
import type { Readable } from "node:stream";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

// spawn() below is called with stdio: ["ignore", "pipe", "pipe"] — no stdin, so this is
// not a ChildProcessWithoutNullStreams (which requires all three streams present).
type SpawnedServer = ChildProcessByStdio<null, Readable, Readable>;

let serverDir: string;
let server: SpawnedServer;
let port: number;

/** Sends a raw HTTP/1.1 request line and returns the full raw response text. */
function rawRequest(requestLine: string, port: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const socket = net.connect(port, "127.0.0.1", () => {
      socket.write(`${requestLine}\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n`);
    });
    let data = "";
    socket.on("data", (chunk) => (data += chunk.toString()));
    socket.on("end", () => resolve(data));
    socket.on("error", reject);
    socket.setTimeout(5000, () => {
      socket.destroy();
      reject(new Error("socket timed out"));
    });
  });
}

function waitForServerReady(proc: SpawnedServer): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("server didn't start in time")), 10_000);
    proc.stdout.on("data", (chunk) => {
      if (chunk.toString().includes("design static server serving")) {
        clearTimeout(timer);
        resolve();
      }
    });
    proc.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`server exited early with code ${code}`));
    });
  });
}

beforeEach(async () => {
  serverDir = await mkdtemp(join(tmpdir(), "repogrove-static-server-test-"));
  await writeFile(join(serverDir, "index.html"), "<html><body>ok</body></html>");
  port = 40000 + Math.floor(Math.random() * 10000);
  // `--dir` is always relative in real usage (playwright.config.ts passes `--dir out`
  // from the repo root); pass "." with `cwd: serverDir` here rather than an absolute
  // path, since the script's `--dir` handling only supports the relative form.
  server = spawn("node", [join(process.cwd(), "scripts/design/static-server.mjs"), "--dir", ".", "--port", String(port)], {
    stdio: ["ignore", "pipe", "pipe"],
    cwd: serverDir,
  });
  await waitForServerReady(server);
});

afterEach(async () => {
  server.kill();
  await rm(serverDir, { recursive: true, force: true });
});

describe("design static server", () => {
  it("stays up and answers 400 (not a crash) for a malformed percent-encoded request", async () => {
    const malformed = await rawRequest("GET /%", port);
    expect(malformed).toMatch(/^HTTP\/1\.1 400/);

    // The real regression: a crashed process refuses every subsequent connection.
    // Confirm the server is still serving normal requests afterwards.
    const ok = await rawRequest("GET / HTTP/1.1", port);
    expect(ok).toMatch(/^HTTP\/1\.1 200/);
    expect(ok).toContain("ok");
  });

  it("still serves normal requests and 404s missing files", async () => {
    const ok = await rawRequest("GET / HTTP/1.1", port);
    expect(ok).toMatch(/^HTTP\/1\.1 200/);

    const missing = await rawRequest("GET /nope HTTP/1.1", port);
    expect(missing).toMatch(/^HTTP\/1\.1 404/);
  });
});
