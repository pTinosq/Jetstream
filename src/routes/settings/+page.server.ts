import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { db } from '$lib/server/db';
import {
  clearOpenSkyCredentials,
  getOpenSkyClientId,
  saveOpenSkyCredentials,
} from '$lib/server/settings/opensky';
import { verifyOpenSkyCredentials } from '$lib/server/flights/providers/opensky';
import type { Actions, PageServerLoad } from './$types';

function envConfigured(): boolean {
  return (env.OPENSKY_CLIENT_ID ?? '') !== '' && (env.OPENSKY_CLIENT_SECRET ?? '') !== '';
}

export const load: PageServerLoad = () => {
  const clientId = getOpenSkyClientId(db);
  const source = clientId !== null ? 'db' : envConfigured() ? 'env' : null;
  return { opensky: { clientId, source } };
};

const credentialsSchema = z.object({
  clientId: z.string().trim().min(1, 'Client ID is required'),
  clientSecret: z.string().trim().min(1, 'Client secret is required'),
});

export const actions: Actions = {
  save: async ({ request }) => {
    const form = await request.formData();
    const parsed = credentialsSchema.safeParse({
      clientId: form.get('clientId'),
      clientSecret: form.get('clientSecret'),
    });
    if (!parsed.success) {
      return fail(400, { errors: z.flattenError(parsed.error).fieldErrors });
    }
    saveOpenSkyCredentials(db, parsed.data);
    // Save regardless, but tell the user whether the keys actually work.
    const verify = await verifyOpenSkyCredentials(parsed.data);
    return { saved: true, verified: verify.ok, verifyError: verify.ok ? null : verify.error };
  },

  clear: () => {
    clearOpenSkyCredentials(db);
    return { cleared: true };
  },
};
