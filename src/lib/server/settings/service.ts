import { eq } from 'drizzle-orm';
import type { Db } from '../db/client.ts';
import { settings } from '../db/schema.ts';

/** Read a raw setting value, or null if unset. */
export function getSetting(db: Db, key: string): string | null {
  return db.select().from(settings).where(eq(settings.key, key)).get()?.value ?? null;
}

/** Insert or update a setting. */
export function setSetting(db: Db, key: string, value: string): void {
  db.insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value, updatedAt: new Date() } })
    .run();
}

/** Remove a setting if present. */
export function deleteSetting(db: Db, key: string): void {
  db.delete(settings).where(eq(settings.key, key)).run();
}
