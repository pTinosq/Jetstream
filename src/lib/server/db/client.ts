import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.ts';

/**
 * Create a database connection to a SQLite file. Kept free of SvelteKit
 * imports so both the app (`index.ts`) and standalone scripts (seeding,
 * migrations) can open the same database.
 */
export function createDb(url: string) {
  return drizzle(new Database(url), { schema });
}

export type Db = ReturnType<typeof createDb>;
