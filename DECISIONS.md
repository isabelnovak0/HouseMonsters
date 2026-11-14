# Decisions log

Every non-trivial choice: what we picked, what else we considered, and why.
Newest entries at the bottom. IDs are stable so code comments can point at them.

---

### D-001 · App type: installable PWA (Next.js App Router)
- **Chosen:** Next.js 16 App Router + TypeScript, shipped as a PWA (web manifest + service worker).
- **Alternatives:** React Native / Expo; native Swift/Kotlin; plain Vite SPA.
- **Why:** Camera (`getUserMedia`) and GPS (`navigator.geolocation`) work in mobile Safari/Chrome, so a PWA needs no app-store review and runs on both platforms from one codebase. Next gives us server routes in the same project, which we need to keep the Claude and email API keys off the phone. Vite would need a separate backend.

### D-002 · Styling: Tailwind CSS v4 + a few hand-written classes
- **Chosen:** Tailwind v4 with the palette declared once in `@theme` (globals.css), plus a `.sticker` class for the chunky outlined cartoon look.
- **Alternatives:** CSS Modules; styled-components; a component kit (shadcn, MUI).
- **Why:** Utility classes keep each screen in one file; component kits fight the hand-drawn storybook look we want.

### D-003 · Fonts loaded from Google Fonts `<link>`, not `next/font`
- **Chosen:** A plain stylesheet link for Fredoka (display) + Nunito (body) with system fallbacks.
- **Alternatives:** `next/font/google` (self-hosts at build time).
- **Why:** `next/font` downloads fonts during `next build`, which fails on locked-down CI/build machines. The link degrades gracefully to rounded system fonts. Swap to `next/font` if your build machine has internet.

### D-004 · TypeScript 5.x, not 7.x
- **Chosen:** `typescript@5`.
- **Alternatives:** TypeScript 7 (native port), the npm `latest`.
- **Why:** Next's type plugin and tooling target the 5.x line; the 7.x port is too new to bet a hackathon build on.

### D-005 · One schema for the photo analysis (Zod), shared by server + client
- **Chosen:** `src/lib/analysis-schema.ts` defines `HouseAnalysisSchema` in Zod. The server hands it to Claude as the structured-output format; TypeScript types are inferred from it.
- **Alternatives:** Hand-written JSON Schema + separate TS interfaces; free-text prompt + `JSON.parse`.
- **Why:** Structured outputs guarantee Claude's reply parses; inferring types means the UI, storage and API contract can't drift. `conditionTags` is an enum so the report never contains invented categories.

### D-006 · Three animals, matching the reference art
- **Chosen:** turtle (detailed, like the reference turtle), snail (minimal line-art), box cat (dark creature wearing a wooden box). Type: `AnimalType = "turtle" | "snail" | "boxcat"`.
- **Alternatives:** The six animals in the original brief (+ crab, beetle, tortoise).
- **Why:** The user supplied exactly these three reference images to follow. More animals can be added as new SVG components without touching data or flows.

### D-007 · On-device storage: IndexedDB via `idb`, behind a repository interface
- **Chosen:** `MonsterRepository` / `SettingsRepository` interfaces (`src/lib/storage/repository.ts`) with an IndexedDB implementation using the tiny `idb` wrapper. Screens import from `src/lib/storage/index.ts` only.
- **Alternatives:** `localStorage` (5 MB cap, sync, strings only — photos would blow it); Dexie (bigger API than we need); a backend DB from day one (needs auth/accounts).
- **Why:** IndexedDB stores photos as data URLs comfortably and works offline. The interface means a server-backed repo can replace it later by changing one file.

### D-008 · State management: none beyond React state + the repository
- **Chosen:** Each screen loads what it needs from the repository with `useEffect`/`useState`; the snap flow keeps its step machine in one `useReducer`.
- **Alternatives:** Redux/Zustand; React Query.
- **Why:** There's no shared server cache and only three screens. A global store would be ceremony. Revisit if a backend + sync arrives.

