import type { Airport } from '../../airports/types.ts';

/** A resolved flight ready to prefill the add-flight form. Nothing is saved. */
export interface AssistantDraft {
  origin: Airport | null;
  destination: Airport | null;
  airline: string | null;
  flightNumber: string | null;
  /** Local wall-clock "YYYY-MM-DDTHH:mm" for the datetime-local inputs. */
  departureLocal: string | null;
  arrivalLocal: string | null;
  aircraftType: string | null;
  registration: string | null;
  photoUrl: string | null;
  /** Seat, if stated in the text. */
  seat: string | null;
  /** Extra details from the text to keep in the flight's notes. */
  notes: string | null;
  /** True when resolved against a real OpenSky candidate (exact times). */
  matchedFlight: boolean;
}

export type AssistantResult =
  | { status: 'draft'; draft: AssistantDraft }
  | { status: 'question'; message: string }
  | { status: 'error'; error: string };
