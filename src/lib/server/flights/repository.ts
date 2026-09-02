import { eq } from 'drizzle-orm';
import { toIsoWithOffset } from '../../datetime.ts';
import type { FlightInput } from '../../flights/schema.ts';
import type { Db } from '../db/client.ts';
import { airports, flights } from '../db/schema.ts';

/** A flight leg with its origin and destination airports resolved. */
export type FlightWithAirports = Awaited<ReturnType<typeof listFlights>>[number];

/**
 * Persist a flight. Departure/arrival arrive as local wall-clock strings and
 * are stored as ISO 8601 with each airport's UTC offset, so times are
 * unambiguous regardless of where the app is viewed.
 */
export function createFlight(db: Db, input: FlightInput): void {
  const origin = db.select().from(airports).where(eq(airports.id, input.originId)).get();
  if (origin === undefined) throw new Error(`Unknown origin airport: ${input.originId}`);

  const destination = db.select().from(airports).where(eq(airports.id, input.destinationId)).get();
  if (destination === undefined) {
    throw new Error(`Unknown destination airport: ${input.destinationId}`);
  }

  db.insert(flights)
    .values({
      originId: input.originId,
      destinationId: input.destinationId,
      departure: toIsoWithOffset(input.departure, origin.timezone ?? 'UTC'),
      arrival:
        input.arrival === null
          ? null
          : toIsoWithOffset(input.arrival, destination.timezone ?? 'UTC'),
      airline: input.airline,
      flightNumber: input.flightNumber,
      aircraftType: input.aircraftType,
      aircraftRegistration: input.aircraftRegistration,
      seat: input.seat,
      cabinClass: input.cabinClass,
      notes: input.notes,
    })
    .run();
}

/** All flights, most recent departure first, with airports joined in. */
export async function listFlights(db: Db) {
  return db.query.flights.findMany({
    with: { origin: true, destination: true },
    orderBy: (flight, { desc }) => [desc(flight.departure)],
  });
}
