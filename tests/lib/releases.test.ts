// @vitest-environment node
// Building the fixture DB reuses scripts/ingestion/snapshots-db.ts's
// openDb/upsertRelease, which statically imports node:sqlite — same reasoning as
// tests/lib/snapshots.test.ts's own header comment (see TECH-DEBT.md). src/lib/
// releases.ts itself avoids that bundling issue via process.getBuiltinModule, and
// would work under jsdom too, but this file doesn't need jsdom for anything.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDb, upsertRelease } from "../../scripts/ingestion/snapshots-db.ts";
import { getRecentReleases } from "@/lib/releases";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length) {
    fs.rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

function fixtureDb(rows: Array<Partial<Record<string, unknown>>>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "repogrove-releases-test-"));
  tempDirs.push(dir);
  const dbPath = path.join(dir, "fixture.db");
  const db = openDb(dbPath);
  for (const row of rows) {
    upsertRelease(db, {
      github: "ollama/ollama",
      tagName: "v1.0.0",
      name: "v1.0.0",
      htmlUrl: "https://github.com/ollama/ollama/releases/tag/v1.0.0",
      publishedAt: "2026-09-20T00:00:00.000Z",
      fetchedAt: "2026-09-27T12:00:00.000Z",
      ...row,
    });
  }
  db.close();
  return dbPath;
}

describe("getRecentReleases", () => {
  it("returns [] when the database file doesn't exist yet", () => {
    expect(getRecentReleases("ollama/ollama", 5, "/nonexistent/repogrove-test.db")).toEqual([]);
  });

  it("returns [] for a repo with no releases on record, without throwing", () => {
    const dbPath = fixtureDb([{ github: "supabase/supabase", tagName: "v2.0.0" }]);
    expect(getRecentReleases("ollama/ollama", 5, dbPath)).toEqual([]);
  });

  it("returns a repo's releases, newest-published first", () => {
    const dbPath = fixtureDb([
      { tagName: "v1.0.0", publishedAt: "2026-08-01T00:00:00.000Z" },
      { tagName: "v1.2.0", publishedAt: "2026-09-20T00:00:00.000Z" },
      { tagName: "v1.1.0", publishedAt: "2026-09-01T00:00:00.000Z" },
    ]);
    expect(getRecentReleases("ollama/ollama", 5, dbPath).map((r) => r.tagName)).toEqual([
      "v1.2.0",
      "v1.1.0",
      "v1.0.0",
    ]);
  });

  it("respects the limit parameter", () => {
    const dbPath = fixtureDb([
      { tagName: "v1.0.0", publishedAt: "2026-08-01T00:00:00.000Z" },
      { tagName: "v1.2.0", publishedAt: "2026-09-20T00:00:00.000Z" },
      { tagName: "v1.1.0", publishedAt: "2026-09-01T00:00:00.000Z" },
    ]);
    expect(getRecentReleases("ollama/ollama", 2, dbPath).map((r) => r.tagName)).toEqual(["v1.2.0", "v1.1.0"]);
  });

  it("keeps different repos' releases independent", () => {
    const dbPath = fixtureDb([
      { github: "ollama/ollama", tagName: "v1.0.0" },
      { github: "supabase/supabase", tagName: "v2.0.0" },
    ]);
    expect(getRecentReleases("ollama/ollama", 5, dbPath).map((r) => r.tagName)).toEqual(["v1.0.0"]);
    expect(getRecentReleases("supabase/supabase", 5, dbPath).map((r) => r.tagName)).toEqual(["v2.0.0"]);
  });

  it("carries a null name through rather than fabricating one", () => {
    const dbPath = fixtureDb([{ tagName: "v1.0.0", name: null }]);
    expect(getRecentReleases("ollama/ollama", 5, dbPath)[0].name).toBeNull();
  });

  it("does not include internal fields like fetchedAt", () => {
    const dbPath = fixtureDb([{ tagName: "v1.0.0" }]);
    const release = getRecentReleases("ollama/ollama", 5, dbPath)[0];
    expect(release).toEqual({
      github: "ollama/ollama",
      tagName: "v1.0.0",
      name: "v1.0.0",
      htmlUrl: "https://github.com/ollama/ollama/releases/tag/v1.0.0",
      publishedAt: "2026-09-20T00:00:00.000Z",
    });
  });
});
