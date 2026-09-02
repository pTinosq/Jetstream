/**
 * An airport as exposed to the client (mirrors the `airports` table row).
 * Declared outside `server/` so both UI and server code can share the type.
 */
export interface Airport {
  id: string;
  icao: string | null;
  iata: string | null;
  name: string;
  municipality: string | null;
  country: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
}
