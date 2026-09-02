import { test, expect } from 'vitest';
import { toIsoWithOffset, formatWallClock } from './datetime.ts';

test('applies a zero offset for UTC', () => {
  expect(toIsoWithOffset('2026-03-01T09:00', 'UTC')).toBe('2026-03-01T09:00:00+00:00');
});

test('applies a positive offset (Dubai, no DST)', () => {
  expect(toIsoWithOffset('2026-03-01T09:00', 'Asia/Dubai')).toBe('2026-03-01T09:00:00+04:00');
});

test('applies a negative offset (New York, winter)', () => {
  expect(toIsoWithOffset('2026-01-15T12:00', 'America/New_York')).toBe('2026-01-15T12:00:00-05:00');
});

test('respects daylight saving (New York, summer)', () => {
  expect(toIsoWithOffset('2026-07-15T12:00', 'America/New_York')).toBe('2026-07-15T12:00:00-04:00');
});

test('handles half-hour offsets (India)', () => {
  expect(toIsoWithOffset('2026-03-01T09:00', 'Asia/Kolkata')).toBe('2026-03-01T09:00:00+05:30');
});

test('rejects a malformed local datetime', () => {
  expect(() => toIsoWithOffset('not-a-date', 'UTC')).toThrow();
});

test('formats a stored ISO string to airport-local wall clock', () => {
  expect(formatWallClock('2026-03-01T20:15:00+04:00')).toBe('2026-03-01 20:15');
});

test('returns the input unchanged when it is not an ISO datetime', () => {
  expect(formatWallClock('n/a')).toBe('n/a');
});
