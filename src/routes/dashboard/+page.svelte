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

  const cards = $derived([
    { label: 'Flights', value: stats.totalFlights.toLocaleString() },
    { label: 'Distance', value: `${stats.totalDistanceKm.toLocaleString()} km` },
    { label: 'Time in the air', value: formatDuration(stats.totalDurationMinutes) },
    { label: 'Airports', value: stats.uniqueAirports.toLocaleString() },
    { label: 'Countries', value: stats.uniqueCountries.toLocaleString() },
    { label: 'Upcoming', value: stats.upcoming.toLocaleString() },
  ]);

  const maxYear = $derived(Math.max(1, ...stats.perYear.map((y) => y.count)));
</script>

<div class="mx-auto max-w-5xl px-6 py-10 text-slate-100">
  <header class="mb-8">
    <h1 class="text-2xl font-semibold">Dashboard</h1>
    <p class="text-slate-400">Your flying, by the numbers.</p>
  </header>

  {#if stats.totalFlights === 0}
    <p class="text-slate-400">No flights logged yet. Add some on the Flights page.</p>
  {:else}
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {#each cards as card (card.label)}
        <div class="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
          <div class="text-sm text-slate-400">{card.label}</div>
          <div class="mt-1 text-2xl font-semibold">{card.value}</div>
        </div>
      {/each}
    </div>

    {#if stats.longest !== null}
      <div class="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <div class="text-sm text-slate-400">Longest flight</div>
        <div class="mt-1 text-lg font-medium">
          {stats.longest.label}
          <span class="text-slate-400">· {stats.longest.distanceKm.toLocaleString()} km</span>
        </div>
      </div>
    {/if}

    <div class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
      <section class="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 class="mb-3 text-lg font-medium">Top airports</h2>
        {#if stats.topAirports.length === 0}
          <p class="text-sm text-slate-400">—</p>
        {:else}
          <ul class="flex flex-col gap-2 text-sm">
            {#each stats.topAirports as airport (airport.code)}
              <li class="flex justify-between">
                <span><span class="font-medium">{airport.code}</span> · {airport.name}</span>
                <span class="text-slate-400">{airport.visits}</span>
              </li>
            {/each}
          </ul>
        {/if}
      </section>

      <section class="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 class="mb-3 text-lg font-medium">Top airlines</h2>
        {#if stats.topAirlines.length === 0}
          <p class="text-sm text-slate-400">No airline info recorded yet.</p>
        {:else}
          <ul class="flex flex-col gap-2 text-sm">
            {#each stats.topAirlines as airline (airline.airline)}
              <li class="flex justify-between">
                <span class="font-medium">{airline.airline}</span>
                <span class="text-slate-400">{airline.count}</span>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    </div>

    {#if stats.perYear.length > 0}
      <section class="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 p-5">
        <h2 class="mb-3 text-lg font-medium">Flights per year</h2>
        <div class="flex flex-col gap-2 text-sm">
          {#each stats.perYear as entry (entry.year)}
            <div class="flex items-center gap-3">
              <span class="w-12 text-slate-400">{entry.year}</span>
              <div class="h-3 flex-1 overflow-hidden rounded bg-slate-800">
                <div
                  class="h-full rounded bg-sky-500"
                  style="width: {(entry.count / maxYear) * 100}%"
                ></div>
              </div>
              <span class="w-8 text-right text-slate-400">{entry.count}</span>
            </div>
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>
