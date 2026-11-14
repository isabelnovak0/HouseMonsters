# House Monsters

**Pokémon Go for abandoned houses.** Snap a photo of an abandoned house in Birmingham, AL. It turns
into a cartoon monster (a turtle, snail or box cat carrying *your* house), it dances, you name it,
and the app files a report to Birmingham 311 with the photo, location and an AI-written description.
When the city deals with the house, its monster becomes an angel.

- **Home:** two big buttons, **Snap a house** and **My monsters**, plus your points.
- **Snap:** camera → Claude reads the photo → monster bursts out of the photo, walks and does 3 dances → name it (15 letters max) → review the 311 report → send.
- **My monsters:** your monsters roam an illustrated map. Fixed houses float as see-through angels with halos. Tap one to see its name, location and when you found it.

See [ARCHITECTURE.md](ARCHITECTURE.md) for components, data flow and the data model, and
[DECISIONS.md](DECISIONS.md) for every non-trivial choice and its alternatives.

## Before you send real reports: read this

Birmingham does not publish a 311 API or a 311 intake email address (as of Nov 2026; details in
[DECISIONS.md › D-009](DECISIONS.md)). The city takes reports through its online portal (account
required), the My Bham 311 app, and by phone (311 or (205) 254-2489). So:

- The app **emails** each report (photo attached) to whatever address you put in `CITY_311_EMAIL`.
  **Use your own inbox while testing.** Before pointing it anywhere official, ask the city's 311
  office which address or intake route they'll accept.
- If Birmingham publishes an Open311 endpoint, set `REPORT_SENDER=open311` and the `OPEN311_*` vars.
- Every confirmation screen also offers **Copy report** + a link to the official portal, so users can file there too.

## Setup

Requirements: Node 20+ and npm.

```bash
npm install
```

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Needed for | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | photo analysis | From console.anthropic.com. Without it the app still works: users get a plain monster in their photo's colors and type the description themselves. |
| `RESEND_API_KEY` | sending reports | From resend.com (free tier is fine). |
| `REPORT_FROM_EMAIL` | sending reports | A sender on a domain you verified in Resend, e.g. `House Monsters <reports@yourdomain.com>`. For quick tests Resend allows `onboarding@resend.dev`, but only to your own Resend account email. |
| `CITY_311_EMAIL` | sending reports | **Your own address while testing.** |
| `REPORT_SENDER` | optional | `email` (default) or `open311`. |
| `OPEN311_BASE_URL`, `OPEN311_SERVICE_CODE`, `OPEN311_API_KEY` | optional | Only with `REPORT_SENDER=open311`. |
| `NEXT_PUBLIC_CITY_311_PORTAL_URL` | optional | Portal link on the confirmation screen. Defaults to `https://birminghamal.gov/311`. |

Run it on your computer:

```bash
npm run dev
```

Open http://localhost:3000. Camera and GPS work on `localhost` in a desktop browser.

## Running it on your phone (HTTPS is required)

Phones only allow the camera and location on **HTTPS** pages. Pick one:

**A. A tunnel (easiest, trusted certificate).** Start the dev server, then in a second terminal:

```bash
npx cloudflared tunnel --url http://localhost:3000
```

Open the `https://….trycloudflare.com` address it prints on your phone. (`ngrok http 3000` works the same way.)

**B. Same Wi-Fi with a self-signed certificate.**

```bash
npm run dev:https
```

Then open `https://<your-computer's-LAN-IP>:3000` on your phone and accept the certificate warning.
Some phones refuse camera access on an untrusted certificate. If the live camera doesn't open, the
app falls back to the phone's own camera app, and option A avoids the issue.

**C. Deploy.** Push to Vercel (or any Node host), add the same environment variables in its dashboard, and open the HTTPS URL.

**Install it like an app:** in Safari tap Share → *Add to Home Screen*; in Chrome tap ⋮ → *Install app*.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on http://localhost:3000 |
| `npm run dev:https` | Dev server with a self-signed HTTPS cert, reachable on your LAN |
| `npm run build` / `npm start` | Production build / serve |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | TypeScript check |

`/gallery` (dev mode only) shows every animal with sample houses, plus buttons for each dance move.

## Privacy

- Photos and the collection stay on the phone (IndexedDB) until the user taps **Send to 311**.
- The analysis prompt tells Claude never to describe people, faces or license plates.
- Before sending, the review screen tells users that the photo, location and any contact info go to the City of Birmingham.
- Address lookups go through our server to OpenStreetMap with a generic app User-Agent and nothing about the user.

## What I'd build next

1. **Confirm the intake route with Birmingham 311**, and switch from email to an API if they offer one. Then `/api/report/status` can turn monsters into angels automatically.
2. **A shared backend** (Postgres + auth) behind `MonsterRepository`, so collections survive a phone change and duplicate reports are caught across *all* users, not just your own.
3. **Leaderboards and neighborhood maps**: points per neighborhood, a city-wide map of reported houses for organizers and council members.
4. **More animals** (crab, beetle, tortoise) and more dances: each is one SVG component.
5. **Photo privacy pass**: blur faces and license plates on the phone before upload.
6. **Push notifications** when a house you reported is fixed.
7. **A paid or self-hosted geocoder** before real traffic (the public Nominatim server allows about 1 request per second).
