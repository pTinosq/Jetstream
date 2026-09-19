<script lang="ts">
  import { enhance } from '$app/forms';
  import { resolve } from '$app/paths';
  import AirportSelect from '$lib/components/AirportSelect.svelte';
  import { formatWallClock } from '$lib/datetime';
  import { CABIN_CLASSES } from '$lib/flights/schema';
  import type { Airport } from '$lib/airports/types';
  import type { Aircraft } from '$lib/aircraft/types';
  import type { FlightCandidate } from '$lib/flights/candidate';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const errors = $derived(form !== null && 'errors' in form ? form.errors : undefined);
  const created = $derived(form !== null && 'created' in form);

  const cabinLabels: Record<(typeof CABIN_CLASSES)[number], string> = {
    economy: 'Economy',
    premium_economy: 'Premium economy',
    business: 'Business',
    first: 'First',
  };

  // Fields auto-detect can prefill are bound to state; the rest stay simple
  // uncontrolled inputs. (use:enhance keeps state across a failed submit.)
  let airline = $state('');
  let flightNumber = $state('');
  let departure = $state('');
  let arrival = $state('');
  let aircraftType = $state('');
  let aircraftRegistration = $state('');
  let aircraftPhoto = $state<string | null>(null);
  let aircraftLookup = $state<'idle' | 'loading' | 'done'>('idle');

  // Auto-detect search state.
  let origin = $state<Airport | null>(null);
  let destination = $state<Airport | null>(null);
  // Default to today; auto-detect only covers recent flights anyway.
  let searchDate = $state(new Date().toISOString().slice(0, 10));
  let searching = $state(false);
  let searched = $state(false);
  let providerConfigured = $state(true);
  let searchError = $state<string | null>(null);
  let candidates = $state<FlightCandidate[]>([]);
  let airlineFilter = $state('');

  const canSearch = $derived(origin !== null && destination !== null && searchDate !== '');

  const airlineOptions = $derived(
    [...new Set(candidates.map((c) => c.airline).filter((a): a is string => a !== null))].sort(),
  );
  const visibleCandidates = $derived(
    airlineFilter === '' ? candidates : candidates.filter((c) => c.airline === airlineFilter),
  );

  function routeCode(iata: string | null, icao: string | null): string {
    return iata ?? icao ?? '???';
  }

  function toLocalInput(iso: string): string {
    return iso.slice(0, 16); // "YYYY-MM-DDTHH:mm" for datetime-local
  }

  function candidateLabel(candidate: FlightCandidate): string {
    if (candidate.airline !== null && candidate.flightNumber !== null) {
      return `${candidate.airline} ${candidate.flightNumber}`;
    }
    return candidate.callsign ?? 'Unknown flight';
  }

  function candidateTime(iso: string): string {
    return iso.slice(11, 16); // "HH:mm"
  }

  async function findFlights(): Promise<void> {
    if (origin === null || destination === null || searchDate === '') return;
    searching = true;
    searched = true;
    searchError = null;
    airlineFilter = '';
    try {
      const params = new URLSearchParams({ from: origin.id, to: destination.id, date: searchDate });
      const response = await fetch(`/api/flight-search?${params.toString()}`);
      const payload = (await response.json()) as {
        provider: string | null;
        candidates: FlightCandidate[];
        error?: string;
      };
      providerConfigured = payload.provider !== null;
      candidates = payload.candidates;
      if (payload.error !== undefined) searchError = payload.error;
      else if (!response.ok) searchError = 'Flight lookup failed';
    } catch {
      searchError = 'Could not reach the flight lookup service';
    } finally {
      searching = false;
    }
  }

  function choose(candidate: FlightCandidate): void {
    airline = candidate.airline ?? '';
    flightNumber = candidate.flightNumber ?? '';
    departure = toLocalInput(candidate.departure);
    arrival = candidate.arrival !== null ? toLocalInput(candidate.arrival) : '';
    aircraftType = '';
    aircraftRegistration = '';
    aircraftPhoto = null;
    aircraftLookup = 'idle';
    if (candidate.icao24 !== null) void enrichAircraft(candidate.icao24);
  }

  // Resolve the specific airframe (registration, type, photo) from its icao24.
  async function enrichAircraft(icao24: string): Promise<void> {
    aircraftLookup = 'loading';
    try {
      const response = await fetch(`/api/aircraft?icao24=${encodeURIComponent(icao24)}`);
      const payload = (await response.json()) as { aircraft: Aircraft | null };
      const aircraft = payload.aircraft;
      if (aircraft !== null) {
        aircraftType = aircraft.type ?? aircraft.typeCode ?? '';
        aircraftRegistration = aircraft.registration ?? '';
        aircraftPhoto = aircraft.photoUrl;
      }
    } catch {
      // Enrichment is best-effort; leave the fields for manual entry.
    } finally {
      aircraftLookup = 'done';
    }
  }
