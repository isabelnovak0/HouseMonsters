import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Address lookup through OpenStreetMap Nominatim (DECISIONS.md D-015), proxied so
 * we can send the identifying User-Agent their policy asks for and add caching.
 *   GET /api/geocode?lat=..&lng=..   → { address }
 *   GET /api/geocode?q=123 Main St   → { lat, lng, address }
 */
const NOMINATIM = "https://nominatim.openstreetmap.org";
const UA = "HouseMonsters/0.1 (community blight-reporting PWA)";
// Rough Birmingham, AL metro bounding box: left, top, right, bottom
const BHAM_VIEWBOX = "-87.1,33.7,-86.6,33.35";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lng = Number(url.searchParams.get("lng"));
  const q = url.searchParams.get("q")?.trim();

  try {
    if (q) {
      const res = await fetch(
        `${NOMINATIM}/search?format=jsonv2&limit=1&countrycodes=us&viewbox=${BHAM_VIEWBOX}&q=${encodeURIComponent(q)}`,
        { headers: { "User-Agent": UA, "Accept-Language": "en" }, next: { revalidate: 86400 } },
      );
      if (!res.ok) throw new Error(`nominatim ${res.status}`);
      const [hit] = (await res.json()) as { lat: string; lon: string; display_name: string }[];
      if (!hit) return NextResponse.json({ error: "We couldn't find that address." }, { status: 404 });
      return NextResponse.json({ lat: Number(hit.lat), lng: Number(hit.lon), address: shorten(hit.display_name) });
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: "Pass lat & lng, or q." }, { status: 400 });
    }
    const res = await fetch(`${NOMINATIM}/reverse?format=jsonv2&zoom=18&lat=${lat}&lon=${lng}`, {
      headers: { "User-Agent": UA, "Accept-Language": "en" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`nominatim ${res.status}`);
    const body = (await res.json()) as {
      display_name?: string;
      address?: Record<string, string>;
    };
    return NextResponse.json({ address: formatAddress(body.address) ?? shorten(body.display_name ?? "") });
  } catch (e) {
    console.error("[geocode]", (e as Error).message);
    return NextResponse.json({ error: "Address lookup is unavailable." }, { status: 502 });
  }
}

function formatAddress(a?: Record<string, string>): string | undefined {
  if (!a?.road) return undefined;
  const street = [a.house_number, a.road].filter(Boolean).join(" ");
  const city = a.city ?? a.town ?? a.village ?? a.suburb ?? "";
  return [street, city, a.state ? abbreviateState(a.state) : "", a.postcode].filter(Boolean).join(", ");
}

function abbreviateState(s: string): string {
  return s === "Alabama" ? "AL" : s;
}

function shorten(display: string): string {
  return display.split(",").slice(0, 4).join(",").trim();
}
