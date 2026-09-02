/**
 * Minutes that `timeZone` is ahead of UTC at the given instant (DST-aware).
 * Works by formatting the instant as wall-clock time in the zone and comparing
 * that back to UTC.
 */
function offsetMinutes(timeZone: string, instant: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(instant);

  const field = (type: Intl.DateTimeFormatPartTypes): number => {
    const value = parts.find((p) => p.type === type)?.value;
    if (value === undefined) throw new Error(`Missing "${type}" while resolving timezone offset`);
    return Number(value);
  };

  const asUtc = Date.UTC(
    field('year'),
    field('month') - 1,
    field('day'),
    field('hour'),
    field('minute'),
    field('second'),
  );
  return Math.round((asUtc - instant.getTime()) / 60_000);
}

function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${sign}${hh}:${mm}`;
}

const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;

/**
 * Convert a local wall-clock datetime (as produced by an
 * `<input type="datetime-local">`, e.g. "2026-03-01T09:00") in a given IANA
 * timezone into a full ISO 8601 string carrying that zone's UTC offset at that
 * moment, e.g. "2026-03-01T09:00:00+00:00".
 */
export function toIsoWithOffset(local: string, timeZone: string): string {
  if (!LOCAL_DATETIME.test(local)) {
    throw new Error(`Expected a local datetime like "YYYY-MM-DDTHH:mm", got "${local}"`);
  }
  const withSeconds = local.length === 16 ? `${local}:00` : local;
  // Interpret the wall-clock as if it were UTC to probe the zone's offset near
  // that time; the offset then defines the real instant.
  const probe = new Date(`${withSeconds}Z`);
  return `${withSeconds}${formatOffset(offsetMinutes(timeZone, probe))}`;
}

/**
 * Render a stored ISO-with-offset string as "YYYY-MM-DD HH:mm", preserving the
 * airport-local wall-clock time rather than converting to the viewer's zone.
 */
export function formatWallClock(iso: string): string {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(iso);
  if (match === null) return iso;
  const [, date, time] = match;
  if (date === undefined || time === undefined) return iso;
  return `${date} ${time}`;
}
