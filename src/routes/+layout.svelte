<script lang="ts">
  import './layout.css';
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

<div class="min-h-dvh">
  {#if data.session !== null}
    <nav class="glass-bar sticky top-0 z-50">
      <div class="mx-auto flex max-w-5xl items-center gap-5 px-4 py-3 sm:px-6">
        <a
          href={resolve('/')}
          class="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
        >
          <svg
            class="h-5 w-5 text-accent"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M2 13.5 21 4l-6.5 16-3.2-6.3L4.5 10Z" />
          </svg>
          Jetstream
        </a>

        <div class="hidden flex-1 items-center justify-center gap-1 sm:flex">
          {#each links as link (link.href)}
            {@const active = page.url.pathname === link.href}
            <a
              href={resolve(link.href)}
              aria-current={active ? 'page' : undefined}
              class="rounded-full px-3 py-1.5 text-sm transition-colors {active
                ? 'bg-accent-wash font-medium text-accent'
                : 'text-ink-soft hover:bg-white/60 hover:text-ink'}"
            >
              {link.label}
            </a>
          {/each}
        </div>

        <div class="ml-auto flex items-center gap-3 text-sm text-ink-soft sm:ml-0">
          {#if (data.session.user?.name ?? '') !== ''}
            <span class="hidden sm:inline">{data.session.user?.name}</span>
          {/if}
          <button
            onclick={() => void signOut()}
            class="rounded-full px-3 py-1.5 text-ink-mute transition-colors hover:bg-white/60 hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </div>

      <!-- Mobile section links -->
      <div class="flex gap-1 overflow-x-auto px-4 pb-2 sm:hidden">
        {#each links as link (link.href)}
          {@const active = page.url.pathname === link.href}
          <a
            href={resolve(link.href)}
            aria-current={active ? 'page' : undefined}
            class="rounded-full px-3 py-1.5 text-sm whitespace-nowrap transition-colors {active
              ? 'bg-accent-wash font-medium text-accent'
              : 'text-ink-soft hover:bg-white/60'}"
          >
            {link.label}
          </a>
        {/each}
      </div>
    </nav>
  {/if}

  {@render children()}
</div>
