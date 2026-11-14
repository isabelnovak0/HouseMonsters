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
