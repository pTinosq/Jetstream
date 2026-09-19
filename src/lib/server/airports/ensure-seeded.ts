import { count } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import type { Db } from '../db/client.ts';
import { airports } from '../db/schema.ts';
import { parseAirportsCsv } from './parse.ts';
import { loadAirportSource, seedAirports } from './seed.ts';

const DEFAULT_SOURCE = 'https://davidmegginson.github.io/ourairports-data/airports.csv';

let seeding: Promise<void> | null = null;
let populated = false;

function isEmpty(db: Db): boolean {
  const [row] = db.select({ n: count() }).from(airports).all();
  return (row?.n ?? 0) === 0;
}

/**
 * First-run convenience for self-hosters: if the airports table is empty,
 * download and seed the OurAirports dataset once so airport autocomplete works
 * without a manual `npm run db:seed`. Runs at most once per process, and never
 * throws — an offline host just gets an empty table and can seed by hand.
 */
export async function ensureAirportsSeeded(db: Db): Promise<void> {
  if (populated) return;
  if (seeding !== null) return seeding;
  if (!isEmpty(db)) {
    populated = true;
    return;
  }

  seeding = (async () => {
    const source =
      env.AIRPORTS_CSV !== undefined && env.AIRPORTS_CSV !== '' ? env.AIRPORTS_CSV : DEFAULT_SOURCE;
    console.log(`[airports] table empty — seeding from ${source}`);
    const csv = await loadAirportSource(source);
    const seeds = parseAirportsCsv(csv);
    const { count: n } = seedAirports(db, seeds);
    populated = true;
    console.log(`[airports] seeded ${n} airports`);
  })().catch((error: unknown) => {
    // Don't crash the server; leave the table empty for a manual seed.
    console.error('[airports] auto-seed failed; run `npm run db:seed` manually:', error);
    seeding = null;
  });

  return seeding;
}
