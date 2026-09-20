import { test, expect } from 'vitest';
import { parseGlobePeriod, periodCutoff, withinPeriod } from './period.ts';

const now = new Date('2026-09-20T12:00:00Z');

test('parseGlobePeriod falls back to all for unknown values', () => {
  expect(parseGlobePeriod('6mo')).toBe('6mo');
  expect(parseGlobePeriod(null)).toBe('all');
  expect(parseGlobePeriod('nonsense')).toBe('all');
});

test('all time has no cutoff', () => {
  expect(periodCutoff('all', now)).toBeNull();
});

test('year to date cuts at Jan 1 of the current year', () => {
  expect(periodCutoff('ytd', now)?.getFullYear()).toBe(2026);
  expect(periodCutoff('ytd', now)?.getMonth()).toBe(0);
  expect(periodCutoff('ytd', now)?.getDate()).toBe(1);
});

test('rolling windows subtract from now', () => {
  expect(periodCutoff('1y', now)?.getFullYear()).toBe(2025);
  expect(periodCutoff('6mo', now)?.getMonth()).toBe(2); // Sep - 6 = Mar (index 2)
});

test('withinPeriod keeps only flights on/after the cutoff', () => {
  const flights = [
    { departure: '2026-09-01T10:00:00+00:00' }, // this year, recent
    { departure: '2025-08-30T16:50:00+01:00' }, // >1y ago
    { departure: '2026-01-05T08:00:00+00:00' }, // this year, older
  ];
  expect(withinPeriod(flights, 'all', now)).toHaveLength(3);
  expect(withinPeriod(flights, 'ytd', now).map((f) => f.departure)).toEqual([
    '2026-09-01T10:00:00+00:00',
    '2026-01-05T08:00:00+00:00',
  ]);
  expect(withinPeriod(flights, '30d', now)).toHaveLength(1);
  expect(withinPeriod(flights, '1y', now)).toHaveLength(2);
});
