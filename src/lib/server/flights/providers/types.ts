import type { Airport } from '../../../airports/types.ts';
import type { FlightCandidate } from '../../../flights/candidate.ts';

export interface FlightSearchParams {
  from: Airport;
  to: Airport;
  /** Local calendar date at the origin, "YYYY-MM-DD". */
  date: string;
}

/**
 * A source of flight candidates for a route + date. Implementations are chosen
 * at runtime from configuration; `null` (no provider) means manual entry only.
 */
export interface FlightSearchProvider {
  readonly name: string;
  search(params: FlightSearchParams): Promise<FlightCandidate[]>;
}
