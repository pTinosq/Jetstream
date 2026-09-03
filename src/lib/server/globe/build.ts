import type { GlobeArc, GlobeData, GlobePoint } from '../../globe/types.ts';
import type { FlightWithAirports } from '../flights/repository.ts';

type FlightAirport = FlightWithAirports['origin'];

function code(airport: FlightAirport): string {
  return airport.iata ?? airport.icao ?? airport.name;
}

/**
 * Reduce logged flights to what the globe renders: a deduplicated set of
 * airports (with visit counts) as points, and one arc per leg.
 */
export function buildGlobeData(flights: FlightWithAirports[]): GlobeData {
  const points = new Map<string, GlobePoint>();

  const visit = (airport: FlightAirport): void => {
    const existing = points.get(airport.id);
    if (existing === undefined) {
      points.set(airport.id, {
        id: airport.id,
        lat: airport.latitude,
        lng: airport.longitude,
        iata: airport.iata,
        name: airport.name,
        visits: 1,
      });
    } else {
      existing.visits += 1;
    }
  };

  const arcs: GlobeArc[] = flights.map((flight) => {
    visit(flight.origin);
    visit(flight.destination);
    return {
      fromId: flight.origin.id,
      toId: flight.destination.id,
      startLat: flight.origin.latitude,
      startLng: flight.origin.longitude,
      endLat: flight.destination.latitude,
      endLng: flight.destination.longitude,
      label: `${code(flight.origin)} → ${code(flight.destination)}`,
    };
  });

  return { points: [...points.values()], arcs };
}
