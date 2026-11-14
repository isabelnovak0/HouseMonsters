"use client";

import { motion } from "framer-motion";
import { darken, lighten, mix } from "@/lib/color";
import type { HouseFeatures, Palette } from "@/lib/types";

export const INK = "#2b2a26";
const GLASS = "#bfe3ea";
const STORY_H = 34;

export interface HouseGeometry {
  wallX: number;
  wallY: number;
  width: number;
  height: number;
  roofTop: number;
}

/** Shared by animals that need to know where the house ends (e.g. box cat ears). */
export function houseGeometry(features: HouseFeatures, cx: number, baseY: number, width: number): HouseGeometry {
  const stories = clamp(features.stories, 1, 3);
  const height = stories * STORY_H;
  const wallY = baseY - height;
  const roofH = features.roofShape === "flat" ? 10 : features.roofShape === "hip" ? 30 : 40;
  return { wallX: cx - width / 2, wallY, width, height, roofTop: wallY - roofH };
}

export interface HouseProps {
  features: HouseFeatures;
  palette: Palette;
  conditionTags: string[];
  cx: number;
  baseY: number;
  width: number;
  /** Box cat: one window shows glowing eyes instead of glass. */
  eyesInWindow?: boolean;
  /** Box cat: dark metal corner brackets like a crate. */
  crateCorners?: boolean;
  /** Increments to replay the roof "lid hop" dance move. */
  roofHopKey?: number;
  /** Increments to replay the chimney puff dance move. */
  puffKey?: number;
}

/**
 * A cartoon house drawn from the photo analysis: number of stories, roof shape,
 * window count, door position, porch and chimney come from `features`; every
 * fill comes from the photo `palette`; visible damage (boarded windows, broken
 * glass, overgrowth…) is drawn from `conditionTags`, so it looks like the user's house.
 */
