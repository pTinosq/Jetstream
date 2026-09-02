import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { searchAirports } from '$lib/server/airports/search';
import type { RequestHandler } from './$types';

/** GET /api/airports?q=<query> — airport autocomplete for the flight form. */
export const GET: RequestHandler = ({ url }) => {
  const query = url.searchParams.get('q') ?? '';
  return json(searchAirports(db, query));
};
