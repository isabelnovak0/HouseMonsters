import { NextResponse } from "next/server";
import { AnalysisError, analyzeHousePhoto } from "@/lib/server/analyze-house";

export const runtime = "nodejs";
export const maxDuration = 60;

/** ~6 MB of base64 ≈ 4.5 MB image. The client downscales to ~1280 px so real photos are far smaller. */
const MAX_BASE64_LENGTH = 6_000_000;
const DATA_URL = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Expected JSON." }, { status: 400 });
  }
  const image = (body as { image?: unknown })?.image;
  if (typeof image !== "string") {
    return NextResponse.json({ error: "Missing photo." }, { status: 400 });
  }
  const match = DATA_URL.exec(image);
  if (!match) {
    return NextResponse.json({ error: "Photo must be a JPEG, PNG or WebP." }, { status: 400 });
  }
  if (match[2].length > MAX_BASE64_LENGTH) {
    return NextResponse.json({ error: "Photo is too large." }, { status: 413 });
  }

  try {
    const analysis = await analyzeHousePhoto(match[2], match[1] as "image/jpeg" | "image/png" | "image/webp");
    return NextResponse.json({ analysis });
  } catch (error) {
    if (error instanceof AnalysisError) {
      console.error("[analyze]", error.message);
      return NextResponse.json({ error: error.userMessage }, { status: error.status });
    }
    console.error("[analyze] unexpected", error);
    return NextResponse.json({ error: "Photo analysis failed." }, { status: 500 });
  }
}
