import { env } from '$env/dynamic/private';
import { createDb, type Db } from './client.ts';

let instance: Db | null = null;

/**
 * Open (once) and return the database connection. Lazy on purpose: importing
 * this module must not require `DATABASE_URL` — only *using* the DB does. This
 * keeps `vite build` (which imports server modules to analyse them) working
 * without a configured database.
 */
export function getDb(): Db {
  if (instance === null) {
    if (env.DATABASE_URL === undefined || env.DATABASE_URL === '') {
      throw new Error('DATABASE_URL is not set');
    }
    instance = createDb(env.DATABASE_URL);
  }
  return instance;
}
