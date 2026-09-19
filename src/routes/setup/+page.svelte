<script lang="ts">
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const errors = $derived(form !== null && 'errors' in form ? form.errors : undefined);
</script>

<div class="enter mx-auto max-w-2xl px-4 py-16 sm:px-6">
  <header class="mb-6">
    <h1 class="text-3xl font-semibold">Set up Jetstream</h1>
    <p class="mt-1.5 leading-relaxed text-ink-soft">
      Protect this instance with GitHub sign-in. The first account to sign in becomes the owner.
    </p>
  </header>

  <ol class="mb-6 list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-ink-soft">
    <li>
      Create a GitHub OAuth app at
      <a
        class="font-medium text-accent hover:underline"
        href="https://github.com/settings/developers"
        target="_blank"
        rel="noreferrer">github.com/settings/developers</a
      >.
    </li>
    <li>
      Set the <strong class="font-medium text-ink">Authorization callback URL</strong> to:
      <code
        class="mt-1.5 block rounded-lg border border-line bg-white/60 px-2.5 py-1.5 font-mono text-xs text-accent"
      >
        {data.callbackUrl}
      </code>
    </li>
    <li>Paste the app's Client ID and a generated client secret below.</li>
  </ol>

  <form method="POST" class="glass flex flex-col gap-4 rounded-panel p-6 sm:p-7">
    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-medium text-ink-soft" for="clientId">GitHub Client ID</label>
      <input id="clientId" name="clientId" type="text" autocomplete="off" class="field font-mono" />
      {#if errors?.clientId?.[0] !== undefined}
        <p class="text-sm text-rose-600">{errors.clientId[0]}</p>
      {/if}
    </div>

    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-medium text-ink-soft" for="clientSecret"
        >GitHub Client secret</label
      >
      <input
        id="clientSecret"
        name="clientSecret"
        type="password"
        autocomplete="off"
        class="field font-mono"
      />
      {#if errors?.clientSecret?.[0] !== undefined}
        <p class="text-sm text-rose-600">{errors.clientSecret[0]}</p>
      {/if}
    </div>

    <div class="pt-1">
      <button type="submit" class="btn btn-primary">Save and continue</button>
    </div>
  </form>
</div>
