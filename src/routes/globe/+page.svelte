<script lang="ts">
  import Globe from '$lib/components/Globe.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<div class="enter mx-auto max-w-5xl px-4 py-10 sm:px-6">
  <header class="mb-6 flex flex-wrap items-baseline justify-between gap-2">
    <h1 class="text-3xl font-semibold">Globe</h1>
    <p class="font-mono text-sm text-ink-soft">
      {data.globe.arcs.length} route{data.globe.arcs.length === 1 ? '' : 's'} ·
      {data.globe.points.length} airport{data.globe.points.length === 1 ? '' : 's'}
    </p>
  </header>

  {#if data.globe.points.length === 0}
    <div class="glass rounded-panel p-8 text-center text-sm text-ink-soft">
      No flights yet — add some on the Flights page to see them here.
    </div>
  {:else}
    <div class="glass overflow-hidden rounded-panel">
      <Globe data={data.globe} />
    </div>
  {/if}
</div>
