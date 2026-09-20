export const GLOBE_PERIODS = ['30d', '6mo', 'ytd', '1y', 'all'] as const;
export type GlobePeriod = (typeof GLOBE_PERIODS)[number];

export const DEFAULT_GLOBE_PERIOD: GlobePeriod = 'all';

export const GLOBE_PERIOD_LABELS: Record<GlobePeriod, string> = {
  '30d': 'Last 30 days',
  '6mo': 'Last 6 months',
  ytd: 'Year to date',
  '1y': 'Last year',
  all: 'All time',
};

/** Narrow an arbitrary string to a valid period, falling back to the default. */
export function parseGlobePeriod(value: string | null): GlobePeriod {
  return GLOBE_PERIODS.find((p) => p === value) ?? DEFAULT_GLOBE_PERIOD;
}

/**
 * The earliest departure instant included by a period, or null for "all time".
 * `now` is injected so the boundary is testable.
 */
export function periodCutoff(period: GlobePeriod, now: Date): Date | null {
  switch (period) {
    case 'all':
      return null;
    case 'ytd':
      return new Date(now.getFullYear(), 0, 1);
    case '30d': {
      const d = new Date(now);
      d.setDate(d.getDate() - 30);
      return d;
    }
    case '6mo': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 6);
      return d;
    }
    case '1y': {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return d;
    }
  }
}

/** Keep flights whose departure falls within the period. */
export function withinPeriod<T extends { departure: string }>(
  flights: T[],
  period: GlobePeriod,
  now: Date,
): T[] {
  const cutoff = periodCutoff(period, now);
  if (cutoff === null) return flights;
  const min = cutoff.getTime();
  return flights.filter((f) => new Date(f.departure).getTime() >= min);
}
