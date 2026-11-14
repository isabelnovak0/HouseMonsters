"use client";

import { monsters } from "../storage";
import type { Monster } from "../types";

/** Sample collection for demos (only offered when NEXT_PUBLIC_DEMO=1). Addresses are placeholders. */
const PIXEL = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=";

export async function seedDemoMonsters() {
  const base = { photo: PIXEL, conditionTags: [] as string[], location: { lat: 33.52, lng: -86.81 } };
  const samples: Monster[] = [
    {
      ...base, id: "demo-ruth", name: "Rusty Ruth", animal: "snail",
      houseFeatures: { roofShape: "gable", stories: 1, windowCount: 2, doorPosition: "center", porch: false, chimney: true },
      palette: { roof: "#2f5d8a", walls: "#c9774c", door: "#c8452f", trim: "#f5e6c8", surroundings: "#4e7a3c" },
      address: "[Sample address], Norwood", description: "Sample monster.", foundAt: "2026-10-02T15:00:00Z",
      reportStatus: "resolved", reportRef: "DEMO-RUTH", points: 150, location: { lat: 33.53, lng: -86.79 },
    },
    {
      ...base, id: "demo-mildew", name: "Sir Mildew", animal: "turtle",
      houseFeatures: { roofShape: "hip", stories: 2, windowCount: 4, doorPosition: "left", porch: true, chimney: false },
      palette: { roof: "#7a4a35", walls: "#c9b48a", door: "#2f5d8a", trim: "#f5e6c8", surroundings: "#6e9c58" },
      conditionTags: ["boarded windows", "overgrowth"],
      address: "[Sample address], Woodlawn", description: "Sample monster.", foundAt: "2026-10-30T18:20:00Z",
      reportStatus: "reported", reportRef: "DEMO-MILDEW", points: 100, location: { lat: 33.54, lng: -86.75 },
    },
    {
      ...base, id: "demo-bones", name: "Old Bones", animal: "boxcat",
      houseFeatures: { roofShape: "flat", stories: 1, windowCount: 2, doorPosition: "right", porch: false, chimney: true },
      palette: { roof: "#4a4038", walls: "#9a8c7a", door: "#5a3e2b", trim: "#b89b6e", surroundings: "#5f6e45" },
      conditionTags: ["open or missing door", "trash or debris"],
      address: "[Sample address], Ensley", description: "Sample monster.", foundAt: "2026-11-08T21:05:00Z",
      reportStatus: "draft", points: 0, location: { lat: 33.51, lng: -86.89 },
    },
  ];
  for (const m of samples) await monsters.put(m);
}
