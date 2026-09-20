<script lang="ts">
  import { untrack } from 'svelte';
  import { enhance } from '$app/forms';
  import { resolve } from '$app/paths';
  import AirportSelect from '$lib/components/AirportSelect.svelte';
  import { CABIN_CLASSES } from '$lib/flights/schema';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const errors = $derived(form !== null && 'errors' in form ? form.errors : undefined);

  const cabinLabels: Record<(typeof CABIN_CLASSES)[number], string> = {
    economy: 'Economy',
    premium_economy: 'Premium economy',
    business: 'Business',
    first: 'First',
  };

  // Seed the form once from the loaded flight (an edit page loads a fresh copy).
  const f = untrack(() => data.flight);
  const toLocalInput = (iso: string): string => iso.slice(0, 16); // "YYYY-MM-DDTHH:mm"

  let departure = $state(toLocalInput(f.departure));
  let arrival = $state(f.arrival !== null ? toLocalInput(f.arrival) : '');
  let airline = $state(f.airline ?? '');
  let flightNumber = $state(f.flightNumber ?? '');
  let aircraftType = $state(f.aircraftType ?? '');
  let aircraftRegistration = $state(f.aircraftRegistration ?? '');
  let seat = $state(f.seat ?? '');
  let cabinClass = $state(f.cabinClass ?? '');
  let notes = $state(f.notes ?? '');

  function confirmDelete(event: Event): void {
    if (!confirm('Delete this flight? This cannot be undone.')) event.preventDefault();
  }
</script>

<div class="enter mx-auto max-w-3xl px-4 py-10 sm:px-6">
  <a href={resolve('/')} class="text-sm text-ink-soft transition-colors hover:text-ink">
    ← Back to flights
  </a>

  <section class="glass mt-4 rounded-panel p-6 sm:p-7">
    <h2 class="mb-5 text-lg font-medium">Edit flight</h2>

    <form method="POST" action="?/update" use:enhance class="flex flex-col gap-6">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AirportSelect
          name="originId"
          label="From"
          initial={data.flight.origin}
          error={errors?.originId?.[0]}
        />
        <AirportSelect
          name="destinationId"
          label="To"
          initial={data.flight.destination}
          error={errors?.destinationId?.[0]}
        />
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
          <input id="airline" name="airline" type="text" bind:value={airline} class="field" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-ink-soft" for="flightNumber">Flight number</label>
          <input
            id="flightNumber"
            name="flightNumber"
            type="text"
            bind:value={flightNumber}
            class="field font-mono"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-ink-soft" for="aircraftType">Aircraft type</label>
          <input
            id="aircraftType"
            name="aircraftType"
            type="text"
            bind:value={aircraftType}
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
            class="field font-mono"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-ink-soft" for="seat">Seat</label>
          <input id="seat" name="seat" type="text" bind:value={seat} class="field font-mono" />
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

      <div class="flex items-center gap-3">
        <button type="submit" class="btn btn-primary">Save changes</button>
        <a href={resolve('/')} class="btn btn-ghost">Cancel</a>
      </div>
    </form>
  </section>

  <form method="POST" action="?/delete" onsubmit={confirmDelete} class="mt-4">
    <button type="submit" class="text-sm text-rose-600 transition-colors hover:text-rose-700">
      Delete flight
    </button>
  </form>
</div>
