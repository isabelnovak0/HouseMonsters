import type { GeoPoint } from "./types";

const EARTH_RADIUS_M = 6_371_000;

/** Great-circle distance in metres (haversine). */
export function distanceMeters(a: GeoPoint, b: GeoPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** "33.5186, -86.8104" — used when reverse geocoding fails. */
export function formatCoords(p: GeoPoint): string {
  return `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
}
