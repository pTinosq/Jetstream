import { test, expect, beforeEach } from 'vitest';
import { memoryDb } from '../db/testing.ts';
import { airports } from '../db/schema.ts';
import { searchAirports } from './search.ts';
import type { Db } from '../db/client.ts';

let db: Db;

beforeEach(() => {
  db = memoryDb();
  db.insert(airports)
    .values([
      makeAirport({
        id: '1',
        iata: 'LHR',
        name: 'London Heathrow Airport',
        municipality: 'London',
      }),
      makeAirport({ id: '2', iata: 'LGW', name: 'London Gatwick Airport', municipality: 'London' }),
      makeAirport({
        id: '3',
        iata: 'JFK',
        name: 'John F. Kennedy International',
        municipality: 'New York',
      }),
    ])
    .run();
});

function makeAirport(fields: { id: string; iata: string; name: string; municipality: string }) {
  return {
    ...fields,
    icao: null,
    country: 'XX',
    latitude: 0,
    longitude: 0,
    timezone: 'UTC',
  };
}

test('returns nothing for an empty query', () => {
  expect(searchAirports(db, '   ')).toEqual([]);
});

test('finds an airport by exact IATA code', () => {
  const results = searchAirports(db, 'jfk');
  expect(results).toHaveLength(1);
  expect(results[0]?.iata).toBe('JFK');
});

test('finds airports by city name', () => {
  const results = searchAirports(db, 'London');
  expect(results.map((a) => a.iata).sort()).toEqual(['LGW', 'LHR']);
});

test('ranks an exact IATA match ahead of name matches', () => {
  db.insert(airports)
    .values([
      makeAirport({ id: '4', iata: 'ABC', name: 'LHR Regional Field', municipality: 'Nowhere' }),
    ])
    .run();
  const results = searchAirports(db, 'LHR');
  expect(results[0]?.iata).toBe('LHR');
});

test('honours the result limit', () => {
  const results = searchAirports(db, 'London', 1);
  expect(results).toHaveLength(1);
});
