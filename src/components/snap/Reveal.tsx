"use client";

/* eslint-disable @next/next/no-img-element */
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Monster, type MonsterLook } from "@/components/monster/Monster";
import type { DanceMove } from "@/lib/monster";
import { MAX_NAME_LENGTH } from "@/lib/types";

const DANCE_LABEL: Record<DanceMove, string> = {
  bounce: "Big bounce",
  spin: "Shell spin",
  lidHop: "Roof hop",
  chimneyPuff: "Chimney puff",
};

type Phase = "burst" | "out" | "walk" | "dance0" | "dance1" | "dance2" | "done";

/** Schedule (ms from start). Total ≈ 4.8 s. */
const TIMELINE: [Phase, number][] = [
  ["burst", 0],
  ["out", 650],
  ["walk", 1350],
  ["dance0", 2400],
  ["dance1", 3200],
  ["dance2", 4000],
  ["done", 4800],
];

export interface RevealProps {
  photo: string;
  look: MonsterLook;
  dances: DanceMove[];
  name: string;
  onNameChange: (name: string) => void;
  /** Points this catch will earn once reported (0 for a duplicate). */
  points: number;
  duplicateOf?: string;
  analysisNote?: string;
  onNext: () => void;
}

/**
 * The fun part: the monster bursts out of the photo, walks across the stage and
 * does three short dance moves, then the user names it (≤15 characters).
 */
export function Reveal({ photo, look, dances, name, onNameChange, points, duplicateOf, analysisNote, onNext }: RevealProps) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(reduceMotion ? "done" : "burst");

  useEffect(() => {
    if (reduceMotion) return;
    const timers = TIMELINE.map(([p, at]) => setTimeout(() => setPhase(p), at));
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion]);

  const danceIndex = phase.startsWith("dance") ? Number(phase.slice(5)) : -1;
  const dance = danceIndex >= 0 ? dances[danceIndex] : null;
  const out = phase !== "burst";
  const walking = phase === "walk";
  const atRest = phase === "done" || danceIndex >= 0;

  const monsterAnim = !out
    ? { scale: 0.15, x: -70, y: -70, opacity: 0, rotate: -20 }
    : phase === "out"
      ? { scale: 1, x: -60, y: 0, opacity: 1, rotate: 0 }
      : walking
        ? { scale: 1, x: 40, y: 0, opacity: 1, rotate: 0 }
        : { scale: 1, x: 20, y: 0, opacity: 1, rotate: 0 };

  return (
    <div className="flex min-h-dvh flex-col pb-[max(2rem,env(safe-area-inset-bottom))]">
      <p className="pt-[max(1.5rem,env(safe-area-inset-top))] text-center text-[13px] font-bold tracking-wide text-ink-soft">
        A WILD HOUSE MONSTER APPEARED
      </p>

      {/* stage */}
      <div className="relative mx-auto mt-1 h-[360px] w-full max-w-[390px] overflow-hidden">
        <motion.div
          className="absolute left-6 top-4 w-[170px] border-[2.5px] border-ink bg-paper p-2 pb-8"
          initial={{ rotate: -7 }}
          animate={phase === "burst" ? { rotate: [-7, -3, -11, -4, -9, -7], x: [0, -3, 3, -2, 2, 0] } : { rotate: -7 }}
          transition={{ duration: 0.6 }}
        >
          <img src={photo} alt="The photo you just took" className="aspect-[4/3] w-full object-cover" />
        </motion.div>

        <motion.div
          className="absolute bottom-0 left-1/2 -ml-[150px]"
          initial={false}
          animate={monsterAnim}
          transition={
            phase === "out"
              ? { type: "spring", stiffness: 180, damping: 12 }
              : walking
                ? { duration: 1, ease: "linear" }
                : { duration: 0.3 }
          }
        >
          <Monster monster={look} size={300} walking={walking} dance={dance} danceKey={danceIndex + 1} title="Your new house monster" />
        </motion.div>

        <AnimatePresence>
          {out && phase !== "done" && points > 0 && (
            <motion.div
              key="points"
              className="absolute right-5 top-8 flex h-20 w-20 items-center justify-center"
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: [0, 1.3, 1], rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <svg aria-hidden="true" viewBox="-40 -40 80 80" className="absolute inset-0">
                <polygon points="0,-38 10,-12 38,-14 16,4 26,32 0,16 -26,32 -16,4 -38,-14 -10,-12" fill="#f6e3a1" stroke="#2b2a26" strokeWidth="3" strokeLinejoin="round" />
              </svg>
              <span className="relative font-[family-name:var(--font-display)] text-lg font-bold">+{points}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex h-8 items-center justify-center" aria-live="polite">
        {dance && (
          <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-paper">
            Dance {danceIndex + 1} of 3 · {DANCE_LABEL[dance]}
          </span>
        )}
      </div>

      {duplicateOf && (
        <p className="mx-6 mt-2 rounded-xl border-2 border-ink bg-butter px-3 py-2 text-sm font-semibold">
          Looks like you already caught <b>{duplicateOf}</b> at this spot, so this one earns no points. You can still report it.
        </p>
      )}
      {analysisNote && <p className="mx-6 mt-2 text-center text-sm text-ink-soft">{analysisNote}</p>}

      <motion.div
        className="mt-4 flex flex-col gap-2 px-6"
        initial={false}
        animate={{ opacity: atRest || reduceMotion ? 1 : 0.35 }}
      >
        <div className="flex items-baseline justify-between">
          <label htmlFor="monster-name" className="font-[family-name:var(--font-display)] text-lg font-semibold">
            Name your monster
          </label>
          <span className={`text-[13px] font-bold ${name.length >= MAX_NAME_LENGTH ? "text-[#b03a22]" : "text-ink-soft"}`}>
            {name.length}/{MAX_NAME_LENGTH}
          </span>
        </div>
        <input
          id="monster-name"
          type="text"
          value={name}
          maxLength={MAX_NAME_LENGTH}
          onChange={(e) => onNameChange(e.target.value.slice(0, MAX_NAME_LENGTH))}
          autoComplete="off"
          enterKeyHint="next"
          className="h-[54px] rounded-[14px] border-[2.5px] border-ink bg-paper px-4 font-[family-name:var(--font-display)] text-xl font-semibold outline-none focus:ring-4 focus:ring-butter"
        />
      </motion.div>

      <div className="mt-auto px-6 pt-6">
        <button
          type="button"
          onClick={onNext}
          disabled={!name.trim()}
          className="sticker h-[58px] w-full rounded-2xl bg-moss font-[family-name:var(--font-display)] text-lg font-semibold text-paper disabled:opacity-50"
        >
          Next: check the 311 report
        </button>
      </div>
    </div>
  );
}
