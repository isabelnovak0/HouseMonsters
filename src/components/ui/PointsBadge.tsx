import { StarIcon } from "./icons";

export function PointsBadge({ points }: { points: number }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border-2 border-ink bg-butter px-3 py-1.5 font-[family-name:var(--font-display)] text-[15px] font-semibold"
      aria-label={`${points} points`}
    >
      <StarIcon className="h-4 w-4" />
      {points.toLocaleString()} pts
    </div>
  );
}
