<script lang="ts">
  import Globe from '$lib/components/Globe.svelte';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
</script>

{#if data.globe.points.length === 0}
  <div class="enter mx-auto max-w-5xl px-4 py-10 sm:px-6">
    <div class="glass rounded-panel p-8 text-center text-sm text-ink-soft">
      No flights yet — add some on the Flights page to see them here.
    </div>
  </div>
{:else}
  <!-- Full-bleed globe, sitting behind the frosted nav so it blurs underneath. -->
  <div class="fixed inset-0 z-0">
    <Globe data={data.globe} />
  </div>

  <!-- Floating route summary; non-interactive so it never steals globe drags. -->
  <div class="enter pointer-events-none fixed right-4 bottom-4 z-10 sm:right-6 sm:bottom-6">
    <p class="glass rounded-control px-4 py-2.5 font-mono text-sm text-ink-soft">
      {data.globe.arcs.length} route{data.globe.arcs.length === 1 ? '' : 's'} ·
      {data.globe.points.length} airport{data.globe.points.length === 1 ? '' : 's'}
    </p>
  </div>
{/if}
