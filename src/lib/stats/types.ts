export interface AirportCount {
  code: string;
  name: string;
  visits: number;
}

export interface AirlineCount {
  airline: string;
  count: number;
}

export interface YearCount {
  year: number;
  count: number;
}

export interface LongestFlight {
  label: string;
  distanceKm: number;
}

export interface AircraftCount {
  type: string;
  count: number;
}

export interface CabinCount {
  cabin: string;
  count: number;
}

/** Where in a row you sit (assuming a standard single-aisle 3-3 layout). */
export type SeatPosition = 'window' | 'middle' | 'aisle';
/** Roughly where along the cabin you sit, by row number. */
export type CabinSection = 'front' | 'mid' | 'rear';

export interface SeatStats {
  /** Flights whose seat we could parse into a row + letter. */
  parsed: number;
  position: Record<SeatPosition, number>;
  section: Record<CabinSection, number>;
  favouritePosition: SeatPosition | null;
  favouriteSection: CabinSection | null;
  favouriteSeat: string | null;
}

export type PartOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface TimeStats {
  byPartOfDay: Record<PartOfDay, number>;
  favouritePartOfDay: PartOfDay | null;
  /** Departures per weekday, indexed 0 = Sunday .. 6 = Saturday. */
  byWeekday: number[];
  /** 0 = Sunday .. 6 = Saturday, or null when there are no flights. */
  favouriteWeekday: number | null;
}

export interface Stats {
  totalFlights: number;
  flown: number;
  upcoming: number;
  uniqueAirports: number;
  uniqueCountries: number;
  totalDistanceKm: number;
  totalDurationMinutes: number;
  topAirports: AirportCount[];
  topAirlines: AirlineCount[];
  topAircraft: AircraftCount[];
  cabins: CabinCount[];
  seats: SeatStats;
  time: TimeStats;
  perYear: YearCount[];
  longest: LongestFlight | null;
}