export function House({
  features,
  palette,
  conditionTags,
  cx,
  baseY,
  width,
  eyesInWindow,
  crateCorners,
  roofHopKey = 0,
  puffKey = 0,
}: HouseProps) {
  const g = houseGeometry(features, cx, baseY, width);
  const stories = clamp(features.stories, 1, 3);
  const tags = new Set(conditionTags);
  const wallFill = palette.walls;
  const roofFill = palette.roof;
  const trim = palette.trim;
  const door = palette.door;

  // --- door ---
  const doorW = 16;
  const doorH = 26;
  const doorX =
    features.doorPosition === "left"
      ? g.wallX + 10
      : features.doorPosition === "right"
        ? g.wallX + g.width - 10 - doorW
        : cx - doorW / 2;
  const doorY = baseY - doorH;

  // --- windows: spread across stories, ground floor avoids the door ---
  const windowCount = eyesInWindow ? Math.max(1, features.windowCount) : features.windowCount;
  const windows = layoutWindows(windowCount, stories, g, doorX, doorW);
  const eyesIndex = eyesInWindow ? Math.max(0, windows.findIndex((w) => w.story === stories - 1)) : -1;

  // --- chimney (drawn before the roof so the roof overlaps its base) ---
  const chimneyX = g.wallX + g.width * 0.68;
  const chimneyTop = g.roofTop - 4;

  return (
    <g strokeLinejoin="round" strokeLinecap="round">
      {features.chimney && (
        <g>
          <rect x={chimneyX} y={chimneyTop} width={11} height={g.wallY - chimneyTop} fill={darken(door, 0.15)} stroke={INK} strokeWidth={2.5} />
          <rect x={chimneyX - 2} y={chimneyTop - 4} width={15} height={6} fill={darken(door, 0.3)} stroke={INK} strokeWidth={2.5} />
          <motion.path
            key={`puff-${puffKey}`}
            d={`M${chimneyX + 5} ${chimneyTop - 8} c -8 -8 8 -12 0 -20 c -6 -6 10 -10 4 -18`}
            fill="none"
            stroke="#b9c2c4"
            strokeWidth={4}
            initial={puffKey ? { scale: 0.6, opacity: 0.4 } : false}
            animate={puffKey ? { scale: [0.6, 1.6, 1], opacity: [0.4, 1, 0.9], y: [0, -10, 0] } : {}}
            transition={{ duration: 0.9 }}
            style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
          />
        </g>
      )}

      {/* foundation */}
      <rect x={g.wallX - 3} y={baseY - 5} width={g.width + 6} height={7} fill={darken(wallFill, 0.45)} stroke={INK} strokeWidth={2.5} />

      {/* walls, one band per story */}
      <rect x={g.wallX} y={g.wallY} width={g.width} height={g.height - 4} fill={wallFill} stroke={INK} strokeWidth={3} />
      {Array.from({ length: stories - 1 }, (_, i) => {
        const y = g.wallY + (i + 1) * STORY_H;
        return <rect key={i} x={g.wallX - 3} y={y - 3} width={g.width + 6} height={6} fill={darken(trim, 0.25)} stroke={INK} strokeWidth={2} />;
      })}
      {tags.has("peeling paint") && (
        <g fill={lighten(wallFill, 0.35)} stroke={INK} strokeWidth={1.2}>
          <path d={`M${g.wallX + 6} ${g.wallY + 8} l 8 2 l -2 6 l -6 -1 z`} />
          <path d={`M${g.wallX + g.width - 18} ${baseY - 20} l 9 1 l -1 7 l -7 -2 z`} />
        </g>
      )}
      {tags.has("graffiti") && (
        <path
          d={`M${g.wallX + 6} ${baseY - 12} q 6 -10 12 0 t 12 0`}
          fill="none"
          stroke={mix(door, "#d23c8c", 0.6)}
          strokeWidth={2.5}
        />
      )}
      {crateCorners && (
        <g fill={INK}>
          {[
            [g.wallX, g.wallY],
            [g.wallX + g.width, g.wallY],
            [g.wallX, baseY - 4],
            [g.wallX + g.width, baseY - 4],
          ].map(([x, y], i) => (
            <rect key={i} x={x - 5} y={y - 5} width={10} height={10} rx={2} />
          ))}
        </g>
      )}

      {/* windows */}
      {windows.map((w, i) => (
        <Window
          key={i}
          x={w.x}
          y={w.y}
          trim={trim}
          variant={
            i === eyesIndex
              ? "eyes"
              : tags.has("boarded windows") && i % 2 === 0
                ? "boarded"
                : tags.has("broken glass") && i === 1
                  ? "broken"
                  : "glass"
          }
        />
      ))}

      {/* door */}
      <path
        d={`M${doorX} ${baseY - 4} V${doorY + 7} a ${doorW / 2} 7 0 0 1 ${doorW} 0 V${baseY - 4} Z`}
        fill={tags.has("open or missing door") ? INK : door}
        stroke={INK}
        strokeWidth={2.5}
      />
      {!tags.has("open or missing door") && (
        <g stroke={darken(door, 0.35)} strokeWidth={1.5}>
          <line x1={doorX + 5.5} y1={doorY + 4} x2={doorX + 5.5} y2={baseY - 5} />
          <line x1={doorX + 10.5} y1={doorY + 4} x2={doorX + 10.5} y2={baseY - 5} />
          <circle cx={doorX + doorW - 4} cy={baseY - 15} r={1.4} fill={INK} stroke="none" />
        </g>
      )}

      {/* porch: little awning + rail */}
      {features.porch && (
        <g stroke={INK} strokeWidth={2.2}>
          <path d={`M${doorX - 9} ${doorY - 1} h ${doorW + 18} l -4 -7 h ${-(doorW + 10)} z`} fill={darken(roofFill, 0.05)} />
          <rect x={g.wallX - 6} y={baseY - 14} width={g.width + 12} height={4} fill={lighten(trim, 0.15)} />
          {Array.from({ length: Math.floor((g.width + 12) / 10) + 1 }, (_, i) => {
            const x = g.wallX - 6 + i * 10;
            if (x > doorX - 4 && x < doorX + doorW + 4) return null;
            return <line key={i} x1={x} y1={baseY - 10} x2={x} y2={baseY - 4} />;
          })}
        </g>
      )}

      {/* roof (its own group so it can "hop" like a lid) */}
      <motion.g
        key={`roof-${roofHopKey}`}
        initial={false}
        animate={roofHopKey ? { y: [0, -18, 0, -8, 0], rotate: [0, -6, 0, 4, 0] } : {}}
        transition={{ duration: 0.9, ease: "easeOut" }}
        style={{ transformBox: "fill-box", transformOrigin: "50% 100%" }}
      >
        <Roof features={features} g={g} cx={cx} fill={roofFill} />
      </motion.g>

      {/* yard mess drawn last, in front */}
      {tags.has("overgrowth") && (
        <g stroke={INK} strokeWidth={2}>
          <circle cx={g.wallX + 2} cy={baseY - 6} r={9} fill={mix(palette.surroundings, "#4e7a3c", 0.5)} />
          <circle cx={g.wallX + 12} cy={baseY - 3} r={7} fill={mix(palette.surroundings, "#6e9c58", 0.5)} />
          <circle cx={g.wallX + g.width - 4} cy={baseY - 5} r={8} fill={mix(palette.surroundings, "#4e7a3c", 0.5)} />
          <path d={`M${g.wallX + g.width * 0.4} ${g.wallY + 4} q 6 8 2 18`} fill="none" stroke="#4e7a3c" strokeWidth={2.5} />
        </g>
      )}
      {tags.has("trash or debris") && (
        <g stroke={INK} strokeWidth={1.8}>
          <rect x={g.wallX + g.width - 22} y={baseY - 8} width={9} height={7} fill="#c9b48a" transform={`rotate(-12 ${g.wallX + g.width - 18} ${baseY - 4})`} />
          <ellipse cx={g.wallX + g.width - 8} cy={baseY - 2} rx={5} ry={3} fill="#8fa3ae" />
        </g>
      )}
      {tags.has("fire damage") && (
        <path
          d={`M${g.wallX + g.width * 0.55} ${g.wallY} q 10 14 -2 30 q -10 -12 2 -30 z`}
          fill={INK}
          opacity={0.55}
        />
      )}
    </g>
  );
}

