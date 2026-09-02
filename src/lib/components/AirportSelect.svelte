<script lang="ts">
  import type { Airport } from '$lib/airports/types';

  let {
    name,
    label,
    placeholder = 'Search by code or city…',
    error,
  }: { name: string; label: string; placeholder?: string; error?: string | undefined } = $props();

  let query = $state('');
  let results = $state<Airport[]>([]);
  let selectedId = $state('');
  let open = $state(false);
  let debounce: ReturnType<typeof setTimeout> | undefined;

  function displayName(airport: Airport): string {
    const code = airport.iata ?? airport.icao ?? '—';
    const place = airport.municipality ?? airport.country ?? '';
    return place === '' ? `${code} · ${airport.name}` : `${code} · ${airport.name}, ${place}`;
  }

  async function runSearch(q: string): Promise<void> {
    const response = await fetch(`/api/airports?q=${encodeURIComponent(q)}`);
    if (!response.ok) {
      results = [];
      return;
    }
    results = (await response.json()) as Airport[];
  }

  function onInput(): void {
    // Any edit invalidates a previous selection until the user picks again.
    selectedId = '';
    open = true;
    clearTimeout(debounce);
    const q = query.trim();
    if (q === '') {
      results = [];
      return;
    }
    debounce = setTimeout(() => void runSearch(q), 150);
  }

  function choose(airport: Airport): void {
    selectedId = airport.id;
    query = displayName(airport);
    results = [];
    open = false;
  }
</script>

<div class="relative flex flex-col gap-1">
  <label class="text-sm font-medium text-slate-200" for={name}>{label}</label>
  <input
    id={name}
    type="text"
    autocomplete="off"
    {placeholder}
    bind:value={query}
    oninput={onInput}
    onfocus={() => (open = results.length > 0)}
    class="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-sky-500"
  />
  <input type="hidden" {name} value={selectedId} />

  {#if open && results.length > 0}
    <ul
      class="absolute top-full z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-700 bg-slate-900 shadow-lg"
    >
      {#each results as airport (airport.id)}
        <li>
          <button
            type="button"
            onclick={() => choose(airport)}
            class="block w-full px-3 py-2 text-left text-sm text-slate-100 hover:bg-slate-800"
          >
            {displayName(airport)}
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  {#if error !== undefined}
    <p class="text-sm text-rose-400">{error}</p>
  {/if}
</div>
