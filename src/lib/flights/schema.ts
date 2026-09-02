import { z } from 'zod';

export const CABIN_CLASSES = ['economy', 'premium_economy', 'business', 'first'] as const;
export type CabinClass = (typeof CABIN_CLASSES)[number];

/** Local datetime as produced by `<input type="datetime-local">`. */
const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;

/** Trim a form field and treat blank as "not provided". */
const emptyToNull = z
  .string()
  .trim()
  .transform((value) => (value === '' ? null : value));

/**
 * Validates the add-flight form. Datetimes stay as local wall-clock strings
 * here; the server pairs them with the relevant airport timezone before
 * storing (see `toIsoWithOffset`).
 */
export const flightInputSchema = z
  .object({
    originId: z.string().min(1, 'Choose a departure airport'),
    destinationId: z.string().min(1, 'Choose an arrival airport'),
    departure: z.string().regex(LOCAL_DATETIME, 'Enter a departure date and time'),
    arrival: emptyToNull.pipe(
      z.string().regex(LOCAL_DATETIME, 'Enter a valid arrival time').nullable(),
    ),
    airline: emptyToNull,
    flightNumber: emptyToNull,
    aircraftType: emptyToNull,
    aircraftRegistration: emptyToNull,
    seat: emptyToNull,
    cabinClass: emptyToNull.pipe(z.enum(CABIN_CLASSES).nullable()),
    notes: emptyToNull,
  })
  .refine((flight) => flight.originId !== flight.destinationId, {
    message: 'Origin and destination must be different airports',
    path: ['destinationId'],
  });

export type FlightInput = z.infer<typeof flightInputSchema>;
