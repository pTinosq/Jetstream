/**
 * A flight the auto-detect lookup found for a route + date. The user picks one
 * to prefill the add-flight form; nothing is stored until they save.
 */
export interface FlightCandidate {
  /** Airline code parsed from the callsign (ICAO-ish), e.g. "BAW". */
  airline: string | null;
  /** Numeric flight number, e.g. "117". */
  flightNumber: string | null;
  /** Raw callsign as reported, e.g. "BAW117". */
  callsign: string | null;
  /** ICAO 24-bit airframe address, e.g. "4008f2" — used to look up the aircraft. */
  icao24: string | null;
  /** Departure as ISO 8601 with the origin airport's UTC offset. */
  departure: string;
  /** Arrival as ISO 8601 with the destination airport's UTC offset, if known. */
  arrival: string | null;
  originIata: string | null;
  destinationIata: string | null;
}
