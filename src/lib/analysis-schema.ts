import { z } from "zod";

/** Hex color like #a1b2c3. */
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const CONDITION_TAGS = [
  "boarded windows",
  "broken glass",
  "roof damage",
  "overgrowth",
  "trash or debris",
  "open or missing door",
  "fire damage",
  "structural collapse",
  "graffiti",
  "peeling paint",
] as const;

export const HouseFeaturesSchema = z.object({
  roofShape: z.enum(["gable", "flat", "hip"]),
  stories: z.number().int().min(1).max(4),
  windowCount: z.number().int().min(0).max(12),
  doorPosition: z.enum(["left", "center", "right"]),
  porch: z.boolean(),
  chimney: z.boolean(),
});

export const PaletteSchema = z.object({
  roof: hex,
  walls: hex,
  door: hex,
  trim: hex,
  surroundings: hex,
});

/**
 * The exact JSON Claude must return for a photo. Used as the structured-output
 * format on the server and as the validator for anything read back from storage.
 */
export const HouseAnalysisSchema = z.object({
  isHouse: z.boolean(),
  confidence: z.number().min(0).max(1),
  description: z.string(),
  conditionTags: z.array(z.enum(CONDITION_TAGS)),
  houseFeatures: HouseFeaturesSchema,
  palette: PaletteSchema,
  suggestedName: z.string(),
});

export type HouseAnalysis = z.infer<typeof HouseAnalysisSchema>;
export type HouseFeatures = z.infer<typeof HouseFeaturesSchema>;
export type Palette = z.infer<typeof PaletteSchema>;
