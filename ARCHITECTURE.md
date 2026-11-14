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

## Layout (work in progress)
```
src/
  app/            routes (pages + API route handlers)
  components/     UI pieces
  lib/            domain types, schema, storage, report senders
public/           icons, service worker
```
