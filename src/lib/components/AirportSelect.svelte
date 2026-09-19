<script lang="ts">
  import type { Airport } from '$lib/airports/types';

  let {
    name,
    label,
    placeholder = 'Search by code or city…',
    error,
    onSelect,
  }: {
    name: string;
    label: string;
    placeholder?: string;
    error?: string | undefined;
    onSelect?: (airport: Airport | null) => void;
  } = $props();

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
    if (selectedId !== '') {
      selectedId = '';
      onSelect?.(null);
    }
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
    onSelect?.(airport);
  }
</script>

<div class="relative flex flex-col gap-1.5">
  <label class="text-sm font-medium text-ink-soft" for={name}>{label}</label>
  <input
    id={name}
    type="text"
    autocomplete="off"
    {placeholder}
    bind:value={query}
    oninput={onInput}
    onfocus={() => (open = results.length > 0)}
    class="field"
  />
  <input type="hidden" {name} value={selectedId} />

  {#if open && results.length > 0}
    <ul
      class="glass absolute top-full z-20 mt-1.5 max-h-60 w-full divide-y divide-line overflow-auto rounded-control"
    >
      {#each results as airport (airport.id)}
        <li>
          <button
            type="button"
            onclick={() => choose(airport)}
            class="block w-full px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-accent-wash"
          >
            {displayName(airport)}
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  {#if error !== undefined}
    <p class="text-sm text-rose-600">{error}</p>
  {/if}
</div>
