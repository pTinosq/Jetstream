import { getDb } from '$lib/server/db';
import { listFlights } from '$lib/server/flights/repository';
import { buildStats } from '$lib/server/stats/build';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  return { stats: buildStats(await listFlights(getDb()), new Date()) };
};
