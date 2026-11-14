"use client";

import { useCallback, useEffect, useState } from "react";
import { monsters as repo } from "../storage";
import type { Monster } from "../types";

/** Loads the on-device collection; `reload()` after any write. */
export function useMonsters() {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(true);
  const reload = useCallback(async () => {
    try {
      setMonsters(await repo.list());
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
    // the outbox may flip statuses in the background
    const onOnline = () => setTimeout(() => void reload(), 3000);
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [reload]);
  return { monsters, loading, reload };
}
