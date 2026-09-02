import { test, expect } from 'vitest';
import { flightInputSchema } from './schema.ts';

const base = {
  originId: 'lhr',
  destinationId: 'dxb',
  departure: '2026-03-01T09:00',
  arrival: '',
  airline: '',
  flightNumber: '',
  aircraftType: '',
  aircraftRegistration: '',
  seat: '',
  cabinClass: '',
  notes: '',
};

test('parses a minimal valid flight, blanking empty optionals to null', () => {
  const result = flightInputSchema.parse(base);
  expect(result.originId).toBe('lhr');
  expect(result.arrival).toBeNull();
  expect(result.airline).toBeNull();
  expect(result.cabinClass).toBeNull();
});

test('keeps provided optional values', () => {
  const result = flightInputSchema.parse({
    ...base,
    arrival: '2026-03-01T20:15',
    airline: 'EK',
    cabinClass: 'business',
  });
  expect(result.arrival).toBe('2026-03-01T20:15');
  expect(result.cabinClass).toBe('business');
});

test('rejects when origin and destination are the same', () => {
  const result = flightInputSchema.safeParse({ ...base, destinationId: 'lhr' });
  expect(result.success).toBe(false);
});

test('rejects a malformed departure', () => {
  const result = flightInputSchema.safeParse({ ...base, departure: '01/03/2026' });
  expect(result.success).toBe(false);
});

test('rejects an unknown cabin class', () => {
  const result = flightInputSchema.safeParse({ ...base, cabinClass: 'platinum' });
  expect(result.success).toBe(false);
});

test('treats omitted optional fields as null', () => {
  const result = flightInputSchema.parse({
    originId: 'lhr',
    destinationId: 'dxb',
    departure: '2026-03-01T09:00',
  });
  expect(result.arrival).toBeNull();
  expect(result.airline).toBeNull();
  expect(result.aircraftRegistration).toBeNull();
  expect(result.cabinClass).toBeNull();
});
