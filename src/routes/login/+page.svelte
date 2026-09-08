<script lang="ts">
  import { signIn } from '@auth/sveltekit/client';
  import { page } from '$app/state';

  const hasError = $derived(page.url.searchParams.get('error') !== null);
</script>

<div class="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center text-slate-100">
  <h1 class="text-2xl font-semibold">Jetstream</h1>
  <p class="mt-2 text-slate-400">Sign in to access your flight log.</p>

  {#if hasError}
    <p class="mt-4 rounded-md bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
      That account isn't the owner of this instance, or sign-in was cancelled.
    </p>
  {/if}

  <button
    onclick={() => void signIn('github')}
    class="mt-6 flex items-center gap-2 rounded-md bg-white px-5 py-2.5 font-medium text-slate-900 hover:bg-slate-200"
  >
    Sign in with GitHub
  </button>
</div>
