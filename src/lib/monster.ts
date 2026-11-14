import type { AnimalType, HouseFeatures } from "./types";

/**
 * Picks which animal carries the house. Deterministic for a given house so the
 * same photo always hatches the same kind of monster (see DECISIONS.md D-013):
 * - spooky houses (fire damage, open/missing door, collapse) or flat roofs → box cat
 * - big houses (2+ stories) or porches → turtle (sturdy shell)
 * - small, simple houses → snail
 * A seed breaks ties so collections stay varied.
 */
export function chooseAnimal(features: HouseFeatures, conditionTags: string[], seed: string): AnimalType {
  const spooky = conditionTags.some((t) => ["fire damage", "open or missing door", "structural collapse"].includes(t));
  if (spooky || features.roofShape === "flat") return "boxcat";
  if (features.stories >= 2 || features.porch) return "turtle";
  if (features.windowCount <= 2) return "snail";
  return hash(seed) % 2 === 0 ? "snail" : "turtle";
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
