<script lang="ts">
  import type { Snippet } from 'svelte';

  // Native <details> so it's keyboard-accessible and works without JS; the
  // chevron rotates via the built-in `open` state.
  let {
    title,
    subtitle,
    open = false,
    children,
  }: {
    title: string;
    subtitle?: string;
    open?: boolean;
    children: Snippet;
  } = $props();
</script>

<details {open} class="glass group rounded-panel [&_summary::-webkit-details-marker]:hidden">
  <summary
    class="flex cursor-pointer list-none items-center justify-between gap-4 rounded-panel px-6 py-4 select-none"
  >
    <div class="min-w-0">
      <h2 class="text-base font-medium">{title}</h2>
      {#if subtitle !== undefined}
        <p class="mt-0.5 truncate text-xs text-ink-mute">{subtitle}</p>
      {/if}
    </div>
    <svg
      class="h-4 w-4 shrink-0 text-ink-mute transition-transform duration-200 group-open:rotate-180"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  </summary>
  <div class="border-t border-line px-6 py-5">
    {@render children()}
  </div>
</details>
