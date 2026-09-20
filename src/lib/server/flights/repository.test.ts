import { test, expect, beforeEach } from 'vitest';
import { memoryDb } from '../db/testing.ts';
import { airports } from '../db/schema.ts';
import {
  createFlight,
  deleteFlight,
  getFlightById,
  listAircraftTypes,
  listFlights,
  updateFlight,
} from './repository.ts';
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

test('getFlightById returns the flight with airports, or undefined', async () => {
  createFlight(db, input({ airline: 'BA' }));
  const [flight] = await listFlights(db);
  const found = await getFlightById(db, flight?.id ?? '');
  expect(found?.airline).toBe('BA');
  expect(found?.origin.iata).toBe('LHR');
  expect(await getFlightById(db, 'missing')).toBeUndefined();
});

test('updateFlight changes fields and re-derives times from the new route', async () => {
  createFlight(db, input({ departure: '2026-03-01T09:00' }));
  const [flight] = await listFlights(db);
  updateFlight(
    db,
    flight?.id ?? '',
    input({
      destinationId: 'jfk',
      departure: '2026-03-01T09:00',
      arrival: '2026-03-01T12:30',
      seat: '3A',
    }),
  );
  const updated = await getFlightById(db, flight?.id ?? '');
  expect(updated?.destination.iata).toBe('JFK');
  expect(updated?.seat).toBe('3A');
  expect(updated?.arrival).toBe('2026-03-01T12:30:00-05:00');
});

test('updateFlight throws for an unknown flight id', () => {
  expect(() => updateFlight(db, 'missing', input())).toThrow(/Unknown flight/);
});

test('deleteFlight removes the flight', async () => {
  createFlight(db, input());
  const [flight] = await listFlights(db);
  deleteFlight(db, flight?.id ?? '');
  expect(await listFlights(db)).toHaveLength(0);
});

test('listAircraftTypes returns distinct types, most used first', () => {
  createFlight(db, input({ aircraftType: 'Airbus A320neo' }));
  createFlight(db, input({ aircraftType: 'Boeing 737' }));
  createFlight(db, input({ aircraftType: 'Airbus A320neo' }));
  createFlight(db, input({ aircraftType: null }));
  expect(listAircraftTypes(db)).toEqual(['Airbus A320neo', 'Boeing 737']);
});

test('listAircraftTypes is empty when nothing is logged', () => {
  expect(listAircraftTypes(db)).toEqual([]);
});
