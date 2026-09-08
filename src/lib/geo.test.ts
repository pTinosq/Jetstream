import { test, expect } from 'vitest';
import { distanceKm } from './geo.ts';

test('distance between an airport and itself is zero', () => {
  expect(distanceKm(51.47, -0.46, 51.47, -0.46)).toBe(0);
});

test('LHR → JFK is roughly 5540 km', () => {
  const d = distanceKm(51.4706, -0.461941, 40.6398, -73.7789);
  expect(d).toBeGreaterThan(5500);
  expect(d).toBeLessThan(5600);
});

test('LHR → DXB is roughly 5500 km', () => {
  const d = distanceKm(51.4706, -0.461941, 25.2528, 55.3644);
  expect(d).toBeGreaterThan(5400);
  expect(d).toBeLessThan(5600);
});
