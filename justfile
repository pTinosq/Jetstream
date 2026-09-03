# Jetstream task runner. Run `just` to list recipes.

# Show available recipes
default:
    @just --list

# First-run setup: create .env, migrate the DB, seed airports
setup:
    npm run setup

# Run the dev server + Drizzle Studio together via Overmind
dev:
    overmind start -f Procfile.dev

# Run only the SvelteKit dev server
web:
    npm run dev

# Open Drizzle Studio (DB browser)
studio:
    npm run db:studio

# Reseed airports (pass a path/URL to seed offline: just seed ./airports.csv)
seed *args:
    npm run db:seed {{ args }}

# Run all checks: type-check, lint, format-check, tests
check:
    npm run check

# Auto-fix lint and formatting
fix:
    npm run lint:fix
    npm run format

# Run tests
test:
    npm test

# Build the production server
build:
    npm run build
