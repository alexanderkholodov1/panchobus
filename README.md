# Pancho Bus

**A dedicated platform for the free university shuttle at Universidad San Francisco de Quito.** Seat booking, QR boarding, live route tracking, operational messaging and demand analytics, in one system shared by the groups that keep the service running: students, administration, route staff and campus security.

| | |
|---|---|
| Live demo | **https://panchobus-backend--panchobus-1.us-east4.hosted.app/** |
| Demo accounts | One click from the login screen: student, administrator, route staff |
| Status | Working prototype, running on real route and stop data. Not presented to the university; not an official USFQ product |
| Origin | Built for Web Development 2 at USFQ, from a problem the authors use every day |

---

## Why this exists

The shuttle is free and it works, but the experience around it was held together by paper, queues and word of mouth. Two long user interviews (75 to 90 minutes each) with daily riders confirmed what riding it already suggested:

- **Seats ran out before most people could react.** A student checking at nine in the morning could already find the route full, with no way to see it in advance and no queue to fall back on.
- **Boarding was verified with stickers handed out in a physical line.** Getting a seat rewarded being early and present, not needing the trip.
- **Routes and schedules lived in PDFs.** No search, no stop detail, no map, no way to tell which departure still had room.
- **Nothing could be announced.** A bus running late or changing its route reached passengers only if someone told someone.
- **Coordination was fragmented.** Administration, drivers, security and students each held a piece of the state, and none of them held the same one.

The last point is the real problem, and the reason this is one platform and not four tools: every group is looking at the same trip from a different side, so they should be looking at the same record of it.

## Principles

These were decided before the first screen and none of them moved.

1. **Access should not depend on physical presence.** Nothing in the product requires standing in a line or reaching an office. A student books, boards and cancels from a phone.
2. **State must be visible to whoever it affects.** Occupancy, delays, route changes and waitlist position are shown to the person who needs them, while a decision still depends on them.
3. **One record, four views.** Student, administrator, route staff and security read and write the same trip, each through the surface their job needs.
4. **Zero cost to operate.** The whole stack runs on free tiers. A university service that costs nothing to run is a service that can actually be adopted.
5. **Institutional, not decorative.** The product uses the university's official visual identity rather than an invented one, because it has to read as part of the institution to be trusted by it.
6. **Evaluable without credentials.** Demo mode is the default: anyone, including the decision maker who would have to approve this, can open the live link and use all three roles with no setup.

## What the platform does

21 screens across three role surfaces, all sharing one data layer.

| Surface | Screens | What it covers |
|---|---|---|
| **Student** | 8 | Personal dashboard with next trip, route explorer with search, route detail with stops on an interactive map, three-step booking with automatic waitlist, booking history with cancellation, active boarding QR, weekly schedule, profile and theme preferences |
| **Administration** | 9 | KPI dashboard with the day's departures, route CRUD, buses, route staff, weekly assignment calendar, all bookings with search and CSV export, user management with driver and admin creation, messaging to individuals or whole routes, demand analytics |
| **Route staff** | 4 | Today's assignment with live GPS reporting and stop sequence, passenger list for the current trip, QR scanner with manual fallback, inbox for messages from administration |

**Demand analytics** is rule-based rather than a model: it flags routes above 85% average occupancy, routes under 40% with active assignments, accumulated waitlist pressure and no-show patterns, and turns each into a concrete operational recommendation (add a bus at peak, merge with a nearby route, send a reminder an hour before departure).

## From research to product decisions

| What the interviews surfaced | What it became |
|---|---|
| Seats gone by mid-morning, with no visibility | Advance booking with per-departure occupancy and an automatic waitlist that promotes on cancellation |
| Stickers handed out in a physical queue | Signed boarding QR on the student's phone, scanned by route staff, with manual code entry when a camera fails |
| Routes published as PDFs | Route explorer with search, stop-by-stop detail and real coordinates on an interactive map |
| No way to announce a delay or a change | Administration messaging to a single user or an entire route, plus driver alerts |
| Four groups, four partial versions of the truth | One data layer, three role surfaces, shared trip state |

## What this is designed to move

The prototype has no production traffic, so it reports no results. These are the metrics it was built to change, and the ones a pilot should measure: share of trips booked in advance instead of claimed in line, no-show rate per route, waitlist conversion after cancellations, boarding time per passenger, share of delays and route changes that reach passengers before departure, and the utilization gap between saturated and underused routes.

## Design

The visual identity is anchored to the university's official brand manual rather than a new one: USFQ red `#E11B22` as primary, institutional black and grey, and the Pancho Bus orange `#F39200` kept from the service's existing logo. Libre Baskerville for display, Inter for body. Every color is a CSS variable, so light and dark are the same design system rather than two stylesheets.

The interface is mobile-first, because the entire student flow happens while walking to a stop: a 256px sidebar on desktop collapses to a dropdown on mobile, and status is carried by badges with a fixed semantic palette (ok, warning, error, info) so a state means the same thing on every screen.

Built with a classmate, who produced the brand identity manual, moodboard, palettes, type system and Figma mockups, and co-presented the pitch. The platform itself, its product design, data model, 21 screens and deployment, was built by Alexander Kholodov.

## Scope: what is real and what is a demo

**Real and working:** all 21 screens; booking with waitlist logic; QR generation and verification by manual code; the interactive map with real coordinates for 8 Quito and Cumbayá routes and 47 stops; GPS reporting from the route staff view to `/api/gps`; messaging; CSV export; rule-based analytics; light and dark themes; PWA manifest; continuous deployment to Firebase App Hosting.

**Demo, by design:** with no Supabase environment variables the app runs entirely on a seeded in-memory store persisted to `localStorage`, including a simulated session. QR scanning uses manual code entry rather than the camera. No email is sent.

**Next, in priority order:** Supabase schema with row-level security per role and real authentication (the data layer in `lib/db/index.ts` is already written as one interface with both branches); camera-based QR scanning; transactional email for booking confirmations and status changes; passenger-facing live bus location; push notifications for status changes.

## Tech

Next.js 14 (App Router), TypeScript, Tailwind CSS with a custom design system, Supabase (Postgres, Auth, RLS) in production with an in-memory store in demo mode, Leaflet with OpenStreetMap tiles, lucide-react, deployed on Firebase App Hosting.

```
app/
  page.tsx            Public landing
  login, registro     Authentication
  app/                Student surface (8 screens)
  admin/              Administration surface (9 screens)
  chofer/             Route staff surface (4 screens)
  api/gps/            Location reporting endpoint
components/           Layout shell, providers, UI primitives
lib/
  types.ts            Domain model, single source of truth
  db/index.ts         Data access layer: one interface, demo and Supabase branches
  data/seed.ts        8 routes, 47 stops with real coordinates, 9 users
```

**Run it locally.**

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run typecheck
```

With no environment variables the app starts in demo mode. To run it against Supabase, copy `.env.example` to `.env.local` and fill in the project URL and anon key.

Contributor notes, the full domain model and the operating rules for this repository are in [`AI_CONTEXT.md`](AI_CONTEXT.md).

---

Independent student project. Not affiliated with, endorsed by, or operated by Universidad San Francisco de Quito.
