import { test, expect, beforeEach } from 'vitest';
import { memoryDb } from '../db/testing.ts';
import { airports } from '../db/schema.ts';
import { createFlight, listFlights } from '../flights/repository.ts';
import { buildStats } from './build.ts';
import type { Db } from '../db/client.ts';
import type { FlightInput } from '../../flights/schema.ts';

let db: Db;

beforeEach(() => {
  db = memoryDb();
  db.insert(airports)
    .values([
      seed('lhr', 'LHR', 'GB', 51.4706, -0.461941),
      seed('dxb', 'DXB', 'AE', 25.2528, 55.3644),
      seed('jfk', 'JFK', 'US', 40.6398, -73.7789),
    ])
    .run();
});

function seed(id: string, iata: string, country: string, latitude: number, longitude: number) {
  return {
    id,
    iata,
    icao: null,
    name: `${iata} Airport`,
    municipality: null,
    country,
    latitude,
    longitude,
    timezone: 'UTC',
  };
}

function input(overrides: Partial<FlightInput>): FlightInput {
  return {
    originId: 'lhr',
    destinationId: 'dxb',
    departure: '2025-03-01T09:00',
    arrival: null,
    airline: null,
    flightNumber: null,
    aircraftType: null,
    aircraftRegistration: null,
    seat: null,
    cabinClass: null,
    notes: null,
    ...overrides,
  };
}

const NOW = new Date('2025-06-01T00:00:00Z');

test('empty log yields zeroed stats', () => {
  const stats = buildStats([], NOW);
  expect(stats).toMatchObject({
    totalFlights: 0,
    flown: 0,
    upcoming: 0,
    uniqueAirports: 0,
    uniqueCountries: 0,
    totalDistanceKm: 0,
    longest: null,
  });
});

test('aggregates airports, countries, distance and airlines', async () => {
  createFlight(db, input({ originId: 'lhr', destinationId: 'dxb', airline: 'BAW' }));
  createFlight(db, input({ originId: 'dxb', destinationId: 'jfk', airline: 'UAE' }));
  const stats = buildStats(await listFlights(db), NOW);

  expect(stats.totalFlights).toBe(2);
  expect(stats.uniqueAirports).toBe(3);
  expect(stats.uniqueCountries).toBe(3);
  expect(stats.totalDistanceKm).toBeGreaterThan(10_000);
  expect(stats.topAirports[0]?.code).toBe('DXB'); // appears in both legs
  expect(stats.topAirports[0]?.visits).toBe(2);
  expect(stats.topAirlines).toContainEqual({ airline: 'BAW', count: 1 });
});

test('splits flown vs upcoming by departure relative to now', async () => {
  createFlight(db, input({ departure: '2025-01-15T09:00' })); // past
  createFlight(db, input({ departure: '2025-12-20T09:00' })); // future
  const stats = buildStats(await listFlights(db), NOW);
  expect(stats.flown).toBe(1);
  expect(stats.upcoming).toBe(1);
});

test('sums duration only when arrival is known', async () => {
  createFlight(db, input({ departure: '2025-03-01T09:00', arrival: '2025-03-01T16:00' }));
  createFlight(db, input({ departure: '2025-03-02T09:00', arrival: null }));
  const stats = buildStats(await listFlights(db), NOW);
  // 09:00→16:00 UTC = 7h = 420 min.
  expect(stats.totalDurationMinutes).toBe(420);
});

test('reports the longest flight and per-year counts', async () => {
  createFlight(db, input({ originId: 'lhr', destinationId: 'jfk', departure: '2024-05-01T09:00' }));
  createFlight(db, input({ originId: 'lhr', destinationId: 'dxb', departure: '2025-05-01T09:00' }));
  const stats = buildStats(await listFlights(db), NOW);
  expect(stats.longest?.label).toBe('LHR → JFK');
  expect(stats.perYear).toEqual([
    { year: 2024, count: 1 },
    { year: 2025, count: 1 },
  ]);
});
