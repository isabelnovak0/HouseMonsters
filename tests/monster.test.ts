import { describe, expect, it } from "vitest";
import { chooseAnimal, pickDances } from "@/lib/monster";

const base = { roofShape: "gable", stories: 1, windowCount: 2, doorPosition: "center", porch: false, chimney: false } as const;

describe("chooseAnimal", () => {
  it("hatches only snails and box cats, a mix of both, regardless of the house", () => {
    const picks = Array.from({ length: 200 }, (_, i) => chooseAnimal({ ...base, stories: 3, porch: true }, ["fire damage"], `id-${i}-${i * 7919}`));
    const snails = picks.filter((a) => a === "snail").length;
    const cats = picks.filter((a) => a === "boxcat").length;
    expect(snails + cats).toBe(200);
    expect(snails).toBeGreaterThan(60);
    expect(cats).toBeGreaterThan(60);
  });
  it("is stable for a given monster", () => {
    expect(chooseAnimal(base, [], "abc")).toBe(chooseAnimal(base, ["overgrowth"], "abc"));
  });
});

describe("pickDances", () => {
  it("returns three different moves, stable per seed", () => {
    const d = pickDances("monster-123");
    expect(new Set(d).size).toBe(3);
    expect(pickDances("monster-123")).toEqual(d);
  });
});
