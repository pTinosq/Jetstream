import { env } from '$env/dynamic/private';
import { OpenSkyProvider } from './opensky.ts';
import type { FlightSearchProvider } from './types.ts';

/**
 * Pick a flight-search provider from configuration. Returns null when none is
 * configured, in which case the UI falls back to manual entry.
 */
export function resolveFlightProvider(): FlightSearchProvider | null {
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
  return new OpenSkyProvider({ clientId, clientSecret });
}
