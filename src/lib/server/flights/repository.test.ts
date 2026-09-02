import { test, expect, beforeEach } from 'vitest';
import { memoryDb } from '../db/testing.ts';
import { airports } from '../db/schema.ts';
import { createFlight, listFlights } from './repository.ts';
import type { Db } from '../db/client.ts';
import type { FlightInput } from '../../flights/schema.ts';

let db: Db;

beforeEach(() => {
  db = memoryDb();
  db.insert(airports)
    .values([
      airport('lhr', 'LHR', 'Europe/London'),
      airport('dxb', 'DXB', 'Asia/Dubai'),
      airport('jfk', 'JFK', 'America/New_York'),
    ])
    .run();
});

function airport(id: string, iata: string, timezone: string) {
  return {
    id,
    iata,
    icao: null,
    name: `${iata} Airport`,
    municipality: null,
    country: 'XX',
    latitude: 0,
    longitude: 0,
    timezone,
  };
}

function input(overrides: Partial<FlightInput> = {}): FlightInput {
  return {
    originId: 'lhr',
    destinationId: 'dxb',
    departure: '2026-03-01T09:00',
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

test('stores departure/arrival with the airport timezone offset', async () => {
  createFlight(db, input({ arrival: '2026-03-01T20:15' }));
  const [flight] = await listFlights(db);
  expect(flight?.departure).toBe('2026-03-01T09:00:00+00:00');
  expect(flight?.arrival).toBe('2026-03-01T20:15:00+04:00');
});

test('leaves arrival null when not provided', async () => {
  createFlight(db, input());
  const [flight] = await listFlights(db);
  expect(flight?.arrival).toBeNull();
});

test('joins origin and destination airports', async () => {
  createFlight(db, input());
  const [flight] = await listFlights(db);
  expect(flight?.origin.iata).toBe('LHR');
  expect(flight?.destination.iata).toBe('DXB');
});

test('orders most recent departure first', async () => {
  createFlight(db, input({ departure: '2026-01-01T10:00' }));
  createFlight(db, input({ destinationId: 'jfk', departure: '2026-06-01T10:00' }));
  const flights = await listFlights(db);
  expect(flights.map((f) => f.destination.iata)).toEqual(['JFK', 'DXB']);
});

test('throws for an unknown airport', () => {
  expect(() => createFlight(db, input({ destinationId: 'nope' }))).toThrow(/Unknown destination/);
});
