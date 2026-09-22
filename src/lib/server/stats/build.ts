import { distanceKm } from '../../geo.ts';
import type {
  AirportCount,
  CabinSection,
  PartOfDay,
  SeatPosition,
  SeatStats,
  Stats,
  TimeStats,
} from '../../stats/types.ts';
import type { FlightWithAirports } from '../flights/repository.ts';

type FlightAirport = FlightWithAirports['origin'];

const airportCode = (airport: FlightAirport): string =>
  airport.iata ?? airport.icao ?? airport.name;

const TOP_N = 5;

// Standard single-aisle 3-3 layout: A/F at the windows, C/D on the aisle. A
// heuristic — widebody rows differ — but a fun, good-enough read for most logs.
const SEAT_POSITION: Record<string, SeatPosition> = {
  A: 'window',
  B: 'middle',
  C: 'aisle',
  D: 'aisle',
  E: 'middle',
  F: 'window',
};

const SEAT_RE = /^(\d{1,2})\s*([A-K])$/i;

interface ParsedSeat {
  row: number;
  letter: string;
}

/** Pull a row number + seat letter out of a seat like "10A" (or "10 a"). */
export function parseSeat(seat: string): ParsedSeat | null {
  const match = SEAT_RE.exec(seat.trim());
  const row = match?.[1];
  const letter = match?.[2];
  if (row === undefined || letter === undefined) return null;
  return { row: Number(row), letter: letter.toUpperCase() };
}

// Thirds of a ~30-row single-aisle cabin. Rough by design — we don't know the
// actual aircraft size — but it captures a front/back leaning.
function sectionForRow(row: number): CabinSection {
  if (row <= 10) return 'front';
  if (row <= 20) return 'mid';
  return 'rear';
}

function partOfDay(hour: number): PartOfDay {
  if (hour >= 5 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 16) return 'afternoon';
  if (hour >= 17 && hour <= 20) return 'evening';
  return 'night';
}

/** Index of the largest count, scanning `order` so ties resolve predictably. */
function topKey<K extends string>(counts: Record<K, number>, order: readonly K[]): K | null {
  let best: K | null = null;
  for (const key of order) {
    if (best === null || counts[key] > counts[best]) best = key;
  }
  return best !== null && counts[best] > 0 ? best : null;
}

function buildSeatStats(seats: string[]): SeatStats {
  const position: Record<SeatPosition, number> = { window: 0, middle: 0, aisle: 0 };
  const section: Record<CabinSection, number> = { front: 0, mid: 0, rear: 0 };
  const exact = new Map<string, number>();
  let parsed = 0;

  for (const raw of seats) {
    const seat = parseSeat(raw);
    if (seat === null) continue;
    parsed += 1;
    section[sectionForRow(seat.row)] += 1;
    const pos = SEAT_POSITION[seat.letter];
    if (pos !== undefined) position[pos] += 1;
    const key = `${seat.row}${seat.letter}`;
    exact.set(key, (exact.get(key) ?? 0) + 1);
  }

  const favouriteSeat =
    [...exact.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;

  return {
    parsed,
    position,
    section,
    favouritePosition: topKey(position, ['window', 'aisle', 'middle']),
    favouriteSection: topKey(section, ['front', 'mid', 'rear']),
    favouriteSeat,
  };
}

// Weekday from the wall-clock date only, so the UTC offset never shifts the day.
function weekdayOf(departure: string): number {
  const parts = departure.slice(0, 10).split('-');
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  const day = Number(parts[2]);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

const WEEKDAY_PRIORITY = [1, 2, 3, 4, 5, 6, 0] as const; // Mon-first for tie-breaks

function buildTimeStats(departures: string[]): TimeStats {
  const byPartOfDay: Record<PartOfDay, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };
  const byWeekday = Array<number>(7).fill(0);

  for (const departure of departures) {
    const hour = Number(departure.slice(11, 13));
    if (Number.isFinite(hour)) byPartOfDay[partOfDay(hour)] += 1;
    const weekday = weekdayOf(departure);
    byWeekday[weekday] = (byWeekday[weekday] ?? 0) + 1;
  }

  let favouriteWeekday: number | null = null;
  for (const day of WEEKDAY_PRIORITY) {
    if (favouriteWeekday === null || (byWeekday[day] ?? 0) > (byWeekday[favouriteWeekday] ?? 0)) {
      favouriteWeekday = day;
    }
  }
  if (favouriteWeekday !== null && (byWeekday[favouriteWeekday] ?? 0) === 0)
    favouriteWeekday = null;

  return {
    byPartOfDay,
    favouritePartOfDay: topKey(byPartOfDay, ['morning', 'afternoon', 'evening', 'night']),
    byWeekday,
    favouriteWeekday,
  };
}

/**
 * Compute flight-log statistics. `now` decides flown vs upcoming (derived from
 * departure), and is passed in so results are deterministic in tests.
 */
export function buildStats(flights: FlightWithAirports[], now: Date): Stats {
  const airports = new Map<string, AirportCount>();
  const countries = new Set<string>();
  const airlineCounts = new Map<string, number>();
  const aircraftCounts = new Map<string, number>();
  const cabinCounts = new Map<string, number>();
  const yearCounts = new Map<number, number>();
  const seats: string[] = [];
  const departures: string[] = [];

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

    if (flight.aircraftType !== null && flight.aircraftType !== '') {
      aircraftCounts.set(flight.aircraftType, (aircraftCounts.get(flight.aircraftType) ?? 0) + 1);
    }

    if (flight.cabinClass !== null && flight.cabinClass !== '') {
      cabinCounts.set(flight.cabinClass, (cabinCounts.get(flight.cabinClass) ?? 0) + 1);
    }

    if (flight.seat !== null && flight.seat !== '') seats.push(flight.seat);
    departures.push(flight.departure);

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
  const topAircraft = [...aircraftCounts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_N);
  const cabins = [...cabinCounts.entries()]
    .map(([cabin, count]) => ({ cabin, count }))
    .sort((a, b) => b.count - a.count);
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
    topAircraft,
    cabins,
    seats: buildSeatStats(seats),
    time: buildTimeStats(departures),
    perYear,
    longest: longest === null ? null : { ...longest, distanceKm: Math.round(longest.distanceKm) },
  };
}
