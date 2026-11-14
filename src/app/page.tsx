"use client";

import Link from "next/link";
import { Monster, type MonsterLook } from "@/components/monster/Monster";
import { CameraIcon, HomeIcon } from "@/components/ui/icons";
import { PointsBadge } from "@/components/ui/PointsBadge";
import { totalPoints } from "@/lib/points";
import { useMonsters } from "@/lib/client/useMonsters";

/** Shown on Home before the user has caught anything. */
const STARTER: MonsterLook = {
  animal: "turtle",
  houseFeatures: { roofShape: "gable", stories: 1, windowCount: 2, doorPosition: "center", porch: false, chimney: true },
  palette: { roof: "#6b5b4e", walls: "#a99a86", door: "#7a4a35", trim: "#c9b48a", surroundings: "#5f6e45" },
  conditionTags: ["boarded windows", "overgrowth"],
};

export default function Home() {
  const { monsters, loading } = useMonsters();
  const latest = monsters[0];
  const pending = monsters.filter((m) => m.pendingReport).length;

  return (
    <div className="relative flex min-h-dvh flex-col px-6 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-[22px] font-bold text-sky">House Monsters</h1>
        <PointsBadge points={totalPoints(monsters)} />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center py-4">
        <Monster
          monster={latest ?? STARTER}
          size={290}
          walking
          title={latest ? `Your latest monster, ${latest.name}` : "A turtle monster carrying a run-down house"}
        />
        <h2 className="mt-2 text-center font-[family-name:var(--font-display)] text-[28px] font-semibold leading-tight">
          Spot an abandoned house?
        </h2>
        <p className="mt-2 max-w-[300px] text-center text-[15px] leading-snug text-ink-soft">
          Snap it, catch its monster, and we’ll report it to Birmingham 311 for you.
        </p>
        {pending > 0 && (
          <p className="mt-3 rounded-full bg-ink px-3 py-1 text-[13px] font-bold text-paper">
            {pending} report{pending > 1 ? "s" : ""} waiting for signal…
          </p>
        )}
      </div>

      <nav className="flex flex-col gap-3.5" aria-label="Main">
        <Link
          href="/snap"
          className="sticker flex h-[76px] items-center justify-center gap-3 rounded-[22px] bg-moss font-[family-name:var(--font-display)] text-[22px] font-semibold text-paper"
        >
          <CameraIcon className="h-7 w-7" />
          Snap a house
        </Link>
        <Link
          href="/collection"
          className="sticker flex h-[76px] items-center justify-center gap-3 rounded-[22px] bg-paper font-[family-name:var(--font-display)] text-[22px] font-semibold text-ink"
        >
          <HomeIcon className="h-7 w-7" />
          My monsters
          {!loading && (
            <span className="rounded-full bg-ink px-2.5 py-0.5 font-[family-name:var(--font-body)] text-sm font-bold text-paper">
              {monsters.length}
            </span>
          )}
        </Link>
      </nav>
    </div>
  );
}
