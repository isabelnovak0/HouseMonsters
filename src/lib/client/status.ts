"use client";

import { markResolved } from "../points";
import { monsters as repo } from "../storage";
import type { Monster } from "../types";

/**
 * Asks the server whether the city closed each reported house (D-019) and turns
 * closed ones into angels. Returns the monsters that changed.
 */
export async function refreshStatuses(list: Monster[]): Promise<Monster[]> {
  const candidates = list.filter((m) => m.reportStatus === "reported" && m.reportRef);
  const changed: Monster[] = [];
  await Promise.all(
    candidates.map(async (m) => {
      try {
        const res = await fetch(`/api/report/status?ref=${encodeURIComponent(m.reportRef!)}`);
        const { status } = (await res.json()) as { status?: string };
        if (status === "closed") {
          const resolved = markResolved(m);
          await repo.put(resolved);
          changed.push(resolved);
        }
      } catch {
        /* offline or unknown: try again next visit */
      }
    }),
  );
  return changed;
}
