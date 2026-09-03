/** An airport rendered as a point on the globe. */
export interface GlobePoint {
  id: string;
  lat: number;
  lng: number;
  iata: string | null;
  name: string;
  /** How many logged legs touch this airport (as origin or destination). */
  visits: number;
}

/** A flown route rendered as a great-circle arc. */
export interface GlobeArc {
  fromId: string;
  toId: string;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  label: string;
}

export interface GlobeData {
  points: GlobePoint[];
  arcs: GlobeArc[];
}
