import { z } from 'zod';
import { toIsoWithOffset } from '../../../datetime.ts';
import type { FlightCandidate } from '../../../flights/candidate.ts';
import { mapOpenSkyRoute } from './opensky-map.ts';
import type { FlightSearchParams, FlightSearchProvider } from './types.ts';

const TOKEN_URL =
  'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';
const API_BASE = 'https://opensky-network.org/api';

const tokenSchema = z.object({ access_token: z.string(), expires_in: z.number() });

export interface OpenSkyCredentials {
  clientId: string;
  clientSecret: string;
}

/** Exchange client credentials for an access token; throws on failure. */
async function requestOpenSkyToken(
  credentials: OpenSkyCredentials,
): Promise<{ value: string; expiresIn: number }> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
    }),
  });
  if (!response.ok) {
    throw new Error(`OpenSky auth failed: ${response.status} ${response.statusText}`);
  }
  const token = tokenSchema.parse(await response.json());
  return { value: token.access_token, expiresIn: token.expires_in };
}

/** Check credentials by attempting a token exchange, for the Settings page. */
export async function verifyOpenSkyCredentials(
  credentials: OpenSkyCredentials,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requestOpenSkyToken(credentials);
    return { ok: true };
  } catch (cause) {
    return { ok: false, error: cause instanceof Error ? cause.message : 'Verification failed' };
  }
}

/**
 * Free flight data from the OpenSky Network. Historical route lookups require a
 * (free) account, so credentials are mandatory. Covers flights that have
 * already departed — future schedules are out of scope for this provider.
 */
export class OpenSkyProvider implements FlightSearchProvider {
  readonly name = 'opensky';
  readonly #credentials: OpenSkyCredentials;
  #token: { value: string; expiresAt: number } | null = null;

  constructor(credentials: OpenSkyCredentials) {
    this.#credentials = credentials;
  }

  async search({ from, to, date }: FlightSearchParams): Promise<FlightCandidate[]> {
    if (from.icao === null || to.icao === null) return [];

    const { begin, end } = dayWindow(date, from.timezone ?? 'UTC');
    const headers = { authorization: `Bearer ${await this.#accessToken()}` };

    const departureUrl = `${API_BASE}/flights/departure?airport=${encodeURIComponent(from.icao)}&begin=${begin}&end=${end}`;
    // Late/long flights land the next day, so widen the arrival window a day past
    // the origin's calendar day to catch them.
    const arrivalUrl = `${API_BASE}/flights/arrival?airport=${encodeURIComponent(to.icao)}&begin=${begin}&end=${end + 24 * 60 * 60}`;

    const [departureRes, arrivalRes] = await Promise.all([
      fetch(departureUrl, { headers }),
      fetch(arrivalUrl, { headers }),
    ]);
    if (!departureRes.ok) {
      throw new Error(`OpenSky request failed: ${departureRes.status} ${departureRes.statusText}`);
    }
    // Arrivals only enrich the match (they confirm destinations OpenSky couldn't
    // estimate on departure). If that call fails, degrade to departures-only.
    const arrivals: unknown = arrivalRes.ok ? await arrivalRes.json() : [];
    return mapOpenSkyRoute(await departureRes.json(), arrivals, from, to);
  }

  async #accessToken(): Promise<string> {
    const now = Date.now();
    if (this.#token !== null && this.#token.expiresAt > now) return this.#token.value;

    const token = await requestOpenSkyToken(this.#credentials);
    // Refresh a minute early to avoid failing at the edge of expiry.
    this.#token = { value: token.value, expiresAt: now + (token.expiresIn - 60) * 1000 };
    return this.#token.value;
  }
}

/** Unix-second [begin, end) window covering the local calendar day at the origin. */
function dayWindow(date: string, timeZone: string): { begin: number; end: number } {
  const start = new Date(toIsoWithOffset(`${date}T00:00`, timeZone));
  const begin = Math.floor(start.getTime() / 1000);
  return { begin, end: begin + 24 * 60 * 60 };
}
