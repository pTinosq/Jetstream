<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const errors = $derived(form !== null && 'errors' in form ? form.errors : undefined);
  const saved = $derived(form !== null && 'saved' in form);
  const verified = $derived(form !== null && 'verified' in form ? form.verified : null);
  const verifyError = $derived(form !== null && 'verifyError' in form ? form.verifyError : null);
  const cleared = $derived(form !== null && 'cleared' in form);

  const fieldClass =
    'rounded-md border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-sky-500';
</script>

<div class="mx-auto max-w-2xl px-6 py-10 text-slate-100">
  <header class="mb-8">
    <h1 class="text-2xl font-semibold">Settings</h1>
    <p class="text-slate-400">Configure Jetstream from here — no <code>.env</code> needed.</p>
  </header>

  <section class="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
    <h2 class="text-lg font-medium">Flight auto-detect (OpenSky)</h2>
    <p class="mt-1 text-sm text-slate-400">
      Look up real flights for a route and date. Create a free account at
      <a
        class="text-sky-400 hover:underline"
        href="https://opensky-network.org/"
        target="_blank"
        rel="noreferrer">opensky-network.org</a
      >, add an API client, and paste its credentials here.
    </p>

    <div class="mt-4 text-sm">
      {#if data.opensky.source === 'db'}
        <span class="rounded-md bg-emerald-500/10 px-2 py-1 text-emerald-300">Configured</span>
      {:else if data.opensky.source === 'env'}
        <span class="rounded-md bg-sky-500/10 px-2 py-1 text-sky-300">
          Configured via environment variable (saving here overrides it)
        </span>
      {:else}
        <span class="rounded-md bg-slate-700/40 px-2 py-1 text-slate-300">Not configured</span>
      {/if}
    </div>

    {#if saved}
      {#if verified === true}
        <p class="mt-4 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          Saved and connection verified.
        </p>
      {:else}
        <p class="mt-4 rounded-md bg-amber-500/10 px-3 py-2 text-sm text-amber-300">
          Saved, but the connection test failed: {verifyError}
        </p>
      {/if}
    {/if}
    {#if cleared}
      <p class="mt-4 rounded-md bg-slate-700/30 px-3 py-2 text-sm text-slate-300">
        Credentials cleared.
      </p>
    {/if}

    <form method="POST" action="?/save" use:enhance class="mt-4 flex flex-col gap-4">
      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-slate-200" for="clientId">Client ID</label>
        <input
          id="clientId"
          name="clientId"
          type="text"
          autocomplete="off"
          value={data.opensky.clientId ?? ''}
          class={fieldClass}
        />
        {#if errors?.clientId?.[0] !== undefined}
          <p class="text-sm text-rose-400">{errors.clientId[0]}</p>
        {/if}
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-sm font-medium text-slate-200" for="clientSecret">Client secret</label>
        <input
          id="clientSecret"
          name="clientSecret"
          type="password"
          autocomplete="off"
          placeholder={data.opensky.source === 'db' ? 'Enter to replace the saved secret' : ''}
          class={fieldClass}
        />
        {#if errors?.clientSecret?.[0] !== undefined}
          <p class="text-sm text-rose-400">{errors.clientSecret[0]}</p>
        {/if}
      </div>

      <div class="flex items-center gap-3">
        <button
          type="submit"
          class="rounded-md bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500"
        >
          Save &amp; test
        </button>
        {#if data.opensky.source === 'db'}
          <button
            type="submit"
            formaction="?/clear"
            class="rounded-md border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            Clear
          </button>
        {/if}
      </div>
    </form>
  </section>
</div>
