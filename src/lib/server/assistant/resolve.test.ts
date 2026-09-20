import { test, expect, beforeEach } from 'vitest';
import { memoryDb } from '../db/testing.ts';
import { airports } from '../db/schema.ts';
import type { Db } from '../db/client.ts';
import type { Aircraft } from '../../aircraft/types.ts';
import type { FlightCandidate } from '../../flights/candidate.ts';
import type { FlightSearchProvider } from '../flights/providers/types.ts';
import type { ChatMessage, LlmClient } from './openrouter.ts';
import { resolveFlightDraft, type ResolveDeps } from './resolve.ts';

let db: Db;

beforeEach(() => {
  db = memoryDb();
  db.insert(airports)
    .values([airport('1', 'LHR', 'London Heathrow'), airport('2', 'ATH', 'Athens')])
    .run();
});

function airport(id: string, iata: string, name: string) {
  return {
    id,
    icao: null,
    iata,
    name,
    municipality: name,
    country: 'XX',
    latitude: 0,
    longitude: 0,
    timezone: 'UTC',
  };
}

/** An LlmClient that replays a fixed list of assistant turns. */
class ScriptedLlm implements LlmClient {
  #turns: ChatMessage[];
  #i = 0;
  constructor(turns: ChatMessage[]) {
    this.#turns = turns;
  }
  complete(): Promise<ChatMessage> {
    const turn = this.#turns[this.#i++];
    if (turn === undefined) throw new Error('scripted LLM ran out of turns');
    return Promise.resolve(turn);
  }
}

const AIRCRAFT: Aircraft = {
  registration: 'OH-LWA',
  type: 'Airbus A350-900',
  typeCode: 'A359',
  manufacturer: 'Airbus',
  operator: 'Finnair',
  photoUrl: 'https://img/plane.jpg',
};

function deps(over: Partial<ResolveDeps>): ResolveDeps {
  return {
    db,
    provider: null,
    llm: new ScriptedLlm([]),
    lookupAircraft: () => Promise.resolve(AIRCRAFT),
    today: '2026-09-19',
    ...over,
  };
}

const call = (id: string, name: string, args: object): ChatMessage => ({
  role: 'assistant',
  content: null,
  tool_calls: [{ id, name, arguments: JSON.stringify(args) }],
});

test('extracts a draft from text when flight lookup is unavailable', async () => {
  const llm = new ScriptedLlm([
    call('c1', 'propose_flight', {
      originAirportId: '1',
      destinationAirportId: '2',
      airline: 'AY',
      flightNumber: '1337',
      departureLocal: '2026-09-18T20:35',
      arrivalLocal: '2026-09-19T02:15',
      note: 'from your text',
    }),
  ]);

  const result = await resolveFlightDraft(deps({ llm }), 'Finnair on the 18th');
  expect(result.status).toBe('draft');
  if (result.status !== 'draft') return;
  expect(result.draft.origin?.iata).toBe('LHR');
  expect(result.draft.destination?.iata).toBe('ATH');
  expect(result.draft.airline).toBe('AY');
  expect(result.draft.departureLocal).toBe('2026-09-18T20:35');
  expect(result.draft.matchedFlight).toBe(false);
  expect(result.draft.note).toBe('from your text');
  // No airframe without an OpenSky match.
  expect(result.draft.aircraftType).toBeNull();
});

test('uses exact times and aircraft when a flight candidate is chosen', async () => {
  const candidate: FlightCandidate = {
    airline: 'AY',
    flightNumber: '1337',
    callsign: 'FIN1337',
    icao24: 'abc123',
    departure: '2026-09-18T20:55:00+01:00',
    arrival: '2026-09-19T02:10:00+03:00',
    originIata: 'LHR',
    destinationIata: 'ATH',
  };
  const provider: FlightSearchProvider = {
    name: 'stub',
    search: () => Promise.resolve([candidate]),
  };

  const llm = new ScriptedLlm([
    call('c1', 'search_flights', {
      originAirportId: '1',
      destinationAirportId: '2',
      date: '2026-09-18',
    }),
    call('c2', 'propose_flight', {
      originAirportId: '1',
      destinationAirportId: '2',
      flightRef: '1',
    }),
  ]);

  const result = await resolveFlightDraft(
    deps({ llm, provider }),
    'Finnair LHR to Athens on the 18th',
  );
  expect(result.status).toBe('draft');
  if (result.status !== 'draft') return;
  expect(result.draft.matchedFlight).toBe(true);
  expect(result.draft.departureLocal).toBe('2026-09-18T20:55');
  expect(result.draft.arrivalLocal).toBe('2026-09-19T02:10');
  expect(result.draft.aircraftType).toBe('Airbus A350-900');
  expect(result.draft.registration).toBe('OH-LWA');
  expect(result.draft.photoUrl).toBe('https://img/plane.jpg');
});

test('returns a question when the model asks for more detail', async () => {
  const llm = new ScriptedLlm([{ role: 'assistant', content: 'Which city did you fly from?' }]);
  const result = await resolveFlightDraft(deps({ llm }), 'a flight yesterday');
  expect(result).toEqual({ status: 'question', message: 'Which city did you fly from?' });
});

test('gives up with an error after too many tool round-trips', async () => {
  // Always searches, never proposes → should hit the step cap.
  const turns = Array.from({ length: 8 }, (_, i) =>
    call(`c${i}`, 'search_airports', { query: 'x' }),
  );
  const result = await resolveFlightDraft(deps({ llm: new ScriptedLlm(turns) }), 'vague');
  expect(result.status).toBe('error');
});
