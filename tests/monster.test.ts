import { describe, expect, it } from "vitest";
import { chooseAnimal, pickDances } from "@/lib/monster";

const base = { roofShape: "gable", stories: 1, windowCount: 2, doorPosition: "center", porch: false, chimney: false } as const;

describe("chooseAnimal", () => {
  it("sends spooky or flat-roofed houses to the box cat", () => {
    expect(chooseAnimal(base, ["fire damage"], "a")).toBe("boxcat");
    expect(chooseAnimal({ ...base, roofShape: "flat" }, [], "a")).toBe("boxcat");
  });
  it("gives big houses and porches to the turtle", () => {
    expect(chooseAnimal({ ...base, stories: 2 }, [], "a")).toBe("turtle");
    expect(chooseAnimal({ ...base, porch: true }, [], "a")).toBe("turtle");
  });
  it("gives small houses to the snail", () => {
    expect(chooseAnimal(base, ["overgrowth"], "a")).toBe("snail");
  });
});

describe("pickDances", () => {
  it("returns three different moves, stable per seed", () => {
    const d = pickDances("monster-123");
    expect(new Set(d).size).toBe(3);
    expect(pickDances("monster-123")).toEqual(d);
  });
});