### D-010 · Points & duplicates are pure functions
- **Chosen:** `src/lib/points.ts` — +100 for a new catch, +50 once when resolved, and a 30 m haversine radius for "same house". Points are stored per monster and summed for the total.
- **Alternatives:** A running total in settings; server-side scoring.
- **Why:** Deriving the total from the collection can't get out of sync, and pure functions are unit-tested (`tests/points.test.ts`).
- **When points land:** the reveal previews "+100", but the points are stored only when the user confirms the report (sent, or queued offline). Tapping "Cancel, don't send" keeps the monster as an unreported draft worth 0 until it's reported from the collection. A duplicate catch (within 30 m of one you already have) is worth 0 and the reveal says so.

### D-011 · Photo analysis: one Claude call with structured output, server-side
- **Chosen:** `POST /api/analyze` → `src/lib/server/analyze-house.ts` makes a single `client.beta.messages.parse` call to `claude-opus-5-5` with the photo as a base64 image block and `HouseAnalysisSchema` as the structured-output format. `effort: "low"` because the user is standing in front of the house waiting; server-side `fallbacks: "default"` (beta `server-side-fallback-2026-07-01`) so a safety-classifier decline is retried on another model instead of failing. Refusals, auth, rate-limit and bad-image errors each map to a friendly message; the client then lets the user type the description themselves.
- **Alternatives:** Calling Claude from the browser (would expose the API key); tool-use with a forced tool (forced `tool_choice` isn't supported on this model); a cheaper/faster model (left to the owner — swap `MODEL`); higher effort (slower, little gain for a short extraction).
- **Why:** Structured output means no brittle JSON parsing, and one round-trip keeps the reveal snappy. The system prompt forbids describing people, faces, plates or guessing at occupants, per the privacy requirement.

### D-012 · Photos are downscaled on the phone before upload
- **Chosen:** The client draws the capture onto a canvas at ≤1280 px on the long edge and exports JPEG (q≈0.82) as a data URL. That one image is used for analysis, storage and the 311 email.
- **Alternatives:** Upload the full camera image (often 4–12 MB); server-side resize with `sharp`.
- **Why:** Smaller uploads on mobile data, fits comfortably in IndexedDB and email attachments, and is plenty for Claude vision. No native dependency on the server.

### D-013 · Monsters are composed SVG, not generated images
- **Chosen:** Hand-built SVG parts (`src/components/monster/`): a `House` drawn from `houseFeatures` (stories, roof shape, windows, door side, porch, chimney) and painted from the photo `palette`, with visible damage from `conditionTags` (boarded/broken windows, overgrowth, trash, graffiti, peeling paint, fire damage). It rides on one of three animals modelled on the reference art. A light `feTurbulence` displacement filter gives the hand-drawn wobble.
- **Alternatives:** An image-generation API (one static picture per catch); Lottie/Rive animations; a sprite sheet.
- **Why:** Each part is a separate SVG group, so Framer Motion can swing legs, hop the roof like a lid, puff the chimney and spin/bounce the body — a generated bitmap can't be animated that way. It costs nothing per catch, works offline, and every monster stays in one consistent cartoon style.
- **Animal choice** (`src/lib/monster.ts`): spooky houses (fire damage, open door, collapse) or flat roofs → box cat; 2+ stories or a porch → turtle; small houses → snail; ties broken by a hash of the id. Deterministic so a house always hatches the same species.

### D-014 · Animation: Framer Motion
- **Chosen:** `framer-motion` for keyframed SVG transforms (walk cycle, dances, angel float), CSS `prefers-reduced-motion` respected globally.
- **Alternatives:** Hand-written CSS keyframes; GSAP; Web Animations API directly.
- **Why:** Declarative keyframes per SVG group, easy replay via React keys, and sequencing from React state. GSAP's licence and imperative style add little here.

### D-009 · How reports reach Birmingham 311: email by default, Open311 ready, portal as backup
- **What we found (Nov 2026):** Birmingham's 311 takes requests through an online portal at birminghamal.gov (you need an account), the "My Bham 311" app, and by phone (dial 311 inside the city, or (205) 254-2489). We found **no public Open311 / developer API** and **no published email address for 311 intake**. The city runs an ArcGIS "CRM/311Application" service, but it is a map layer, not a documented way to submit requests. (We could only check via search results; the city site wasn't reachable from the build machine. Confirm with the 311 office.)
- **Chosen:** A `ReportSender` interface (`src/lib/report/`) picked by `REPORT_SENDER`:
  1. `email` (default) — Resend sends a formatted email with the photo attached to `CITY_311_EMAIL`. Point it at your own inbox while testing, then at whichever address the city confirms (or at a team inbox that re-files into the portal).
  2. `open311` — a working GeoReport v2 client (`POST /requests.json`), ready if Birmingham publishes an endpoint.
  The confirmation screen also links to the official portal (`NEXT_PUBLIC_CITY_311_PORTAL_URL`) and offers to copy the report text, so a user can always file it there themselves.
