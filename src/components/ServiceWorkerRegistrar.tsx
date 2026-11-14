"use client";

import { useEffect } from "react";

/** Registers /sw.js so the app shell works offline and can be installed. */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* non-fatal: the app still works online */
    });
  }, []);
  return null;
}
