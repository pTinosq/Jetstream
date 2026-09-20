import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { getDb } from '$lib/server/db';
import { lookupAircraft } from '$lib/server/aircraft/adsbdb';
import { resolveFlightProvider } from '$lib/server/flights/providers/resolve';
import { resolveOpenRouterConfig } from '$lib/server/settings/openrouter';
import { OpenRouterClient } from '$lib/server/assistant/openrouter';
import { resolveFlightDraft } from '$lib/server/assistant/resolve';
import type { RequestHandler } from './$types';

const bodySchema = z.object({ text: z.string().trim().min(1).max(4000) });

/**
 * POST /api/assistant  { text }
 * Turn free text (or a pasted email) into a proposed flight to prefill the form.
 * Nothing is saved — the user reviews and submits.
 */
export const POST: RequestHandler = async ({ request }) => {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ status: 'error', error: 'Enter some flight details.' });

  const db = getDb();
  const config = resolveOpenRouterConfig(db);
  if (config === null) {
    return json({
      status: 'error',
      error: 'The AI assistant is not configured. Add an OpenRouter API key in Settings.',
    });
  }

  const llm = new OpenRouterClient(config.apiKey, config.model);
  const provider = resolveFlightProvider(db);
  const today = new Date().toISOString().slice(0, 10);

  try {
    const result = await resolveFlightDraft(
      { db, provider, llm, lookupAircraft, today },
      parsed.data.text,
    );
    return json(result);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'The assistant failed.';
    return json({ status: 'error', error: message });
  }
};
