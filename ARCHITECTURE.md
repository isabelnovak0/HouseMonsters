# Architecture

House Monsters is a mobile-first PWA ("Pokémon Go for abandoned houses"): photograph an
abandoned house, it becomes a cartoon monster in your collection, and a report goes to
Birmingham, AL 311.

_Kept current as the code changes. Why things are the way they are: DECISIONS.md (IDs like D-009)._

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript 5, installable PWA (manifest + service worker)
- Tailwind CSS v4 (palette in `src/app/globals.css`)
- Claude API (`@anthropic-ai/sdk`, model `claude-opus-5-5`) for photo analysis, server-side only
- IndexedDB via `idb` for the on-device collection
- Framer Motion for animation; monsters are hand-built layered SVG
- Resend for report email; OpenStreetMap Nominatim + tiles for addresses and the mini map
- Vitest (+ fake-indexeddb) for unit tests

## Screens and routes

| Route | File | What it does |
|---|---|---|
| `/` | `src/app/page.tsx` | Home: points badge, latest monster, **Snap a house** and **My monsters** buttons |
| `/snap` | `src/app/snap/page.tsx` | The capture → reveal → report flow (one page, reducer step machine, D-016) |
| `/collection` | `src/app/collection/page.tsx` | Map with roaming monsters, angels for fixed houses, detail card |
| `/gallery` | `src/app/gallery/page.tsx` | Dev-only: every animal × sample houses × dance buttons |
| `POST /api/analyze` | `src/app/api/analyze/route.ts` | Photo → Claude → `HouseAnalysis` JSON |
| `POST /api/report` | `src/app/api/report/route.ts` | Validates and sends a report via the configured `ReportSender` |
| `GET /api/report/status` | `src/app/api/report/status/route.ts` | Asks the city whether a report was closed (Open311 only) |
| `GET /api/geocode` | `src/app/api/geocode/route.ts` | GPS → address, or typed address → GPS (Nominatim) |
| `/manifest.webmanifest` | `src/app/manifest.ts` | PWA manifest |

## Components

```
src/components/
  monster/
    Monster.tsx        <Monster> wrapper: dances (bounce/spin), angel mode (opacity, halo, wings, float)
    animals.tsx        Turtle, Snail, BoxCat (from the reference art) + HOUSE_ANCHORS + VIEWBOX
    House.tsx          house drawn from features + palette + damage tags; roof "lid hop", chimney puff
  snap/
    CameraView.tsx     full-screen rear camera, warm GPS fix, file-picker fallback
    Analyzing.tsx      "Something is stirring…" + NotAHouse (retake)
    Reveal.tsx         burst out of the photo → walk → 3 dances (~4.8 s) → name it (≤15 chars)
    ReviewReport.tsx   editable report: photo, mini map, address, AI description, tags, optional contact
    Done.tsx           sent / queued confirmation, copy report + link to the city portal
  collection/
    Wanderer.tsx       one monster wandering the map (seeded random walk, pauses, random dances)
  ui/                  icons, PointsBadge, MapBackdrop (illustrated map), MiniMap (OSM tiles + pin)
  OutboxFlusher.tsx    retries queued reports on start-up and when the browser comes back online
  ServiceWorkerRegistrar.tsx
```

```
src/lib/
  types.ts             Monster, ReportPayload, AnimalType, … (domain types)
  analysis-schema.ts   Zod HouseAnalysisSchema — single source of truth for the Claude output (D-005)
  monster.ts           chooseAnimal(), pickDances(), hash()
  points.ts            +100 / +50 / 30 m duplicate rule (pure, tested)
  geo.ts, color.ts     haversine distance, color mixing
  storage/             MonsterRepository + SettingsRepository interfaces, IndexedDB implementation (D-007)
  report/              ReportSender interface, EmailReportSender (Resend), Open311ReportSender, formatReport()
  server/              analyze-house.ts — the Claude call (server-only)
  client/              api.ts, photo.ts (downscale + fallback palette), location.ts, outbox.ts, status.ts, useMonsters.ts
```

## Data flow

### Snap a house
```
CameraView ──shutter──▶ captureVideoFrame() ≤1280px JPEG  +  last GPS fix (watchPosition)
   │
   ▼  snap/page.tsx reducer: step = "analyzing"
   ├─▶ POST /api/analyze ─▶ analyze-house.ts ─▶ Claude (image + system prompt, structured output)
   │        ◀── HouseAnalysis {isHouse, description, conditionTags, houseFeatures, palette, suggestedName}
   ├─▶ GET /api/geocode?lat&lng ─▶ Nominatim  ◀── street address      (in parallel)
   └─▶ IndexedDB: existing monsters → findNearbyDuplicate (30 m)      (in parallel)
   │
   ├─ not a house ─▶ NotAHouse ─▶ retake
   ├─ Claude failed ─▶ samplePalette(photo) + plain house, user writes the description (D-018)
   ▼
Reveal: chooseAnimal(features) → <Monster> bursts out, walks, dances; user names it
   ▼
ReviewReport: user checks/edits address, description, tags, optional contact
   ▼ "Send to 311"
IndexedDB put(monster, pendingReport=true)          ← saved first, never lost (D-017)
POST /api/report ─▶ createReportSender() ─▶ Resend email (photo attached) | Open311
   ├─ ok        ─▶ put(reportStatus="reported", reportRef, points=100|0) ─▶ Done
   ├─ offline/5xx ─▶ stays queued ─▶ Done ("will send when back online") ─▶ OutboxFlusher retries
   └─ rejected  ─▶ draft kept, error shown
```

