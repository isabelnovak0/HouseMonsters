import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Status hook (D-019): GET /api/report/status?ref=SR-123
 * → { status: "open" | "closed" | "unknown" }
 * Only Open311 can answer today (GeoReport v2 GET /requests/{id}.json). With the
 * email sender there is no ticket system to ask, so the answer is "unknown" and
 * users mark houses resolved by hand.
 */
export async function GET(req: Request) {
  const ref = new URL(req.url).searchParams.get("ref");
  if (!ref) return NextResponse.json({ error: "Missing ref." }, { status: 400 });

  const base = process.env.OPEN311_BASE_URL;
  if ((process.env.REPORT_SENDER ?? "email").toLowerCase() !== "open311" || !base) {
    return NextResponse.json({ status: "unknown" });
  }
  try {
    const key = process.env.OPEN311_API_KEY ? `?api_key=${encodeURIComponent(process.env.OPEN311_API_KEY)}` : "";
    const res = await fetch(`${base.replace(/\/$/, "")}/requests/${encodeURIComponent(ref)}.json${key}`, { cache: "no-store" });
    if (!res.ok) return NextResponse.json({ status: "unknown" });
    const [request] = (await res.json()) as { status?: string }[];
    const status = request?.status === "closed" ? "closed" : request?.status === "open" ? "open" : "unknown";
    return NextResponse.json({ status });
  } catch {
    return NextResponse.json({ status: "unknown" });
  }
}
