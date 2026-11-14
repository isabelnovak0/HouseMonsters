import { describe, expect, it } from "vitest";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { HouseAnalysisSchema } from "@/lib/analysis-schema";

const sample = {
  isHouse: true,
  confidence: 0.92,
  description: "Two-story wood-frame house that appears vacant.",
  conditionTags: ["boarded windows", "overgrowth"],
  houseFeatures: { roofShape: "gable", stories: 2, windowCount: 4, doorPosition: "center", porch: true, chimney: false },
  palette: { roof: "#4a4038", walls: "#9a8c7a", door: "#5a3e2b", trim: "#b89b6e", surroundings: "#5f6e45" },
  suggestedName: "Creaky Shelby",
};

describe("HouseAnalysisSchema", () => {
  it("converts to a JSON-schema output format for Claude", () => {
    const format = betaZodOutputFormat(HouseAnalysisSchema) as unknown as { type: string; schema: { properties: object } };
    expect(format.type).toBe("json_schema");
    expect(Object.keys(format.schema.properties)).toEqual(
      expect.arrayContaining(["isHouse", "description", "conditionTags", "houseFeatures", "palette", "suggestedName"]),
    );
  });
  it("accepts a well-formed analysis and rejects invented tags / bad colors", () => {
    expect(HouseAnalysisSchema.safeParse(sample).success).toBe(true);
    expect(HouseAnalysisSchema.safeParse({ ...sample, conditionTags: ["haunted"] }).success).toBe(false);
    expect(HouseAnalysisSchema.safeParse({ ...sample, palette: { ...sample.palette, roof: "blue" } }).success).toBe(false);
  });
});
