import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { IndexedDbMonsterRepository, IndexedDbSettingsRepository } from "@/lib/storage/indexeddb";
import { makeMonster } from "./fixtures";

describe("IndexedDB repositories", () => {
  it("stores monsters and lists newest first", async () => {
    const repo = new IndexedDbMonsterRepository();
    await repo.put(makeMonster({ id: "old", foundAt: "2026-01-01T00:00:00Z" }));
    await repo.put(makeMonster({ id: "new", foundAt: "2026-06-01T00:00:00Z" }));
    expect((await repo.list()).map((m) => m.id)).toEqual(["new", "old"]);
    await repo.remove("old");
    expect(await repo.get("old")).toBeUndefined();
  });

  it("remembers reporter contact", async () => {
    const s = new IndexedDbSettingsRepository();
    await s.saveReporter({ name: "Ada", email: "ada@example.com" });
    expect(await s.getReporter()).toEqual({ name: "Ada", email: "ada@example.com" });
  });
});
