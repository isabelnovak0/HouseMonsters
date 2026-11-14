import { IndexedDbMonsterRepository, IndexedDbSettingsRepository } from "./indexeddb";
import type { MonsterRepository, SettingsRepository } from "./repository";

export type { MonsterRepository, SettingsRepository } from "./repository";

/** The single place that picks the storage backend. */
export const monsters: MonsterRepository = new IndexedDbMonsterRepository();
export const settings: SettingsRepository = new IndexedDbSettingsRepository();
