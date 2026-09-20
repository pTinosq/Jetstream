import type { Airport } from '../../airports/types.ts';
import type { FlightCandidate } from '../../flights/candidate.ts';
import type { Db } from '../db/client.ts';
import { searchAirports } from '../airports/search.ts';
import type { ChatTool } from './openrouter.ts';

/** Widest gap (minutes) between a stated time and a candidate to still match. */
const MATCH_TOLERANCE_MINUTES = 120;

/**
 * The single tool the model calls. It only *extracts* the flight from the text;
 * the server resolves airports and finds the tracked flight deterministically.
 * One round-trip instead of an airport/flight/propose tool dance.
 */
export const FIND_FLIGHT_TOOL: ChatTool = {
  name: 'find_flight',
  description:
    'Log the flight described in the text. Extract its details and call this once. The server resolves the airports and finds the matching tracked flight (exact times + aircraft) itself.',
  parameters: {
    type: 'object',
    properties: {
      from: {
        type: 'string',
        description: 'Origin airport IATA/ICAO code if known, else city or name.',
      },
      to: {
        type: 'string',
        description: 'Destination airport IATA/ICAO code if known, else city or name.',
      },
      date: {
        type: 'string',
        description:
          'Local departure date at the origin, YYYY-MM-DD. Resolve relative dates against today.',
      },
      airline: {
        type: 'string',
        description:
          'Marketing airline code (prefer IATA, e.g. "AY") or name, from the text. Optional.',
      },
      flightNumber: {
        type: 'string',
        description: 'Marketing flight number, e.g. "1337". Optional.',
      },
      departureTimeLocal: {
        type: 'string',
        description:
          'Scheduled local departure time at the origin if stated, "HH:mm". Improves matching.',
      },
      arrivalTimeLocal: {
        type: 'string',
        description:
          'Scheduled local arrival time at the destination if stated, "HH:mm". Optional.',
      },
      seat: {
        type: 'string',
        description: 'Seat number if the text states one, e.g. "12A". Optional.',
      },
      cabin: {
        type: 'string',
        enum: ['economy', 'premium_economy', 'business', 'first'],
        description:
          'Cabin/travel class if stated, mapped to one of these values (e.g. "Economy Plus" → premium_economy). Optional.',
      },
      notes: {
        type: 'string',
        description:
          'Any other useful details worth keeping as notes (confirmation code, cabin/fare, meal, etc.). Optional.',
      },
    },
    required: ['from', 'to', 'date'],
    additionalProperties: false,
  },
};

/** Resolve a code/city/name to a single airport (best-ranked hit), if any. */
export function resolveAirport(db: Db, query: string | null): Airport | undefined {
  if (query === null) return undefined;
  return searchAirports(db, query, 1)[0];
}

/** Minutes-since-midnight from an "HH:mm" (or ISO "…THH:mm…") string, or null. */
export function minutesFromTime(value: string | null): number | null {
  if (value === null) return null;
  const match = /(\d{2}):(\d{2})/.exec(value);
  if (match === null) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/**
 * Deterministically pick the tracked flight that best fits the stated departure
 * time. With a time, choose the closest candidate within tolerance (candidate
 * times are wheels-up, so allow slack). Without one, only commit if there's a
 * single candidate — otherwise return nothing rather than guess.
 */
export function pickBestCandidate(
  candidates: FlightCandidate[],
  departureTimeLocal: string | null,
): FlightCandidate | undefined {
  if (candidates.length === 0) return undefined;

  const target = minutesFromTime(departureTimeLocal);
  if (target === null) return candidates.length === 1 ? candidates[0] : undefined;

  let best: FlightCandidate | undefined;
  let bestDiff = Infinity;
  for (const candidate of candidates) {
    const minutes = minutesFromTime(candidate.departure);
    if (minutes === null) continue;
    const diff = Math.abs(minutes - target);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = candidate;
    }
  }
  return bestDiff <= MATCH_TOLERANCE_MINUTES ? best : undefined;
}
