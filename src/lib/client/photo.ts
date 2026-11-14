"use client";

import { paletteFromPixels } from "../palette";

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
 * On-device palette when Claude is unavailable (D-021). Shrinks the photo to
 * 48×48 and assigns colors by where they sit: roof = upper middle, walls =
 * centre, door = darkest color low in the centre, trim = lightest color in the
 * house area, surroundings = bottom strip. Each region uses its most common
 * color bucket rather than an average, so colors stay vivid instead of muddy.
 */
export async function samplePalette(dataUrl: string) {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const N = 48;
  const canvas = document.createElement("canvas");
  canvas.width = N;
  canvas.height = N;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, N, N);
  return paletteFromPixels(ctx.getImageData(0, 0, N, N).data, N, N);
}
