"use client";

import { motion, type TargetAndTransition, type Transition } from "framer-motion";
import { useEffect, useId, useState } from "react";
import type { DanceMove } from "@/lib/monster";
import type { AnimalType, HouseFeatures, Palette } from "@/lib/types";
import { BoxCat, HOUSE_ANCHORS, Snail, Turtle, VIEWBOX, type AnimalProps } from "./animals";
import { INK, houseGeometry } from "./House";

export type MonsterLook = {
  animal: AnimalType;
  palette: Palette;
  houseFeatures: HouseFeatures;
  conditionTags: string[];
};

export interface MonsterProps {
  monster: MonsterLook;
  /** Rendered width in CSS px; height follows the VIEWBOX aspect. */
  size?: number;
  walking?: boolean;
  /** Play a dance move; change `danceKey` to replay the same move. */
  dance?: DanceMove | null;
  danceKey?: number;
  /** Resolved houses become angels: halo, wings, see-through, gentle float. */
  angel?: boolean;
  /** Face left instead of right (used while wandering). */
  flip?: boolean;
  /** Hand-drawn wobble filter; turn off for tiny thumbnails. */
  wobble?: boolean;
  className?: string;
  title?: string;
}

const ANIMALS: Record<AnimalType, (p: AnimalProps) => React.ReactElement> = {
  turtle: Turtle,
  snail: Snail,
  boxcat: BoxCat,
};

const BODY_DANCES: Partial<Record<DanceMove, { animate: TargetAndTransition; transition: Transition }>> = {
  bounce: { animate: { y: [0, -34, 0, -18, 0], scaleY: [1, 0.9, 1.06, 0.95, 1] }, transition: { duration: 0.9, ease: "easeOut" } },
  spin: { animate: { rotate: [0, 360] }, transition: { duration: 0.9, ease: "easeInOut" } },
};

/** A house monster: the house from the photo riding on one of the three animals. */
export function Monster({
  monster,
  size = 240,
  walking = false,
  dance = null,
  danceKey = 0,
  angel = false,
  flip = false,
  wobble = true,
  className,
  title,
}: MonsterProps) {
  const filterId = useId().replace(/:/g, "");
  const Animal = ANIMALS[monster.animal] ?? Turtle;

  // lid hop / chimney puff are drawn inside the house; body dances wrap everything
  const [roofHopKey, setRoofHopKey] = useState(0);
  const [puffKey, setPuffKey] = useState(0);
  useEffect(() => {
    if (!danceKey) return;
    if (dance === "lidHop") setRoofHopKey((k) => k + 1);
    if (dance === "chimneyPuff") setPuffKey((k) => k + 1);
  }, [dance, danceKey]);

  const body = dance ? BODY_DANCES[dance] : undefined;
  const anchor = HOUSE_ANCHORS[monster.animal] ?? HOUSE_ANCHORS.turtle;
  const roofTop = houseGeometry(monster.houseFeatures, anchor.cx, anchor.baseY, anchor.width).roofTop;
  const haloY = roofTop - 16;
  const wingY = roofTop + 30;
  const height = (size * VIEWBOX.h) / VIEWBOX.w;

  return (
    <motion.svg
      viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`}
      width={size}
      height={height}
      className={className}
      role="img"
      aria-label={title}
      style={{ overflow: "visible", opacity: angel ? 0.5 : 1 }}
      animate={angel ? { y: [0, -8, 0] } : undefined}
      transition={angel ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : undefined}
    >
      {title && <title>{title}</title>}
      <defs>
        <filter id={`wobble-${filterId}`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={1} seed={3} />
          <feDisplacementMap in="SourceGraphic" scale={2.4} />
        </filter>
        <radialGradient id={`glow-${filterId}`}>
          <stop offset="0%" stopColor="#fff6c8" stopOpacity={0.9} />
          <stop offset="100%" stopColor="#fff6c8" stopOpacity={0} />
        </radialGradient>
      </defs>

      {angel && (
        <g>
          <ellipse cx={130} cy={wingY + 20} rx={130} ry={110} fill={`url(#glow-${filterId})`} />
          <path d={`M${anchor.cx - 40} ${wingY + 30} Q ${anchor.cx - 110} ${wingY} ${anchor.cx - 96} ${wingY - 44} Q ${anchor.cx - 70} ${wingY - 4} ${anchor.cx - 34} ${wingY + 8} Z`} fill="#fffbf2" stroke={INK} strokeWidth={3} />
          <path d={`M${anchor.cx + 40} ${wingY + 30} Q ${anchor.cx + 110} ${wingY} ${anchor.cx + 96} ${wingY - 44} Q ${anchor.cx + 70} ${wingY - 4} ${anchor.cx + 34} ${wingY + 8} Z`} fill="#fffbf2" stroke={INK} strokeWidth={3} />
        </g>
      )}

      <motion.g
        key={`${dance}-${danceKey}`}
        initial={false}
        animate={body?.animate ?? {}}
        transition={body?.transition}
        style={{ transformBox: "fill-box", transformOrigin: "50% 80%" }}
      >
        <g
          filter={wobble ? `url(#wobble-${filterId})` : undefined}
          transform={flip ? `translate(${VIEWBOX.w} 0) scale(-1 1)` : undefined}
        >
          <Animal
            palette={monster.palette}
            features={monster.houseFeatures}
            conditionTags={monster.conditionTags}
            walking={walking && !angel}
            roofHopKey={roofHopKey}
            puffKey={puffKey}
          />
        </g>
      </motion.g>

      {angel && (
        <motion.g animate={{ opacity: [0.75, 1, 0.75] }} transition={{ duration: 2, repeat: Infinity }}>
          <ellipse cx={anchor.cx} cy={haloY} rx={40} ry={10} fill="none" stroke="#e8b923" strokeWidth={8} />
          <ellipse cx={anchor.cx} cy={haloY} rx={48} ry={15} fill="none" stroke="#f6e3a1" strokeWidth={3} />
        </motion.g>
      )}
    </motion.svg>
  );
}