function Roof({ features, g, cx, fill }: { features: HouseFeatures; g: HouseGeometry; cx: number; fill: string }) {
  const l = g.wallX - 9;
  const r = g.wallX + g.width + 9;
  const shingle = darken(fill, 0.25);
  if (features.roofShape === "flat") {
    return (
      <g>
        <rect x={g.wallX - 5} y={g.roofTop} width={g.width + 10} height={g.wallY - g.roofTop + 2} fill={fill} stroke={INK} strokeWidth={3} />
        <line x1={g.wallX} y1={g.roofTop + 5} x2={g.wallX + g.width} y2={g.roofTop + 5} stroke={shingle} strokeWidth={2} />
      </g>
    );
  }
  const points =
    features.roofShape === "hip"
      ? `${l},${g.wallY + 2} ${g.wallX + g.width * 0.2},${g.roofTop} ${g.wallX + g.width * 0.8},${g.roofTop} ${r},${g.wallY + 2}`
      : `${l},${g.wallY + 2} ${cx},${g.roofTop} ${r},${g.wallY + 2}`;
  const h = g.wallY - g.roofTop;
  // scalloped shingle rows like the reference turtle's tiled roof
  const rows = [0.4, 0.72].map((t) => {
    const y = g.roofTop + h * t;
    const half = features.roofShape === "hip" ? g.width * 0.3 + (g.width * 0.2 + 9) * t : (g.width / 2 + 9) * t;
    const x0 = cx - half + 3;
    const x1 = cx + half - 3;
    const n = Math.max(2, Math.round((x1 - x0) / 9));
    const step = (x1 - x0) / n;
    let d = `M${x0} ${y}`;
    for (let i = 0; i < n; i++) d += ` q ${step / 2} 5 ${step} 0`;
    return d;
  });
  return (
    <g>
      <polygon points={points} fill={fill} stroke={INK} strokeWidth={3} />
      {rows.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={shingle} strokeWidth={2} />
      ))}
      {features.roofShape === "gable" && <circle cx={cx} cy={g.roofTop - 3} r={3} fill={lighten(fill, 0.3)} stroke={INK} strokeWidth={2} />}
    </g>
  );
}

