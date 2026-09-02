import { readFile } from 'node:fs/promises';
import { sql } from 'drizzle-orm';
import type { Db } from '../db/client.ts';
import { airports } from '../db/schema.ts';
import type { AirportSeed } from './parse.ts';

/** Keep each INSERT well under SQLite's bound-parameter limit. */
const BATCH_SIZE = 500;

/**
 * Load the airports CSV from an HTTP(S) URL or a local file path. Downloading
 * is a one-time setup step; self-hosters offline can point at a local file.
 */
export async function loadAirportSource(source: string): Promise<string> {
  if (/^https?:\/\//.test(source)) {
    const response = await fetch(source);
    if (!response.ok) {
      throw new Error(
        `Failed to download airports data: ${response.status} ${response.statusText}`,
      );
    }
    return response.text();
  }
  return readFile(source, 'utf8');
}

/** Upsert airport rows by id, so re-seeding refreshes data without duplicates. */
export function seedAirports(db: Db, seeds: AirportSeed[]): { count: number } {
  db.transaction((tx) => {
    for (let i = 0; i < seeds.length; i += BATCH_SIZE) {
      const batch = seeds.slice(i, i + BATCH_SIZE);
      tx.insert(airports)
        .values(batch)
        .onConflictDoUpdate({
          target: airports.id,
          set: {
            icao: sql`excluded.icao`,
            iata: sql`excluded.iata`,
            name: sql`excluded.name`,
            municipality: sql`excluded.municipality`,
            country: sql`excluded.country`,
            latitude: sql`excluded.latitude`,
            longitude: sql`excluded.longitude`,
            timezone: sql`excluded.timezone`,
          },
        })
        .run();
    }
  });
  return { count: seeds.length };
}
