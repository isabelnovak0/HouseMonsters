import type { AnimalType, HouseFeatures } from "./types";

/** Animals new catches can hatch as (D-023). The turtle still renders for older monsters. */
export const HATCHABLE: AnimalType[] = ["snail", "boxcat"];

/**
 * Picks which animal carries the house: a coin flip between snail and box cat,
 * taken from the monster's random id so it's random per catch but stays the same
 * for that monster forever (D-023).
 */
export function chooseAnimal(_features: HouseFeatures, _conditionTags: string[], seed: string): AnimalType {
  return HATCHABLE[hash(seed) % HATCHABLE.length];
}

export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const DANCE_MOVES = ["bounce", "spin", "lidHop", "chimneyPuff"] as const;
export type DanceMove = (typeof DANCE_MOVES)[number];

/** Three different dance moves for the reveal, chosen from the monster id. */
export function pickDances(seed: string): DanceMove[] {
  const h = hash(seed);
  const pool = [...DANCE_MOVES];
  const out: DanceMove[] = [];
  for (let i = 0; i < 3; i++) out.push(pool.splice((h >> (i * 4)) % pool.length, 1)[0]);
  return out;
}