### Collection
```
useMonsters() ─▶ IndexedDB list ─▶ <Wanderer> per monster (angel if resolved)
on open: refreshStatuses() ─▶ GET /api/report/status?ref ─▶ (Open311) closed? ─▶ markResolved (+50)
tap monster ─▶ card: name · location · found date · status
   ├─ reported ─▶ "The city fixed it: mark as resolved" ─▶ markResolved (+50) ─▶ angel
   └─ draft    ─▶ "Report this house to 311" ─▶ confirm ─▶ same send path as above
```

## Data model (`src/lib/types.ts`)
One record per collected house in IndexedDB database `house-monsters`, store `monsters` (key `id`, index `foundAt`):

| Field | Type | Notes |
|---|---|---|
| id | string | `crypto.randomUUID()` |
| name | string ≤ 15 | user-editable, pre-filled by Claude |
| animal | `turtle \| snail \| boxcat` | `chooseAnimal()` from the house features |
| houseFeatures | roofShape, stories, windowCount, doorPosition, porch, chimney | from Claude |
| palette | roof, walls, door, trim, surroundings (hex) | from Claude; paints the monster |
| photo | JPEG data URL | downscaled to ≤1280 px on the phone |
| location | lat, lng, accuracy? | GPS at capture, or geocoded typed address |
| address | string | reverse-geocoded, user-editable |
| description, conditionTags | string, enum[] | from Claude, user-editable |
| foundAt | ISO time | capture time |
| reportStatus | `draft \| reported \| resolved` | |
| reportRef, reportedAt, resolvedAt | optional | reference id from the sender |
| points | number | 100 when reported (0 for a duplicate), +50 when resolved |
| pendingReport | boolean? | confirmed but waiting for the network |
| reporter | name/email/phone? | what was sent with the report |

Store `settings` holds the remembered reporter contact (key `reporter`).

**Points total** = sum of `points` over the collection (never stored separately).

### Claude analysis contract (`HouseAnalysisSchema`)
```ts
{
  isHouse: boolean; confidence: number /* 0–1 */;
  description: string;                       // 2–3 factual sentences for the city
  conditionTags: ("boarded windows" | "broken glass" | "roof damage" | "overgrowth" | "trash or debris"
                 | "open or missing door" | "fire damage" | "structural collapse" | "graffiti" | "peeling paint")[];
  houseFeatures: { roofShape: "gable"|"flat"|"hip"; stories: 1–4; windowCount: 0–12;
                   doorPosition: "left"|"center"|"right"; porch: boolean; chimney: boolean };
  palette: { roof; walls; door; trim; surroundings };   // "#rrggbb" from the photo
  suggestedName: string;                     // ≤15 chars (trimmed server-side)
}
```

## Monster rendering
```
<Monster monster={{animal, palette, houseFeatures, conditionTags}} walking dance angel flip />
  └─ motion.svg (viewBox 0 -70 260 290)  ← angel: 50% opacity + float
       ├─ glow + flapping wings attached to the walls (angel only)
       ├─ motion.g  ← body dances: bounce / spin
       │    └─ <Turtle | Snail | BoxCat>  ← legs swing while walking
       │         └─ <House>  ← stories/roof/windows/door/porch/chimney + damage, painted from palette
       │              ├─ chimney smoke (chimneyPuff)
       │              └─ roof group   (lidHop)
       └─ halo just above the roof (angel only)
```
A light `feTurbulence` displacement filter gives the hand-drawn wobble (off for small map sprites).

## Offline & PWA
- `public/sw.js`: app shell cached; `/_next/static` cache-first; pages network-first; `/api/*` never cached.
- Reports: saved before sending, retried by `flushOutbox()` (D-017).
- Analysis needs the network; without it the fallback monster path is used (D-018).

## Environment variables
See `.env.example`. Server-only: `ANTHROPIC_API_KEY`, `REPORT_SENDER`, `CITY_311_EMAIL`, `RESEND_API_KEY`,
`REPORT_FROM_EMAIL`, `OPEN311_*`. Public: `NEXT_PUBLIC_CITY_311_PORTAL_URL`.

## Tests
`npm test` — points & duplicates, IndexedDB repositories, analysis schema → Claude output format,
animal/dance choice, report formatting, sender selection, Open311 request shape.
