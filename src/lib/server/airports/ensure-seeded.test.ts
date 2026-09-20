import { test, expect, vi, beforeEach } from 'vitest';
import { memoryDb } from '../db/testing.ts';
import { airports } from '../db/schema.ts';
import type { Db } from '../db/client.ts';
import type * as SeedModule from './seed.ts';

// Minimal OurAirports-shaped CSV with one IATA airport.
const CSV = [
  'id,type,name,latitude_deg,longitude_deg,iso_country,municipality,icao_code,iata_code',
  '1,large_airport,London Heathrow Airport,51.47,-0.4543,GB,London,EGLL,LHR',
].join('\n');

const loadAirportSource = vi.fn<(source: string) => Promise<string>>();

vi.mock('$env/dynamic/private', () => ({ env: {} }));
vi.mock('./seed.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof SeedModule>();
  return { ...actual, loadAirportSource: (source: string) => loadAirportSource(source) };
});

let db: Db;

beforeEach(() => {
  vi.resetModules();
  loadAirportSource.mockReset();
  db = memoryDb();
});

test('seeds airports when the table is empty', async () => {
  loadAirportSource.mockResolvedValue(CSV);
  const { ensureAirportsSeeded } = await import('./ensure-seeded.ts');

  await ensureAirportsSeeded(db);

  expect(loadAirportSource).toHaveBeenCalledTimes(1);
  expect(db.select().from(airports).all()).toHaveLength(1);
});

test('does nothing when the table already has data', async () => {
  db.insert(airports)
    .values([
      {
        id: '99',
        icao: null,
        iata: 'JFK',
        name: 'John F. Kennedy International',
        municipality: 'New York',
        country: 'US',
        latitude: 0,
        longitude: 0,
        timezone: 'UTC',
      },
    ])
    .run();
  const { ensureAirportsSeeded } = await import('./ensure-seeded.ts');

  await ensureAirportsSeeded(db);

  expect(loadAirportSource).not.toHaveBeenCalled();
});

test('does not throw if seeding fails; leaves the table empty', async () => {
  loadAirportSource.mockRejectedValue(new Error('offline'));
  const { ensureAirportsSeeded } = await import('./ensure-seeded.ts');

  await expect(ensureAirportsSeeded(db)).resolves.toBeUndefined();
  expect(db.select().from(airports).all()).toHaveLength(0);
});
