"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Wanderer } from "@/components/collection/Wanderer";
import { BackIcon, CameraIcon, CheckIcon, CloseIcon } from "@/components/ui/icons";
import { MapBackdrop } from "@/components/ui/MapBackdrop";
import { isRetryable, sendReport } from "@/lib/client/api";
import { markReported, toPayload } from "@/lib/client/outbox";
import { refreshStatuses } from "@/lib/client/status";
import { useMonsters } from "@/lib/client/useMonsters";
import { markResolved, NEW_HOUSE_POINTS, RESOLVE_BONUS_POINTS, totalPoints } from "@/lib/points";
import { monsters as repo } from "@/lib/storage";
import type { Monster } from "@/lib/types";

export default function CollectionPage() {
  const { monsters, loading, reload } = useMonsters();
  const [selectedId, setSelectedId] = useState<string>();
  const [toast, setToast] = useState<string>();
  const selected = monsters.find((m) => m.id === selectedId);
  const angels = monsters.filter((m) => m.reportStatus === "resolved").length;

  // Ask the city (when an API is configured) whether any reported houses were fixed.
  useEffect(() => {
    if (loading || !monsters.length) return;
    refreshStatuses(monsters).then((changed) => {
      if (!changed.length) return;
      void reload();
      setToast(`${changed[0].name} was fixed by the city and earned a halo! +${RESOLVE_BONUS_POINTS} pts`);
    });
    // run once after the first load
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(undefined), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <MapBackdrop className="absolute inset-0 h-full w-full" />

      <div className="absolute inset-0" onClick={() => setSelectedId(undefined)} aria-hidden="true" />
      <div className="absolute inset-0 pointer-events-none [&>*]:pointer-events-auto">
        {monsters.map((m) => (
          <Wanderer key={m.id} monster={m} selected={m.id === selectedId} onSelect={() => setSelectedId(m.id)} />
        ))}
      </div>

      <header className="absolute inset-x-4 top-[max(1rem,env(safe-area-inset-top))] z-[200] flex items-center gap-2.5">
        <Link href="/" aria-label="Home" className="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-ink bg-paper">
          <BackIcon className="h-6 w-6" />
        </Link>
        <div className="flex h-12 min-w-0 flex-1 items-center justify-between gap-2 rounded-2xl border-2 border-ink bg-paper px-3.5">
          <h1 className="whitespace-nowrap font-[family-name:var(--font-display)] text-[17px] font-semibold">My monsters</h1>
          <span className="whitespace-nowrap text-[13px] font-bold text-ink-soft" aria-label={`${monsters.length} caught, ${angels} fixed, ${totalPoints(monsters)} points`}>
            {monsters.length} caught · {angels} saved · {totalPoints(monsters)}★
          </span>
        </div>
      </header>

      <AnimatePresence>
        {toast && (
          <motion.div
            role="status"
            className="absolute left-1/2 top-[calc(max(1rem,env(safe-area-inset-top))+60px)] z-[200] flex w-max max-w-[90%] -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-4 py-2 text-[13px] font-bold text-paper"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CheckIcon className="h-4 w-4 shrink-0 text-[#9dd48a]" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && monsters.length === 0 && (
        <div className="absolute inset-x-6 top-1/3 z-[150] rounded-3xl border-[2.5px] border-ink bg-paper p-6 text-center">
          <p className="font-[family-name:var(--font-display)] text-2xl font-semibold">No monsters yet</p>
          <p className="mt-2 text-[15px] text-ink-soft">Snap an abandoned house and its monster will move in here.</p>
          <Link href="/snap" className="sticker mt-4 flex h-14 items-center justify-center gap-2 rounded-2xl bg-moss font-[family-name:var(--font-display)] text-lg font-semibold text-paper">
            <CameraIcon className="h-6 w-6" /> Snap a house
          </Link>
        </div>
      )}

      <AnimatePresence>
        {selected ? (
          <MonsterCard
            key={selected.id}
            monster={selected}
            onClose={() => setSelectedId(undefined)}
            onChanged={async (message) => {
              await reload();
              if (message) setToast(message);
            }}
          />
        ) : (
          monsters.length > 0 && (
            <motion.p
              key="hint"
              className="absolute inset-x-0 bottom-[max(2rem,env(safe-area-inset-bottom))] z-[150] text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <span className="rounded-full border-2 border-ink bg-paper px-3.5 py-2 text-[13px] font-bold">
                Tap a monster · halo = fixed by the city
              </span>
            </motion.p>
          )
        )}
      </AnimatePresence>
    </div>
  );
}

/** Small popup: name, location, date found, status, and the next action. */
function MonsterCard({ monster, onClose, onChanged }: { monster: Monster; onClose: () => void; onChanged: (toast?: string) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [error, setError] = useState<string>();

  const status =
    monster.reportStatus === "resolved"
      ? { label: "Fixed by the city · angel", cls: "bg-butter text-ink" }
      : monster.reportStatus === "reported"
        ? { label: "Reported to 311", cls: "bg-sky text-paper" }
        : monster.pendingReport
          ? { label: "Waiting for signal", cls: "bg-ink-soft text-paper" }
          : { label: "Not reported yet", cls: "bg-parchment text-ink" };

  async function resolve() {
    setBusy(true);
    await repo.put(markResolved(monster));
    await onChanged(`${monster.name} earned its halo! +${RESOLVE_BONUS_POINTS} pts`);
    setBusy(false);
  }

  async function report() {
    setBusy(true);
    setError(undefined);
    const queued: Monster = { ...monster, pendingReport: true, points: NEW_HOUSE_POINTS };
    await repo.put(queued);
    try {
      const result = await sendReport(toPayload(queued));
      await repo.put(markReported(queued, result.reference, NEW_HOUSE_POINTS));
      await onChanged(`Report sent for ${monster.name}! +${NEW_HOUSE_POINTS} pts`);
    } catch (e) {
      if (isRetryable(e)) {
        await onChanged("No signal, the report will send when you're back online.");
      } else {
        await repo.put({ ...monster, pendingReport: false });
        setError(e instanceof Error ? e.message : "Sending failed.");
        await onChanged();
      }
    }
    setBusy(false);
    setConfirmSend(false);
  }

  return (
    <motion.div
      role="dialog"
      aria-label={`${monster.name} details`}
      className="sticker absolute inset-x-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-[300] rounded-[20px] bg-paper p-4"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-[22px] font-semibold leading-tight">{monster.name}</h2>
          <span className={`mt-1.5 inline-block rounded-full border-[1.5px] border-ink px-2.5 py-0.5 text-xs font-bold ${status.cls}`}>{status.label}</span>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-parchment">
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2.5 text-[13px]">
        <div>
          <dt className="font-bold text-ink-soft">Location</dt>
          <dd className="font-semibold">{monster.address}</dd>
        </div>
        <div>
          <dt className="font-bold text-ink-soft">Found</dt>
          <dd className="font-semibold">{new Date(monster.foundAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}</dd>
        </div>
      </dl>

      {error && <p role="alert" className="mt-2 text-sm font-semibold text-[#b03a22]">{error}</p>}

      {monster.reportStatus === "reported" && (
        <button
          type="button"
          onClick={resolve}
          disabled={busy}
          className="mt-3 h-12 w-full rounded-xl border-2 border-ink bg-butter font-[family-name:var(--font-display)] text-base font-semibold disabled:opacity-50"
        >
          The city fixed it: mark as resolved
        </button>
      )}
      {monster.reportStatus === "draft" && !monster.pendingReport && (
        confirmSend ? (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-[13px] text-ink-soft">This sends the photo, address and description to Birmingham 311.</p>
            <div className="flex gap-2">
              <button type="button" onClick={report} disabled={busy} className="h-12 flex-1 rounded-xl border-2 border-ink bg-sky font-[family-name:var(--font-display)] font-semibold text-paper disabled:opacity-50">
                {busy ? "Sending…" : "Send to 311"}
              </button>
              <button type="button" onClick={() => setConfirmSend(false)} disabled={busy} className="h-12 rounded-xl px-3 font-semibold">
                Not now
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmSend(true)}
            className="mt-3 h-12 w-full rounded-xl border-2 border-ink bg-sky font-[family-name:var(--font-display)] text-base font-semibold text-paper"
          >
            Report this house to 311
          </button>
        )
      )}
    </motion.div>
  );
}
