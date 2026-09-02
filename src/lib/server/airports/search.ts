import { or, like, sql } from 'drizzle-orm';
import type { Airport } from '../../airports/types.ts';
import type { Db } from '../db/client.ts';
import { airports } from '../db/schema.ts';

const DEFAULT_LIMIT = 10;

/**
 * Search airports by IATA/ICAO code, name, or city. Ranks exact then prefix
 * IATA matches first (so "LHR" surfaces Heathrow before a city named "…lhr…"),
 * then falls back to name order. Empty queries return nothing.
 */
export function searchAirports(db: Db, query: string, limit = DEFAULT_LIMIT): Airport[] {
  const q = query.trim();
  if (q === '') return [];

  const code = q.toUpperCase();
  const contains = `%${q}%`;

  return db
    .select()
    .from(airports)
    .where(
      or(
        like(airports.iata, code),
        like(airports.icao, code),
        like(airports.name, contains),
        like(airports.municipality, contains),
      ),
    )
    .orderBy(
      sql`case when ${airports.iata} = ${code} then 0 when ${airports.iata} like ${`${code}%`} then 1 else 2 end`,
      airports.name,
    )
    .limit(limit)
    .all();
}
