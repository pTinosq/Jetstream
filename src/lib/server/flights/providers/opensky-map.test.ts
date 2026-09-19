import { test, expect } from 'vitest';
import { mapOpenSkyRoute, parseCallsign } from './opensky-map.ts';
import type { Airport } from '../../../airports/types.ts';

const lhr: Airport = {
  id: 'lhr',
  icao: 'EGLL',
  iata: 'LHR',
  name: 'Heathrow',
  municipality: 'London',
  country: 'GB',
  latitude: 51.47,
  longitude: -0.46,
  timezone: 'Europe/London',
};
const jfk: Airport = {
  id: 'jfk',
  icao: 'KJFK',
  iata: 'JFK',
  name: 'JFK',
  municipality: 'New York',
  country: 'US',
  latitude: 40.64,
  longitude: -73.78,
  timezone: 'America/New_York',
};

function departure(over: Record<string, unknown>) {
  return {
    icao24: 'abc123',
    firstSeen: 0,
    estDepartureAirport: 'EGLL',
    lastSeen: 0,
    estArrivalAirport: 'KJFK',
    callsign: 'BAW117',
    ...over,
  };
}

function arrival(over: Record<string, unknown>) {
  return {
    icao24: 'abc123',
    firstSeen: 0,
    estDepartureAirport: 'EGLL',
    lastSeen: 0,
    estArrivalAirport: 'KJFK',
    callsign: 'BAW117',
    ...over,
  };
}

test('parseCallsign splits airline and number', () => {
  expect(parseCallsign('BAW117 ')).toEqual({ airline: 'BAW', flightNumber: '117' });
});

test('parseCallsign handles number suffixes (letters after digits)', () => {
  expect(parseCallsign('UAE79Y')).toEqual({ airline: 'UAE', flightNumber: '79Y' });
  expect(parseCallsign('UAE7CN')).toEqual({ airline: 'UAE', flightNumber: '7CN' });
});

test('parseCallsign returns nulls for unparseable callsigns', () => {
  expect(parseCallsign(null)).toEqual({ airline: null, flightNumber: null });
  expect(parseCallsign('123')).toEqual({ airline: null, flightNumber: null });
});

test('keeps flights whose estimated arrival is the destination', () => {
  const departures = [
    departure({ estArrivalAirport: 'KJFK', callsign: 'BAW117' }),
    departure({ estArrivalAirport: 'KBOS', callsign: 'BAW999' }),
  ];
  const candidates = mapOpenSkyRoute(departures, [], lhr, jfk);
  expect(candidates.map((c) => c.callsign)).toEqual(['BAW117']);
});

test('confirms a flight via the arrival feed when OpenSky could not estimate the destination', () => {
  // A real match whose departure row has a null estimated arrival airport — the
  // exact case that used to be silently dropped.
  const departures = [
    departure({ icao24: 'aaa111', estArrivalAirport: null, callsign: 'BAW640', firstSeen: 1000 }),
  ];
  const arrivals = [arrival({ icao24: 'aaa111', callsign: 'BAW640', lastSeen: 12_000 })];
  const candidates = mapOpenSkyRoute(departures, arrivals, lhr, jfk);
  expect(candidates).toHaveLength(1);
  expect(candidates[0]?.callsign).toBe('BAW640');
});

test('does not match an airframe that landed at the destination on an unrelated later leg', () => {
  const departures = [departure({ icao24: 'aaa111', estArrivalAirport: null, firstSeen: 1000 })];
  // Same airframe, but landing more than a day later — a different flight.
  const arrivals = [arrival({ icao24: 'aaa111', lastSeen: 1000 + 25 * 60 * 60 })];
  expect(mapOpenSkyRoute(departures, arrivals, lhr, jfk)).toHaveLength(0);
});

test('drops departures that neither estimate nor land at the destination', () => {
  const departures = [departure({ icao24: 'zzz999', estArrivalAirport: null, callsign: 'VIR3' })];
  expect(mapOpenSkyRoute(departures, [], lhr, jfk)).toHaveLength(0);
});

test('converts absolute times to each airport local zone', () => {
  // firstSeen 2026-03-01T09:00Z → 09:00 London (+00). lastSeen 16:30Z → 11:30 NY (-05).
  const departures = [
    departure({
      firstSeen: Math.floor(Date.UTC(2026, 2, 1, 9, 0, 0) / 1000),
      lastSeen: Math.floor(Date.UTC(2026, 2, 1, 16, 30, 0) / 1000),
    }),
  ];
  const [candidate] = mapOpenSkyRoute(departures, [], lhr, jfk);
  expect(candidate?.departure).toBe('2026-03-01T09:00:00+00:00');
  expect(candidate?.arrival).toBe('2026-03-01T11:30:00-05:00');
  expect(candidate?.airline).toBe('BAW');
  expect(candidate?.flightNumber).toBe('117');
  expect(candidate?.icao24).toBe('abc123');
});

test('prefers the arrival feed landing time over the departure row lastSeen', () => {
  const departures = [
    departure({
      icao24: 'aaa111',
      estArrivalAirport: null,
      firstSeen: Math.floor(Date.UTC(2026, 2, 1, 9, 0, 0) / 1000),
      lastSeen: Math.floor(Date.UTC(2026, 2, 1, 10, 0, 0) / 1000), // left coverage early
    }),
  ];
  const arrivals = [
    arrival({
      icao24: 'aaa111',
      lastSeen: Math.floor(Date.UTC(2026, 2, 1, 16, 30, 0) / 1000), // actual landing
    }),
  ];
  const [candidate] = mapOpenSkyRoute(departures, arrivals, lhr, jfk);
  expect(candidate?.arrival).toBe('2026-03-01T11:30:00-05:00');
});

test('sorts candidates by departure time', () => {
  const departures = [
    departure({ firstSeen: 5000, callsign: 'BAW200' }),
    departure({ firstSeen: 1000, callsign: 'BAW100' }),
  ];
  const candidates = mapOpenSkyRoute(departures, [], lhr, jfk);
  expect(candidates.map((c) => c.callsign)).toEqual(['BAW100', 'BAW200']);
});
