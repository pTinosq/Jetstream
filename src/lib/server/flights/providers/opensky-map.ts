import { z } from 'zod';
import type { Airport } from '../../../airports/types.ts';
import type { FlightCandidate } from '../../../flights/candidate.ts';
import { instantToIsoWithOffset } from '../../../datetime.ts';

/**
 * OpenSky `/flights/departure` rows we use. Times are Unix seconds; airport
 * fields are ICAO codes and may be null when OpenSky can't estimate them.
 */
const departureSchema = z.object({
  icao24: z.string(),
  firstSeen: z.number().int(),
  estDepartureAirport: z.string().nullable(),
  lastSeen: z.number().int(),
  estArrivalAirport: z.string().nullable(),
  callsign: z.string().nullable(),
});

const callsignPattern = /^([A-Z]+)(\d+[A-Z]?)$/;

/** Split a callsign like "BAW117" into airline "BAW" and number "117". */
export function parseCallsign(raw: string | null): {
  airline: string | null;
  flightNumber: string | null;
} {
  const callsign = raw?.trim() ?? '';
  const match = callsignPattern.exec(callsign);
  if (match === null) return { airline: null, flightNumber: null };
  return { airline: match[1] ?? null, flightNumber: match[2] ?? null };
}

/**
 * Map an OpenSky departures response into candidates for the requested route:
 * keep only flights whose estimated arrival is the destination airport, convert
 * absolute times to each airport's local zone, and sort by departure time.
 */
export function mapOpenSkyDepartures(raw: unknown, from: Airport, to: Airport): FlightCandidate[] {
  const rows = z.array(departureSchema).parse(raw);
  const fromZone = from.timezone ?? 'UTC';
  const toZone = to.timezone ?? 'UTC';

  return rows
    .filter((row) => row.estArrivalAirport === to.icao)
    .map((row) => {
      const { airline, flightNumber } = parseCallsign(row.callsign);
      return {
        airline,
        flightNumber,
        callsign: row.callsign?.trim() ?? null,
        departure: instantToIsoWithOffset(new Date(row.firstSeen * 1000), fromZone),
        arrival: instantToIsoWithOffset(new Date(row.lastSeen * 1000), toZone),
        originIata: from.iata,
        destinationIata: to.iata,
      };
    })
    .sort((a, b) => a.departure.localeCompare(b.departure));
}
