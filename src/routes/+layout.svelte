<script lang="ts">
  import './layout.css';
  import favicon from '$lib/assets/favicon.svg';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { signOut } from '@auth/sveltekit/client';
  import type { Snippet } from 'svelte';
  import type { LayoutData } from './$types';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  const links: { href: '/' | '/dashboard' | '/globe' | '/settings'; label: string }[] = [
    { href: '/', label: 'Flights' },
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/globe', label: 'Globe' },
    { href: '/settings', label: 'Settings' },
  ];
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="min-h-screen bg-slate-950 text-slate-100">
  <nav class="border-b border-slate-800 bg-slate-900/50">
    <div class="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
      <span class="font-semibold">Jetstream</span>
      {#if data.session !== null}
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
        <div class="ml-auto flex items-center gap-3 text-sm text-slate-400">
          {#if (data.session.user?.name ?? '') !== ''}<span>{data.session.user?.name}</span>{/if}
          <button
            onclick={() => void signOut()}
            class="rounded-md px-3 py-1.5 hover:bg-slate-800/60"
          >
            Sign out
          </button>
        </div>
      {/if}
    </div>
  </nav>

  {@render children()}
</div>
