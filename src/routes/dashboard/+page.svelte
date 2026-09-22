<script lang="ts">
  import CollapsibleSection from '$lib/components/CollapsibleSection.svelte';
  import type { CabinSection, PartOfDay, SeatPosition } from '$lib/stats/types';
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
  const maxAircraft = $derived(Math.max(1, ...stats.topAircraft.map((a) => a.count)));

  const positionLabels: Record<SeatPosition, string> = {
    window: 'Window',
    middle: 'Middle',
    aisle: 'Aisle',
  };
  const sectionLabels: Record<CabinSection, string> = {
    front: 'Front',
    mid: 'Middle',
    rear: 'Rear',
  };
  const partLabels: Record<PartOfDay, string> = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    night: 'Night',
  };
  const cabinLabels: Record<string, string> = {
    economy: 'Economy',
    premium_economy: 'Premium economy',
    business: 'Business',
    first: 'First',
  };

  // Segment tones: the accent, stepped down in opacity, so a proportion bar
  // reads as one family rather than a rainbow.
  const tones = ['bg-accent', 'bg-accent/55', 'bg-accent/30', 'bg-accent/15'];

  const seatPositionSegments = $derived(
    (['window', 'aisle', 'middle'] as const).map((key) => ({
      label: positionLabels[key],
      value: stats.seats.position[key],
    })),
  );
  const seatSectionSegments = $derived(
    (['front', 'mid', 'rear'] as const).map((key) => ({
      label: sectionLabels[key],
      value: stats.seats.section[key],
    })),
  );
  const partSegments = $derived(
    (['morning', 'afternoon', 'evening', 'night'] as const).map((key) => ({
      label: partLabels[key],
      value: stats.time.byPartOfDay[key],
    })),
  );

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekdayOrder = [1, 2, 3, 4, 5, 6, 0]; // Monday-first display
  const maxWeekday = $derived(Math.max(1, ...stats.time.byWeekday));

  const seatHeadline = $derived.by(() => {
    const pos = stats.seats.favouritePosition;
    const sec = stats.seats.favouriteSection;
    if (pos === null) return null;
    const posText = `a ${positionLabels[pos].toLowerCase()}-seat person`;
    if (sec === null) return `You're ${posText}.`;
    const secText = sec === 'front' ? 'the front' : sec === 'mid' ? 'the middle' : 'the back';
    return `You're ${posText}, usually towards ${secText} of the cabin.`;
  });
</script>

