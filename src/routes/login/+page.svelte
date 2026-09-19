<script lang="ts">
  import { signIn } from '@auth/sveltekit/client';
  import { page } from '$app/state';

  const hasError = $derived(page.url.searchParams.get('error') !== null);
</script>

<div
  class="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-6 py-16 text-center"
>
  <div class="glass enter w-full rounded-panel p-8 sm:p-10">
    <div class="mb-6 flex items-center justify-center gap-2">
      <svg
        class="h-6 w-6 text-accent"
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
      <span class="text-xl font-semibold tracking-tight">Jetstream</span>
    </div>

    <p class="text-ink-soft">Sign in to access your flight log.</p>

    {#if hasError}
      <p
        class="mt-5 rounded-control border border-rose-600/15 bg-rose-500/10 px-3 py-2 text-sm text-rose-700"
      >
        That account isn't the owner of this instance, or sign-in was cancelled.
      </p>
    {/if}

    <button
      onclick={() => void signIn('github')}
      class="mt-6 inline-flex w-full items-center justify-center gap-2.5 rounded-[var(--radius-control)] bg-ink px-5 py-2.5 font-medium text-white transition-colors hover:bg-black"
    >
      <svg class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path
          d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58v-2.02c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.92 1.23 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z"
        />
      </svg>
      Sign in with GitHub
    </button>
  </div>
</div>