- **Alternatives:** Automating the city's web form with a headless browser (fragile, needs the user's portal login, likely against terms); calling 311 by phone (not automatable); only a "copy & open portal" handoff (no automation at all).
- **Why:** Email is the only automatic channel that works today without credentials we don't have, and the interface means switching to an API later is a config change.
- **Email provider:** Resend — simple REST API, attachments, free tier. Alternatives: SendGrid, Postmark, SMTP via Nodemailer. Any of them fits behind `ReportSender`.

### D-015 · Address lookup and mini map: OpenStreetMap (Nominatim + tiles)
- **Chosen:** `/api/geocode` proxies Nominatim for reverse (GPS → address) and forward (typed address → point, biased to the Birmingham area) lookups. The review screen's small map is OSM raster tiles with a pin, with attribution.
- **Alternatives:** Google Maps / Mapbox (API keys and billing); Leaflet/MapLibre (heavier than a single static map needs).
- **Why:** No key needed to start. Proxying lets us send the identifying User-Agent Nominatim's usage policy asks for, without sending anything about the user. For real traffic, switch to a paid geocoder or self-hosted Nominatim — Nominatim's public server allows ~1 request/second.

### D-016 · Snap flow is one page with a reducer-driven step machine
- **Chosen:** `/snap` renders `camera → analyzing → (notHouse) → reveal → review → done` from one `useReducer` in `src/app/snap/page.tsx`; each step is a component in `src/components/snap/`.
- **Alternatives:** One route per step (`/snap/review`, …) with state in the URL or a store; a state-machine library (XState).
- **Why:** The photo is a large data URL that shouldn't travel through URLs or be re-read between routes, and the steps are strictly linear. A typed reducer gives explicit transitions without a dependency.

### D-017 · Offline: reports are saved before sending and retried automatically
- **Chosen:** On "Send" the monster is written to IndexedDB with `pendingReport: true` first. Success → `reported`. Network/5xx/429 → stays queued and the user sees "will send when you're back online"; `flushOutbox()` retries on app start and on the browser `online` event. A permanent rejection (4xx) clears the flag and shows the error.
- **Alternatives:** Background Sync API (not supported in iOS Safari); dropping the report with an error.
- **Why:** Abandoned houses are often in spots with weak signal. Saving first means closing the tab mid-send never loses a report.

### D-018 · If Claude is unavailable the user can still catch and report
- **Chosen:** When `/api/analyze` fails, the client samples five colors from bands of the photo (`samplePalette`) and hatches a plain one-story house monster named "Mystery House"; the review screen asks the user to write the description.
- **Alternatives:** Block the flow until analysis works.
- **Why:** The civic report matters more than the monster; an API outage shouldn't stop it.

### D-019 · Collection: free-roaming monsters + a status hook
- **Chosen:** `/collection` places each monster absolutely on an illustrated map (`MapBackdrop`); `Wanderer` walks it to random spots (seeded from the monster id), pauses, and sometimes dances. Resolved houses render as angels: 50% opacity, halo above the roof, flapping wings, slow drift instead of walking. Tapping opens a card with name, location, date found and status, plus the next action ("Mark as resolved" or "Report this house to 311" for drafts).
- **Status hook:** `GET /api/report/status?ref=…` asks the configured sender whether the city closed the request; `refreshStatuses()` runs when the collection opens and turns closed reports into angels (+50). Only Open311 can answer (GeoReport v2 `GET /requests/{id}.json`); with email it returns `unknown`, so v1 relies on "Mark as resolved".
- **Alternatives:** A real map library with geographic positions (monsters would pile up on one neighborhood and need clustering); a grid/list view.
- **Why:** The brief asks for monsters roaming a playful map, not a geographic one; the real address is in the card. Positions are cosmetic, so no map tiles or location math are needed.
