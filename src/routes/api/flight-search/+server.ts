import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { getAirportById } from '$lib/server/airports/get';
import { resolveFlightProvider } from '$lib/server/flights/providers/resolve';
import type { RequestHandler } from './$types';

const querySchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/**
 * GET /api/flight-search?from=<airportId>&to=<airportId>&date=YYYY-MM-DD
 * Returns candidate flights for the route + date, or `provider: null` when
 * auto-detect isn't configured (the client then uses manual entry).
 */
export const GET: RequestHandler = async ({ url }) => {
  const parsed = querySchema.safeParse({
    from: url.searchParams.get('from'),
    to: url.searchParams.get('to'),
    date: url.searchParams.get('date'),
  });
  if (!parsed.success) error(400, 'Invalid search parameters');

  const provider = resolveFlightProvider(db);
  if (provider === null) return json({ provider: null, candidates: [] });

  const from = getAirportById(db, parsed.data.from);
  const to = getAirportById(db, parsed.data.to);
  if (from === undefined || to === undefined) error(404, 'Unknown airport');

  try {
    const candidates = await provider.search({ from, to, date: parsed.data.date });
    return json({ provider: provider.name, candidates });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Flight lookup failed';
    return json({ provider: provider.name, candidates: [], error: message }, { status: 502 });
  }
};
