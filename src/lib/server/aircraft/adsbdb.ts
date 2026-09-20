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

/**
 * Extract a clean model designation from adsbdb's raw type string, dropping the
 * airline customer/winglet codes it appends (e.g. "737NG 8AS/W" → "737"), while
 * keeping tidy variants like "777-300ER". Returns null if nothing recognisable.
 */
function baseModel(raw: string): string | null {
  // No trailing boundary: keep clean "-variant" suffixes but drop attached
  // customer codes like the "NG" / "neo" that run straight on from the number.
  const boeing = /\b(7[0-9]7)(-\d{3}(?:ER|LR)?)?/.exec(raw);
  if (boeing !== null) return `${boeing[1]}${boeing[2] ?? ''}`;
  const airbus = /\b(A[23]\d{2})(-\d{3})?/.exec(raw);
  if (airbus !== null) return `${airbus[1]}${airbus[2] ?? ''}`;
  const embraer = /\b(E1[0-9]{2}|E2[0-9]{2})\b/.exec(raw);
  if (embraer !== null) return embraer[1] ?? null;
  return null;
}

/**
 * A human-friendly aircraft type like "Boeing 737" or "Airbus A350", from
 * adsbdb's manufacturer + noisy type/ICAO-code fields.
 */
export function friendlyAircraftType(
  manufacturer: string | null,
  rawType: string | null,
  typeCode: string | null,
): string | null {
  const model =
    (rawType !== null ? baseModel(rawType) : null) ??
    (typeCode !== null ? baseModel(typeCode) : null);
  if (model !== null) return manufacturer !== null ? `${manufacturer} ${model}` : model;
  return rawType ?? typeCode ?? manufacturer;
}

/** Map an adsbdb aircraft response into our Aircraft, or null if not found. */
export function mapAdsbdbAircraft(raw: unknown): Aircraft | null {
  const parsed = responseSchema.safeParse(raw);
  if (!parsed.success) return null;
  const a = parsed.data.response.aircraft;
  const manufacturer = clean(a.manufacturer);
  const typeCode = clean(a.icao_type);
  return {
    registration: clean(a.registration),
    type: friendlyAircraftType(manufacturer, clean(a.type), typeCode),
    typeCode,
    manufacturer,
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
