import { test, expect } from 'vitest';
import { buildGlobeData, type GlobeAirport, type GlobeLeg } from './build.ts';

const lhr: GlobeAirport = {
  id: 'lhr',
  iata: 'LHR',
  icao: 'EGLL',
  name: 'Heathrow',
  latitude: 51.47,
  longitude: -0.46,
};
const dxb: GlobeAirport = {
  id: 'dxb',
  iata: 'DXB',
  icao: 'OMDB',
  name: 'Dubai Intl',
  latitude: 25.25,
  longitude: 55.36,
};

const leg = (origin: GlobeAirport, destination: GlobeAirport): GlobeLeg => ({
  origin,
  destination,
});

test('deduplicates airports into points with visit counts', () => {
  const { points } = buildGlobeData([leg(lhr, dxb), leg(dxb, lhr)]);
  expect(points).toHaveLength(2);
  expect(points.every((p) => p.visits === 2)).toBe(true);
  expect(points.find((p) => p.id === 'lhr')).toMatchObject({ iata: 'LHR', lat: 51.47, lng: -0.46 });
});

test('creates one arc per leg with coordinates and a label', () => {
  const { arcs } = buildGlobeData([leg(lhr, dxb)]);
  expect(arcs).toHaveLength(1);
  expect(arcs[0]).toMatchObject({
    fromId: 'lhr',
    toId: 'dxb',
    startLat: 51.47,
    endLat: 25.25,
    label: 'LHR → DXB',
  });
});

test('returns empty data when there are no legs', () => {
  expect(buildGlobeData([])).toEqual({ points: [], arcs: [] });
});
