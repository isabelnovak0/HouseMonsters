"use client";

/* eslint-disable @next/next/no-img-element */
import { motion } from "framer-motion";

export function Analyzing({ photo }: { photo: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-8 text-center" role="status" aria-live="polite">
      <motion.div
        className="w-[230px] border-[2.5px] border-ink bg-paper p-2 pb-8"
        animate={{ rotate: [-4, 4, -4], y: [0, -6, 0] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
      >
        <img src={photo} alt="Your photo" className="aspect-[4/3] w-full object-cover" />
      </motion.div>
      <div>
        <p className="font-[family-name:var(--font-display)] text-2xl font-semibold">Something is stirring…</p>
        <p className="mt-1 text-sm text-ink-soft">Reading the house and finding your monster.</p>
      </div>
    </div>
  );
}

export function NotAHouse({ photo, what, onRetake }: { photo: string; what: string; onRetake: () => void }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-8 text-center">
      <img src={photo} alt="Your photo" className="w-[220px] rotate-[-3deg] border-[2.5px] border-ink bg-paper object-cover p-2 pb-6" />
      <div>
        <p className="font-[family-name:var(--font-display)] text-2xl font-semibold">Hmm, no house monster here</p>
        <p className="mt-2 text-[15px] leading-snug text-ink-soft">{what || "We couldn't spot a house in that photo."} Try a clear shot of the whole house.</p>
      </div>
      <button type="button" onClick={onRetake} className="sticker h-14 w-full rounded-2xl bg-moss font-[family-name:var(--font-display)] text-lg font-semibold text-paper">
        Retake photo
      </button>
    </div>
  );
}
