import { getDb } from '$lib/server/db';
import { listFlights } from '$lib/server/flights/repository';
import type { GlobeAirport } from '$lib/globe/build';
import type { PageServerLoad } from './$types';

const airport = (a: GlobeAirport): GlobeAirport => ({
  id: a.id,
  latitude: a.latitude,
  longitude: a.longitude,
  iata: a.iata,
  icao: a.icao,
  name: a.name,
});

/**
 * Send the legs (departure + endpoint airports) so the client can filter by
 * period and rebuild the globe instantly, without a server round-trip.
 */
export const load: PageServerLoad = async () => {
  const flights = await listFlights(getDb());
  return {
    legs: flights.map((f) => ({
      departure: f.departure,
      origin: airport(f.origin),
      destination: airport(f.destination),
    })),
  };
};
