import { env } from '$env/dynamic/private';
import type { Db } from '../db/client.ts';
import { getSetting, setSetting, deleteSetting } from './service.ts';

const API_KEY_KEY = 'openrouter_api_key';
const MODEL_KEY = 'openrouter_model';

/** Sensible tool-calling-capable default; overridable in Settings. */
export const DEFAULT_OPENROUTER_MODEL = 'openai/gpt-4o-mini';

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  /** Where the key came from, for the Settings page badge. */
  source: 'db' | 'env';
}

/**
 * Resolve OpenRouter config: DB (Settings page) first, then env fallback for
 * env-based deploys. Returns null when no API key is configured anywhere.
 */
export function resolveOpenRouterConfig(db: Db): OpenRouterConfig | null {
  const dbKey = getSetting(db, API_KEY_KEY);
  if (dbKey !== null && dbKey !== '') {
    return { apiKey: dbKey, model: getModel(db), source: 'db' };
  }
  const envKey = env.OPENROUTER_API_KEY;
  if (envKey !== undefined && envKey !== '') {
    const envModel = env.OPENROUTER_MODEL;
    const model = envModel !== undefined && envModel !== '' ? envModel : DEFAULT_OPENROUTER_MODEL;
    return { apiKey: envKey, model, source: 'env' };
  }
  return null;
}

function getModel(db: Db): string {
  const model = getSetting(db, MODEL_KEY);
  return model !== null && model !== '' ? model : DEFAULT_OPENROUTER_MODEL;
}

/** The stored model (not key), for showing current config in the UI. */
export function getOpenRouterModel(db: Db): string {
  return getModel(db);
}

export function saveOpenRouterConfig(db: Db, apiKey: string, model: string): void {
  setSetting(db, API_KEY_KEY, apiKey);
  setSetting(db, MODEL_KEY, model !== '' ? model : DEFAULT_OPENROUTER_MODEL);
}

export function clearOpenRouterConfig(db: Db): void {
  deleteSetting(db, API_KEY_KEY);
  deleteSetting(db, MODEL_KEY);
}
