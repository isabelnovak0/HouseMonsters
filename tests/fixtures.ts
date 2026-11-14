import type { Monster } from "@/lib/types";

export function makeMonster(overrides: Partial<Monster> = {}): Monster {
  return {
    id: "m1",
    name: "Creaky Shelby",
    animal: "turtle",
    houseFeatures: { roofShape: "gable", stories: 2, windowCount: 4, doorPosition: "center", porch: true, chimney: false },
    palette: { roof: "#4a4038", walls: "#9a8c7a", door: "#5a3e2b", trim: "#b89b6e", surroundings: "#5f6e45" },
    photo: "data:image/jpeg;base64,AAAA",
    location: { lat: 33.5186, lng: -86.8104 },
    address: "Birmingham, AL",
    description: "Two-story vacant house with boarded windows.",
    conditionTags: ["boarded windows"],
    foundAt: "2026-11-14T16:32:00.000Z",
    reportStatus: "reported",
    points: 100,
    ...overrides,
  };
}
