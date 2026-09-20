import type { Aircraft } from '../../aircraft/types.ts';
import type { Airport } from '../../airports/types.ts';
import type { FlightCandidate } from '../../flights/candidate.ts';
import type { Db } from '../db/client.ts';
import { getAirportById } from '../airports/get.ts';
import type { FlightSearchProvider } from '../flights/providers/types.ts';
import type { ChatMessage, LlmClient } from './openrouter.ts';
import { candidateRef, executeTool, TOOL_SCHEMAS, type ToolContext } from './tools.ts';
import type { AssistantDraft, AssistantResult } from './types.ts';

/** Cap tool round-trips so a confused model can't burn tokens indefinitely. */
const MAX_STEPS = 6;

export interface ResolveDeps {
  db: Db;
  provider: FlightSearchProvider | null;
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
    'From the user text, determine the origin, destination, date, airline, flight number, and times.',
    'Use search_airports to turn place names or codes into airport ids.',
    'Whenever you have an origin, destination, and date, you MUST call search_flights and try to ground the flight on a real candidate — do not skip it.',
    'IMPORTANT: search_flights candidates are labelled by the ATC callsign (e.g. "FIN7WG"), which usually does NOT match the marketing flight number (e.g. "AY1337"). Do not require the numbers to match. Match the user\'s flight to a candidate by route and the CLOSEST departure time; the callsign\'s leading letters are the airline ICAO code (BAW=British Airways, FIN=Finnair, DLH=Lufthansa, etc.). Candidate times are wheels-up/wheels-down, so allow ~30 min difference from scheduled times.',
    'When you match a candidate, pass its flightRef so the exact times and aircraft are used. Still pass the airline and flightNumber from the user text (the marketing code, e.g. "AY" and "1337") so the log shows the number the user recognises.',
    'Only fall back to times from the text when search_flights is unavailable or returns no plausible candidate for the route and date.',
    'Call propose_flight exactly once when done.',
    'If the text lacks enough to identify a route or date and you cannot reasonably infer it, reply in plain words asking for the missing detail instead of calling propose_flight.',
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

function findCandidate(
  lastSearch: ToolContext['lastSearch'],
  flightRef: string | null,
): FlightCandidate | undefined {
  if (lastSearch === null || flightRef === null) return undefined;
  return lastSearch.candidates.find((_, i) => candidateRef(i) === flightRef);
}

async function buildDraft(
  deps: ResolveDeps,
  ctx: ToolContext,
  args: Record<string, unknown>,
): Promise<AssistantDraft> {
  const candidate = findCandidate(ctx.lastSearch, str(args.flightRef));

  const originId = str(args.originAirportId);
  const destId = str(args.destinationAirportId);
  const origin: Airport | null =
    (originId !== null ? getAirportById(deps.db, originId) : undefined) ??
    ctx.lastSearch?.from ??
    null;
  const destination: Airport | null =
    (destId !== null ? getAirportById(deps.db, destId) : undefined) ?? ctx.lastSearch?.to ?? null;

  const departureLocal = candidate?.departure.slice(0, 16) ?? str(args.departureLocal);
  const arrivalLocal = candidate?.arrival?.slice(0, 16) ?? str(args.arrivalLocal);

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
    // Prefer the marketing code from the text (e.g. "AY 1337") over the
    // decorrelated callsign the candidate carries (e.g. "FIN 7WG").
    airline: str(args.airline) ?? candidate?.airline ?? null,
    flightNumber: str(args.flightNumber) ?? candidate?.flightNumber ?? null,
    departureLocal,
    arrivalLocal,
    aircraftType,
    registration,
    photoUrl,
    matchedFlight: candidate !== undefined,
    note: str(args.note),
  };
}

/**
 * Drive the model + tools until it proposes a flight, asks a question, or we hit
 * the step cap. Returns a draft to prefill the form — never saves anything.
 */
export async function resolveFlightDraft(
  deps: ResolveDeps,
  text: string,
): Promise<AssistantResult> {
  const ctx: ToolContext = { db: deps.db, provider: deps.provider, lastSearch: null };
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt(deps.today) },
    { role: 'user', content: text },
  ];

  for (let step = 0; step < MAX_STEPS; step++) {
    const message = await deps.llm.complete(messages, TOOL_SCHEMAS);
    messages.push(message);

    const calls = message.tool_calls ?? [];
    if (calls.length === 0) {
      return { status: 'question', message: message.content ?? 'Could you add a bit more detail?' };
    }

    for (const call of calls) {
      const args = parseArgs(call.arguments);
      if (call.name === 'propose_flight') {
        return { status: 'draft', draft: await buildDraft(deps, ctx, args) };
      }
      const result = await executeTool(ctx, call.name, args);
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        name: call.name,
        content: JSON.stringify(result),
      });
    }
  }

  return {
    status: 'error',
    error: 'Could not identify the flight. Try adding the route and date.',
  };
}
