"use client";

const MAX_EDGE = 1280;
const QUALITY = 0.82;

/** Draws any image/video source to a canvas at ≤1280 px and returns a JPEG data URL (D-012). */
export function downscale(source: CanvasImageSource, srcW: number, srcH: number): string {
  const scale = Math.min(1, MAX_EDGE / Math.max(srcW, srcH));
  const w = Math.round(srcW * scale);
  const h = Math.round(srcH * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(source, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", QUALITY);
}

/** Grabs the current video frame. */
export function captureVideoFrame(video: HTMLVideoElement): string {
  return downscale(video, video.videoWidth, video.videoHeight);
}

/** Reads a picked/camera file (fallback path) into a downscaled JPEG. */
export async function fileToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
  if (bitmap) {
    const url = downscale(bitmap, bitmap.width, bitmap.height);
    bitmap.close();
    return url;
  }
  // Older Safari: go through an <img>
  const src = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not read that photo"));
      el.src = src;
    });
    return downscale(img, img.naturalWidth, img.naturalHeight);
  } finally {
    URL.revokeObjectURL(src);
  }
}

/**
 * Fallback palette when Claude is unavailable: average colors of horizontal
 * bands of the photo (top ≈ roof/sky, middle ≈ walls, bottom ≈ yard).
 */
export async function samplePalette(dataUrl: string) {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 24;
  canvas.height = 24;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, 24, 24);
  const band = (y0: number, y1: number, x0 = 4, x1 = 20) => {
    const d = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
    let r = 0, g = 0, b = 0;
    const n = d.length / 4;
    for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
    const hex = (v: number) => Math.round(v / n).toString(16).padStart(2, "0");
    return `#${hex(r)}${hex(g)}${hex(b)}`;
  };
  return {
    roof: band(4, 9),
    walls: band(10, 16),
    door: band(14, 19, 10, 14),
    trim: band(9, 11),
    surroundings: band(19, 24, 0, 24),
  };
}
