import { distanceMeters } from "./geo";
import type { GeoPoint, Monster } from "./types";

export const NEW_HOUSE_POINTS = 100;
export const RESOLVE_BONUS_POINTS = 50;
/** Two snaps closer than this are treated as the same house. */
export const DUPLICATE_RADIUS_M = 30;

/** The closest already-collected monster within DUPLICATE_RADIUS_M, if any. */
export function findNearbyDuplicate(monsters: Monster[], at: GeoPoint): Monster | undefined {
  let best: { m: Monster; d: number } | undefined;
  for (const m of monsters) {
    const d = distanceMeters(m.location, at);
    if (d <= DUPLICATE_RADIUS_M && (!best || d < best.d)) best = { m, d };
  }
  return best?.m;
}

/** Points to award for a fresh catch: nothing if it duplicates a house already in the collection. */
export function pointsForCatch(monsters: Monster[], at: GeoPoint): number {
  return findNearbyDuplicate(monsters, at) ? 0 : NEW_HOUSE_POINTS;
}

export function totalPoints(monsters: Monster[]): number {
  return monsters.reduce((sum, m) => sum + m.points, 0);
}

/** Returns the monster after it is marked resolved, adding the one-time bonus. */
export function markResolved(m: Monster, now = new Date()): Monster {
  if (m.reportStatus === "resolved") return m;
  return {
    ...m,
    reportStatus: "resolved",
    resolvedAt: now.toISOString(),
    points: m.points + RESOLVE_BONUS_POINTS,
  };
}
