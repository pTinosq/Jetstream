/** Aircraft details resolved from an ICAO 24-bit address. */
export interface Aircraft {
  registration: string | null;
  /** Human-friendly type, e.g. "Boeing 777-300ER". */
  type: string | null;
  /** ICAO type code, e.g. "B77W". */
  typeCode: string | null;
  manufacturer: string | null;
  operator: string | null;
  photoUrl: string | null;
}
