import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema.ts';
import type { Db } from './client.ts';

/** An in-memory SQLite database with migrations applied, for use in tests. */
export function memoryDb(): Db {
  const db = drizzle(new Database(':memory:'), { schema });
  migrate(db, { migrationsFolder: 'drizzle' });
  return db;
}
