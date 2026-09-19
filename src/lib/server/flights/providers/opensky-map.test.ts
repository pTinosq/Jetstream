import { test, expect } from 'vitest';
import { mapOpenSkyDepartures, parseCallsign } from './opensky-map.ts';
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

test('keeps only flights arriving at the destination', () => {
  const raw = [
    departure({ estArrivalAirport: 'KJFK', callsign: 'BAW117' }),
    departure({ estArrivalAirport: 'KBOS', callsign: 'BAW999' }),
    departure({ estArrivalAirport: null, callsign: 'VIR3' }),
  ];
  const candidates = mapOpenSkyDepartures(raw, lhr, jfk);
  expect(candidates).toHaveLength(1);
  expect(candidates[0]?.callsign).toBe('BAW117');
});

test('converts absolute times to each airport local zone', () => {
  // firstSeen 2026-03-01T09:00Z → 09:00 London (+00). lastSeen 16:30Z → 11:30 NY (-05).
  const raw = [
    departure({
      firstSeen: Math.floor(Date.UTC(2026, 2, 1, 9, 0, 0) / 1000),
      lastSeen: Math.floor(Date.UTC(2026, 2, 1, 16, 30, 0) / 1000),
    }),
  ];
  const [candidate] = mapOpenSkyDepartures(raw, lhr, jfk);
  expect(candidate?.departure).toBe('2026-03-01T09:00:00+00:00');
  expect(candidate?.arrival).toBe('2026-03-01T11:30:00-05:00');
  expect(candidate?.airline).toBe('BAW');
  expect(candidate?.flightNumber).toBe('117');
  expect(candidate?.icao24).toBe('abc123');
});

test('sorts candidates by departure time', () => {
  const raw = [
    departure({ firstSeen: 5000, callsign: 'BAW200' }),
    departure({ firstSeen: 1000, callsign: 'BAW100' }),
  ];
  const candidates = mapOpenSkyDepartures(raw, lhr, jfk);
  expect(candidates.map((c) => c.callsign)).toEqual(['BAW100', 'BAW200']);
});
