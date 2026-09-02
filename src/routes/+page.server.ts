import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import { createFlight, listFlights } from '$lib/server/flights/repository';
import { flightInputSchema } from '$lib/flights/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  return { flights: await listFlights(db) };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const form = await request.formData();
    const values: Record<string, string> = {};
    for (const [key, value] of form) {
      if (typeof value === 'string') values[key] = value;
    }

    const parsed = flightInputSchema.safeParse(values);
    if (!parsed.success) {
      return fail(400, { errors: z.flattenError(parsed.error).fieldErrors, values });
    }

    createFlight(db, parsed.data);
    return { created: true };
  },
};
