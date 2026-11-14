import type { Monster, ReporterContact } from "../types";

/**
 * Storage boundary. v1 ships an IndexedDB implementation (on-device only).
 * A server-backed implementation (e.g. Postgres behind /api/monsters) can be
 * dropped in later without touching any screen — screens only see this interface.
 */
export interface MonsterRepository {
  list(): Promise<Monster[]>;
  get(id: string): Promise<Monster | undefined>;
  put(monster: Monster): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface SettingsRepository {
  getReporter(): Promise<ReporterContact | undefined>;
  saveReporter(contact: ReporterContact): Promise<void>;
}
