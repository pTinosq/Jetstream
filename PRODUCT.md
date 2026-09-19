# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The instance owner: a **frequent flyer** who wants a clean, low-effort record of
the flights they've taken and have coming up — where they've been, on what, and
when. They self-host their own private instance. They are travelers first, not
aviation power-users; simplicity and speed of logging matter more than exhaustive
controls (though the product captures aircraft detail automatically when it can).

## Product Purpose

A self-hostable **personal flight log**. It gives one person a single, private
view of their flying:

- an interactive **globe** of the airports they've flown to, with great-circle
  arcs between routes;
- a **dashboard** of stats (flights, distance, time in the air, top airports and
  airlines, per-year counts, longest flight);
- a **table** / list of logged flights.

Success is that recording a flight takes seconds, and that seeing the globe and
stats makes past and upcoming travel feel tangible and worth revisiting.

## Positioning

Free to run and configured entirely from the website — no `.env` archaeology and
no paid services. It is gated by the owner's own GitHub sign-in and built only on
**free data sources**: OpenSky (flight lookup), adsbdb (aircraft), and the
OurAirports open dataset (airport coordinates, seeded locally). From just
**from + to + date** it finds the real flight and identifies the exact
airframe — registration, type, and a photo — without any paid API. Most flight
loggers are hosted SaaS; this is yours, on your box, for nothing.

## Operating Context

Ships as one deployable (SvelteKit UI + server routes, SQLite on a mounted
volume); Railway is the initial target, portable to Docker/other hosts.
**Single-owner:** the first GitHub account to sign in claims the instance;
everyone else is refused, so a public URL stays private to the owner. Instance
configuration (OpenSky keys, GitHub OAuth) is done in-app via a **Settings** /
first-run **setup** flow, stored in the database.

## Capabilities and Constraints

- **Log a flight:** origin/destination airport, departure (and optional arrival),
  airline, flight number, aircraft type, registration, seat, cabin class, notes.
- **Assisted flight detection:** enter from/to + date → pick a real operated
  flight → the form prefills. Source is OpenSky (past flights); its free tier
  retains only **recent history** (roughly the last few weeks), so auto-detect is
  for recently flown segments, not arbitrary historical or future dates.
- **Aircraft identification:** each found flight carries the airframe's `icao24`,
  resolved via adsbdb to registration / type / photo. Best-effort — unknown
  airframes leave the fields blank for manual entry.
- **Views:** globe (globe.gl arcs), dashboard stats, flights table.
- **Time model:** departure/arrival stored as ISO 8601 with UTC offset (airport
  local wall-clock + DST); upcoming vs flown is derived from departure, never
  stored.
- **Trips:** the data model can group legs into a trip (LHR→DXB→SYD), but this is
  not yet surfaced in the UI — an undecided/forthcoming product area.
- **Hard constraint:** no paid API may ever be required to run the core product.

## Brand Commitments

- **Name:** Jetstream.
- **Voice:** clean and utilitarian — minimal, factual, labels and short hints, no
  marketing fluff. Copy explains what to do and gets out of the way.

## Evidence on Hand

- **OurAirports** open dataset (public domain), seeded into SQLite (~9k airports
  with IATA/ICAO codes, coordinates, IANA timezones).
- **OpenSky Network** API (free account; owner supplies credentials).
- **adsbdb** (free, no key) for aircraft details.
- Bundled public-domain NASA night-earth texture at `static/earth-night.jpg`.
- No customers, testimonials, pricing, or usage metrics exist — future work must
  not fabricate them.

## Product Principles

1. **Free to run.** Never require a paid API; rely only on free sources and free
   tiers. Cost must never be a barrier to self-hosting.
2. **Self-hostable and simple.** One deployable, configured in-app; favor
   simplicity over feature breadth.
3. **Low-effort logging.** Adding a flight should take seconds — auto-detect and
   prefill do the typing wherever possible.
4. **Make travel tangible.** The globe and stats should turn a plain list into
   something the owner wants to come back and look at.
