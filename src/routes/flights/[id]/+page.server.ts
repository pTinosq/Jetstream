import { error, fail } from '@sveltejs/kit';
import { z } from 'zod';
import { getDb } from '$lib/server/db';
import {
  deleteFlight,
  getFlightById,
  listAircraftTypes,
  updateFlight,
} from '$lib/server/flights/repository';
import { flightInputSchema } from '$lib/flights/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const db = getDb();
  const flight = await getFlightById(db, params.id);
  if (flight === undefined) error(404, 'Flight not found');
  return { flight, aircraftTypes: listAircraftTypes(db) };
};

export const actions: Actions = {
  update: async ({ request, params }) => {
    const form = await request.formData();
    const values: Record<string, string> = {};
    for (const [key, value] of form) {
      if (typeof value === 'string') values[key] = value;
    }

    const parsed = flightInputSchema.safeParse(values);
    if (!parsed.success) {
      return fail(400, { errors: z.flattenError(parsed.error).fieldErrors, values });
    }

    updateFlight(getDb(), params.id, parsed.data);
    return { updated: true };
  },

  delete: ({ params }) => {
    deleteFlight(getDb(), params.id);
    return { deleted: true };
  },
};
