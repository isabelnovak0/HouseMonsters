"use client";

import Link from "next/link";
import { useState } from "react";
import { Monster } from "@/components/monster/Monster";
import { CheckIcon } from "@/components/ui/icons";
import { toPayload } from "@/lib/client/outbox";
import { formatReport } from "@/lib/report/format";
import type { Monster as MonsterRecord } from "@/lib/types";

const PORTAL_URL = process.env.NEXT_PUBLIC_CITY_311_PORTAL_URL || "https://birminghamal.gov/311";

/** Confirmation after Send: sent now, or queued until the phone is back online. */
export function Done({ monster, queued, onSnapAnother }: { monster: MonsterRecord; queued: boolean; onSnapAnother: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(formatReport(toPayload(monster)).text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col items-center px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] text-center">
      <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-paper ${queued ? "bg-ink-soft" : "bg-ink"}`} role="status">
        <CheckIcon className={`h-4 w-4 ${queued ? "text-butter" : "text-[#9dd48a]"}`} />
        {queued ? "Saved, will send when you're back online" : "Report sent to 311"}
        {monster.points > 0 && ` · +${monster.points} pts`}
      </div>

      <div className="my-4">
        <Monster monster={monster} size={260} walking title={`${monster.name}, your new monster`} />
      </div>

      <h1 className="font-[family-name:var(--font-display)] text-[28px] font-semibold leading-tight">{monster.name} joined your collection!</h1>
      <p className="mt-2 max-w-[310px] text-[15px] leading-snug text-ink-soft">
        {queued
          ? "No signal right now. Your report is saved on this phone and will go out automatically."
          : "Thanks for looking out for your neighborhood. If the city fixes this house, your monster becomes an angel."}
      </p>
      {monster.reportRef && <p className="mt-2 text-xs text-ink-soft">Reference: {monster.reportRef}</p>}

      <div className="mt-auto flex w-full flex-col gap-3 pt-6">
        <Link href="/collection" className="sticker flex h-14 items-center justify-center rounded-2xl bg-moss font-[family-name:var(--font-display)] text-lg font-semibold text-paper">
          See my monsters
        </Link>
        <button type="button" onClick={onSnapAnother} className="sticker h-14 rounded-2xl bg-paper font-[family-name:var(--font-display)] text-lg font-semibold">
          Snap another house
        </button>
        <div className="mt-1 text-[13px] text-ink-soft">
          Want to track it with the city too?{" "}
          <button type="button" onClick={copyReport} className="font-bold text-sky underline">
            {copied ? "Copied!" : "Copy report"}
          </button>{" "}
          and paste it into the{" "}
          <a href={PORTAL_URL} target="_blank" rel="noopener noreferrer" className="font-bold text-sky underline">
            Birmingham 311 portal
          </a>
          .
        </div>
      </div>
    </div>
  );
}
