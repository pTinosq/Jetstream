import { test, expect } from 'vitest';
import { friendlyAircraftType, mapAdsbdbAircraft } from './adsbdb.ts';

test('cleans Boeing customer/winglet codes to a base model', () => {
  expect(friendlyAircraftType('Boeing', '737NG 8AS/W', 'B738')).toBe('Boeing 737');
});

test('keeps a tidy Boeing variant when present', () => {
  expect(friendlyAircraftType('Boeing', '777-300ER', 'B77W')).toBe('Boeing 777-300ER');
});

test('cleans an Airbus type, dropping the numeric customer suffix', () => {
  expect(friendlyAircraftType('Airbus', 'A350 941', 'A359')).toBe('Airbus A350');
});

test('falls back to the raw type then the code when nothing is recognised', () => {
  expect(friendlyAircraftType('Cessna', 'Citation X', 'C750')).toBe('Citation X');
  expect(friendlyAircraftType(null, null, 'ZZZZ')).toBe('ZZZZ');
});

test('mapAdsbdbAircraft produces a friendly type', () => {
  const aircraft = mapAdsbdbAircraft({
    response: {
      aircraft: {
        registration: 'G-XLEB',
        type: '737NG 8AS/W',
        icao_type: 'B738',
        manufacturer: 'Boeing',
        registered_owner: 'British Airways',
        url_photo_thumbnail: 'https://img/t.jpg',
      },
    },
  });
  expect(aircraft?.type).toBe('Boeing 737');
  expect(aircraft?.typeCode).toBe('B738');
});
