import { describe, expect, it } from "vitest";
import { distanceMeters } from "@/lib/geo";
import { findNearbyDuplicate, markResolved, pointsForCatch, totalPoints } from "@/lib/points";
import { makeMonster } from "./fixtures";

describe("distanceMeters", () => {
  it("is ~111 km per degree of latitude", () => {
    const d = distanceMeters({ lat: 33, lng: -86 }, { lat: 34, lng: -86 });
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });
});

describe("duplicate detection", () => {
  const existing = makeMonster();
  it("flags a snap ~11 m away as the same house", () => {
    const near = { lat: existing.location.lat + 0.0001, lng: existing.location.lng };
    expect(findNearbyDuplicate([existing], near)?.id).toBe("m1");
    expect(pointsForCatch([existing], near)).toBe(0);
  });
  it("awards full points ~100 m away", () => {
    const far = { lat: existing.location.lat + 0.0009, lng: existing.location.lng };
    expect(findNearbyDuplicate([existing], far)).toBeUndefined();
    expect(pointsForCatch([existing], far)).toBe(100);
  });
});

describe("resolve bonus", () => {
  it("adds 50 once and stamps the time", () => {
    const resolved = markResolved(makeMonster(), new Date("2026-12-01T00:00:00Z"));
    expect(resolved.reportStatus).toBe("resolved");
    expect(resolved.points).toBe(150);
    expect(markResolved(resolved).points).toBe(150);
    expect(totalPoints([resolved, makeMonster({ id: "m2" })])).toBe(250);
  });
});
