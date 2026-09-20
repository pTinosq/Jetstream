import type { Aircraft } from '../../aircraft/types.ts';
import type { Db } from '../db/client.ts';
import type { FlightSearchProvider } from '../flights/providers/types.ts';
import type { ChatMessage, LlmClient, ToolCall } from './openrouter.ts';
import { FIND_FLIGHT_TOOL, pickBestCandidate, resolveAirport } from './tools.ts';
import type { AssistantDraft, AssistantResult } from './types.ts';

export interface ResolveDeps {
  db: Db;
  provider: FlightSearchProvider | null;
  /** The LLM used to extract the flight from free text. */
  llm: LlmClient;
  /** icao24 → airframe details; injected so the loop is testable offline. */
  lookupAircraft: (icao24: string) => Promise<Aircraft | null>;
  /** Today's local date "YYYY-MM-DD", for relative dates like "the 18th". */
  today: string;
}

function systemPrompt(today: string): string {
  return [
    'You help a user log a single flight into their personal flight log.',
    `Today's date is ${today}. Resolve relative dates against it.`,
    'Extract the flight from the user text (which may be a booking email) and call find_flight exactly once.',
    'Pass airport IATA codes when you know them (emails usually list them), else the city or name.',
    'Include the marketing airline code and flight number and the scheduled local times when the text states them — they help the server find and label the right flight.',
    'The server resolves the airports and finds the matching tracked flight itself; you do not need to look anything up.',
    'Only if the text lacks enough to identify a route or date, reply in plain words asking for the missing detail instead of calling find_flight.',
  ].join(' ');
}

function parseArgs(raw: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

const str = (v: unknown): string | null =>
  typeof v === 'string' && v.trim() !== '' ? v.trim() : null;

/** Combine a date and an "HH:mm" into a datetime-local string, if both present. */
function combineDateTime(date: string | null, time: string | null): string | null {
  if (date === null) return null;
  const match = time !== null ? /(\d{2}:\d{2})/.exec(time) : null;
  return match === null ? null : `${date}T${match[1]}`;
}

async function buildDraft(
  deps: ResolveDeps,
  args: Record<string, unknown>,
): Promise<AssistantDraft> {
  const origin = resolveAirport(deps.db, str(args.from)) ?? null;
  const destination = resolveAirport(deps.db, str(args.to)) ?? null;
  const date = str(args.date);
  const departureTime = str(args.departureTimeLocal);
  const arrivalTime = str(args.arrivalTimeLocal);

  // Ground on a real tracked flight when we can; matching is deterministic.
  let candidate;
  if (deps.provider !== null && origin !== null && destination !== null && date !== null) {
    try {
      const candidates = await deps.provider.search({ from: origin, to: destination, date });
      candidate = pickBestCandidate(candidates, departureTime);
    } catch {
      // Lookup failed — fall back to the times from the text.
    }
  }

  let aircraftType: string | null = null;
  let registration: string | null = null;
  let photoUrl: string | null = null;
  const icao24 = candidate?.icao24 ?? null;
  if (icao24 !== null) {
    const aircraft = await deps.lookupAircraft(icao24);
    if (aircraft !== null) {
      aircraftType = aircraft.type ?? aircraft.typeCode;
      registration = aircraft.registration;
      photoUrl = aircraft.photoUrl;
    }
  }

  return {
    origin,
    destination,
    // Keep the marketing code from the text over the decorrelated callsign.
    airline: str(args.airline) ?? candidate?.airline ?? null,
    flightNumber: str(args.flightNumber) ?? candidate?.flightNumber ?? null,
    departureLocal: candidate?.departure.slice(0, 16) ?? combineDateTime(date, departureTime),
    arrivalLocal: candidate?.arrival?.slice(0, 16) ?? combineDateTime(date, arrivalTime),
    aircraftType,
    registration,
    photoUrl,
    seat: str(args.seat),
    notes: str(args.notes),
    matchedFlight: candidate !== undefined,
  };
}

/**
 * One LLM round-trip: the model extracts the flight and calls find_flight; the
 * server resolves airports + the tracked flight deterministically. Falls back to
 * a plain-text question when the model needs more detail.
 */
export async function resolveFlightDraft(
  deps: ResolveDeps,
  text: string,
): Promise<AssistantResult> {
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt(deps.today) },
    { role: 'user', content: text },
  ];

  const message = await deps.llm.complete(messages, [FIND_FLIGHT_TOOL]);
  const call = message.tool_calls?.find((c: ToolCall) => c.name === 'find_flight');
  if (call === undefined) {
    return { status: 'question', message: message.content ?? 'Could you add a bit more detail?' };
  }

  return { status: 'draft', draft: await buildDraft(deps, parseArgs(call.arguments)) };
}
