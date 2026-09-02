import { createDb } from '../src/lib/server/db/client.ts';
import { parseAirportsCsv } from '../src/lib/server/airports/parse.ts';
import { loadAirportSource, seedAirports } from '../src/lib/server/airports/seed.ts';

const DEFAULT_SOURCE = 'https://davidmegginson.github.io/ourairports-data/airports.csv';

// Source precedence: CLI arg, then AIRPORTS_CSV env, then the public dataset.
const source = process.argv[2] ?? process.env.AIRPORTS_CSV ?? DEFAULT_SOURCE;
const databaseUrl = process.env.DATABASE_URL ?? 'local.db';

console.log(`Loading airports from ${source}`);
const csv = await loadAirportSource(source);

const seeds = parseAirportsCsv(csv);
console.log(`Parsed ${seeds.length} airports; seeding into ${databaseUrl}`);

const db = createDb(databaseUrl);
const { count } = seedAirports(db, seeds);
console.log(`Done. Seeded ${count} airports.`);
