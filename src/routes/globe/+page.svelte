<script lang="ts">
  import Globe from '$lib/components/Globe.svelte';
  import { buildGlobeData } from '$lib/globe/build';
  import {
    DEFAULT_GLOBE_PERIOD,
    GLOBE_PERIODS,
    withinPeriod,
    type GlobePeriod,
  } from '$lib/globe/period';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const shortLabels: Record<GlobePeriod, string> = {
    '30d': '30d',
    '6mo': '6mo',
    ytd: 'YTD',
    '1y': '1y',
    all: 'All',
  };

  let period = $state<GlobePeriod>(DEFAULT_GLOBE_PERIOD);

  // Filter + rebuild on the client so switching periods is instant.
  const globe = $derived(buildGlobeData(withinPeriod(data.legs, period, new Date())));
  const hasFlights = $derived(data.legs.length > 0);
</script>

{#if globe.points.length > 0}
  <!-- Full-bleed globe, sitting behind the frosted nav so it blurs underneath. -->
  <div class="fixed inset-0 z-0">
    <Globe data={globe} />
  </div>
{:else}
  <div class="fixed inset-0 z-0 flex items-center justify-center px-6">
    <p class="glass rounded-panel p-8 text-center text-sm text-ink-soft">
      No flights {hasFlights ? 'in this period' : 'yet — add some on the Flights page'}.
    </p>
  </div>
{/if}

<!-- Period filter (only useful once there are flights to slice). -->
{#if hasFlights}
  <div class="enter fixed bottom-4 left-4 z-10 sm:bottom-6 sm:left-6">
    <div class="glass inline-flex gap-0.5 rounded-control p-1 font-mono text-sm">
      {#each GLOBE_PERIODS as p (p)}
        {@const active = period === p}
        <button
          type="button"
          onclick={() => (period = p)}
          aria-current={active ? 'true' : undefined}
          class="rounded-[calc(var(--radius-control)-0.25rem)] px-2.5 py-1 transition-colors {active
            ? 'bg-accent-wash font-medium text-accent'
            : 'text-ink-soft hover:text-ink'}"
        >
          {shortLabels[p]}
        </button>
      {/each}
    </div>
  </div>
{/if}

<!-- Floating route summary; non-interactive so it never steals globe drags. -->
<div class="enter pointer-events-none fixed right-4 bottom-4 z-10 sm:right-6 sm:bottom-6">
  <p class="glass rounded-control px-4 py-2.5 font-mono text-sm text-ink-soft">
    {globe.arcs.length} route{globe.arcs.length === 1 ? '' : 's'} ·
    {globe.points.length} airport{globe.points.length === 1 ? '' : 's'}
  </p>
</div>
