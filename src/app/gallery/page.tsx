"use client";

import { useState } from "react";
import { Monster, type MonsterLook } from "@/components/monster/Monster";
import { DANCE_MOVES, type DanceMove } from "@/lib/monster";

/** Developer gallery: every animal × a few house shapes. Not linked from the app. */
const HOUSES: Omit<MonsterLook, "animal">[] = [
  {
    houseFeatures: { roofShape: "gable", stories: 2, windowCount: 4, doorPosition: "center", porch: true, chimney: true },
    palette: { roof: "#2f5d8a", walls: "#c9774c", door: "#c8452f", trim: "#f5e6c8", surroundings: "#4e7a3c" },
    conditionTags: [],
  },
  {
    houseFeatures: { roofShape: "hip", stories: 1, windowCount: 2, doorPosition: "left", porch: false, chimney: false },
    palette: { roof: "#4a4038", walls: "#9a8c7a", door: "#5a3e2b", trim: "#b89b6e", surroundings: "#5f6e45" },
    conditionTags: ["boarded windows", "overgrowth", "broken glass"],
  },
  {
    houseFeatures: { roofShape: "flat", stories: 3, windowCount: 6, doorPosition: "right", porch: false, chimney: true },
    palette: { roof: "#6b5b4e", walls: "#d8cfc0", door: "#2f5d8a", trim: "#7a4a35", surroundings: "#8fa3ae" },
    conditionTags: ["graffiti", "trash or debris", "peeling paint", "fire damage"],
  },
];

export default function Gallery() {
  const [dance, setDance] = useState<DanceMove | null>(null);
  const [key, setKey] = useState(0);
  const [walking, setWalking] = useState(false);
  if (process.env.NODE_ENV === "production") return null;
  return (
    <div className="p-4">
      <div className="mb-4 flex flex-wrap gap-2">
        <button className="rounded border px-2" onClick={() => setWalking((w) => !w)}>walk: {String(walking)}</button>
        {DANCE_MOVES.map((d) => (
          <button key={d} className="rounded border px-2" onClick={() => { setDance(d); setKey((k) => k + 1); }}>{d}</button>
        ))}
      </div>
      {(["turtle", "snail", "boxcat"] as const).map((animal) => (
        <div key={animal} className="flex flex-wrap gap-2" data-testid={animal}>
          {HOUSES.map((h, i) => (
            <Monster key={i} size={180} monster={{ ...h, animal }} walking={walking} dance={dance} danceKey={key} angel={i === 1} />
          ))}
        </div>
      ))}
    </div>
  );
}