{#snippet proportionBar(segments: { label: string; value: number }[])}
  {@const total = segments.reduce((sum, s) => sum + s.value, 0)}
  <div class="flex h-2.5 overflow-hidden rounded-full bg-line">
    {#each segments as segment, i (segment.label)}
      {#if segment.value > 0}
        <div
          class="{tones[i % tones.length]} h-full"
          style="width: {(segment.value / total) * 100}%"
          title="{segment.label}: {segment.value}"
        ></div>
      {/if}
    {/each}
  </div>
  <ul class="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm">
    {#each segments as segment, i (segment.label)}
      <li class="flex items-center gap-2">
        <span class="{tones[i % tones.length]} h-2.5 w-2.5 rounded-full"></span>
        <span class="text-ink-soft">{segment.label}</span>
        <span class="font-mono text-ink-mute">
          {total === 0 ? 0 : Math.round((segment.value / total) * 100)}%
        </span>
      </li>
    {/each}
  </ul>
{/snippet}

<div class="enter mx-auto flex max-w-5xl flex-col gap-4 px-4 py-10 sm:px-6">
  {#if stats.totalFlights === 0}
    <div class="glass rounded-panel p-8 text-center text-sm text-ink-soft">
      No flights logged yet. Add some on the Flights page.
    </div>
  {:else}
    <!-- Overview: always on. Instrument readout, hairline-divided cells. -->
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
        class="glass flex flex-wrap items-baseline justify-between gap-3 rounded-panel px-5 py-4"
      >
        <span class="text-xs tracking-wide text-ink-mute uppercase">Longest flight</span>
        <span class="font-mono">
          <span class="font-medium">{stats.longest.label}</span>
          <span class="text-ink-mute">· {stats.longest.distanceKm.toLocaleString()} km</span>
        </span>
      </div>
    {/if}

    <!-- Airports -->
    <CollapsibleSection
      title="Airports"
      subtitle="{stats.uniqueAirports} airports · {stats.uniqueCountries} countries"
      open
    >
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
    </CollapsibleSection>

    <!-- Airlines & aircraft -->
    <CollapsibleSection title="Airlines & aircraft" subtitle="Who you fly, and what you fly on">
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h3 class="mb-3 text-xs tracking-wide text-ink-mute uppercase">Top airlines</h3>
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
        </div>

        <div>
          <h3 class="mb-3 text-xs tracking-wide text-ink-mute uppercase">Top aircraft</h3>
          {#if stats.topAircraft.length === 0}
            <p class="text-sm text-ink-mute">No aircraft info recorded yet.</p>
          {:else}
            <ul class="flex flex-col gap-3">
              {#each stats.topAircraft as aircraft (aircraft.type)}
                <li>
                  <div class="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span class="truncate font-medium">{aircraft.type}</span>
                    <span class="font-mono text-ink-soft">{aircraft.count}</span>
                  </div>
                  <div class="h-1.5 overflow-hidden rounded-full bg-line">
                    <div
                      class="h-full rounded-full bg-accent"
                      style="width: {(aircraft.count / maxAircraft) * 100}%"
                    ></div>
                  </div>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      </div>
    </CollapsibleSection>

    <!-- Seats & cabin: the fun one. -->
    <CollapsibleSection
      title="Seats & cabin"
      subtitle={seatHeadline ?? 'Add seats to your flights to unlock this'}
      open
    >
      {#if stats.seats.parsed === 0}
        <p class="text-sm text-ink-mute">
          No seats recorded yet. Add a seat like <span class="font-mono">12A</span> to a flight to see
          your seating habits.
        </p>
      {:else}
        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <h3 class="mb-3 text-xs tracking-wide text-ink-mute uppercase">Where in the row</h3>
            {@render proportionBar(seatPositionSegments)}
          </div>
          <div>
            <h3 class="mb-3 text-xs tracking-wide text-ink-mute uppercase">Where in the cabin</h3>
            {@render proportionBar(seatSectionSegments)}
          </div>
        </div>

        <div class="mt-6 flex flex-wrap gap-6 text-sm">
          {#if stats.seats.favouriteSeat !== null}
            <div>
              <div class="text-xs tracking-wide text-ink-mute uppercase">Favourite seat</div>
              <div class="mt-1 font-mono text-lg font-medium">{stats.seats.favouriteSeat}</div>
            </div>
          {/if}
          {#if stats.cabins.length > 0}
            <div>
              <div class="text-xs tracking-wide text-ink-mute uppercase">Cabin</div>
              <div class="mt-1.5 flex flex-wrap gap-2">
                {#each stats.cabins as cabin (cabin.cabin)}
                  <span class="rounded-full bg-accent-wash px-2.5 py-1 text-xs text-accent">
                    {cabinLabels[cabin.cabin] ?? cabin.cabin}
                    <span class="font-mono text-accent/70">· {cabin.count}</span>
                  </span>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}
    </CollapsibleSection>

    <!-- When you fly -->
    <CollapsibleSection title="When you fly" subtitle="Your preferred times to be in the air">
      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h3 class="mb-3 text-xs tracking-wide text-ink-mute uppercase">Time of day</h3>
          {@render proportionBar(partSegments)}
        </div>
        <div>
          <h3 class="mb-3 text-xs tracking-wide text-ink-mute uppercase">Day of week</h3>
          <div class="flex flex-col gap-2 text-sm">
            {#each weekdayOrder as day (day)}
              <div class="flex items-center gap-3">
                <span class="w-9 font-mono text-ink-soft">{weekdayNames[day]}</span>
                <div class="h-2 flex-1 overflow-hidden rounded-full bg-line">
                  <div
                    class="h-full rounded-full bg-accent"
                    style="width: {((stats.time.byWeekday[day] ?? 0) / maxWeekday) * 100}%"
                  ></div>
                </div>
                <span class="w-6 text-right font-mono text-ink-mute"
                  >{stats.time.byWeekday[day] ?? 0}</span
                >
              </div>
            {/each}
          </div>
        </div>
      </div>
    </CollapsibleSection>

    <!-- Activity by year -->
    {#if stats.perYear.length > 0}
      <CollapsibleSection title="Activity by year" subtitle="Flights logged each year">
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
      </CollapsibleSection>
    {/if}
  {/if}
</div>
