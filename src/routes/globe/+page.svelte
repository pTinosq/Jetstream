<script lang="ts">
  import Globe from '$lib/components/Globe.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

<div class="mx-auto max-w-5xl px-6 py-10 text-slate-100">
  <header class="mb-6">
    <h1 class="text-2xl font-semibold">Globe</h1>
    <p class="text-slate-400">
      {data.globe.arcs.length} route{data.globe.arcs.length === 1 ? '' : 's'} ·
      {data.globe.points.length} airport{data.globe.points.length === 1 ? '' : 's'}
    </p>
  </header>

  {#if data.globe.points.length === 0}
    <p class="text-slate-400">No flights yet — add some on the Flights page to see them here.</p>
  {:else}
    <Globe data={data.globe} />
  {/if}
</div>
