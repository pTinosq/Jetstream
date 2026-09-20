import { test, expect, beforeEach } from 'vitest';
import { memoryDb } from '../db/testing.ts';
import { airports } from '../db/schema.ts';
import type { Db } from '../db/client.ts';
import type { FlightCandidate } from '../../flights/candidate.ts';
import type { FlightSearchProvider } from '../flights/providers/types.ts';
import { executeTool, type ToolContext } from './tools.ts';

let db: Db;

beforeEach(() => {
  db = memoryDb();
  db.insert(airports)
    .values([
      {
        id: '1',
        icao: 'EGLL',
        iata: 'LHR',
        name: 'London Heathrow',
        municipality: 'London',
        country: 'GB',
        latitude: 0,
        longitude: 0,
        timezone: 'UTC',
      },
      {
        id: '2',
        icao: 'LGAV',
        iata: 'ATH',
        name: 'Athens',
        municipality: 'Athens',
        country: 'GR',
        latitude: 0,
        longitude: 0,
        timezone: 'UTC',
      },
    ])
    .run();
});

test('search_airports returns id-bearing candidates', async () => {
  const ctx: ToolContext = { db, provider: null, lastSearch: null };
  const result = (await executeTool(ctx, 'search_airports', { query: 'LHR' })) as {
    airports: { id: string; code: string }[];
  };
  expect(result.airports[0]).toMatchObject({ id: '1', code: 'LHR' });
});

test('search_flights reports unavailable when no provider is configured', async () => {
  const ctx: ToolContext = { db, provider: null, lastSearch: null };
  const result = (await executeTool(ctx, 'search_flights', {
    originAirportId: '1',
    destinationAirportId: '2',
    date: '2026-09-18',
  })) as { available: boolean };
  expect(result.available).toBe(false);
});

test('search_flights returns refs and records lastSearch', async () => {
  const candidate: FlightCandidate = {
    airline: 'AY',
    flightNumber: '1337',
    callsign: 'FIN1337',
    icao24: 'abc',
    departure: '2026-09-18T20:55:00+01:00',
    arrival: '2026-09-19T02:10:00+03:00',
    originIata: 'LHR',
    destinationIata: 'ATH',
  };
  const provider: FlightSearchProvider = {
    name: 'stub',
    search: () => Promise.resolve([candidate]),
  };
  const ctx: ToolContext = { db, provider, lastSearch: null };

  const result = (await executeTool(ctx, 'search_flights', {
    originAirportId: '1',
    destinationAirportId: '2',
    date: '2026-09-18',
  })) as { available: boolean; candidates: { flightRef: string; departureLocal: string }[] };

  expect(result.available).toBe(true);
  expect(result.candidates[0]).toMatchObject({
    flightRef: '1',
    departureLocal: '2026-09-18T20:55',
  });
  expect(ctx.lastSearch?.candidates).toHaveLength(1);
});
