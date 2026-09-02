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
npm run dev
```

Common tasks:

| Task       | Command           |
| ---------- | ----------------- |
| Dev server | `npm run dev`     |
| Build      | `npm run build`   |
| Preview    | `npm run preview` |
| All checks | `npm run check`   |
| Sync DB    | `npm run db:push` |

`npm run check` runs type-check, lint, format-check, and tests — it must pass
before every commit.

## Configuration

Copy `.env.example` to `.env`. `DATABASE_URL` points at the SQLite file
(defaults to `local.db`).

## License

TBD.
