import { test, expect, beforeEach } from 'vitest';
import { memoryDb } from '../db/testing.ts';
import { airports } from '../db/schema.ts';
import { createFlight, listFlights } from '../flights/repository.ts';
import { buildStats, parseSeat } from './build.ts';
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

test('parseSeat pulls a row and letter, or null when unparseable', () => {
  expect(parseSeat('10A')).toEqual({ row: 10, letter: 'A' });
  expect(parseSeat('7 c')).toEqual({ row: 7, letter: 'C' });
  expect(parseSeat('')).toBeNull();
  expect(parseSeat('window')).toBeNull();
});

test('classifies seats by position, section and favourite', async () => {
  createFlight(db, input({ seat: '10A' })); // front · window
  createFlight(db, input({ seat: '12F' })); // mid · window
  createFlight(db, input({ seat: '28C' })); // rear · aisle
  createFlight(db, input({ seat: '10A' })); // front · window (repeat)
  createFlight(db, input({ seat: null })); // ignored
  const { seats } = buildStats(await listFlights(db), NOW);

  expect(seats.parsed).toBe(4);
  expect(seats.position).toEqual({ window: 3, middle: 0, aisle: 1 });
  expect(seats.section).toEqual({ front: 2, mid: 1, rear: 1 });
  expect(seats.favouritePosition).toBe('window');
  expect(seats.favouriteSection).toBe('front');
  expect(seats.favouriteSeat).toBe('10A');
});

test('aggregates aircraft types and cabins by frequency', async () => {
  createFlight(db, input({ aircraftType: 'Airbus A320neo', cabinClass: 'economy' }));
  createFlight(db, input({ aircraftType: 'Airbus A320neo', cabinClass: 'business' }));
  createFlight(db, input({ aircraftType: 'Boeing 737', cabinClass: 'economy' }));
  const stats = buildStats(await listFlights(db), NOW);
  expect(stats.topAircraft[0]).toEqual({ type: 'Airbus A320neo', count: 2 });
  expect(stats.cabins).toContainEqual({ cabin: 'economy', count: 2 });
});

test('buckets departures by part of day and weekday from wall-clock time', async () => {
  // 2025-03-01 is a Saturday; 09:00 is morning.
  createFlight(db, input({ departure: '2025-03-01T09:00' }));
  createFlight(db, input({ departure: '2025-03-08T09:30' })); // Saturday, morning
  createFlight(db, input({ departure: '2025-03-03T19:00' })); // Monday, evening
  const { time } = buildStats(await listFlights(db), NOW);

  expect(time.byPartOfDay.morning).toBe(2);
  expect(time.byPartOfDay.evening).toBe(1);
  expect(time.favouritePartOfDay).toBe('morning');
  expect(time.byWeekday[6]).toBe(2); // Saturday
  expect(time.favouriteWeekday).toBe(6);
});

test('seat and time stats are empty-safe with no data', () => {
  const stats = buildStats([], NOW);
  expect(stats.seats.parsed).toBe(0);
  expect(stats.seats.favouritePosition).toBeNull();
  expect(stats.time.favouriteWeekday).toBeNull();
  expect(stats.topAircraft).toEqual([]);
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