</script>

<div class="enter mx-auto max-w-5xl px-4 py-10 sm:px-6">
  <header class="mb-8">
    <h1 class="text-3xl font-semibold">Flights</h1>
    <p class="mt-1 text-ink-soft">Log the flights you've taken and plan to take.</p>
  </header>

  <section class="glass mb-10 rounded-panel p-6 sm:p-7">
    <h2 class="mb-5 text-lg font-medium">Add a flight</h2>

    {#if created}
      <p
        class="mb-5 rounded-control border border-emerald-600/15 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700"
      >
        Flight added.
      </p>
    {/if}

    <form method="POST" action="?/create" use:enhance class="flex flex-col gap-6">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AirportSelect
          name="originId"
          label="From"
          error={errors?.originId?.[0]}
          onSelect={(airport: Airport | null) => {
            origin = airport;
          }}
        />
        <AirportSelect
          name="destinationId"
          label="To"
          error={errors?.destinationId?.[0]}
          onSelect={(airport: Airport | null) => {
            destination = airport;
          }}
        />
      </div>

      <!-- Auto-detect: find real flights for the route + date and prefill. -->
      <div class="rounded-panel border border-line bg-white/45 p-4">
        <div class="flex flex-wrap items-end gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-ink-soft" for="searchDate">Flight date</label>
            <input id="searchDate" type="date" bind:value={searchDate} class="field font-mono" />
          </div>
          <button
            type="button"
            onclick={findFlights}
            disabled={!canSearch || searching}
            class="btn btn-ghost disabled:cursor-not-allowed disabled:opacity-50"
          >
            {searching ? 'Searching…' : 'Find flights'}
          </button>
          <p class="max-w-xs text-xs leading-relaxed text-ink-mute">
            Pick From, To and a date to look up flights. Works best for recent flights (roughly the
            last few weeks).
          </p>
        </div>

        {#if searched && !searching}
          {#if !providerConfigured}
            <p class="mt-3 text-sm text-amber-700">
              Auto-detect isn't configured. Add your OpenSky keys in
              <a class="font-medium text-accent hover:underline" href={resolve('/settings')}
                >Settings</a
              >, or fill in the details below manually.
            </p>
          {:else if searchError !== null}
            <p class="mt-3 text-sm text-rose-600">{searchError}</p>
          {:else if candidates.length === 0}
            <p class="mt-3 text-sm text-ink-mute">No flights found for that route and date.</p>
          {:else}
            <div class="mt-4 flex items-center gap-2">
              <label class="text-sm text-ink-soft" for="airlineFilter">Airline</label>
              <select
                id="airlineFilter"
                bind:value={airlineFilter}
                class="field w-auto py-1.5 font-mono text-sm"
              >
                <option value="">All</option>
                {#each airlineOptions as code (code)}
                  <option value={code}>{code}</option>
                {/each}
              </select>
            </div>
            <ul
              class="mt-3 max-h-64 divide-y divide-line overflow-auto rounded-control border border-line bg-white/55"
            >
              {#each visibleCandidates as candidate (candidate.callsign ?? candidate.departure)}
                <li>
                  <button
                    type="button"
                    onclick={() => choose(candidate)}
                    class="flex w-full items-center justify-between px-3.5 py-2.5 text-left transition-colors hover:bg-accent-wash"
                  >
                    <span class="font-mono text-sm font-medium">{candidateLabel(candidate)}</span>
                    <span class="font-mono text-xs text-ink-mute">
                      {candidateTime(candidate.departure)}{#if candidate.arrival !== null}&nbsp;→
                        {candidateTime(candidate.arrival)}{/if}
                    </span>
                  </button>
                </li>
              {/each}
            </ul>
          {/if}
        {/if}
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-ink-soft" for="departure">Departure</label>
          <input
            id="departure"
            name="departure"
            type="datetime-local"
            bind:value={departure}
            class="field font-mono"
          />
          {#if errors?.departure?.[0] !== undefined}
            <p class="text-sm text-rose-600">{errors.departure[0]}</p>
          {/if}
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-ink-soft" for="arrival">Arrival (optional)</label>
          <input
            id="arrival"
            name="arrival"
            type="datetime-local"
            bind:value={arrival}
            class="field font-mono"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-ink-soft" for="airline">Airline</label>
          <input
            id="airline"
            name="airline"
            type="text"
            bind:value={airline}
            placeholder="e.g. BA"
            class="field"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-ink-soft" for="flightNumber">Flight number</label>
          <input
            id="flightNumber"
            name="flightNumber"
            type="text"
            bind:value={flightNumber}
            placeholder="e.g. 117"
            class="field font-mono"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-ink-soft" for="aircraftType">
            Aircraft type
            {#if aircraftLookup === 'loading'}<span class="text-xs text-ink-mute"
                >· looking up…</span
              >{/if}
          </label>
          <input
            id="aircraftType"
            name="aircraftType"
            type="text"
            bind:value={aircraftType}
            placeholder="e.g. A380"
            class="field"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-ink-soft" for="aircraftRegistration"
            >Registration</label
          >
          <input
            id="aircraftRegistration"
            name="aircraftRegistration"
            type="text"
            bind:value={aircraftRegistration}
            placeholder="e.g. G-XLEB"
            class="field font-mono"
          />
        </div>

        {#if aircraftPhoto !== null}
          <div class="sm:col-span-2">
            <img
              src={aircraftPhoto}
              alt="{aircraftRegistration} aircraft"
              class="h-44 w-full rounded-control border border-line object-cover"
            />
          </div>
        {/if}

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-ink-soft" for="seat">Seat</label>
          <input id="seat" name="seat" type="text" placeholder="e.g. 12A" class="field font-mono" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-ink-soft" for="cabinClass">Cabin</label>
          <select id="cabinClass" name="cabinClass" class="field">
            <option value="">Not set</option>
            {#each CABIN_CLASSES as cabin (cabin)}
              <option value={cabin}>{cabinLabels[cabin]}</option>
            {/each}
          </select>
        </div>

        <div class="flex flex-col gap-1.5 sm:col-span-2">
          <label class="text-sm font-medium text-ink-soft" for="notes">Notes</label>
          <textarea id="notes" name="notes" rows="2" class="field"></textarea>
        </div>
      </div>

      <div>
        <button type="submit" class="btn btn-primary">Add flight</button>
      </div>
    </form>
  </section>

  <section>
    <h2 class="mb-4 text-lg font-medium">
      Flights <span class="font-mono text-base text-ink-mute">({data.flights.length})</span>
    </h2>

    {#if data.flights.length === 0}
      <div class="glass rounded-panel p-8 text-center text-sm text-ink-soft">
        No flights logged yet. Add your first one above.
      </div>
    {:else}
      <div class="glass overflow-hidden rounded-panel">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead>
              <tr class="border-b border-line text-xs tracking-wide text-ink-mute uppercase">
                <th class="px-5 py-3 font-medium">Departure</th>
                <th class="px-5 py-3 font-medium">Route</th>
                <th class="px-5 py-3 font-medium">Flight</th>
                <th class="px-5 py-3 font-medium">Aircraft</th>
                <th class="px-5 py-3 font-medium">Seat</th>
              </tr>
            </thead>
            <tbody>
              {#each data.flights as flight (flight.id)}
                <tr class="border-t border-line/70 transition-colors hover:bg-white/55">
                  <td class="px-5 py-3 font-mono whitespace-nowrap text-ink-soft">
                    {formatWallClock(flight.departure)}
                  </td>
                  <td class="px-5 py-3 font-mono font-medium whitespace-nowrap">
                    {routeCode(flight.origin.iata, flight.origin.icao)}
                    <span class="text-ink-mute">→</span>
                    {routeCode(flight.destination.iata, flight.destination.icao)}
                  </td>
                  <td class="px-5 py-3 font-mono text-ink-soft">
                    {[flight.airline, flight.flightNumber].filter(Boolean).join(' ') || '—'}
                  </td>
                  <td class="px-5 py-3 text-ink-soft">{flight.aircraftType ?? '—'}</td>
                  <td class="px-5 py-3 font-mono text-ink-soft">{flight.seat ?? '—'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </section>
</div>
