import { test, expect } from 'vitest';
import { memoryDb } from '../db/testing.ts';
import { airports } from '../db/schema.ts';
import { seedAirports } from './seed.ts';
import type { AirportSeed } from './parse.ts';

const lhr: AirportSeed = {
  id: '2434',
  icao: 'EGLL',
  iata: 'LHR',
  name: 'London Heathrow Airport',
  municipality: 'London',
  country: 'GB',
  latitude: 51.4706,
  longitude: -0.461941,
  timezone: 'Europe/London',
};

test('inserts airports and reports the count', () => {
  const db = memoryDb();
  const { count } = seedAirports(db, [lhr]);
  expect(count).toBe(1);
  const rows = db.select().from(airports).all();
  expect(rows).toHaveLength(1);
  expect(rows[0]?.iata).toBe('LHR');
});

test('upserts by id so re-seeding is idempotent', () => {
  const db = memoryDb();
  seedAirports(db, [lhr]);
  seedAirports(db, [{ ...lhr, name: 'Heathrow (renamed)' }]);
  const rows = db.select().from(airports).all();
  expect(rows).toHaveLength(1);
  expect(rows[0]?.name).toBe('Heathrow (renamed)');
});
