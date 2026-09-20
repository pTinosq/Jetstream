import type { GlobeArc, GlobeData, GlobePoint } from './types.ts';

/** The airport fields the globe needs (a subset of a stored airport). */
export interface GlobeAirport {
  id: string;
  latitude: number;
  longitude: number;
  iata: string | null;
  icao: string | null;
  name: string;
}

/** A flown leg the globe can render. */
export interface GlobeLeg {
  origin: GlobeAirport;
  destination: GlobeAirport;
}

function code(airport: GlobeAirport): string {
  return airport.iata ?? airport.icao ?? airport.name;
}

/**
 * Reduce logged legs to what the globe renders: a deduplicated set of airports
 * (with visit counts) as points, and one arc per leg. Pure, so it runs on the
 * client for instant period-filtering.
 */
export function buildGlobeData(legs: GlobeLeg[]): GlobeData {
  const points = new Map<string, GlobePoint>();

  const visit = (airport: GlobeAirport): void => {
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

  const arcs: GlobeArc[] = legs.map((leg) => {
    visit(leg.origin);
    visit(leg.destination);
    return {
      fromId: leg.origin.id,
      toId: leg.destination.id,
      startLat: leg.origin.latitude,
      startLng: leg.origin.longitude,
      endLat: leg.destination.latitude,
      endLng: leg.destination.longitude,
      label: `${code(leg.origin)} → ${code(leg.destination)}`,
    };
  });

  return { points: [...points.values()], arcs };
}
