# Jetstream

TypeScript / Node project. This file tells Claude Code how to work in this repo.

## Project

Jetstream is a self-hostable, open-source **personal flight log**. It gives one
person a centralised view of flights they've taken and will take:

- An interactive **globe/map** of airports flown to, with arcs between routes.
- Multiple views: **map**, **dashboard** (stats), and **table**.
- Later: assisted **flight detection** (enter date + airport → look up flight).

Design priorities: **self-hostable and simple** above all. Single-user, **no
auth** for now (it's behind the host's own access). Ships as one deployable;
**Railway** is the initial target (keep it portable to Docker/other hosts).

## Architecture

- **Framework:** SvelteKit (UI + server routes in one app; single Node server).
- **Database:** SQLite — one file on disk, mounted on a volume when hosted.
- **Data layer:** Drizzle ORM (type-safe queries + migrations).
- **Globe/map:** globe.gl (WebGL 3D globe with great-circle arcs for routes).
- **Styling:** Tailwind CSS.
- **Airport data:** OurAirports open dataset (public domain) seeded into SQLite;
  airport code → coordinates resolved locally, fully offline.

## Data model

- **`airports`** — seeded reference data (coords, codes, IANA `timezone`).
- **`trips`** — optional grouping of legs into one journey (LHR→DXB→SYD).
- **`flights`** — one leg (takeoff→landing); FK to origin/destination airports
  and an optional `trip_id` (+ `sequence` for ordering within a trip).
  - Times (`departure`, `arrival`) are **ISO 8601 strings with UTC offset** —
    pins local wall-clock + DST without a separate tz lookup. `arrival` optional.
  - **Upcoming vs flown is derived** from `departure`, never stored.
- Migrations live in `drizzle/`; change `schema.ts` then `npm run db:generate`.

## Commands

| Task          | Command             |
| ------------- | ------------------- |
| Dev (watch)   | `npm run dev`       |
| Build         | `npm run build`     |
| Preview build | `npm run preview`   |
| Type-check    | `npm run typecheck` |
| Lint          | `npm run lint`      |
| Lint + fix    | `npm run lint:fix`  |
| Format        | `npm run format`    |
| Test          | `npm test`          |
| **All gates** | `npm run check`     |

Always run `npm run check` before considering a change done. It runs
type-check (`svelte-check`), lint, format-check, and tests.

Database (Drizzle): `npm run db:push` (sync schema in dev), `db:generate`
(create a migration), `db:migrate` (apply migrations), `db:studio` (browse).

## Stack

- **Framework:** SvelteKit (Svelte 5 runes) on Vite; `@sveltejs/adapter-node`
  builds a standalone Node server for self-hosting.
- **Language:** TypeScript, strict mode. ESM only (`"type": "module"`).
- **Lint:** ESLint (flat config) with `typescript-eslint` type-checked rules +
  `eslint-plugin-svelte`.
- **Format:** Prettier (source of truth for style — never hand-format).
- **Test:** Vitest; test files named `*.test.ts` (or `*.spec.ts`).

## Conventions

**Types** — Strict, no escapes. Never `any` (use `unknown` + narrowing). No
non-null `!` or unnecessary assertions (lint-enforced). Prefer inference;
annotate exported signatures. Validate all external input at boundaries with
**Zod** (`z.parse` HTTP bodies, config, env, third-party responses).

**Errors** — Hybrid. Return a `Result<T, E>` union for expected/domain
failures (validation, not-found); `throw` typed `Error` subclasses only for
truly exceptional/invariant violations. Never swallow errors.

**Comments** — Why, not what. Code is self-documenting via clear names;
comment only non-obvious decisions, trade-offs, gotchas. No JSDoc unless a
contract is genuinely subtle.

**Structure** — SvelteKit layout: routes/pages in `src/routes/`, shared code
in `src/lib/` (imported via the `$lib` alias), server-only code in
`src/lib/server/` (never imported by client). Group `src/lib/` by feature/domain,
each holding its logic, types, and `*.test.ts` together. Named exports only.
Relative imports include the `.ts` extension.

**Style** — Immutability preferred for shared/returned data; mutate freely in
local scopes when clearer. `async`/`await` preferred over `.then()` chains;
`Promise.all` for independent work. No dead code — delete it, git remembers.

## Testing

- Test behavior and meaningful branches, not implementation details. Aim for
  confidence, not a coverage number.
- Add or update a test with every feature and bugfix.
- Run a single test file: `npx vitest run src/lib/<feature>/x.test.ts`.

## Git

- Conventional Commits (`feat:` / `fix:` / `chore:` / `refactor:` / `test:` …).
- Work on feature branches; PR into `main`. `npm run check` must pass before
  commit.
- **Commit and push continually as you build** — many small, focused commits
  per PR, each a coherent step, pushed as they land. Aim for a clean, readable
  git history that tells the story of the feature; don't batch a whole feature
  into one giant commit.

## Working agreement

- Match the style of surrounding code.
- Let Prettier and ESLint format/fix — don't argue with the tools.
- If a rule genuinely gets in the way, change the config deliberately rather
  than sprinkling inline disables.
