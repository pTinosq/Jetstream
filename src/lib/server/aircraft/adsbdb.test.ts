import { test, expect } from 'vitest';
import { mapAdsbdbAircraft } from './adsbdb.ts';

test('maps a full adsbdb response', () => {
  const raw = {
    response: {
      aircraft: {
        type: 'Boeing 777 300ER',
        icao_type: 'B77W',
        manufacturer: 'Boeing',
        registration: 'A6-ENV',
        registered_owner: 'Emirates',
        url_photo: 'https://img/full.jpg',
        url_photo_thumbnail: 'https://img/thumb.jpg',
      },
    },
  };
  expect(mapAdsbdbAircraft(raw)).toEqual({
    registration: 'A6-ENV',
    type: 'Boeing 777 300ER',
    typeCode: 'B77W',
    manufacturer: 'Boeing',
    operator: 'Emirates',
    photoUrl: 'https://img/thumb.jpg',
  });
});

test('blank fields become null and photo falls back to full size', () => {
  const raw = {
    response: {
      aircraft: {
        registration: 'G-XLEB',
        type: '',
        icao_type: 'A388',
        url_photo: 'https://img/full.jpg',
      },
    },
  };
  const aircraft = mapAdsbdbAircraft(raw);
  expect(aircraft?.type).toBeNull();
  expect(aircraft?.manufacturer).toBeNull();
  expect(aircraft?.photoUrl).toBe('https://img/full.jpg');
});

test('returns null for an unexpected shape (e.g. unknown aircraft)', () => {
  expect(mapAdsbdbAircraft({ response: 'unknown aircraft' })).toBeNull();
});
