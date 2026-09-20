<script lang="ts">
  import { enhance } from '$app/forms';
  import type { SubmitFunction } from '@sveltejs/kit';
  import { resolve } from '$app/paths';
  import { toast } from '$lib/toast';
  import AirportSelect from '$lib/components/AirportSelect.svelte';
  import AircraftTypeSelect from '$lib/components/AircraftTypeSelect.svelte';
  import { formatWallClock } from '$lib/datetime';
  import { CABIN_CLASSES } from '$lib/flights/schema';
  import type { Airport } from '$lib/airports/types';
  import type { Aircraft } from '$lib/aircraft/types';
  import type { FlightCandidate } from '$lib/flights/candidate';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const errors = $derived(form !== null && 'errors' in form ? form.errors : undefined);

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
  let seat = $state('');
  let cabinClass = $state('');
  let notes = $state('');

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

  // AirportSelect instances, so the assistant can set From/To programmatically.
  // Typed by the exported API we call (bind:this accepts the instance).
  type AirportSetter = { setSelected: (airport: Airport | null) => void };
  let fromSelect = $state<AirportSetter>();
  let toSelect = $state<AirportSetter>();

  // AI assistant (paste free text / an email → prefilled draft).
  interface AssistantDraft {
    origin: Airport | null;
    destination: Airport | null;
    airline: string | null;
    flightNumber: string | null;
    departureLocal: string | null;
    arrivalLocal: string | null;
    aircraftType: string | null;
    registration: string | null;
    photoUrl: string | null;
    seat: string | null;
    cabin: (typeof CABIN_CLASSES)[number] | null;
    notes: string | null;
    matchedFlight: boolean;
  }
  type AssistantResponse =
    | { status: 'draft'; draft: AssistantDraft }
    | { status: 'question'; message: string }
    | { status: 'error'; error: string };

  let aiText = $state('');
  let aiBusy = $state(false);
  let aiError = $state<string | null>(null);
  let aiMessage = $state<string | null>(null);
  // null = no result yet; true = grounded on a tracked flight; false = from text.
  let aiMatched = $state<boolean | null>(null);

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

  function applyDraft(draft: AssistantDraft): void {
    fromSelect?.setSelected(draft.origin);
    toSelect?.setSelected(draft.destination);
    airline = draft.airline ?? '';
    flightNumber = draft.flightNumber ?? '';
    departure = draft.departureLocal ?? '';
    arrival = draft.arrivalLocal ?? '';
    aircraftType = draft.aircraftType ?? '';
    aircraftRegistration = draft.registration ?? '';
    aircraftPhoto = draft.photoUrl;
    aircraftLookup = draft.aircraftType !== null ? 'done' : 'idle';
    seat = draft.seat ?? '';
    cabinClass = draft.cabin ?? '';
    notes = draft.notes ?? '';
    aiMatched = draft.matchedFlight;
    if (draft.departureLocal !== null) searchDate = draft.departureLocal.slice(0, 10);
  }

  // Enter submits (like a chat box); Shift+Enter inserts a newline. Pasting is
  // unaffected — it never fires an Enter keydown.
  function onAiKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void runAssistant();
    }
  }

  async function runAssistant(): Promise<void> {
    if (aiText.trim() === '' || aiBusy) return;
    aiBusy = true;
    aiError = null;
    aiMessage = null;
    aiMatched = null;
    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: aiText }),
      });
      const payload = (await response.json()) as AssistantResponse;
      if (payload.status === 'draft') applyDraft(payload.draft);
      else if (payload.status === 'question') aiMessage = payload.message;
      else aiError = payload.error;
    } catch {
      aiError = 'Could not reach the assistant.';
    } finally {
      aiBusy = false;
    }
  }

  // Clear the whole add-flight form after a successful save; bound $state isn't
  // reset by the native form reset, so the aircraft photo etc. would linger.
  function resetForm(): void {
    fromSelect?.setSelected(null);
    toSelect?.setSelected(null);
    origin = null;
    destination = null;
    airline = '';
    flightNumber = '';
    departure = '';
    arrival = '';
    aircraftType = '';
    aircraftRegistration = '';
    aircraftPhoto = null;
    aircraftLookup = 'idle';
    seat = '';
    cabinClass = '';
    notes = '';
    candidates = [];
    searched = false;
    searchError = null;
    airlineFilter = '';
    aiText = '';
    aiError = null;
    aiMessage = null;
    aiMatched = null;
  }

  const submitFlight: SubmitFunction = () => {
    return async ({ result, update }) => {
      await update();
      if (result.type === 'success') {
        resetForm();
        toast('Flight added');
      }
    };
  };

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
  <section class="glass mb-10 rounded-panel p-6 sm:p-7">
    <h2 class="mb-5 text-lg font-medium">Add a flight</h2>

    <!-- AI assistant: paste a sentence or a booking email → prefilled draft. -->
    <div class="mb-6 rounded-panel border border-line bg-white/45 p-4">
      <label class="text-sm font-medium text-ink-soft" for="aiText"
        >Describe or paste a flight</label
      >
      <p class="mt-1 mb-2.5 text-xs leading-relaxed text-ink-mute">
        e.g. “Finnair flight on the 18th of Sept 26, landed Helsinki 12:00 local” — or paste a
        booking confirmation email. Press <kbd class="font-mono">Enter</kbd> to fill,
        <kbd class="font-mono">Shift</kbd>+<kbd class="font-mono">Enter</kbd> for a new line.
      </p>
      <textarea
        id="aiText"
        bind:value={aiText}
        onkeydown={onAiKeydown}
        rows="3"
        placeholder="Type the flight details, or paste an email…"
        class="field"></textarea>
      <div class="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onclick={runAssistant}
          disabled={aiText.trim() === '' || aiBusy}
          class="btn btn-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {aiBusy ? 'Reading…' : 'Fill from text'}
        </button>
        {#if aiMatched === true}
          <span
            class="rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-medium text-emerald-700"
          >
            ✓ Matched to a tracked flight
          </span>
        {:else if aiMatched === false}
          <span class="rounded-full bg-amber-500/12 px-2.5 py-1 text-xs font-medium text-amber-800">
            From your text — not verified against tracking
          </span>
        {/if}
        {#if aiMessage !== null}
          <p class="text-sm text-amber-700">{aiMessage}</p>
        {/if}
        {#if aiError !== null}
          <p class="text-sm text-rose-600">{aiError}</p>
        {/if}
      </div>
    </div>

    <form method="POST" action="?/create" use:enhance={submitFlight} class="flex flex-col gap-6">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AirportSelect
          bind:this={fromSelect}
          name="originId"
          label="From"
          error={errors?.originId?.[0]}
          onSelect={(airport: Airport | null) => {
            origin = airport;
          }}
        />
        <AirportSelect
          bind:this={toSelect}
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
          <AircraftTypeSelect
            id="aircraftType"
            name="aircraftType"
            bind:value={aircraftType}
            suggestions={data.aircraftTypes}
            placeholder="e.g. Airbus A320neo"
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
          <input
            id="seat"
            name="seat"
            type="text"
            bind:value={seat}
            placeholder="e.g. 12A"
            class="field font-mono"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-ink-soft" for="cabinClass">Cabin</label>
          <select id="cabinClass" name="cabinClass" bind:value={cabinClass} class="field">
            <option value="">Not set</option>
            {#each CABIN_CLASSES as cabin (cabin)}
              <option value={cabin}>{cabinLabels[cabin]}</option>
            {/each}
          </select>
        </div>

        <div class="flex flex-col gap-1.5 sm:col-span-2">
          <label class="text-sm font-medium text-ink-soft" for="notes">Notes</label>
          <textarea id="notes" name="notes" rows="2" bind:value={notes} class="field"></textarea>
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
                <th class="px-5 py-3"><span class="sr-only">Edit</span></th>
              </tr>
            </thead>
            <tbody>
              {#each data.flights as flight (flight.id)}
                <tr class="group border-t border-line/70 transition-colors hover:bg-white/55">
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
                  <td class="px-5 py-3 text-right">
                    <a
                      href={resolve('/flights/[id]', { id: flight.id })}
                      aria-label="Edit flight"
                      class="inline-flex text-ink-mute opacity-0 transition group-hover:opacity-100 hover:text-accent focus-visible:opacity-100"
                    >
                      <svg
                        class="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        aria-hidden="true"
                      >
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                      </svg>
                    </a>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    {/if}
  </section>
</div>
