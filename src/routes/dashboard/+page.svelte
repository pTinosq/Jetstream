<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  const stats = $derived(data.stats);

  function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours.toLocaleString()}h ${mins}m`;
  }

  const cells = $derived([
    { label: 'Flights', value: stats.totalFlights.toLocaleString() },
    { label: 'Distance', value: `${stats.totalDistanceKm.toLocaleString()} km` },
    { label: 'Time in the air', value: formatDuration(stats.totalDurationMinutes) },
    { label: 'Airports', value: stats.uniqueAirports.toLocaleString() },
    { label: 'Countries', value: stats.uniqueCountries.toLocaleString() },
    { label: 'Upcoming', value: stats.upcoming.toLocaleString() },
  ]);

  const maxYear = $derived(Math.max(1, ...stats.perYear.map((y) => y.count)));
  const maxAirport = $derived(Math.max(1, ...stats.topAirports.map((a) => a.visits)));
  const maxAirline = $derived(Math.max(1, ...stats.topAirlines.map((a) => a.count)));
</script>

<div class="enter mx-auto max-w-5xl px-4 py-10 sm:px-6">
  <header class="mb-8">
    <h1 class="text-3xl font-semibold">Dashboard</h1>
    <p class="mt-1 text-ink-soft">Your flying, by the numbers.</p>
  </header>

  {#if stats.totalFlights === 0}
    <div class="glass rounded-panel p-8 text-center text-sm text-ink-soft">
      No flights logged yet. Add some on the Flights page.
    </div>
  {:else}
    <!-- Instrument readout: one panel, hairline-divided cells. -->
    <div class="glass overflow-hidden rounded-panel">
      <div class="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-6">
        {#each cells as cell (cell.label)}
          <div class="bg-white/45 p-5">
            <div class="text-xs tracking-wide text-ink-mute uppercase">{cell.label}</div>
            <div class="mt-1.5 truncate font-mono text-xl font-medium">{cell.value}</div>
          </div>
        {/each}
      </div>
    </div>

    {#if stats.longest !== null}
      <div
        class="glass mt-4 flex flex-wrap items-baseline justify-between gap-3 rounded-panel px-5 py-4"
      >
        <span class="text-xs tracking-wide text-ink-mute uppercase">Longest flight</span>
        <span class="font-mono">
          <span class="font-medium">{stats.longest.label}</span>
          <span class="text-ink-mute">· {stats.longest.distanceKm.toLocaleString()} km</span>
        </span>
      </div>
    {/if}

    <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      <section class="glass rounded-panel p-6">
        <h2 class="mb-4 text-base font-medium">Top airports</h2>
        {#if stats.topAirports.length === 0}
          <p class="text-sm text-ink-mute">—</p>
        {:else}
          <ul class="flex flex-col gap-3">
            {#each stats.topAirports as airport (airport.code)}
              <li>
                <div class="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <span class="truncate">
                    <span class="font-mono font-medium">{airport.code}</span>
                    <span class="text-ink-mute">· {airport.name}</span>
                  </span>
                  <span class="font-mono text-ink-soft">{airport.visits}</span>
                </div>
                <div class="h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    class="h-full rounded-full bg-accent"
                    style="width: {(airport.visits / maxAirport) * 100}%"
                  ></div>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <section class="glass rounded-panel p-6">
        <h2 class="mb-4 text-base font-medium">Top airlines</h2>
        {#if stats.topAirlines.length === 0}
          <p class="text-sm text-ink-mute">No airline info recorded yet.</p>
        {:else}
          <ul class="flex flex-col gap-3">
            {#each stats.topAirlines as airline (airline.airline)}
              <li>
                <div class="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <span class="font-mono font-medium">{airline.airline}</span>
                  <span class="font-mono text-ink-soft">{airline.count}</span>
                </div>
                <div class="h-1.5 overflow-hidden rounded-full bg-line">
                  <div
                    class="h-full rounded-full bg-accent"
                    style="width: {(airline.count / maxAirline) * 100}%"
                  ></div>
                </div>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    </div>

    {#if stats.perYear.length > 0}
      <section class="glass mt-4 rounded-panel p-6">
        <h2 class="mb-4 text-base font-medium">Flights per year</h2>
        <div class="flex flex-col gap-2.5 text-sm">
          {#each stats.perYear as entry (entry.year)}
            <div class="flex items-center gap-3">
              <span class="w-12 font-mono text-ink-soft">{entry.year}</span>
              <div class="h-2.5 flex-1 overflow-hidden rounded-full bg-line">
                <div
                  class="h-full rounded-full bg-accent"
                  style="width: {(entry.count / maxYear) * 100}%"
                ></div>
              </div>
              <span class="w-8 text-right font-mono text-ink-soft">{entry.count}</span>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>
