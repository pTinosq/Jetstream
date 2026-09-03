import { test, expect, beforeEach } from 'vitest';
import { memoryDb } from '../db/testing.ts';
import { airports } from '../db/schema.ts';
import { createFlight, listFlights } from '../flights/repository.ts';
import { buildGlobeData } from './build.ts';
import type { Db } from '../db/client.ts';
import type { FlightInput } from '../../flights/schema.ts';

let db: Db;

beforeEach(() => {
  db = memoryDb();
  db.insert(airports)
    .values([
      {
        id: 'lhr',
        iata: 'LHR',
        icao: 'EGLL',
        name: 'Heathrow',
        municipality: 'London',
        country: 'GB',
        latitude: 51.47,
        longitude: -0.46,
        timezone: 'Europe/London',
      },
      {
        id: 'dxb',
        iata: 'DXB',
        icao: 'OMDB',
        name: 'Dubai Intl',
        municipality: 'Dubai',
        country: 'AE',
        latitude: 25.25,
        longitude: 55.36,
        timezone: 'Asia/Dubai',
      },
    ])
    .run();
});

function input(overrides: Partial<FlightInput>): FlightInput {
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

test('deduplicates airports into points with visit counts', async () => {
  createFlight(db, input({ originId: 'lhr', destinationId: 'dxb' }));
  createFlight(db, input({ originId: 'dxb', destinationId: 'lhr' }));

  const { points } = buildGlobeData(await listFlights(db));
  expect(points).toHaveLength(2);
  expect(points.every((p) => p.visits === 2)).toBe(true);

  const lhr = points.find((p) => p.id === 'lhr');
  expect(lhr).toMatchObject({ iata: 'LHR', lat: 51.47, lng: -0.46 });
});

test('creates one arc per flight with coordinates and a label', async () => {
  createFlight(db, input({ originId: 'lhr', destinationId: 'dxb' }));

  const { arcs } = buildGlobeData(await listFlights(db));
  expect(arcs).toHaveLength(1);
  expect(arcs[0]).toMatchObject({
    fromId: 'lhr',
    toId: 'dxb',
    startLat: 51.47,
    endLat: 25.25,
    label: 'LHR → DXB',
  });
});

test('returns empty data when there are no flights', () => {
  expect(buildGlobeData([])).toEqual({ points: [], arcs: [] });
});
