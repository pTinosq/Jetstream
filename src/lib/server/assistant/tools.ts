import type { Airport } from '../../airports/types.ts';
import type { FlightCandidate } from '../../flights/candidate.ts';
import type { Db } from '../db/client.ts';
import { getAirportById } from '../airports/get.ts';
import { searchAirports } from '../airports/search.ts';
import type { FlightSearchProvider } from '../flights/providers/types.ts';
import type { ChatTool } from './openrouter.ts';

const MAX_FLIGHT_RESULTS = 15;

/** The last route search, so a chosen flightRef maps back to an exact candidate. */
export interface LastSearch {
  from: Airport;
  to: Airport;
  candidates: FlightCandidate[];
}

export interface ToolContext {
  db: Db;
  provider: FlightSearchProvider | null;
  /** Set by search_flights so the terminal step can recover exact times. */
  lastSearch: LastSearch | null;
}

/** The tool catalogue advertised to the model. Terminal step is propose_flight. */
export const TOOL_SCHEMAS: ChatTool[] = [
  {
    name: 'search_airports',
    description:
      'Find airports by IATA/ICAO code, name, or city. Returns candidates with ids to use in other tools.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Airport code, name, or city, e.g. "LHR" or "Athens".',
        },
      },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'search_flights',
    description:
      'Look up real flights for a route and local departure date. Returns candidates with exact times and an aircraft reference. May be empty or unavailable if flight lookup is not configured.',
    parameters: {
      type: 'object',
      properties: {
        originAirportId: { type: 'string' },
        destinationAirportId: { type: 'string' },
        date: { type: 'string', description: 'Local departure date at the origin, YYYY-MM-DD.' },
      },
      required: ['originAirportId', 'destinationAirportId', 'date'],
      additionalProperties: false,
    },
  },
  {
    name: 'propose_flight',
    description:
      'Finalise the flight to log. Call this once you have identified it. Provide originAirportId and destinationAirportId from search_airports. If it came from a search_flights result, pass its flightRef to use the exact times and aircraft; otherwise provide the fields you extracted from the text.',
    parameters: {
      type: 'object',
      properties: {
        originAirportId: { type: 'string' },
        destinationAirportId: { type: 'string' },
        airline: { type: 'string', description: 'Airline code or name, e.g. "BA" or "Finnair".' },
        flightNumber: { type: 'string' },
        departureLocal: {
          type: 'string',
          description: 'Local departure wall-clock, "YYYY-MM-DDTHH:mm".',
        },
        arrivalLocal: {
          type: 'string',
          description: 'Local arrival wall-clock, "YYYY-MM-DDTHH:mm".',
        },
        flightRef: {
          type: 'string',
          description: 'The ref of a candidate from search_flights, if one matched.',
        },
        note: { type: 'string', description: 'Anything you could not confirm, kept short.' },
      },
      required: ['originAirportId', 'destinationAirportId'],
      additionalProperties: false,
    },
  },
];

function airportView(a: Airport): Record<string, unknown> {
  return {
    id: a.id,
    code: a.iata ?? a.icao,
    name: a.name,
    city: a.municipality,
    country: a.country,
  };
}

/** The candidate ref exposed to the model: its 1-based position in the results. */
export const candidateRef = (index: number): string => String(index + 1);

/**
 * Run a non-terminal tool call and return a JSON-serialisable result for the
 * model. `search_flights` records its result into ctx.lastSearch.
 */
export async function executeTool(
  ctx: ToolContext,
  name: string,
  args: Record<string, unknown>,
): Promise<unknown> {
  if (name === 'search_airports') {
    const query = typeof args.query === 'string' ? args.query : '';
    return { airports: searchAirports(ctx.db, query).map(airportView) };
  }

  if (name === 'search_flights') {
    const { originAirportId, destinationAirportId, date } = args;
    if (
      typeof originAirportId !== 'string' ||
      typeof destinationAirportId !== 'string' ||
      typeof date !== 'string'
    ) {
      return { error: 'originAirportId, destinationAirportId and date are required.' };
    }
    if (ctx.provider === null) {
      return {
        available: false,
        note: 'Flight lookup is not configured; extract details from the text instead.',
      };
    }
    const from = getAirportById(ctx.db, originAirportId);
    const to = getAirportById(ctx.db, destinationAirportId);
    if (from === undefined || to === undefined) return { error: 'Unknown airport id.' };

    try {
      const candidates = (await ctx.provider.search({ from, to, date })).slice(
        0,
        MAX_FLIGHT_RESULTS,
      );
      ctx.lastSearch = { from, to, candidates };
      return {
        available: true,
        candidates: candidates.map((c, i) => ({
          flightRef: candidateRef(i),
          airline: c.airline,
          flightNumber: c.flightNumber,
          callsign: c.callsign,
          departureLocal: c.departure.slice(0, 16),
          arrivalLocal: c.arrival?.slice(0, 16) ?? null,
        })),
      };
    } catch (cause) {
      return { error: cause instanceof Error ? cause.message : 'Flight lookup failed.' };
    }
  }

  return { error: `Unknown tool: ${name}` };
}
