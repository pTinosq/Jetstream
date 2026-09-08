import { distanceKm } from '../../geo.ts';
import type { AirportCount, Stats } from '../../stats/types.ts';
import type { FlightWithAirports } from '../flights/repository.ts';

type FlightAirport = FlightWithAirports['origin'];

const airportCode = (airport: FlightAirport): string =>
  airport.iata ?? airport.icao ?? airport.name;

const TOP_N = 5;

/**
 * Compute flight-log statistics. `now` decides flown vs upcoming (derived from
 * departure), and is passed in so results are deterministic in tests.
 */
export function buildStats(flights: FlightWithAirports[], now: Date): Stats {
  const airports = new Map<string, AirportCount>();
  const countries = new Set<string>();
  const airlineCounts = new Map<string, number>();
  const yearCounts = new Map<number, number>();

  let flown = 0;
  let totalDistanceKm = 0;
  let totalDurationMinutes = 0;
  let longest: Stats['longest'] = null;

  const visit = (airport: FlightAirport): void => {
    const code = airportCode(airport);
    const existing = airports.get(airport.id);
    if (existing === undefined) {
      airports.set(airport.id, { code, name: airport.name, visits: 1 });
    } else {
      existing.visits += 1;
    }
    if (airport.country !== null) countries.add(airport.country);
  };

  for (const flight of flights) {
    visit(flight.origin);
    visit(flight.destination);

    if (Date.parse(flight.departure) <= now.getTime()) flown += 1;

    const year = new Date(flight.departure).getUTCFullYear();
    yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);

    if (flight.airline !== null) {
      airlineCounts.set(flight.airline, (airlineCounts.get(flight.airline) ?? 0) + 1);
    }

    const distance = distanceKm(
      flight.origin.latitude,
      flight.origin.longitude,
      flight.destination.latitude,
      flight.destination.longitude,
    );
    totalDistanceKm += distance;
    if (longest === null || distance > longest.distanceKm) {
      longest = {
        label: `${airportCode(flight.origin)} → ${airportCode(flight.destination)}`,
        distanceKm: distance,
      };
    }

    if (flight.arrival !== null) {
      const minutes = (Date.parse(flight.arrival) - Date.parse(flight.departure)) / 60_000;
      if (Number.isFinite(minutes) && minutes > 0) totalDurationMinutes += minutes;
    }
  }

  const topAirports = [...airports.values()].sort((a, b) => b.visits - a.visits).slice(0, TOP_N);
  const topAirlines = [...airlineCounts.entries()]
    .map(([airline, count]) => ({ airline, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_N);
  const perYear = [...yearCounts.entries()]
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => a.year - b.year);

  return {
    totalFlights: flights.length,
    flown,
    upcoming: flights.length - flown,
    uniqueAirports: airports.size,
    uniqueCountries: countries.size,
    totalDistanceKm: Math.round(totalDistanceKm),
    totalDurationMinutes: Math.round(totalDurationMinutes),
    topAirports,
    topAirlines,
    perYear,
    longest: longest === null ? null : { ...longest, distanceKm: Math.round(longest.distanceKm) },
  };
}
