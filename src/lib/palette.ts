import type { Palette } from "./types";

type RGB = [number, number, number];

const hex = ([r, g, b]: RGB) => "#" + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
const lum = ([r, g, b]: RGB) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

/**
 * Most common color in a region: pixels are bucketed (4 levels per channel
 * after a coarse quantise), the fullest bucket wins, and its pixels are averaged.
 * `pick` can bias the choice (e.g. darkest bucket for the door).
 */
function dominant(
  data: Uint8ClampedArray,
  width: number,
  box: { x0: number; y0: number; x1: number; y1: number },
  pick: "common" | "dark" | "light" = "common",
): RGB {
  const buckets = new Map<number, { n: number; sum: RGB }>();
  for (let y = box.y0; y < box.y1; y++) {
    for (let x = box.x0; x < box.x1; x++) {
      const i = (y * width + x) * 4;
      const c: RGB = [data[i], data[i + 1], data[i + 2]];
      const key = (c[0] >> 5) * 64 + (c[1] >> 5) * 8 + (c[2] >> 5);
      const b = buckets.get(key) ?? { n: 0, sum: [0, 0, 0] as RGB };
      b.n++;
      b.sum[0] += c[0];
      b.sum[1] += c[1];
      b.sum[2] += c[2];
      buckets.set(key, b);
    }
  }
  const total = [...buckets.values()].reduce((a, b) => a + b.n, 0) || 1;
  const colors = [...buckets.values()].map((b) => ({ n: b.n, c: b.sum.map((v) => v / b.n) as RGB }));
  // ignore specks: a bucket must cover ≥4% of the region to be picked as dark/light
  const big = colors.filter((b) => b.n / total >= 0.04);
  const pool = big.length ? big : colors;
  if (pick === "dark") return pool.reduce((a, b) => (lum(b.c) < lum(a.c) ? b : a)).c;
  if (pick === "light") return pool.reduce((a, b) => (lum(b.c) > lum(a.c) ? b : a)).c;
  return colors.reduce((a, b) => (b.n > a.n ? b : a)).c;
}

/** Picks the five monster colors from raw RGBA pixels (see samplePalette). */
export function paletteFromPixels(data: Uint8ClampedArray, width: number, height: number): Palette {
  const W = width;
  const H = height;
  const at = (fx0: number, fy0: number, fx1: number, fy1: number) => ({
    x0: Math.floor(W * fx0),
    y0: Math.floor(H * fy0),
    x1: Math.max(Math.floor(W * fx0) + 1, Math.floor(W * fx1)),
    y1: Math.max(Math.floor(H * fy0) + 1, Math.floor(H * fy1)),
  });
  const walls = dominant(data, W, at(0.25, 0.4, 0.75, 0.7));
  let roof = dominant(data, W, at(0.25, 0.15, 0.75, 0.4));
  // if the "roof" region is mostly sky (same as walls or very bright/blue), take the darkest band color instead
  if (Math.abs(lum(roof) - lum(walls)) < 12 || (roof[2] > roof[0] + 25 && lum(roof) > 150)) {
    roof = dominant(data, W, at(0.2, 0.15, 0.8, 0.45), "dark");
  }
  return {
    roof: hex(roof),
    walls: hex(walls),
    door: hex(dominant(data, W, at(0.38, 0.55, 0.62, 0.85), "dark")),
    trim: hex(dominant(data, W, at(0.2, 0.3, 0.8, 0.8), "light")),
    surroundings: hex(dominant(data, W, at(0, 0.82, 1, 1))),
  };
}
