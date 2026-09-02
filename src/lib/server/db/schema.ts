import { real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Airports, seeded from the OurAirports open dataset. Coordinates power the
 * globe; codes are how the user references an airport when logging a flight.
 */
export const airports = sqliteTable('airports', {
  // OurAirports internal id — stable primary key from the source dataset.
  id: text('id').primaryKey(),
  icao: text('icao'),
  iata: text('iata'),
  name: text('name').notNull(),
  municipality: text('municipality'),
  country: text('country'),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
});
