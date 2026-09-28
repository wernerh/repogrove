// @vitest-environment node
// Building the fixture DB reuses scripts/ingestion/snapshots-db.ts's
// openDb/upsertSnapshot, which statically imports node:sqlite — that needs
// the same per-file node environment override as tests/ingestion/*.test.ts
// (see TECH-DEBT.md). src/lib/snapshots.ts itself avoids that bundling
// issue via process.getBuiltinModule (see its own module doc comment) and
// would work under jsdom too, but this file doesn't need jsdom for
// anything, so the plain node environment is the simpler choice here.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDb, upsertSnapshot } from "../../scripts/ingestion/snapshots-db.ts";
import { getGrowthSummary, getSnapshotHistory, type SnapshotRow } from "@/lib/snapshots";

const tempDirs: string[] = [];

afterEach(() => {
  while (tempDirs.length) {
    fs.rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

function fixtureDb(rows: Array<Partial<Record<string, unknown>>>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "repogrove-snapshots-test-"));
  tempDirs.push(dir);
  const dbPath = path.join(dir, "fixture.db");
  const db = openDb(dbPath);
  for (const row of rows) {
    const capturedOn = (row.capturedOn as string) ?? "2026-09-27";
    upsertSnapshot(db, {
      github: "ollama/ollama",
      stars: 100,
      forks: 10,
      openIssues: 5,
      watchers: 100,
      fetchedAt: `${capturedOn}T12:00:00.000Z`,
      ...row,
      capturedOn,
    });
  }
  db.close();
  return dbPath;
}

function row(overrides: Partial<SnapshotRow> = {}): SnapshotRow {
  return {
    github: "ollama/ollama",
    capturedOn: "2026-09-27",
    stars: 100,
    forks: 10,
    openIssues: 5,
    watchers: 100,
    source: "github-api",
    fetchedAt: "2026-09-27T12:00:00.000Z",
    ...overrides,
  };
}

describe("getSnapshotHistory", () => {
  it("returns [] when the database file doesn't exist yet (before the first ingestion run)", () => {
    expect(getSnapshotHistory("ollama/ollama", "/nonexistent/path/repogrove.db")).toEqual([]);
  });

  it("returns [] for a repo the database has never captured", () => {
    const dbPath = fixtureDb([{ capturedOn: "2026-09-27", stars: 100 }]);
    expect(getSnapshotHistory("supabase/supabase", dbPath)).toEqual([]);
  });

  it("returns history oldest-first for a tracked repo", () => {
    const dbPath = fixtureDb([
      { capturedOn: "2026-09-27", stars: 100 },
      { capturedOn: "2026-09-26", stars: 90 },
    ]);
    const history = getSnapshotHistory("ollama/ollama", dbPath);
    expect(history.map((r) => r.capturedOn)).toEqual(["2026-09-26", "2026-09-27"]);
    expect(history[1].stars).toBe(100);
  });

  it("returns [] rather than throwing if the file isn't a valid SQLite database", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "repogrove-snapshots-test-"));
    tempDirs.push(dir);
    const dbPath = path.join(dir, "corrupt.db");
    fs.writeFileSync(dbPath, "not a sqlite file");
    expect(getSnapshotHistory("ollama/ollama", dbPath)).toEqual([]);
  });
});

describe("getGrowthSummary", () => {
  it("returns null for no history", () => {
    expect(getGrowthSummary([])).toBeNull();
  });

  it("reports days=0 / deltaStars=0 for a single snapshot (not enough history yet)", () => {
    const summary = getGrowthSummary([row({ capturedOn: "2026-09-27", stars: 100 })]);
    expect(summary).toMatchObject({
      currentStars: 100,
      deltaStars: 0,
      days: 0,
      trackingSince: "2026-09-27",
    });
  });

  it("computes delta against the oldest snapshot within the last 30 days, not the very first one", () => {
    const history = [
      row({ capturedOn: "2026-08-01", stars: 10 }),
      row({ capturedOn: "2026-09-01", stars: 50 }),
      row({ capturedOn: "2026-09-27", stars: 100 }),
    ];
    const summary = getGrowthSummary(history);
    // latest is 2026-09-27; 30 days back is 2026-08-28, so the baseline is
    // the 2026-09-01 row (the first one on/after that date), not 2026-08-01.
    expect(summary).toMatchObject({ currentStars: 100, deltaStars: 50, trackingSince: "2026-08-01" });
    expect(summary!.days).toBe(26);
  });

  it("uses the very first snapshot as baseline when history spans less than 30 days", () => {
    const history = [row({ capturedOn: "2026-09-25", stars: 90 }), row({ capturedOn: "2026-09-27", stars: 100 })];
    const summary = getGrowthSummary(history);
    expect(summary).toMatchObject({ currentStars: 100, deltaStars: 10, days: 2, trackingSince: "2026-09-25" });
  });

  it("can report a negative delta (star count dropped)", () => {
    const history = [row({ capturedOn: "2026-09-25", stars: 100 }), row({ capturedOn: "2026-09-27", stars: 95 })];
    expect(getGrowthSummary(history)).toMatchObject({ currentStars: 95, deltaStars: -5 });
  });
});
