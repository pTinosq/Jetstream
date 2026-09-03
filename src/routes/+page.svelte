<script lang="ts">
  import { enhance } from '$app/forms';
  import AirportSelect from '$lib/components/AirportSelect.svelte';
  import { formatWallClock } from '$lib/datetime';
  import { CABIN_CLASSES } from '$lib/flights/schema';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const errors = $derived(form !== null && 'errors' in form ? form.errors : undefined);
  const values = $derived(form !== null && 'values' in form ? form.values : undefined);
  const created = $derived(form !== null && 'created' in form);

  const cabinLabels: Record<(typeof CABIN_CLASSES)[number], string> = {
    economy: 'Economy',
    premium_economy: 'Premium economy',
    business: 'Business',
    first: 'First',
  };

  function routeCode(iata: string | null, icao: string | null): string {
    return iata ?? icao ?? '???';
  }
</script>

<div class="mx-auto max-w-5xl px-6 py-10 text-slate-100">
  <header class="mb-8">
    <h1 class="text-2xl font-semibold">Flights</h1>
    <p class="text-slate-400">Log the flights you've taken and plan to take.</p>
  </header>

  <section class="mb-10 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
    <h2 class="mb-4 text-lg font-medium">Add a flight</h2>

    {#if created}
      <p class="mb-4 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
        Flight added.
      </p>
    {/if}

    <form method="POST" action="?/create" use:enhance class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <AirportSelect name="originId" label="From" error={errors?.originId?.[0]} />
      <AirportSelect name="destinationId" label="To" error={errors?.destinationId?.[0]} />

      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-slate-200" for="departure">Departure</label>
        <input
          id="departure"
          name="departure"
          type="datetime-local"
          value={values?.departure ?? ''}
          class="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-sky-500"
        />
        {#if errors?.departure?.[0] !== undefined}
          <p class="text-sm text-rose-400">{errors.departure[0]}</p>
        {/if}
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-slate-200" for="arrival">Arrival (optional)</label>
        <input
          id="arrival"
          name="arrival"
          type="datetime-local"
          value={values?.arrival ?? ''}
          class="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-sky-500"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-slate-200" for="airline">Airline</label>
        <input
          id="airline"
          name="airline"
          type="text"
          value={values?.airline ?? ''}
          placeholder="e.g. BA"
          class="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-sky-500"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-slate-200" for="flightNumber">Flight number</label>
        <input
          id="flightNumber"
          name="flightNumber"
          type="text"
          value={values?.flightNumber ?? ''}
          placeholder="e.g. 007"
          class="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-sky-500"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-slate-200" for="aircraftType">Aircraft type</label>
        <input
          id="aircraftType"
          name="aircraftType"
          type="text"
          value={values?.aircraftType ?? ''}
          placeholder="e.g. A380"
          class="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-sky-500"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-slate-200" for="aircraftRegistration">
          Registration
        </label>
        <input
          id="aircraftRegistration"
          name="aircraftRegistration"
          type="text"
          value={values?.aircraftRegistration ?? ''}
          placeholder="e.g. G-XLEB"
          class="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-sky-500"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-slate-200" for="seat">Seat</label>
        <input
          id="seat"
          name="seat"
          type="text"
          value={values?.seat ?? ''}
          placeholder="e.g. 12A"
          class="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-sky-500"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-slate-200" for="cabinClass">Cabin</label>
        <select
          id="cabinClass"
          name="cabinClass"
          class="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-sky-500"
        >
          <option value="">—</option>
          {#each CABIN_CLASSES as cabin (cabin)}
            <option value={cabin}>{cabinLabels[cabin]}</option>
          {/each}
        </select>
      </div>

      <div class="flex flex-col gap-1 sm:col-span-2">
        <label class="text-sm font-medium text-slate-200" for="notes">Notes</label>
        <textarea
          id="notes"
          name="notes"
          rows="2"
          class="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-sky-500"
          >{values?.notes ?? ''}</textarea
        >
      </div>

      <div class="sm:col-span-2">
        <button
          type="submit"
          class="rounded-md bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500"
        >
          Add flight
        </button>
      </div>
    </form>
  </section>

  <section>
    <h2 class="mb-4 text-lg font-medium">Flights ({data.flights.length})</h2>

    {#if data.flights.length === 0}
      <p class="text-slate-400">No flights logged yet. Add your first one above.</p>
    {:else}
      <div class="overflow-x-auto rounded-xl border border-slate-800">
        <table class="w-full text-left text-sm">
          <thead class="bg-slate-900/70 text-slate-300">
            <tr>
              <th class="px-4 py-3 font-medium">Departure</th>
              <th class="px-4 py-3 font-medium">Route</th>
              <th class="px-4 py-3 font-medium">Flight</th>
              <th class="px-4 py-3 font-medium">Aircraft</th>
              <th class="px-4 py-3 font-medium">Seat</th>
            </tr>
          </thead>
          <tbody>
            {#each data.flights as flight (flight.id)}
              <tr class="border-t border-slate-800">
                <td class="px-4 py-3 text-slate-300">{formatWallClock(flight.departure)}</td>
                <td class="px-4 py-3 font-medium">
                  {routeCode(flight.origin.iata, flight.origin.icao)}
                  <span class="text-slate-500">→</span>
                  {routeCode(flight.destination.iata, flight.destination.icao)}
                </td>
                <td class="px-4 py-3 text-slate-300">
                  {[flight.airline, flight.flightNumber].filter(Boolean).join(' ') || '—'}
                </td>
                <td class="px-4 py-3 text-slate-300">{flight.aircraftType ?? '—'}</td>
                <td class="px-4 py-3 text-slate-300">{flight.seat ?? '—'}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </section>
</div>
