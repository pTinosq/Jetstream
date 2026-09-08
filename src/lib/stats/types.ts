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
  perYear: YearCount[];
  longest: LongestFlight | null;
}
