import { describe, expect, it } from "vitest";
import { paletteFromPixels } from "@/lib/palette";

/** Paints a 48×48 "photo": blue sky, dark-brown roof, red-brick walls, black door, green lawn. */
function fakePhoto() {
  const N = 48;
  const d = new Uint8ClampedArray(N * N * 4);
  const set = (x: number, y: number, c: number[]) => d.set([...c, 255], (y * N + x) * 4);
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      let c = [135, 190, 235]; // sky
      if (y >= 10 && y < 20 && x >= 8 && x < 40) c = [70, 45, 35]; // roof
      if (y >= 20 && y < 40 && x >= 10 && x < 38) c = [180, 80, 60]; // walls
      if (y >= 30 && y < 40 && x >= 21 && x < 27) c = [25, 25, 25]; // door
      if (y >= 40) c = [60, 140, 60]; // lawn
      set(x, y, c);
    }
  return d;
}

describe("paletteFromPixels", () => {
  it("finds roof, walls, door and yard colors from where they sit", () => {
    const p = paletteFromPixels(fakePhoto(), 48, 48);
    expect(p.walls).toBe("#b4503c");
    expect(p.roof).toBe("#462d23");
    expect(p.door).toBe("#191919");
    expect(p.surroundings).toBe("#3c8c3c");
  });
});
