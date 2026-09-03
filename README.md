# Jetstream

A self-hostable, open-source **personal flight log**. Jetstream gives you a
single, private view of every flight you've taken and plan to take — plotted on
an interactive 3D globe, with dashboard and table views.

> Status: early development. The app skeleton is in place; features are being
> built out.

## Features (planned)

- **Globe** — a WebGL globe of the airports you've flown to, with great-circle
  arcs between routes.
- **Views** — switch between map, dashboard (stats), and table.
- **Flight log** — record flights and let Jetstream resolve airports and routes.
- **Self-hosted & private** — your data lives in a single SQLite file you own.

## Tech

SvelteKit (Svelte 5) · TypeScript · SQLite + Drizzle ORM · Tailwind CSS ·
`globe.gl`. Builds to a standalone Node server via `@sveltejs/adapter-node`.

## Development

Requires Node 22+.

```sh
npm install
npm run setup        # creates .env, migrates the DB, loads airports (first run)
npm run dev          # → http://localhost:5173
```

SvelteKit serves the UI, server routes, and API from a single process — there
is no separate backend to start.

Common tasks:

| Task        | Command           |
| ----------- | ----------------- |
| First-run   | `npm run setup`   |
| Dev server  | `npm run dev`     |
| Build       | `npm run build`   |
| Preview     | `npm run preview` |
| All checks  | `npm run check`   |
| Reseed data | `npm run db:seed` |

`npm run check` runs type-check, lint, format-check, and tests — it must pass
before every commit.

### Task shortcuts (just)

A [`justfile`](https://github.com/casey/just) wraps the common tasks. Run `just`
to list them:

```sh
just setup   # first-run setup
just dev     # dev server + Drizzle Studio via Overmind
just web     # only the SvelteKit dev server
just check   # all checks
```

### Overmind (optional)

`just dev` uses [Overmind](https://github.com/DarthSim/overmind) to run the dev
server alongside [Drizzle Studio](https://orm.drizzle.team/drizzle-studio/overview)
(a DB browser) via `Procfile.dev`. The app is a single process, so plain
`npm run dev` (or `just web`) is equally fine.

```sh
brew install overmind          # requires tmux
```

## Configuration

`npm run setup` copies `.env.example` to `.env` on first run. `DATABASE_URL`
points at the SQLite file (defaults to `local.db`).

`db:seed` downloads the OurAirports dataset; to seed offline, pass a local CSV:
`npm run db:seed ./airports.csv`.

When self-hosting behind a domain, set `ORIGIN` to the public URL (e.g.
`ORIGIN=https://flights.example.com`) so form submissions pass SvelteKit's CSRF
check.

## License

TBD.
