import { relations } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Airports, seeded from the OurAirports open dataset. Coordinates power the
 * globe; codes are how the user references an airport when logging a flight;
 * `timezone` lets us show local departure/arrival times.
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
  // IANA timezone (e.g. "Europe/London"), for rendering local times.
  timezone: text('timezone'),
});

/**
 * A journey that groups one or more flight legs (e.g. LHR→DXB→SYD). Optional:
 * a leg may stand alone with no trip.
 */
export const trips = sqliteTable('trips', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

/**
 * A single flight leg: one takeoff→landing. Times are ISO 8601 strings that
 * include the local UTC offset (e.g. "2026-03-01T09:00:00+04:00"), which pins
 * the local wall-clock time and handles DST without a separate lookup.
 * Upcoming vs flown is derived from `departure`, not stored.
 */
export const flights = sqliteTable('flights', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  tripId: text('trip_id').references(() => trips.id, { onDelete: 'set null' }),
  // Position within the trip, for ordering multi-leg journeys.
  sequence: integer('sequence'),

  originId: text('origin_id')
    .notNull()
    .references(() => airports.id),
  destinationId: text('destination_id')
    .notNull()
    .references(() => airports.id),

  departure: text('departure').notNull(),
  arrival: text('arrival'),

  airline: text('airline'),
  flightNumber: text('flight_number'),
  aircraftType: text('aircraft_type'),
  aircraftRegistration: text('aircraft_registration'),
  seat: text('seat'),
  cabinClass: text('cabin_class'),
  notes: text('notes'),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const tripsRelations = relations(trips, ({ many }) => ({
  flights: many(flights),
}));

export const flightsRelations = relations(flights, ({ one }) => ({
  trip: one(trips, { fields: [flights.tripId], references: [trips.id] }),
  origin: one(airports, {
    fields: [flights.originId],
    references: [airports.id],
    relationName: 'origin',
  }),
  destination: one(airports, {
    fields: [flights.destinationId],
    references: [airports.id],
    relationName: 'destination',
  }),
}));
