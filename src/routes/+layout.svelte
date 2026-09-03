<script lang="ts">
  import './layout.css';
  import favicon from '$lib/assets/favicon.svg';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import type { Snippet } from 'svelte';

  let { children }: { children: Snippet } = $props();

  const links: { href: '/' | '/globe'; label: string }[] = [
    { href: '/', label: 'Flights' },
    { href: '/globe', label: 'Globe' },
  ];
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-slate-950 text-slate-100">
  <nav class="border-b border-slate-800 bg-slate-900/50">
    <div class="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
      <span class="font-semibold">Jetstream</span>
      <div class="flex gap-1">
        {#each links as link (link.href)}
          <a
            href={resolve(link.href)}
            class="rounded-md px-3 py-1.5 text-sm {page.url.pathname === link.href
              ? 'bg-slate-800 text-white'
              : 'text-slate-300 hover:bg-slate-800/60'}"
          >
            {link.label}
          </a>
        {/each}
      </div>
    </div>
  </nav>

  {@render children()}
</div>
