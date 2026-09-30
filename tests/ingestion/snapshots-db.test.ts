// @vitest-environment node
// This suite exercises node:sqlite (via snapshots-db.ts) directly; the jsdom environment
// made Vite refuse to bundle that built-in once vitest 5.0.1 / @vitejs/plugin-react
// 6.1.1 landed (PRs #14/#15) — see TECH-DEBT.md.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  openDb,
  upsertSnapshot,
  getLatestSnapshot,
  getSnapshotHistory,
  getTrackedRepos,
  upsertRelease,
  getReleases,
} from "../../scripts/ingestion/snapshots-db.ts";

interface SnapshotRow {
  github: string;
  capturedOn: string;
  stars: number;
  forks: number;
  openIssues: number;
  watchers: number;
  source: string;
  fetchedAt: string;
}

function makeSnapshot(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    github: "ollama/ollama",
    capturedOn: "2026-09-27",
    stars: 100,
    forks: 10,
    openIssues: 5,
    watchers: 100,
    fetchedAt: "2026-09-27T12:00:00.000Z",
    ...overrides,
  };
}

describe("snapshots-db", () => {
  it("creates the schema and starts empty", () => {
    const db = openDb(":memory:");
    expect(getLatestSnapshot(db, "ollama/ollama")).toBeNull();
    expect(getSnapshotHistory(db, "ollama/ollama")).toEqual([]);
    expect(getTrackedRepos(db)).toEqual([]);
    db.close();
  });

  it("round-trips a snapshot", () => {
    const db = openDb(":memory:");
    upsertSnapshot(db, makeSnapshot());
    expect(getLatestSnapshot(db, "ollama/ollama")).toMatchObject({
      github: "ollama/ollama",
      capturedOn: "2026-09-27",
      stars: 100,
      forks: 10,
      openIssues: 5,
      watchers: 100,
      source: "github-api",
    });
    db.close();
  });

  it("is idempotent — upserting the same (github, capturedOn) twice updates, not duplicates", () => {
    const db = openDb(":memory:");
    upsertSnapshot(db, makeSnapshot({ stars: 100 }));
    upsertSnapshot(db, makeSnapshot({ stars: 142, fetchedAt: "2026-09-27T18:00:00.000Z" }));

    const history = getSnapshotHistory(db, "ollama/ollama");
    expect(history).toHaveLength(1);
    expect(history[0].stars).toBe(142);
    expect(history[0].fetchedAt).toBe("2026-09-27T18:00:00.000Z");
    db.close();
  });

  it("keeps separate rows per day, ordered oldest-first for history", () => {
    const db = openDb(":memory:");
    upsertSnapshot(db, makeSnapshot({ capturedOn: "2026-09-25", stars: 90 }));
    upsertSnapshot(db, makeSnapshot({ capturedOn: "2026-09-27", stars: 110 }));
    upsertSnapshot(db, makeSnapshot({ capturedOn: "2026-09-26", stars: 100 }));

    const history: SnapshotRow[] = getSnapshotHistory(db, "ollama/ollama");
    expect(history.map((row) => row.capturedOn)).toEqual(["2026-09-25", "2026-09-26", "2026-09-27"]);
    expect(getLatestSnapshot(db, "ollama/ollama")?.capturedOn).toBe("2026-09-27");
    db.close();
  });

  it("keeps different repos' histories independent", () => {
    const db = openDb(":memory:");
    upsertSnapshot(db, makeSnapshot({ github: "ollama/ollama", stars: 100 }));
    upsertSnapshot(db, makeSnapshot({ github: "supabase/supabase", stars: 5000 }));

    expect(getLatestSnapshot(db, "ollama/ollama")?.stars).toBe(100);
    expect(getLatestSnapshot(db, "supabase/supabase")?.stars).toBe(5000);
    expect(getTrackedRepos(db)).toEqual(["ollama/ollama", "supabase/supabase"]);
    db.close();
  });

  it("rejects a snapshot missing a required field rather than silently writing partial data", () => {
    const db = openDb(":memory:");
    expect(() => upsertSnapshot(db, makeSnapshot({ stars: undefined }))).toThrow(/missing required field "stars"/);
    expect(getTrackedRepos(db)).toEqual([]);
    db.close();
  });

  describe("contributors", () => {
    it("round-trips a contributor count", () => {
      const db = openDb(":memory:");
      upsertSnapshot(db, makeSnapshot({ contributors: 42 }));
      expect(getLatestSnapshot(db, "ollama/ollama")).toMatchObject({ contributors: 42 });
      db.close();
    });

    it("stores null when a snapshot omits contributors — e.g. that day's fetch failed", () => {
      const db = openDb(":memory:");
      upsertSnapshot(db, makeSnapshot());
      expect(getLatestSnapshot(db, "ollama/ollama")).toMatchObject({ contributors: null });
      db.close();
    });

    it("does not clobber a known contributor count when a same-day re-upsert omits it", () => {
      const db = openDb(":memory:");
      upsertSnapshot(db, makeSnapshot({ contributors: 42 }));
      // Re-run later the same day (e.g. a manual dispatch), this time without a
      // contributor count — the earlier good value must survive, not be overwritten
      // with null (see upsertSnapshot's COALESCE).
      upsertSnapshot(db, makeSnapshot({ stars: 105, fetchedAt: "2026-09-27T18:00:00.000Z" }));
      expect(getLatestSnapshot(db, "ollama/ollama")).toMatchObject({ stars: 105, contributors: 42 });
      db.close();
    });

    it("does overwrite an existing contributor count when the re-upsert has a new one", () => {
      const db = openDb(":memory:");
      upsertSnapshot(db, makeSnapshot({ contributors: 42 }));
      upsertSnapshot(db, makeSnapshot({ contributors: 45, fetchedAt: "2026-09-27T18:00:00.000Z" }));
      expect(getLatestSnapshot(db, "ollama/ollama")).toMatchObject({ contributors: 45 });
      db.close();
    });
  });

  it("migrates a database created before the contributors column existed", () => {
    // openDb's SCHEMA constant intentionally doesn't declare `contributors` — every
    // fresh `:memory:` db exercises the same `ALTER TABLE ... ADD COLUMN` migrate()
    // path a real pre-existing committed data/repogrove.db goes through, rather than
    // only being tested against an already-migrated fixture.
    const db = openDb(":memory:");
    const columns = db.prepare(`PRAGMA table_info(repository_snapshots)`).all() as unknown as { name: string }[];
    expect(columns.map((c) => c.name)).toContain("contributors");
    db.close();
  });

  it("re-opening an already-migrated database is a no-op, not an error", () => {
    // Unlike ":memory:", a real file path persists across separate openDb() calls, so
    // this actually exercises migrate() running a second time against a db that
    // already has the column — `ALTER TABLE ADD COLUMN` on a column that already
    // exists would throw if migrate() re-ran it unconditionally.
    const dbPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "repogrove-snapshots-db-test-")), "test.db");
    try {
      const first = openDb(dbPath);
      upsertSnapshot(first, makeSnapshot({ contributors: 42 }));
      first.close();

      expect(() => openDb(dbPath)).not.toThrow();
      const second = openDb(dbPath);
      expect(getLatestSnapshot(second, "ollama/ollama")).toMatchObject({ contributors: 42 });
      second.close();
    } finally {
      fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
    }
  });

  describe("releases (issue #72)", () => {
    function makeRelease(overrides: Partial<Record<string, unknown>> = {}) {
      return {
        github: "ollama/ollama",
        tagName: "v1.8.0",
        name: "v1.8.0",
        htmlUrl: "https://github.com/ollama/ollama/releases/tag/v1.8.0",
        publishedAt: "2026-09-20T12:00:00.000Z",
        fetchedAt: "2026-09-27T12:00:00.000Z",
        ...overrides,
      };
    }

    it("starts empty", () => {
      const db = openDb(":memory:");
      expect(getReleases(db, "ollama/ollama")).toEqual([]);
      db.close();
    });

    it("round-trips a release", () => {
      const db = openDb(":memory:");
      upsertRelease(db, makeRelease());
      expect(getReleases(db, "ollama/ollama")).toEqual([
        {
          github: "ollama/ollama",
          tagName: "v1.8.0",
          name: "v1.8.0",
          htmlUrl: "https://github.com/ollama/ollama/releases/tag/v1.8.0",
          publishedAt: "2026-09-20T12:00:00.000Z",
          fetchedAt: "2026-09-27T12:00:00.000Z",
        },
      ]);
      db.close();
    });

    it("stores a null name when GitHub's release has none", () => {
      const db = openDb(":memory:");
      upsertRelease(db, makeRelease({ name: null }));
      expect(getReleases(db, "ollama/ollama")[0].name).toBeNull();
      db.close();
    });

    it("is idempotent — upserting the same (github, tagName) twice updates, not duplicates", () => {
      const db = openDb(":memory:");
      upsertRelease(db, makeRelease({ name: "v1.8.0" }));
      upsertRelease(db, makeRelease({ name: "v1.8.0 (edited)", fetchedAt: "2026-09-28T12:00:00.000Z" }));

      const releases = getReleases(db, "ollama/ollama");
      expect(releases).toHaveLength(1);
      expect(releases[0].name).toBe("v1.8.0 (edited)");
      expect(releases[0].fetchedAt).toBe("2026-09-28T12:00:00.000Z");
      db.close();
    });

    it("orders multiple releases most-recently-published first", () => {
      const db = openDb(":memory:");
      upsertRelease(db, makeRelease({ tagName: "v1.7.0", publishedAt: "2026-09-01T00:00:00.000Z" }));
      upsertRelease(db, makeRelease({ tagName: "v1.8.0", publishedAt: "2026-09-20T00:00:00.000Z" }));
      upsertRelease(db, makeRelease({ tagName: "v1.6.0", publishedAt: "2026-08-15T00:00:00.000Z" }));

      expect(getReleases(db, "ollama/ollama").map((r) => r.tagName)).toEqual(["v1.8.0", "v1.7.0", "v1.6.0"]);
      db.close();
    });

    it("keeps different repos' releases independent", () => {
      const db = openDb(":memory:");
      upsertRelease(db, makeRelease({ github: "ollama/ollama", tagName: "v1.8.0" }));
      upsertRelease(db, makeRelease({ github: "supabase/supabase", tagName: "v2.0.0" }));

      expect(getReleases(db, "ollama/ollama").map((r) => r.tagName)).toEqual(["v1.8.0"]);
      expect(getReleases(db, "supabase/supabase").map((r) => r.tagName)).toEqual(["v2.0.0"]);
      db.close();
    });

    it("rejects a release missing a required field rather than silently writing partial data", () => {
      const db = openDb(":memory:");
      expect(() => upsertRelease(db, makeRelease({ htmlUrl: undefined }))).toThrow(
        /missing required field "htmlUrl"/,
      );
      expect(getReleases(db, "ollama/ollama")).toEqual([]);
      db.close();
    });
  });
});
