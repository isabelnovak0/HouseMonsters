"use client";

import { motion } from "framer-motion";
import { darken, lighten, mix } from "@/lib/color";
import type { HouseFeatures, Palette } from "@/lib/types";
import { House, INK, houseGeometry } from "./House";

/** Every animal draws into the same box (y from -70 leaves headroom for 3-story houses + halo). */
/** Where each animal carries its house (centre x, ground line, wall width). */
export const HOUSE_ANCHORS = {
  turtle: { cx: 122, baseY: 104, width: 96 },
  snail: { cx: 146, baseY: 190, width: 108 },
  boxcat: { cx: 124, baseY: 160, width: 104 },
} as const;

export const VIEWBOX = { x: 0, y: -70, w: 260, h: 290 };

export interface AnimalProps {
  palette: Palette;
  features: HouseFeatures;
  conditionTags: string[];
  walking: boolean;
  roofHopKey: number;
  puffKey: number;
}

/** Leg that swings from its top edge while walking. */
function Leg({ walking, delay, children }: { walking: boolean; delay: number; children: React.ReactNode }) {
  return (
    <motion.g
      animate={walking ? { rotate: [-14, 14, -14] } : { rotate: 0 }}
      transition={walking ? { duration: 0.5, repeat: Infinity, ease: "easeInOut", delay } : { duration: 0.2 }}
      style={{ transformBox: "fill-box", transformOrigin: "50% 0%" }}
    >
      {children}
    </motion.g>
  );
}

