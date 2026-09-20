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
    'Use search_flights to find the real flight and its exact times and aircraft when possible; times are local to each airport.',
    'When flight lookup is unavailable or finds nothing, extract what you can from the text.',
    'Call propose_flight exactly once when done. If a search_flights candidate matches, pass its flightRef.',
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
    airline: candidate?.airline ?? str(args.airline),
    flightNumber: candidate?.flightNumber ?? str(args.flightNumber),
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
