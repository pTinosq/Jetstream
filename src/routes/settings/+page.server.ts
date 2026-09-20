import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { getDb } from '$lib/server/db';
import {
  clearOpenSkyCredentials,
  getOpenSkyClientId,
  saveOpenSkyCredentials,
} from '$lib/server/settings/opensky';
import { verifyOpenSkyCredentials } from '$lib/server/flights/providers/opensky';
import {
  clearOpenRouterConfig,
  DEFAULT_OPENROUTER_MODEL,
  resolveOpenRouterConfig,
  saveOpenRouterConfig,
} from '$lib/server/settings/openrouter';
import { verifyOpenRouter } from '$lib/server/assistant/openrouter';
import type { Actions, PageServerLoad } from './$types';

function envConfigured(): boolean {
  return (env.OPENSKY_CLIENT_ID ?? '') !== '' && (env.OPENSKY_CLIENT_SECRET ?? '') !== '';
}

export const load: PageServerLoad = () => {
  const db = getDb();
  const clientId = getOpenSkyClientId(db);
  const source = clientId !== null ? 'db' : envConfigured() ? 'env' : null;

  const ai = resolveOpenRouterConfig(db);
  return {
    opensky: { clientId, source },
    openrouter: { model: ai?.model ?? DEFAULT_OPENROUTER_MODEL, source: ai?.source ?? null },
  };
};

const credentialsSchema = z.object({
  clientId: z.string().trim().min(1, 'Client ID is required'),
  clientSecret: z.string().trim().min(1, 'Client secret is required'),
});

const aiSchema = z.object({
  apiKey: z.string().trim().min(1, 'API key is required'),
  model: z.string().trim().default(''),
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
    saveOpenSkyCredentials(getDb(), parsed.data);
    // Save regardless, but tell the user whether the keys actually work.
    const verify = await verifyOpenSkyCredentials(parsed.data);
    return { saved: true, verified: verify.ok, verifyError: verify.ok ? null : verify.error };
  },

  clear: () => {
    clearOpenSkyCredentials(getDb());
    return { cleared: true };
  },

  saveAi: async ({ request }) => {
    const form = await request.formData();
    const parsed = aiSchema.safeParse({
      apiKey: form.get('apiKey'),
      model: form.get('model'),
    });
    if (!parsed.success) {
      return fail(400, { errors: z.flattenError(parsed.error).fieldErrors });
    }
    const model = parsed.data.model !== '' ? parsed.data.model : DEFAULT_OPENROUTER_MODEL;
    saveOpenRouterConfig(getDb(), parsed.data.apiKey, model);
    const verify = await verifyOpenRouter(parsed.data.apiKey, model);
    return { aiSaved: true, aiVerified: verify.ok, aiVerifyError: verify.ok ? null : verify.error };
  },

  clearAi: () => {
    clearOpenRouterConfig(getDb());
    return { aiCleared: true };
  },
};