type WindowVariant = "glass" | "boarded" | "broken" | "eyes";

function Window({ x, y, trim, variant }: { x: number; y: number; trim: string; variant: WindowVariant }) {
  const w = 14;
  const h = 12;
  const dark = variant === "eyes" || variant === "broken";
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={1.5} fill={dark ? INK : GLASS} stroke={INK} strokeWidth={2.2} />
      {variant === "glass" && (
        <g stroke={trim} strokeWidth={1.6}>
          <line x1={x + w / 2} y1={y + 1} x2={x + w / 2} y2={y + h - 1} />
          <line x1={x + 1} y1={y + h / 2} x2={x + w - 1} y2={y + h / 2} />
        </g>
      )}
      {variant === "boarded" && (
        <g fill={trim} stroke={INK} strokeWidth={1.4}>
          <rect x={x - 3} y={y + 2} width={w + 6} height={3.5} transform={`rotate(14 ${x + w / 2} ${y + h / 2})`} />
          <rect x={x - 3} y={y + 6} width={w + 6} height={3.5} transform={`rotate(-12 ${x + w / 2} ${y + h / 2})`} />
        </g>
      )}
      {variant === "broken" && <path d={`M${x + 2} ${y + 2} l 4 4 l -1 4 M${x + 6} ${y + 6} l 5 -2`} stroke={GLASS} strokeWidth={1.2} fill="none" />}
      {variant === "eyes" && (
        <g>
          <circle cx={x + 4} cy={y + 6} r={3.2} fill="#f2d33b" />
          <circle cx={x + 10} cy={y + 6} r={3.2} fill="#f2d33b" />
          <circle cx={x + 4.6} cy={y + 6.4} r={1.4} fill={INK} />
          <circle cx={x + 10.6} cy={y + 6.4} r={1.4} fill={INK} />
        </g>
      )}
    </g>
  );
}

function layoutWindows(count: number, stories: number, g: HouseGeometry, doorX: number, doorW: number) {
  const out: { x: number; y: number; story: number }[] = [];
  const n = clamp(count, 0, stories * 3);
  const perStory = Math.ceil(n / stories);
  let placed = 0;
  // fill from the top story down so a 1-window house shows it upstairs-ish
  for (let s = 0; s < stories && placed < n; s++) {
    const take = Math.min(perStory, n - placed);
    const y = g.wallY + s * STORY_H + 8;
    const isGround = s === stories - 1;
    const slots = slotXs(take, g, isGround ? { x: doorX - 3, w: doorW + 6 } : undefined);
    for (const x of slots) out.push({ x, y: isGround ? y + 2 : y, story: s });
    placed += slots.length;
  }
  return out;
}

function slotXs(take: number, g: HouseGeometry, avoid?: { x: number; w: number }) {
  const winW = 14;
  const candidates: number[] = [];
  const cols = Math.max(take + (avoid ? 1 : 0), 1);
  for (let i = 0; i < cols; i++) {
    candidates.push(g.wallX + ((i + 1) * g.width) / (cols + 1) - winW / 2);
  }
  const free = avoid ? candidates.filter((x) => x + winW < avoid.x || x > avoid.x + avoid.w) : candidates;
  return free.slice(0, take);
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
