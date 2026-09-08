import { env } from '$env/dynamic/private';
import type { Db } from '../../db/client.ts';
import { getOpenSkyCredentialsFromDb } from '../../settings/opensky.ts';
import { OpenSkyProvider, type OpenSkyCredentials } from './opensky.ts';
import type { FlightSearchProvider } from './types.ts';

/**
 * Pick a flight-search provider. Credentials configured in the app (Settings
 * page, stored in the DB) take precedence; environment variables are a fallback
 * for env-based deploys. Returns null when nothing is configured, in which case
 * the UI falls back to manual entry.
 */
export function resolveFlightProvider(db: Db): FlightSearchProvider | null {
  const credentials = getOpenSkyCredentialsFromDb(db) ?? openSkyCredentialsFromEnv();
  return credentials === null ? null : new OpenSkyProvider(credentials);
}

function openSkyCredentialsFromEnv(): OpenSkyCredentials | null {
  const clientId = env.OPENSKY_CLIENT_ID;
  const clientSecret = env.OPENSKY_CLIENT_SECRET;
  if (
    clientId === undefined ||
    clientId === '' ||
    clientSecret === undefined ||
    clientSecret === ''
  ) {
    return null;
  }
  return { clientId, clientSecret };
}
