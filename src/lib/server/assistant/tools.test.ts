import { test, expect, beforeEach } from 'vitest';
import { memoryDb } from '../db/testing.ts';
import { airports } from '../db/schema.ts';
import type { Db } from '../db/client.ts';
import type { FlightCandidate } from '../../flights/candidate.ts';
import { minutesFromTime, pickBestCandidate, resolveAirport } from './tools.ts';

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
        icao: 'EFHK',
        iata: 'HEL',
        name: 'Helsinki Vantaa',
        municipality: 'Helsinki',
        country: 'FI',
        latitude: 0,
        longitude: 0,
        timezone: 'UTC',
      },
    ])
    .run();
});

function candidate(over: Partial<FlightCandidate>): FlightCandidate {
  return {
    airline: 'FIN',
    flightNumber: '7WG',
    callsign: 'FIN7WG',
    icao24: 'abc',
    departure: '2026-08-30T16:30:00+03:00',
    arrival: '2026-08-30T16:58:00+01:00',
    originIata: 'HEL',
    destinationIata: 'LHR',
    ...over,
  };
}

test('resolveAirport finds an airport by code', () => {
  expect(resolveAirport(db, 'HEL')?.iata).toBe('HEL');
});

test('resolveAirport returns undefined for a blank query', () => {
  expect(resolveAirport(db, null)).toBeUndefined();
});

test('minutesFromTime parses HH:mm and ISO strings', () => {
  expect(minutesFromTime('16:30')).toBe(16 * 60 + 30);
  expect(minutesFromTime('2026-08-30T16:30:00+03:00')).toBe(16 * 60 + 30);
  expect(minutesFromTime('2026-08-30')).toBeNull();
  expect(minutesFromTime(null)).toBeNull();
});

test('pickBestCandidate chooses the closest departure to the stated time', () => {
  const candidates = [
    candidate({ callsign: 'A', departure: '2026-08-30T11:42:00+03:00' }),
    candidate({ callsign: 'B', departure: '2026-08-30T16:30:00+03:00' }),
    candidate({ callsign: 'C', departure: '2026-08-30T19:45:00+03:00' }),
  ];
  expect(pickBestCandidate(candidates, '16:00')?.callsign).toBe('B');
});

test('pickBestCandidate refuses a match beyond tolerance', () => {
  const candidates = [candidate({ departure: '2026-08-30T11:42:00+03:00' })];
  expect(pickBestCandidate(candidates, '16:00')).toBeUndefined();
});

test('pickBestCandidate uses the sole candidate when no time is given', () => {
  expect(pickBestCandidate([candidate({})], null)?.callsign).toBe('FIN7WG');
});

test('pickBestCandidate stays undecided with multiple candidates and no time', () => {
  const candidates = [candidate({ callsign: 'A' }), candidate({ callsign: 'B' })];
  expect(pickBestCandidate(candidates, null)).toBeUndefined();
});
