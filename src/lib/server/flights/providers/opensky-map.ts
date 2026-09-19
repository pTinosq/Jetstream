import { z } from 'zod';
import type { Airport } from '../../../airports/types.ts';
import type { FlightCandidate } from '../../../flights/candidate.ts';
import { instantToIsoWithOffset } from '../../../datetime.ts';

/**
 * OpenSky flight rows (shared by `/flights/departure` and `/flights/arrival`).
 * Times are Unix seconds; airport fields are ICAO codes and may be null when
 * OpenSky's ground-receiver coverage can't estimate them.
 */
const flightRowSchema = z.object({
  icao24: z.string(),
  firstSeen: z.number().int(),
  estDepartureAirport: z.string().nullable(),
  lastSeen: z.number().int(),
  estArrivalAirport: z.string().nullable(),
  callsign: z.string().nullable(),
});

type FlightRow = z.infer<typeof flightRowSchema>;

// Airline prefix (letters) + flight number (digits, optionally with up to two
// trailing letters, e.g. "79Y" or the ferry-style "7CN").
const callsignPattern = /^([A-Z]+)(\d+[A-Z]{0,2})$/;

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

// A single flight can't plausibly take longer than this; bounds the airframe
// cross-reference so an unrelated later leg by the same aircraft isn't matched.
const MAX_FLIGHT_SECONDS = 24 * 60 * 60;

const icaoKey = (row: FlightRow): string => row.icao24.trim().toLowerCase();

/**
 * Build route candidates from OpenSky's departure feed at the origin and arrival
 * feed at the destination.
 *
 * OpenSky's per-row `estArrivalAirport` is frequently null or wrong for flights
 * that leave dense-coverage regions, so filtering on it alone silently drops
 * real matches. We instead confirm a departure reaches the destination either
 * directly (its estimated arrival *is* the destination) or by finding the same
 * airframe landing at the destination shortly after it left the origin.
 */
export function mapOpenSkyRoute(
  rawDepartures: unknown,
  rawArrivals: unknown,
  from: Airport,
  to: Airport,
): FlightCandidate[] {
  const departures = z.array(flightRowSchema).parse(rawDepartures);
  const arrivals = z.array(flightRowSchema).parse(rawArrivals);
  const fromZone = from.timezone ?? 'UTC';
  const toZone = to.timezone ?? 'UTC';

  const arrivalsByIcao = new Map<string, FlightRow[]>();
  for (const row of arrivals) {
    const key = icaoKey(row);
    const list = arrivalsByIcao.get(key) ?? [];
    list.push(row);
    arrivalsByIcao.set(key, list);
  }

  const candidates: FlightCandidate[] = [];
  for (const dep of departures) {
    // The same airframe landing at the destination after this departure, if any.
    const landed = (arrivalsByIcao.get(icaoKey(dep)) ?? [])
      .filter(
        (arr) => arr.lastSeen > dep.firstSeen && arr.lastSeen - dep.firstSeen < MAX_FLIGHT_SECONDS,
      )
      .sort((a, b) => a.lastSeen - b.lastSeen)[0];

    if (dep.estArrivalAirport !== to.icao && landed === undefined) continue;

    // Prefer the arrival feed's landing time (more accurate than the departure
    // row's lastSeen, which is only when the airframe left origin coverage).
    const arrivalSeen = landed?.lastSeen ?? dep.lastSeen;
    const { airline, flightNumber } = parseCallsign(dep.callsign);
    candidates.push({
      airline,
      flightNumber,
      callsign: dep.callsign?.trim() ?? null,
      icao24: icaoKey(dep),
      departure: instantToIsoWithOffset(new Date(dep.firstSeen * 1000), fromZone),
      arrival: instantToIsoWithOffset(new Date(arrivalSeen * 1000), toZone),
      originIata: from.iata,
      destinationIata: to.iata,
    });
  }

  return candidates.sort((a, b) => a.departure.localeCompare(b.departure));
}
