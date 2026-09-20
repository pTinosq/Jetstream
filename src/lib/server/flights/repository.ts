import { eq, isNotNull, sql } from 'drizzle-orm';
import { toIsoWithOffset } from '../../datetime.ts';
import type { FlightInput } from '../../flights/schema.ts';
import type { Db } from '../db/client.ts';
import { airports, flights } from '../db/schema.ts';

/** A flight leg with its origin and destination airports resolved. */
export type FlightWithAirports = Awaited<ReturnType<typeof listFlights>>[number];

/**
 * Turn form input (local wall-clock times + airport ids) into the stored row
 * shape: times become ISO 8601 with each airport's UTC offset, so they're
 * unambiguous regardless of where the app is viewed.
 */
function toRow(db: Db, input: FlightInput) {
  const origin = db.select().from(airports).where(eq(airports.id, input.originId)).get();
  if (origin === undefined) throw new Error(`Unknown origin airport: ${input.originId}`);

  const destination = db.select().from(airports).where(eq(airports.id, input.destinationId)).get();
  if (destination === undefined) {
    throw new Error(`Unknown destination airport: ${input.destinationId}`);
  }

  return {
    originId: input.originId,
    destinationId: input.destinationId,
    departure: toIsoWithOffset(input.departure, origin.timezone ?? 'UTC'),
    arrival:
      input.arrival === null ? null : toIsoWithOffset(input.arrival, destination.timezone ?? 'UTC'),
    airline: input.airline,
    flightNumber: input.flightNumber,
    aircraftType: input.aircraftType,
    aircraftRegistration: input.aircraftRegistration,
    seat: input.seat,
    cabinClass: input.cabinClass,
    notes: input.notes,
  };
}

/** Persist a new flight. */
export function createFlight(db: Db, input: FlightInput): void {
  db.insert(flights).values(toRow(db, input)).run();
}

/** Update an existing flight in place. Throws if the id doesn't exist. */
export function updateFlight(db: Db, id: string, input: FlightInput): void {
  const result = db.update(flights).set(toRow(db, input)).where(eq(flights.id, id)).run();
  if (result.changes === 0) throw new Error(`Unknown flight: ${id}`);
}

/** Remove a flight. */
export function deleteFlight(db: Db, id: string): void {
  db.delete(flights).where(eq(flights.id, id)).run();
}

/**
 * Distinct aircraft types already logged, most frequently used first — powers
 * the type-to-pick suggestions so a repeat aircraft (e.g. "Airbus A320neo")
 * doesn't have to be retyped each time.
 */
export function listAircraftTypes(db: Db): string[] {
  return db
    .select({ type: flights.aircraftType })
    .from(flights)
    .where(isNotNull(flights.aircraftType))
    .groupBy(flights.aircraftType)
    .orderBy(sql`count(*) desc`)
    .all()
    .map((row) => row.type)
    .filter((type): type is string => type !== null && type !== '');
}

/** A single flight with its airports resolved, or undefined if not found. */
export async function getFlightById(db: Db, id: string) {
  return db.query.flights.findFirst({
    with: { origin: true, destination: true },
    where: (flight, { eq: equals }) => equals(flight.id, id),
  });
}

/** All flights, most recent departure first, with airports joined in. */
export async function listFlights(db: Db) {
  return db.query.flights.findMany({
    with: { origin: true, destination: true },
    orderBy: (flight, { desc }) => [desc(flight.departure)],
  });
}
