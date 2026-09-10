import { error, json } from '@sveltejs/kit';
import { z } from 'zod';
import { lookupAircraft } from '$lib/server/aircraft/adsbdb';
import type { RequestHandler } from './$types';

const icao24Schema = z.string().regex(/^[0-9a-fA-F]{6}$/);

/** GET /api/aircraft?icao24=<hex> — resolve an airframe's details (or null). */
export const GET: RequestHandler = async ({ url }) => {
  const parsed = icao24Schema.safeParse(url.searchParams.get('icao24'));
  if (!parsed.success) error(400, 'Invalid icao24');

  try {
    return json({ aircraft: await lookupAircraft(parsed.data.toLowerCase()) });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Aircraft lookup failed';
    return json({ aircraft: null, error: message }, { status: 502 });
  }
};
