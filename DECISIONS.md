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
- **Why:** Deriving the total from the collection can't get out of sync, and pure functions are unit-tested (`tests/points.test.ts`). The +100 is awarded at catch time (so the reveal can show "+100"); a duplicate catch earns 0 and the user is warned.

### D-011 · Photo analysis: one Claude call with structured output, server-side
- **Chosen:** `POST /api/analyze` → `src/lib/server/analyze-house.ts` makes a single `client.beta.messages.parse` call to `claude-opus-5-5` with the photo as a base64 image block and `HouseAnalysisSchema` as the structured-output format. `effort: "low"` because the user is standing in front of the house waiting; server-side `fallbacks: "default"` (beta `server-side-fallback-2026-07-01`) so a safety-classifier decline is retried on another model instead of failing. Refusals, auth, rate-limit and bad-image errors each map to a friendly message; the client then lets the user type the description themselves.
- **Alternatives:** Calling Claude from the browser (would expose the API key); tool-use with a forced tool (forced `tool_choice` isn't supported on this model); a cheaper/faster model (left to the owner — swap `MODEL`); higher effort (slower, little gain for a short extraction).
- **Why:** Structured output means no brittle JSON parsing, and one round-trip keeps the reveal snappy. The system prompt forbids describing people, faces, plates or guessing at occupants, per the privacy requirement.

### D-012 · Photos are downscaled on the phone before upload
- **Chosen:** The client draws the capture onto a canvas at ≤1280 px on the long edge and exports JPEG (q≈0.82) as a data URL. That one image is used for analysis, storage and the 311 email.
- **Alternatives:** Upload the full camera image (often 4–12 MB); server-side resize with `sharp`.
- **Why:** Smaller uploads on mobile data, fits comfortably in IndexedDB and email attachments, and is plenty for Claude vision. No native dependency on the server.
