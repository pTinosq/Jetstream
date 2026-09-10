import { z } from 'zod';
import type { Aircraft } from '../../aircraft/types.ts';

const API_BASE = 'https://api.adsbdb.com/v0/aircraft';

// adsbdb wraps the aircraft in { response: { aircraft: {...} } }; a miss is a
// 404 with { response: "unknown aircraft" }. Only the fields we use, all lenient.
const responseSchema = z.object({
  response: z.object({
    aircraft: z.object({
      registration: z.string().nullish(),
      type: z.string().nullish(),
      icao_type: z.string().nullish(),
      manufacturer: z.string().nullish(),
      registered_owner: z.string().nullish(),
      url_photo: z.string().nullish(),
      url_photo_thumbnail: z.string().nullish(),
    }),
  }),
});

const clean = (value: string | null | undefined): string | null => {
  const trimmed = value?.trim() ?? '';
  return trimmed === '' ? null : trimmed;
};

/** Map an adsbdb aircraft response into our Aircraft, or null if not found. */
export function mapAdsbdbAircraft(raw: unknown): Aircraft | null {
  const parsed = responseSchema.safeParse(raw);
  if (!parsed.success) return null;
  const a = parsed.data.response.aircraft;
  return {
    registration: clean(a.registration),
    type: clean(a.type),
    typeCode: clean(a.icao_type),
    manufacturer: clean(a.manufacturer),
    operator: clean(a.registered_owner),
    photoUrl: clean(a.url_photo_thumbnail) ?? clean(a.url_photo),
  };
}

/** Look up an aircraft by ICAO 24-bit address via adsbdb (free, no key). */
export async function lookupAircraft(icao24: string): Promise<Aircraft | null> {
  const response = await fetch(`${API_BASE}/${encodeURIComponent(icao24)}`);
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`adsbdb request failed: ${response.status} ${response.statusText}`);
  }
  return mapAdsbdbAircraft(await response.json());
}
