"use client";

import { useEffect } from "react";
import { flushOutbox } from "@/lib/client/outbox";

/** Sends queued reports on start-up and whenever the connection returns. */
export function OutboxFlusher() {
  useEffect(() => {
    void flushOutbox();
    const onOnline = () => void flushOutbox();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);
  return null;
}
