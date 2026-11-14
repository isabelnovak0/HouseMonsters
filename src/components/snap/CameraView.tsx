"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CloseIcon, GalleryIcon, PinIcon } from "@/components/ui/icons";
import { getPosition, LOCATION_HELP, watchPosition, type LocationError } from "@/lib/client/location";
import { captureVideoFrame, fileToDataUrl } from "@/lib/client/photo";
import type { GeoPoint } from "@/lib/types";

export interface Capture {
  photo: string;
  location?: GeoPoint;
  locationError?: LocationError;
}

type CameraState = "starting" | "live" | "fallback";

/**
 * Full-screen rear camera. If the browser can't open the camera (no permission,
 * insecure origin, old browser) it falls back to the native picker with
 * `capture="environment"`, which still opens the camera on phones.
 */
export function CameraView({ onCapture }: { onCapture: (c: Capture) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fixRef = useRef<GeoPoint | undefined>(undefined);
  const [camera, setCamera] = useState<CameraState>("starting");
  const [cameraNote, setCameraNote] = useState<string>();
  const [fix, setFix] = useState<GeoPoint>();
  const [locError, setLocError] = useState<LocationError>();
  const [busy, setBusy] = useState(false);

  // open the camera
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setCamera("fallback");
        setCameraNote("This browser can't show a live camera here.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        setCamera("live");
      } catch (e) {
        if (cancelled) return;
        setCamera("fallback");
        setCameraNote(
          (e as DOMException)?.name === "NotAllowedError"
            ? "Camera permission is off. You can still take a photo with your phone's camera."
            : "We couldn't open the camera. You can still take or pick a photo.",
        );
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // keep a warm GPS fix so the location is ready the moment the shutter fires
  useEffect(
    () =>
      watchPosition(
        (p) => {
          fixRef.current = p;
          setFix(p);
          setLocError(undefined);
        },
        (e) => setLocError(e),
      ),
    [],
  );

  async function locate(): Promise<Pick<Capture, "location" | "locationError">> {
    if (fixRef.current) return { location: fixRef.current };
    try {
      return { location: await getPosition(6000) };
    } catch (e) {
      return { locationError: e as LocationError };
    }
  }

  async function shoot() {
    const video = videoRef.current;
    if (!video || !video.videoWidth || busy) return;
    setBusy(true);
    const photo = captureVideoFrame(video);
    onCapture({ photo, ...(await locate()) });
  }

  async function pick(file: File | undefined) {
    if (!file || busy) return;
    setBusy(true);
    try {
      const photo = await fileToDataUrl(file);
      onCapture({ photo, ...(await locate()) });
    } catch {
      setBusy(false);
      setCameraNote("That photo couldn't be opened. Try another one.");
    }
  }

  return (
    <div className="fixed inset-0 z-10 bg-[#1e1d1a] text-paper">
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={`absolute inset-0 h-full w-full object-cover ${camera === "live" ? "" : "hidden"}`}
      />

      {camera === "live" && (
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 390 844" preserveAspectRatio="none">
          <g fill="none" stroke="#fffbf2" strokeWidth="4" strokeLinecap="round">
            <path d="M40 200 V160 H80" /><path d="M310 160 H350 V200" /><path d="M40 600 V640 H80" /><path d="M310 640 H350 V600" />
          </g>
        </svg>
      )}

      {/* top bar */}
      <div className="absolute inset-x-4 top-[max(1rem,env(safe-area-inset-top))] flex items-center justify-between gap-2">
        <Link href="/" aria-label="Close camera" className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55">
          <CloseIcon className="h-6 w-6" />
        </Link>
        <div className="flex items-center gap-1.5 rounded-full bg-black/60 px-3.5 py-2 text-[13px] font-bold" role="status">
          <PinIcon className={`h-4 w-4 ${fix ? "text-[#9dd48a]" : "text-butter"}`} />
          {fix ? `Location locked (±${Math.round(fix.accuracy ?? 0)} m)` : locError ? LOCATION_HELP[locError] : "Finding your location…"}
        </div>
      </div>

      {camera === "fallback" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-8 text-center">
          <p className="text-[15px] leading-snug">{cameraNote}</p>
          <label className="sticker flex h-16 w-full cursor-pointer items-center justify-center rounded-2xl bg-moss font-[family-name:var(--font-display)] text-xl font-semibold">
            Take a photo
            <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
        </div>
      )}

      {camera === "live" && (
        <p className="absolute inset-x-0 bottom-36 text-center">
          <span className="rounded-full bg-black/60 px-4 py-2 text-sm font-bold">Fit the whole house in the frame</span>
        </p>
      )}

      {/* bottom controls */}
      <div className="absolute inset-x-0 bottom-[max(2.25rem,env(safe-area-inset-bottom))] flex items-center justify-around px-10">
        <label
          className="flex h-[52px] w-[52px] cursor-pointer items-center justify-center rounded-2xl border-2 border-paper bg-black/50"
          aria-label="Pick a photo from your gallery"
        >
          <GalleryIcon className="h-6 w-6" />
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
        </label>
        <button
          type="button"
          onClick={shoot}
          disabled={camera !== "live" || busy}
          aria-label="Take photo"
          className="flex h-[82px] w-[82px] items-center justify-center rounded-full border-[5px] border-paper disabled:opacity-40"
        >
          <span className={`block h-[62px] w-[62px] rounded-full bg-butter transition-transform ${busy ? "scale-75" : ""}`} />
        </button>
        <span className="h-[52px] w-[52px]" aria-hidden="true" />
      </div>
    </div>
  );
}
