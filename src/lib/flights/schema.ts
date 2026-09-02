import { z } from 'zod';

export const CABIN_CLASSES = ['economy', 'premium_economy', 'business', 'first'] as const;
export type CabinClass = (typeof CABIN_CLASSES)[number];

/** Local datetime as produced by `<input type="datetime-local">`. */
const LOCAL_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/;

/** Trim a form field, treating blank or missing as "not provided" (null). */
const optionalText = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() !== '' ? value.trim() : null),
  z.string().nullable(),
);

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
    arrival: optionalText.pipe(
      z.string().regex(LOCAL_DATETIME, 'Enter a valid arrival time').nullable(),
    ),
    airline: optionalText,
    flightNumber: optionalText,
    aircraftType: optionalText,
    aircraftRegistration: optionalText,
    seat: optionalText,
    cabinClass: optionalText.pipe(z.enum(CABIN_CLASSES).nullable()),
    notes: optionalText,
  })
  .refine((flight) => flight.originId !== flight.destinationId, {
    message: 'Origin and destination must be different airports',
    path: ['destinationId'],
  });

export type FlightInput = z.infer<typeof flightInputSchema>;
