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
    .values([airport('1', 'HEL', 'Helsinki Vantaa'), airport('2', 'LHR', 'London Heathrow')])
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

/** An LlmClient that returns one fixed assistant turn. */
class OneShotLlm implements LlmClient {
  #turn: ChatMessage;
  constructor(turn: ChatMessage) {
    this.#turn = turn;
  }
  complete(): Promise<ChatMessage> {
    return Promise.resolve(this.#turn);
  }
}

const AIRCRAFT: Aircraft = {
  registration: 'OH-LWS',
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
    llm: new OneShotLlm({ role: 'assistant', content: '' }),
    lookupAircraft: () => Promise.resolve(AIRCRAFT),
    today: '2026-09-19',
    ...over,
  };
}

const findFlight = (args: object): ChatMessage => ({
  role: 'assistant',
  content: null,
  tool_calls: [{ id: 'c1', name: 'find_flight', arguments: JSON.stringify(args) }],
});

test('grounds on the tracked flight closest to the stated time, keeping the marketing number', async () => {
  const candidates: FlightCandidate[] = [
    {
      airline: 'FIN',
      flightNumber: '27W',
      callsign: 'FIN27W',
      icao24: 'x1',
      departure: '2026-08-30T11:42:00+03:00',
      arrival: '2026-08-30T12:22:00+01:00',
      originIata: 'HEL',
      destinationIata: 'LHR',
    },
    {
      airline: 'FIN',
      flightNumber: '7WG',
      callsign: 'FIN7WG',
      icao24: 'abc',
      departure: '2026-08-30T16:30:00+03:00',
      arrival: '2026-08-30T16:58:00+01:00',
      originIata: 'HEL',
      destinationIata: 'LHR',
    },
  ];
  const provider: FlightSearchProvider = {
    name: 'stub',
    search: () => Promise.resolve(candidates),
  };

  const llm = new OneShotLlm(
    findFlight({
      from: 'HEL',
      to: 'LHR',
      date: '2026-08-30',
      airline: 'AY',
      flightNumber: '1337',
      departureTimeLocal: '16:00',
    }),
  );

  const result = await resolveFlightDraft(
    deps({ llm, provider }),
    'Finnair AY1337 HEL→LHR 30 Aug 16:00',
  );
  expect(result.status).toBe('draft');
  if (result.status !== 'draft') return;
  expect(result.draft.matchedFlight).toBe(true);
  expect(result.draft.airline).toBe('AY');
  expect(result.draft.flightNumber).toBe('1337');
  expect(result.draft.departureLocal).toBe('2026-08-30T16:30');
  expect(result.draft.arrivalLocal).toBe('2026-08-30T16:58');
  expect(result.draft.registration).toBe('OH-LWS');
  expect(result.draft.origin?.iata).toBe('HEL');
  expect(result.draft.destination?.iata).toBe('LHR');
});

test('falls back to text times and captures seat + notes when lookup is unavailable', async () => {
  const llm = new OneShotLlm(
    findFlight({
      from: 'HEL',
      to: 'LHR',
      date: '2026-08-30',
      airline: 'AY',
      flightNumber: '1337',
      departureTimeLocal: '16:00',
      arrivalTimeLocal: '17:05',
      seat: '14C',
      notes: 'Confirmation Y36W7E, economy',
    }),
  );
  const result = await resolveFlightDraft(deps({ llm }), 'AY1337 seat 14C');
  expect(result.status).toBe('draft');
  if (result.status !== 'draft') return;
  expect(result.draft.matchedFlight).toBe(false);
  expect(result.draft.departureLocal).toBe('2026-08-30T16:00');
  expect(result.draft.arrivalLocal).toBe('2026-08-30T17:05');
  expect(result.draft.aircraftType).toBeNull();
  expect(result.draft.seat).toBe('14C');
  expect(result.draft.notes).toBe('Confirmation Y36W7E, economy');
});

test('leaves seat and notes null when the text omits them', async () => {
  const llm = new OneShotLlm(findFlight({ from: 'HEL', to: 'LHR', date: '2026-08-30' }));
  const result = await resolveFlightDraft(deps({ llm }), 'HEL to LHR on 30 Aug');
  expect(result.status).toBe('draft');
  if (result.status !== 'draft') return;
  expect(result.draft.seat).toBeNull();
  expect(result.draft.notes).toBeNull();
});

test('falls back to text times when the lookup throws', async () => {
  const provider: FlightSearchProvider = {
    name: 'stub',
    search: () => Promise.reject(new Error('opensky down')),
  };
  const llm = new OneShotLlm(
    findFlight({ from: 'HEL', to: 'LHR', date: '2026-08-30', departureTimeLocal: '16:00' }),
  );
  const result = await resolveFlightDraft(deps({ llm, provider }), 'AY1337');
  expect(result.status).toBe('draft');
  if (result.status !== 'draft') return;
  expect(result.draft.matchedFlight).toBe(false);
  expect(result.draft.departureLocal).toBe('2026-08-30T16:00');
});

test('returns a question when the model asks for more detail', async () => {
  const llm = new OneShotLlm({ role: 'assistant', content: 'Which city did you fly from?' });
  const result = await resolveFlightDraft(deps({ llm }), 'a flight yesterday');
  expect(result).toEqual({ status: 'question', message: 'Which city did you fly from?' });
});
