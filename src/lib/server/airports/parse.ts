import { parse } from 'csv-parse/sync';
import tzLookup from '@photostructure/tz-lookup';
import { z } from 'zod';

/** A cleaned airport row ready to seed into the database. */
export interface AirportSeed {
  id: string;
  icao: string | null;
  iata: string | null;
  name: string;
  municipality: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
}

/** Blank CSV cells become null; a numeric-looking cell becomes a finite number. */
const blankToNull = (v: unknown): unknown => (typeof v === 'string' && v.trim() === '' ? null : v);
const toFiniteNumber = (v: unknown): unknown => (v === '' || v === null ? undefined : Number(v));

/**
 * Shape of the OurAirports `airports.csv` columns we care about. External data,
 * so it's validated here at the boundary before anything downstream trusts it.
 */
const rawAirport = z.object({
  id: z.string().min(1),
  type: z.string(),
  name: z.string().min(1),
  latitude_deg: z.preprocess(toFiniteNumber, z.number().finite()),
  longitude_deg: z.preprocess(toFiniteNumber, z.number().finite()),
  iso_country: z.preprocess(blankToNull, z.string().nullable()),
  municipality: z.preprocess(blankToNull, z.string().nullable()),
  icao_code: z.preprocess(blankToNull, z.string().nullable()),
  iata_code: z.preprocess(blankToNull, z.string().nullable()),
});

function lookupTimezone(latitude: number, longitude: number): string | null {
  try {
    return tzLookup(latitude, longitude);
  } catch {
    // tz-lookup throws for out-of-range coordinates; treat as unknown.
    return null;
  }
}

/**
 * Parse the OurAirports CSV into seedable rows. Keeps only airports that a
 * traveller would actually log: those with an IATA code and valid coordinates,
 * excluding closed airfields.
 */
export function parseAirportsCsv(csv: string): AirportSeed[] {
  const records: unknown = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  });
  const rows = z.array(z.record(z.string(), z.string())).parse(records);

  const seeds: AirportSeed[] = [];
  for (const row of rows) {
    const parsed = rawAirport.safeParse(row);
    if (!parsed.success) continue;

    const airport = parsed.data;
    if (airport.iata_code === null || airport.type === 'closed') continue;

    seeds.push({
      id: airport.id,
      icao: airport.icao_code,
      iata: airport.iata_code,
      name: airport.name,
      municipality: airport.municipality,
      country: airport.iso_country,
      latitude: airport.latitude_deg,
      longitude: airport.longitude_deg,
      timezone: lookupTimezone(airport.latitude_deg, airport.longitude_deg),
    });
  }
  return seeds;
}
