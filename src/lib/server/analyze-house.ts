import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { HouseAnalysisSchema, type HouseAnalysis } from "../analysis-schema";
import { MAX_NAME_LENGTH } from "../types";

/** See DECISIONS.md D-011 for model / effort / fallback choices. */
const MODEL = "claude-opus-5-5";

const SYSTEM_PROMPT = `You analyze photos taken by residents of Birmingham, Alabama, who are reporting houses that look abandoned, vacant or dilapidated. Your output is used two ways: a factual description is sent to the city's 311 service, and the house's look is turned into a friendly cartoon monster for the user's collection.

isHouse / confidence: isHouse is true only when the main subject is a house or similar residential building (including mobile homes and duplexes). Set false for anything else (people, pets, cars, a commercial building, an indoor scene, a blurry photo where no building can be made out). confidence is how sure you are, 0 to 1.

description: 2–3 plain, factual sentences a city inspector can act on. Mention the structure type, number of stories, and only the condition problems you can actually see (boarded or broken windows, roof damage, overgrowth, trash or debris, open or missing doors, fire damage, collapse, graffiti, peeling paint). Do not guess at ownership, occupancy history or crime. Never describe or identify people, faces, license plates, or house numbers that identify neighbouring homes; if people or vehicles are visible, leave them out entirely. If isHouse is false, briefly say what the photo shows instead.

conditionTags: every listed condition you can see; an empty list if none.

houseFeatures: approximate the visible front of the house. windowCount counts windows visible on the front; doorPosition is where the front door sits.

palette: five real colors sampled from this photo as #rrggbb hex: roof, walls (siding/brick), door, trim (window frames, boards, porch), surroundings (yard, trees or sky, whichever dominates). Pick the actual weathered colors, not idealised ones.

suggestedName: a playful, kind monster name inspired by the house, at most ${MAX_NAME_LENGTH} characters including spaces (for example "Creaky Shelby", "Sir Mildew", "Old Bones"). No real people's names and nothing insulting to residents.`;

export class AnalysisError extends Error {
  constructor(
    message: string,
    /** Message safe to show the user. */
    public readonly userMessage: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

let client: Anthropic | undefined;
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    console.warn("[analyze] ANTHROPIC_API_KEY is not set: add it to .env.local and restart to get AI descriptions and colors.");
    throw new AnalysisError(
      "ANTHROPIC_API_KEY is not set",
      "Photo analysis isn't set up on this server, so you'll need to describe the house yourself.",
      503,
    );
  }
  client ??= new Anthropic();
  return client;
}

/** Sends a JPEG/PNG/WebP (base64, no data: prefix) to Claude and returns the validated analysis. */
export async function analyzeHousePhoto(
  base64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp",
): Promise<HouseAnalysis> {
  let response;
  try {
    response = await getClient().beta.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: betaZodOutputFormat(HouseAnalysisSchema) },
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
            { type: "text", text: "Analyze this photo." },
          ],
        },
      ],
    });
  } catch (error) {
    if (error instanceof AnalysisError) throw error;
    if (error instanceof Anthropic.RateLimitError) {
      throw new AnalysisError("rate limited", "Too many monsters at once! Try again in a minute.", 429);
    }
    if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
      throw new AnalysisError(`auth: ${error.message}`, "Photo analysis isn't set up correctly on the server.", 503);
    }
    if (error instanceof Anthropic.BadRequestError) {
      throw new AnalysisError(`bad request: ${error.message}`, "That photo couldn't be read. Try another one.", 400);
    }
    if (error instanceof Anthropic.APIError) {
      throw new AnalysisError(`api ${error.status}: ${error.message}`, "Photo analysis is having trouble right now.", 502);
    }
    // e.g. the reply didn't validate against HouseAnalysisSchema
    throw new AnalysisError(`unexpected: ${(error as Error)?.message}`, "Photo analysis got confused. Try again.", 502);
  }

  if (response.stop_reason === "refusal") {
    throw new AnalysisError(
      `refusal: ${response.stop_details?.category ?? "unknown"}`,
      "We couldn't analyze that photo. Try a clear shot of just the house.",
      422,
    );
  }
  const parsed = response.parsed_output;
  if (!parsed) {
    throw new AnalysisError(`unparsed output (stop_reason=${response.stop_reason})`, "Photo analysis got confused. Try again.", 502);
  }
  return {
    ...parsed,
    suggestedName: parsed.suggestedName.trim().slice(0, MAX_NAME_LENGTH) || "Mystery House",
  };
}
