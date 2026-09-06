import { z } from 'zod';
import { toIsoWithOffset } from '../../../datetime.ts';
import type { FlightCandidate } from '../../../flights/candidate.ts';
import { mapOpenSkyDepartures } from './opensky-map.ts';
import type { FlightSearchParams, FlightSearchProvider } from './types.ts';

const TOKEN_URL =
  'https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token';
const API_BASE = 'https://opensky-network.org/api';

const tokenSchema = z.object({ access_token: z.string(), expires_in: z.number() });

export interface OpenSkyCredentials {
  clientId: string;
  clientSecret: string;
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
    const url = `${API_BASE}/flights/departure?airport=${encodeURIComponent(from.icao)}&begin=${begin}&end=${end}`;
    const response = await fetch(url, {
      headers: { authorization: `Bearer ${await this.#accessToken()}` },
    });
    if (!response.ok) {
      throw new Error(`OpenSky request failed: ${response.status} ${response.statusText}`);
    }
    return mapOpenSkyDepartures(await response.json(), from, to);
  }

  async #accessToken(): Promise<string> {
    const now = Date.now();
    if (this.#token !== null && this.#token.expiresAt > now) return this.#token.value;

    const response = await fetch(TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.#credentials.clientId,
        client_secret: this.#credentials.clientSecret,
      }),
    });
    if (!response.ok) {
      throw new Error(`OpenSky auth failed: ${response.status} ${response.statusText}`);
    }
    const token = tokenSchema.parse(await response.json());
    // Refresh a minute early to avoid failing at the edge of expiry.
    this.#token = { value: token.access_token, expiresAt: now + (token.expires_in - 60) * 1000 };
    return this.#token.value;
  }
}

/** Unix-second [begin, end) window covering the local calendar day at the origin. */
function dayWindow(date: string, timeZone: string): { begin: number; end: number } {
  const start = new Date(toIsoWithOffset(`${date}T00:00`, timeZone));
  const begin = Math.floor(start.getTime() / 1000);
  return { begin, end: begin + 24 * 60 * 60 };
}
