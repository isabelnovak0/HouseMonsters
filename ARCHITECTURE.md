# Architecture

House Monsters is a mobile-first PWA: photograph an abandoned house, it becomes a cartoon
monster in your collection, and a report goes to Birmingham, AL 311.

_This document is kept current as the code changes. Design rationale lives in DECISIONS.md._

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS v4
- Claude API (`@anthropic-ai/sdk`) for photo analysis — server-side only
- IndexedDB (`idb`) for the on-device collection
- Framer Motion for monster animation; monsters are hand-built layered SVG

## Data model (`src/lib/types.ts`)
One record per collected house, stored in IndexedDB store `monsters` (key `id`, index `foundAt`):

| Field | Type | Notes |
|---|---|---|
| id | string | `crypto.randomUUID()` |
| name | string ≤ 15 | user-editable, pre-filled by Claude |
| animal | `turtle \| snail \| boxcat` | picked from house features |
| houseFeatures | roofShape, stories, windowCount, doorPosition, porch, chimney | from Claude |
| palette | roof, walls, door, trim, surroundings (hex) | from Claude; paints the monster |
| photo | JPEG data URL | downscaled to ≤1280 px on the phone |
| location | lat, lng, accuracy? | GPS at capture, or geocoded typed address |
| address | string | reverse-geocoded, user-editable |
| description, conditionTags | string, enum[] | from Claude, user-editable |
| foundAt | ISO time | |
| reportStatus | `draft \| reported \| resolved` | |
| reportRef, reportedAt, resolvedAt | optional | |
| points | number | 100 per new house, +50 when resolved, 0 for duplicates |
| pendingReport | boolean? | confirmed but waiting for network |
| reporter | name/email/phone? | what was sent with the report |

Store `settings` holds the remembered reporter contact (key `reporter`).

## Monster rendering
```
<Monster monster={{animal, palette, houseFeatures, conditionTags}} walking dance angel flip />
  └─ motion.svg (viewBox 0 -70 260 290)  ← angel: 50% opacity + float
       ├─ wings + glow (angel only)
       ├─ motion.g  ← body dances: bounce / spin
       │    └─ <Turtle | Snail | BoxCat>  ← legs swing while walking
       │         └─ <House>  ← drawn from features + palette + damage tags
       │              ├─ chimney smoke (motion: chimneyPuff)
       │              └─ roof group   (motion: lidHop)
       └─ halo (angel only, placed above the roof)
```
`/gallery` (dev only) shows every animal × sample houses with buttons for each move.

## Layout (work in progress)
```
src/
  app/            routes (pages + API route handlers)
  components/     UI pieces
  lib/            domain types, schema, storage, report senders
public/           icons, service worker
```