/* ------------------------------------------------------------------ */
/* Turtle — follows the detailed reference: grey-green skin with line  */
/* texture, patterned shell, long neck looking up, yellow eye, claws.  */
/* ------------------------------------------------------------------ */
export function Turtle({ palette, features, conditionTags, walking, roofHopKey, puffKey }: AnimalProps) {
  const skin = mix("#a3ad97", palette.walls, 0.2);
  const skinDark = darken(skin, 0.18);
  const shell = mix("#5f7651", palette.surroundings, 0.45);
  const scute = lighten(shell, 0.12);
  const rim = mix("#b9b58a", palette.trim, 0.35);
  const spot = mix("#d2453a", palette.door, 0.4);
  const claw = "#f1ead6";

  const leg = (x: number, fill: string) => (
    <g>
      <path d={`M${x} 150 q -4 26 -2 42 h 26 q 2 -18 -4 -42 z`} fill={fill} stroke={INK} strokeWidth={3} />
      <path d={`M${x + 4} 165 q 2 10 0 18 M${x + 14} 162 q 3 12 1 22`} stroke={darken(fill, 0.25)} strokeWidth={1.5} fill="none" />
      {[0, 8, 16].map((dx) => (
        <path key={dx} d={`M${x + 1 + dx} 192 l 2 7 l 3 -7`} fill={claw} stroke={INK} strokeWidth={1.5} />
      ))}
    </g>
  );

  return (
    <g>
      <ellipse cx={122} cy={200} rx={110} ry={11} fill={INK} opacity={0.8} />
      {/* back legs */}
      <Leg walking={walking} delay={0.25}>{leg(46, skinDark)}</Leg>
      <Leg walking={walking} delay={0}>{leg(132, skinDark)}</Leg>
      {/* tail */}
      <path d="M30 156 l -18 10 l 22 2 z" fill={skin} stroke={INK} strokeWidth={2.5} />
      {/* shell */}
      <path d="M26 166 Q 30 94 128 90 Q 222 94 226 166 Z" fill={shell} stroke={INK} strokeWidth={3} />
      {[
        [46, 128, 34],
        [86, 108, 38],
        [130, 104, 38],
        [174, 112, 36],
        [62, 146, 30],
        [112, 140, 32],
        [160, 140, 32],
      ].map(([x, y, s], i) => (
        <g key={i}>
          <rect x={x} y={y} width={s} height={s * 0.7} rx={8} fill={scute} stroke={INK} strokeWidth={2} />
          <path
            d={`M${x + s / 2} ${y + s * 0.35} m -3 0 a 3 3 0 1 1 6 0 a 6 6 0 1 1 -12 0 a 9 9 0 1 1 18 0`}
            fill="none"
            stroke={darken(scute, 0.3)}
            strokeWidth={1.5}
          />
        </g>
      ))}
      <path d="M22 166 Q 128 182 230 166 L 226 176 Q 128 192 26 176 Z" fill={rim} stroke={INK} strokeWidth={2.5} />
      {/* front legs */}
      <Leg walking={walking} delay={0}>{leg(70, skin)}</Leg>
      <Leg walking={walking} delay={0.25}>{leg(156, skin)}</Leg>
      {/* neck + head, gazing up like the reference */}
      <path d="M180 172 C 186 132 198 104 214 84 Q 230 74 244 88 C 240 116 232 146 222 176 Z" fill={skin} stroke={INK} strokeWidth={3} />
      <path d="M194 160 C 198 132 206 112 218 96 M206 166 C 210 138 216 118 228 100 M218 170 C 222 146 228 124 236 106" stroke={skinDark} strokeWidth={1.6} fill="none" />
      <circle cx={204} cy={150} r={3} fill={skinDark} />
      <circle cx={212} cy={136} r={2.2} fill={skinDark} />
      <ellipse cx={234} cy={70} rx={25} ry={17} transform="rotate(-28 234 70)" fill={skin} stroke={INK} strokeWidth={3} />
      <circle cx={238} cy={62} r={8} fill="#f2d33b" stroke={INK} strokeWidth={2.2} />
      <ellipse cx={239} cy={62} rx={2.4} ry={5.5} fill={INK} transform="rotate(-28 239 62)" />
      <circle cx={221} cy={70} r={3.2} fill={spot} />
      <path d="M224 84 q 16 2 30 -14" fill="none" stroke={INK} strokeWidth={2.4} />
      <circle cx={254} cy={56} r={1.5} fill={INK} />

      <House
        features={features}
        palette={palette}
        conditionTags={conditionTags}
        {...HOUSE_ANCHORS.turtle}
        roofHopKey={roofHopKey}
        puffKey={puffKey}
      />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Snail — follows the minimal reference: smooth green body, eyestalks */
/* with dot eyes, sleepy smile, a little trail behind.                 */
/* ------------------------------------------------------------------ */
export function Snail({ palette, features, conditionTags, walking, roofHopKey, puffKey }: AnimalProps) {
  const body = mix("#5cc46a", palette.surroundings, 0.25);
  return (
    <g>
      <ellipse cx={130} cy={203} rx={104} ry={6} fill={INK} opacity={0.18} />
      {/* trail */}
      <motion.g animate={walking ? { opacity: [0.4, 1, 0.4] } : { opacity: 1 }} transition={{ duration: 1, repeat: walking ? Infinity : 0 }}>
        <ellipse cx={238} cy={199} rx={7} ry={2.5} fill={lighten(body, 0.2)} stroke={INK} strokeWidth={1.2} />
        <ellipse cx={252} cy={199} rx={3} ry={2} fill={lighten(body, 0.2)} stroke={INK} strokeWidth={1.2} />
      </motion.g>
      {/* eyestalks wiggle while walking */}
      <motion.g
        animate={walking ? { rotate: [-6, 6, -6] } : { rotate: 0 }}
        transition={{ duration: 0.8, repeat: walking ? Infinity : 0 }}
        style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
      >
        <path d="M40 104 L 34 64 M60 104 L 64 64" stroke={INK} strokeWidth={3} />
        <circle cx={34} cy={62} r={5} fill={body} stroke={INK} strokeWidth={2.5} />
        <circle cx={64} cy={62} r={5} fill={body} stroke={INK} strokeWidth={2.5} />
      </motion.g>
      {/* body: neck + long foot tapering to the tail */}
      <motion.path
        d="M30 200 L 30 120 Q 30 98 50 98 Q 70 98 72 122 L 76 168 Q 84 186 120 186 L 226 190 Q 236 200 220 200 Z"
        fill={body}
        stroke={INK}
        strokeWidth={3}
        animate={walking ? { scaleX: [1, 1.04, 1] } : { scaleX: 1 }}
        transition={{ duration: 0.8, repeat: walking ? Infinity : 0 }}
        style={{ transformBox: "fill-box", transformOrigin: "0% 100%" }}
      />
      <path d="M43 120 q 6 5 12 0" fill="none" stroke={INK} strokeWidth={2.4} />
      <path d="M46 132 q 5 3 10 0" fill="none" stroke={INK} strokeWidth={1.8} />

      <House
        features={features}
        palette={palette}
        conditionTags={conditionTags}
        {...HOUSE_ANCHORS.snail}
        roofHopKey={roofHopKey}
        puffKey={puffKey}
      />
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Box cat — follows the crate reference: a shy dark creature wearing  */
/* the house like a box; ears poke out, yellow eyes peer from a window.*/
/* ------------------------------------------------------------------ */
export function BoxCat({ palette, features, conditionTags, walking, roofHopKey, puffKey }: AnimalProps) {
  const fur = mix(INK, palette.roof, 0.12);
  const { cx, baseY, width } = HOUSE_ANCHORS.boxcat;
  const g = houseGeometry(features, cx, baseY, width);
  const earY = g.roofTop + 14;
  return (
    <g>
      <ellipse cx={126} cy={203} rx={78} ry={8} fill={INK} opacity={0.25} />
      {/* tail curling up behind */}
      <motion.path
        d={`M${cx + width / 2 - 6} ${baseY - 20} q 46 -6 34 -52 q -4 -14 8 -16`}
        fill="none"
        stroke={fur}
        strokeWidth={9}
        animate={{ rotate: walking ? [-8, 8, -8] : [-3, 3, -3] }}
        transition={{ duration: walking ? 0.6 : 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformBox: "fill-box", transformOrigin: "0% 100%" }}
      />
      {/* ears poke out of the roof */}
      <path d={`M${cx - 34} ${earY} l 8 -38 l 14 34 z`} fill={fur} stroke={INK} strokeWidth={2} />
      <path d={`M${cx + 34} ${earY} l -8 -38 l -14 34 z`} fill={fur} stroke={INK} strokeWidth={2} />
      {/* legs */}
      {[cx - 30, cx - 12, cx + 10, cx + 28].map((x, i) => (
        <Leg key={x} walking={walking} delay={i % 2 ? 0.25 : 0}>
          <path d={`M${x} ${baseY - 2} v 34 q 0 6 7 6 h 2 q 2 -4 -2 -6 v -34 z`} fill={fur} stroke={INK} strokeWidth={1.5} />
        </Leg>
      ))}
      <House
        features={features}
        palette={palette}
        conditionTags={conditionTags}
        cx={cx}
        baseY={baseY}
        width={width}
        eyesInWindow
        crateCorners
        roofHopKey={roofHopKey}
        puffKey={puffKey}
      />
    </g>
  );
}
