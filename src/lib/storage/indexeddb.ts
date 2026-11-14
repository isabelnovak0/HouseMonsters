import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Monster, ReporterContact } from "../types";
import type { MonsterRepository, SettingsRepository } from "./repository";

interface HouseMonstersDB extends DBSchema {
  monsters: { key: string; value: Monster; indexes: { foundAt: string } };
  settings: { key: string; value: unknown };
}

const DB_NAME = "house-monsters";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<HouseMonstersDB>> | undefined;

function db(): Promise<IDBPDatabase<HouseMonstersDB>> {
  dbPromise ??= openDB<HouseMonstersDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      const monsters = database.createObjectStore("monsters", { keyPath: "id" });
      monsters.createIndex("foundAt", "foundAt");
      database.createObjectStore("settings");
    },
  });
  return dbPromise;
}

export class IndexedDbMonsterRepository implements MonsterRepository {
  async list(): Promise<Monster[]> {
    const all = await (await db()).getAllFromIndex("monsters", "foundAt");
    return all.reverse(); // newest first
  }
  async get(id: string): Promise<Monster | undefined> {
    return (await db()).get("monsters", id);
  }
  async put(monster: Monster): Promise<void> {
    await (await db()).put("monsters", monster);
  }
  async remove(id: string): Promise<void> {
    await (await db()).delete("monsters", id);
  }
}

export class IndexedDbSettingsRepository implements SettingsRepository {
  async getReporter(): Promise<ReporterContact | undefined> {
    return (await (await db()).get("settings", "reporter")) as ReporterContact | undefined;
  }
  async saveReporter(contact: ReporterContact): Promise<void> {
    await (await db()).put("settings", contact, "reporter");
  }
}

/** Test hook: forget the cached connection (used with fake-indexeddb). */
export function __resetDbForTests() {
  dbPromise = undefined;
}
