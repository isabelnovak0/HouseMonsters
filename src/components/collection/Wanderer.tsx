"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Monster } from "@/components/monster/Monster";
import { DANCE_MOVES, hash, type DanceMove } from "@/lib/monster";
import type { Monster as MonsterRecord } from "@/lib/types";

/** Monster width on the map in px. */
export const WANDERER_SIZE = 116;
const SPEED_PCT_PER_S = 7;

type Pos = { x: number; y: number };

/** Random point inside the roaming area (percent of the map), kept clear of the header and card. */
function randomTarget(rand: () => number): Pos {
  return { x: 4 + rand() * 62, y: 14 + rand() * 54 };
}

function seeded(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * One monster roaming the map: walks to a random spot, pauses, sometimes dances.
 * Angels (resolved houses) drift slowly instead of walking.
 */
export function Wanderer({ monster, selected, onSelect }: { monster: MonsterRecord; selected: boolean; onSelect: () => void }) {
  const reduceMotion = useReducedMotion();
  const angel = monster.reportStatus === "resolved";
  const randRef = useRef(seeded(hash(monster.id)));
  const [pos, setPos] = useState<Pos>(() => randomTarget(randRef.current));
  const [moving, setMoving] = useState<{ duration: number } | null>(null);
  const [flip, setFlip] = useState(false);
  const [dance, setDance] = useState<{ move: DanceMove; key: number } | null>(null);

  useEffect(() => {
    if (reduceMotion || selected) return;
    let timer: ReturnType<typeof setTimeout>;
    const rand = randRef.current;

    const step = (from: Pos) => {
      timer = setTimeout(
        () => {
          const to = angel ? { x: clamp(from.x + (rand() - 0.5) * 16, 4, 66), y: clamp(from.y + (rand() - 0.5) * 12, 14, 68) } : randomTarget(rand);
          const dist = Math.hypot(to.x - from.x, to.y - from.y);
          const duration = Math.max(1.2, dist / (angel ? SPEED_PCT_PER_S / 2 : SPEED_PCT_PER_S));
          setFlip(to.x < from.x);
          setMoving({ duration });
          setPos(to);
          timer = setTimeout(() => {
            setMoving(null);
            if (!angel && rand() < 0.3) setDance({ move: DANCE_MOVES[Math.floor(rand() * DANCE_MOVES.length)], key: Date.now() });
            step(to);
          }, duration * 1000);
        },
        1500 + rand() * 3500,
      );
    };
    step(pos);
    return () => clearTimeout(timer);
    // restart the loop only when mode changes, not on every position update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angel, selected, reduceMotion]);

  const label = `${monster.name}, ${angel ? "fixed by the city" : monster.reportStatus === "reported" ? "reported" : "not reported yet"}`;

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-label={label}
      aria-pressed={selected}
      className="absolute rounded-3xl outline-none focus-visible:ring-4 focus-visible:ring-sky"
      style={{ width: WANDERER_SIZE, zIndex: Math.round(pos.y) + (selected ? 100 : 0) }}
      initial={false}
      animate={{ left: `${pos.x}%`, top: `${pos.y}%`, scale: selected ? 1.15 : 1 }}
      transition={{ left: { duration: moving?.duration ?? 0, ease: "linear" }, top: { duration: moving?.duration ?? 0, ease: "linear" }, scale: { duration: 0.2 } }}
    >
      <Monster
        monster={monster}
        size={WANDERER_SIZE}
        walking={Boolean(moving) && !angel}
        angel={angel}
        flip={flip}
        dance={dance?.move ?? null}
        danceKey={dance?.key ?? 0}
        wobble={false}
      />
      {monster.reportStatus === "draft" && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full border-2 border-ink bg-butter px-1.5 text-[10px] font-bold">
          {monster.pendingReport ? "queued" : "unsent"}
        </span>
      )}
    </motion.button>
  );
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
