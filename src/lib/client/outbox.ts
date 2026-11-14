"use client";

import { monsters } from "../storage";
import type { Monster, ReportPayload } from "../types";
import { isRetryable, sendReport } from "./api";

export function toPayload(m: Monster): ReportPayload {
  return {
    monsterId: m.id,
    monsterName: m.name,
    address: m.address,
    location: m.location,
    foundAt: m.foundAt,
    description: m.description,
    conditionTags: m.conditionTags,
    photo: m.photo,
    reporter: m.reporter,
  };
}

/** Applies a successful send to the stored monster. */
export function markReported(m: Monster, reference: string | undefined, points: number): Monster {
  return {
    ...m,
    reportStatus: "reported",
    reportRef: reference,
    reportedAt: new Date().toISOString(),
    pendingReport: false,
    points,
  };
}

let flushing = false;

/**
 * Retries every confirmed-but-unsent report (offline queue). Safe to call
 * repeatedly; runs on app start and whenever the browser comes back online.
 * Returns how many were sent.
 */
export async function flushOutbox(): Promise<number> {
  if (flushing || (typeof navigator !== "undefined" && !navigator.onLine)) return 0;
  flushing = true;
  let sent = 0;
  try {
    const pending = (await monsters.list()).filter((m) => m.pendingReport && m.reportStatus === "draft");
    for (const m of pending) {
      try {
        const result = await sendReport(toPayload(m));
        await monsters.put(markReported(m, result.reference, m.points));
        sent++;
      } catch (e) {
        if (!isRetryable(e)) {
          // rejected for good: stop retrying, leave it as an unsent draft the user can fix
          await monsters.put({ ...m, pendingReport: false });
        }
      }
    }
  } finally {
    flushing = false;
  }
  return sent;
}
