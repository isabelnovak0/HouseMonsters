"use client";

import type { GeoPoint } from "../types";

export type LocationError = "unsupported" | "denied" | "unavailable" | "timeout";

/** One GPS fix, or a typed error the UI can explain. */
export function getPosition(timeoutMs = 10_000): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject("unsupported" satisfies LocationError);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
      (e) =>
        reject(
          (e.code === e.PERMISSION_DENIED ? "denied" : e.code === e.TIMEOUT ? "timeout" : "unavailable") satisfies LocationError,
        ),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 15_000 },
    );
  });
}

/**
 * Keeps a warm GPS fix while the camera is open so the location is ready the
 * instant the shutter is pressed. Returns a stop function.
 */
export function watchPosition(onFix: (p: GeoPoint) => void, onError: (e: LocationError) => void): () => void {
  if (!("geolocation" in navigator)) {
    onError("unsupported");
    return () => {};
  }
  const id = navigator.geolocation.watchPosition(
    (p) => onFix({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy }),
    (e) => onError(e.code === e.PERMISSION_DENIED ? "denied" : e.code === e.TIMEOUT ? "timeout" : "unavailable"),
    { enableHighAccuracy: true, maximumAge: 10_000 },
  );
  return () => navigator.geolocation.clearWatch(id);
}

export const LOCATION_HELP: Record<LocationError, string> = {
  unsupported: "This browser can't share your location.",
  denied: "Location is turned off for this app.",
  unavailable: "We couldn't get a GPS fix.",
  timeout: "GPS took too long.",
};
