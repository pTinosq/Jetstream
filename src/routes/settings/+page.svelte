<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // Both forms surface field errors under `errors`; widen to a common record so
  // each section can read its own field names (clientId/clientSecret vs apiKey).
  const errors = $derived(
    form !== null && 'errors' in form
      ? (form.errors as Record<string, string[] | undefined>)
      : undefined,
  );
  const saved = $derived(form !== null && 'saved' in form);
  const verified = $derived(form !== null && 'verified' in form ? form.verified : null);
  const verifyError = $derived(form !== null && 'verifyError' in form ? form.verifyError : null);
  const cleared = $derived(form !== null && 'cleared' in form);

  const aiSaved = $derived(form !== null && 'aiSaved' in form);
  const aiVerified = $derived(form !== null && 'aiVerified' in form ? form.aiVerified : null);
  const aiVerifyError = $derived(
    form !== null && 'aiVerifyError' in form ? form.aiVerifyError : null,
  );
  const aiCleared = $derived(form !== null && 'aiCleared' in form);
</script>

<div class="enter mx-auto max-w-2xl px-4 py-10 sm:px-6">
  <section class="glass rounded-panel p-6 sm:p-7">
    <h2 class="text-lg font-medium">Flight auto-detect (OpenSky)</h2>
    <p class="mt-1.5 text-sm leading-relaxed text-ink-soft">
      Look up real flights for a route and date. Create a free account at
      <a
        class="font-medium text-accent hover:underline"
        href="https://opensky-network.org/"
        target="_blank"
        rel="noreferrer">opensky-network.org</a
      >, add an API client, and paste its credentials here.
    </p>

    <div class="mt-4 text-sm">
      {#if data.opensky.source === 'db'}
        <span class="rounded-full bg-emerald-500/12 px-2.5 py-1 font-medium text-emerald-700">
          Configured
        </span>
      {:else if data.opensky.source === 'env'}
        <span class="rounded-full bg-accent-wash px-2.5 py-1 font-medium text-accent">
          Configured via environment variable (saving here overrides it)
        </span>
      {:else}
        <span class="rounded-full bg-black/5 px-2.5 py-1 text-ink-soft">Not configured</span>
      {/if}
    </div>

    {#if saved}
      {#if verified === true}
        <p
          class="mt-4 rounded-control border border-emerald-600/15 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700"
        >
          Saved and connection verified.
        </p>
      {:else}
        <p
          class="mt-4 rounded-control border border-amber-600/15 bg-amber-500/10 px-3 py-2 text-sm text-amber-800"
        >
          Saved, but the connection test failed: {verifyError}
        </p>
      {/if}
    {/if}
    {#if cleared}
      <p class="mt-4 rounded-control bg-black/5 px-3 py-2 text-sm text-ink-soft">
        Credentials cleared.
      </p>
    {/if}

    <form method="POST" action="?/save" use:enhance class="mt-5 flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-ink-soft" for="clientId">Client ID</label>
        <input
          id="clientId"
          name="clientId"
          type="text"
          autocomplete="off"
          value={data.opensky.clientId ?? ''}
          class="field font-mono"
        />
        {#if errors?.clientId?.[0] !== undefined}
          <p class="text-sm text-rose-600">{errors.clientId[0]}</p>
        {/if}
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-ink-soft" for="clientSecret">Client secret</label>
        <input
          id="clientSecret"
          name="clientSecret"
          type="password"
          autocomplete="off"
          placeholder={data.opensky.source === 'db' ? 'Enter to replace the saved secret' : ''}
          class="field font-mono"
        />
        {#if errors?.clientSecret?.[0] !== undefined}
          <p class="text-sm text-rose-600">{errors.clientSecret[0]}</p>
        {/if}
      </div>

      <div class="flex items-center gap-3 pt-1">
        <button type="submit" class="btn btn-primary">Save &amp; test</button>
        {#if data.opensky.source === 'db'}
          <button type="submit" formaction="?/clear" class="btn btn-ghost text-sm">Clear</button>
        {/if}
      </div>
    </form>
  </section>

  <section class="glass mt-6 rounded-panel p-6 sm:p-7">
    <h2 class="text-lg font-medium">AI flight assistant (OpenRouter)</h2>
    <p class="mt-1.5 text-sm leading-relaxed text-ink-soft">
      Describe a flight in plain words — or paste a booking email — and have it prefill the form.
      Create a key at
      <a
        class="font-medium text-accent hover:underline"
        href="https://openrouter.ai/keys"
        target="_blank"
        rel="noreferrer">openrouter.ai/keys</a
      > and paste it here. Optional — flights can still be added manually.
    </p>

    <div class="mt-4 text-sm">
      {#if data.openrouter.source === 'db'}
        <span class="rounded-full bg-emerald-500/12 px-2.5 py-1 font-medium text-emerald-700">
          Configured
        </span>
      {:else if data.openrouter.source === 'env'}
        <span class="rounded-full bg-accent-wash px-2.5 py-1 font-medium text-accent">
          Configured via environment variable (saving here overrides it)
        </span>
      {:else}
        <span class="rounded-full bg-black/5 px-2.5 py-1 text-ink-soft">Not configured</span>
      {/if}
    </div>

    {#if aiSaved}
      {#if aiVerified === true}
        <p
          class="mt-4 rounded-control border border-emerald-600/15 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700"
        >
          Saved and connection verified.
        </p>
      {:else}
        <p
          class="mt-4 rounded-control border border-amber-600/15 bg-amber-500/10 px-3 py-2 text-sm text-amber-800"
        >
          Saved, but the connection test failed: {aiVerifyError}
        </p>
      {/if}
    {/if}
    {#if aiCleared}
      <p class="mt-4 rounded-control bg-black/5 px-3 py-2 text-sm text-ink-soft">
        Credentials cleared.
      </p>
    {/if}

    <form method="POST" action="?/saveAi" use:enhance class="mt-5 flex flex-col gap-4">
      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-ink-soft" for="apiKey">API key</label>
        <input
          id="apiKey"
          name="apiKey"
          type="password"
          autocomplete="off"
          placeholder={data.openrouter.source === 'db' ? 'Enter to replace the saved key' : ''}
          class="field font-mono"
        />
        {#if errors?.apiKey?.[0] !== undefined}
          <p class="text-sm text-rose-600">{errors.apiKey[0]}</p>
        {/if}
      </div>

      <div class="flex flex-col gap-1.5">
        <label class="text-sm font-medium text-ink-soft" for="model">Model</label>
        <input
          id="model"
          name="model"
          type="text"
          autocomplete="off"
          value={data.openrouter.model}
          class="field font-mono"
        />
        <p class="text-xs text-ink-mute">
          Any tool-calling model on OpenRouter, e.g. <code>openai/gpt-4o-mini</code> or
          <code>anthropic/claude-3.5-haiku</code>.
        </p>
      </div>

      <div class="flex items-center gap-3 pt-1">
        <button type="submit" class="btn btn-primary">Save &amp; test</button>
        {#if data.openrouter.source === 'db'}
          <button type="submit" formaction="?/clearAi" class="btn btn-ghost text-sm">Clear</button>
        {/if}
      </div>
    </form>
  </section>
</div>
