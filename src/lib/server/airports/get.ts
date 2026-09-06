import { eq } from 'drizzle-orm';
import type { Airport } from '../../airports/types.ts';
import type { Db } from '../db/client.ts';
import { airports } from '../db/schema.ts';

export function getAirportById(db: Db, id: string): Airport | undefined {
  return db.select().from(airports).where(eq(airports.id, id)).get();
}
