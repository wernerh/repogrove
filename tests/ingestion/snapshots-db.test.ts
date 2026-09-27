import { describe, expect, it } from "vitest";
// Plain JS module (node:sqlite predates this project's @types/node pin — see
// docs/adr/ADR-005-repository-snapshot-storage.md and TECH-DEBT.md). TypeScript infers
// its exports as untyped rather than erroring, so no suppression comment is needed here.
import { openDb, upsertSnapshot, getLatestSnapshot, getSnapshotHistory, getTrackedRepos } from "../../scripts/ingestion/snapshots-db.mjs";

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
});
