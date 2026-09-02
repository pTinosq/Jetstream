import { test, expect } from 'vitest';
import { parseAirportsCsv } from './parse.ts';

const HEADER =
  'id,ident,type,name,latitude_deg,longitude_deg,elevation_ft,continent,iso_country,iso_region,municipality,scheduled_service,icao_code,iata_code,gps_code,local_code,home_link,wikipedia_link,keywords';

function row(fields: Partial<Record<string, string>>): string {
  const cols: Record<string, string> = {
    id: '',
    ident: '',
    type: '',
    name: '',
    latitude_deg: '',
    longitude_deg: '',
    elevation_ft: '',
    continent: '',
    iso_country: '',
    iso_region: '',
    municipality: '',
    scheduled_service: '',
    icao_code: '',
    iata_code: '',
    gps_code: '',
    local_code: '',
    home_link: '',
    wikipedia_link: '',
    keywords: '',
    ...fields,
  };
  return HEADER.split(',')
    .map((k) => {
      const value = cols[k] ?? '';
      return value.includes(',') ? `"${value}"` : value;
    })
    .join(',');
}

const heathrow = {
  id: '2434',
  type: 'large_airport',
  name: 'London Heathrow Airport',
  latitude_deg: '51.4706',
  longitude_deg: '-0.461941',
  iso_country: 'GB',
  municipality: 'London',
  icao_code: 'EGLL',
  iata_code: 'LHR',
};

test('parses a valid airport row into a seed', () => {
  const seeds = parseAirportsCsv([HEADER, row(heathrow)].join('\n'));
  expect(seeds).toHaveLength(1);
  expect(seeds[0]).toMatchObject({
    id: '2434',
    iata: 'LHR',
    icao: 'EGLL',
    name: 'London Heathrow Airport',
    municipality: 'London',
    country: 'GB',
    latitude: 51.4706,
  });
  expect(seeds[0]?.timezone).toBe('Europe/London');
});

test('skips airports without an IATA code', () => {
  const seeds = parseAirportsCsv([HEADER, row({ ...heathrow, iata_code: '' })].join('\n'));
  expect(seeds).toHaveLength(0);
});

test('skips closed airports', () => {
  const seeds = parseAirportsCsv([HEADER, row({ ...heathrow, type: 'closed' })].join('\n'));
  expect(seeds).toHaveLength(0);
});

test('skips rows with missing coordinates', () => {
  const seeds = parseAirportsCsv(
    [HEADER, row({ ...heathrow, latitude_deg: '', longitude_deg: '' })].join('\n'),
  );
  expect(seeds).toHaveLength(0);
});

test('handles quoted names containing commas', () => {
  const seeds = parseAirportsCsv(
    [HEADER, row({ ...heathrow, name: 'Cologne, Bonn Airport' })].join('\n'),
  );
  expect(seeds[0]?.name).toBe('Cologne, Bonn Airport');
});
