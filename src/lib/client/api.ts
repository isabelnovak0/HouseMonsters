"use client";

import type { HouseAnalysis, ReportPayload, ReportResult } from "../types";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function jsonOrError<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError((body as { error?: string }).error ?? `Request failed (${res.status})`, res.status);
  return body as T;
}

export async function analyzePhoto(image: string): Promise<HouseAnalysis> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image }),
  });
  return (await jsonOrError<{ analysis: HouseAnalysis }>(res)).analysis;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
  return (await jsonOrError<{ address: string }>(res)).address;
}

export async function geocodeAddress(q: string): Promise<{ lat: number; lng: number; address: string }> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
  return jsonOrError(res);
}

/** Sends a report. Network failures surface as ApiError(status 0) so callers can queue. */
export async function sendReport(payload: ReportPayload): Promise<ReportResult> {
  let res: Response;
  try {
    res = await fetch("/api/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new ApiError("You're offline.", 0);
  }
  const body = (await res.json().catch(() => ({ ok: false, channel: "none" }))) as ReportResult;
  if (!res.ok || !body.ok) throw new ApiError(body.error ?? `Report failed (${res.status})`, res.status);
  return body;
}

/** A failure worth retrying later rather than showing as final. */
export function isRetryable(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 0 || e.status === 429 || e.status >= 500);
}
