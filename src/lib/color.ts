/** Tiny color helpers for painting monsters from the photo palette. */

function parse(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [128, 128, 128];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  const c = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Linear blend: t=0 → a, t=1 → b. */
export function mix(a: string, b: string, t: number): string {
  const A = parse(a);
  const B = parse(b);
  return toHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}

export const darken = (c: string, t = 0.25) => mix(c, "#000000", t);
export const lighten = (c: string, t = 0.25) => mix(c, "#ffffff", t);

/** Relative luminance 0..1 (sRGB approximation, good enough for picking contrast). */
export function luminance(c: string): number {
  const [r, g, b] = parse(c).map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
