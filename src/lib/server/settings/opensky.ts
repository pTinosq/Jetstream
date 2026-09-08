import type { Db } from '../db/client.ts';
import type { OpenSkyCredentials } from '../flights/providers/opensky.ts';
import { deleteSetting, getSetting, setSetting } from './service.ts';

const CLIENT_ID_KEY = 'opensky_client_id';
const CLIENT_SECRET_KEY = 'opensky_client_secret';

/** OpenSky credentials stored in the DB (via the Settings page), or null. */
export function getOpenSkyCredentialsFromDb(db: Db): OpenSkyCredentials | null {
  const clientId = getSetting(db, CLIENT_ID_KEY);
  const clientSecret = getSetting(db, CLIENT_SECRET_KEY);
  if (clientId === null || clientSecret === null) return null;
  return { clientId, clientSecret };
}

export function saveOpenSkyCredentials(db: Db, credentials: OpenSkyCredentials): void {
  setSetting(db, CLIENT_ID_KEY, credentials.clientId);
  setSetting(db, CLIENT_SECRET_KEY, credentials.clientSecret);
}

export function clearOpenSkyCredentials(db: Db): void {
  deleteSetting(db, CLIENT_ID_KEY);
  deleteSetting(db, CLIENT_SECRET_KEY);
}

/** The stored client id (not secret), for displaying current config in the UI. */
export function getOpenSkyClientId(db: Db): string | null {
  return getSetting(db, CLIENT_ID_KEY);
}
