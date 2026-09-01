# Jetstream

TypeScript / Node project. This file tells Claude Code how to work in this repo.

## Commands

| Task            | Command                |
| --------------- | ---------------------- |
| Run             | `npm start`            |
| Dev (watch)     | `npm run dev`          |
| Type-check      | `npm run typecheck`    |
| Lint            | `npm run lint`         |
| Lint + fix      | `npm run lint:fix`     |
| Format          | `npm run format`       |
| Test            | `npm test`             |
| **All gates**   | `npm run check`        |

Always run `npm run check` before considering a change done. It runs
type-check, lint, format-check, and tests.

## Stack

- **Runtime:** Node 24 (native TypeScript execution — no build step to run).
- **Language:** TypeScript, strict mode. ESM only (`"type": "module"`).
- **Lint:** ESLint 9 (flat config) with `typescript-eslint` type-checked rules.
- **Format:** Prettier (source of truth for style — never hand-format).
- **Test:** Node's built-in test runner (`node:test`), files named `*.test.ts`.

## Conventions

- Keep functions small and single-purpose; prefer pure functions.
- Prefer `type`/`interface` over `any`. If you reach for `any`, stop and model it.
- Use named exports; avoid default exports.
- Use `import type { ... }` for type-only imports (lint enforces this).
- Relative imports include the `.ts` extension (NodeNext resolution).
- No dead code, no commented-out blocks — delete it, git remembers.
- Handle errors explicitly; don't swallow them.

## Working agreement

- Match the style of surrounding code.
- When adding a feature, add or update a test for it.
- Let Prettier and ESLint format/fix — don't argue with the tools.
- If a rule genuinely gets in the way, change the config deliberately rather
  than sprinkling inline disables.
