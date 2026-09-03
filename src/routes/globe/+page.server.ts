import { db } from '$lib/server/db';
import { listFlights } from '$lib/server/flights/repository';
import { buildGlobeData } from '$lib/server/globe/build';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  return { globe: buildGlobeData(await listFlights(db)) };
};
