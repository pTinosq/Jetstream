<script lang="ts">
  import type { PageData, ActionData } from './$types';

  let { data, form }: { data: PageData; form: ActionData } = $props();

  const errors = $derived(form !== null && 'errors' in form ? form.errors : undefined);

  const fieldClass =
    'w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 outline-none focus:border-sky-500';
</script>

<div class="mx-auto max-w-2xl px-6 py-12 text-slate-100">
  <header class="mb-6">
    <h1 class="text-2xl font-semibold">Set up Jetstream</h1>
    <p class="mt-1 text-slate-400">
      Protect this instance with GitHub sign-in. The first account to sign in becomes the owner.
    </p>
  </header>

  <ol class="mb-6 list-decimal space-y-2 pl-5 text-sm text-slate-300">
    <li>
      Create a GitHub OAuth app at
      <a
        class="text-sky-400 hover:underline"
        href="https://github.com/settings/developers"
        target="_blank"
        rel="noreferrer">github.com/settings/developers</a
      >.
    </li>
    <li>
      Set the <strong>Authorization callback URL</strong> to:
      <code class="mt-1 block rounded bg-slate-900 px-2 py-1 text-sky-300">{data.callbackUrl}</code>
    </li>
    <li>Paste the app's Client ID and a generated client secret below.</li>
  </ol>

  <form
    method="POST"
    class="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6"
  >
    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-slate-200" for="clientId">GitHub Client ID</label>
      <input id="clientId" name="clientId" type="text" autocomplete="off" class={fieldClass} />
      {#if errors?.clientId?.[0] !== undefined}
        <p class="text-sm text-rose-400">{errors.clientId[0]}</p>
      {/if}
    </div>

    <div class="flex flex-col gap-1">
      <label class="text-sm font-medium text-slate-200" for="clientSecret"
        >GitHub Client secret</label
      >
      <input
        id="clientSecret"
        name="clientSecret"
        type="password"
        autocomplete="off"
        class={fieldClass}
      />
      {#if errors?.clientSecret?.[0] !== undefined}
        <p class="text-sm text-rose-400">{errors.clientSecret[0]}</p>
      {/if}
    </div>

    <div>
      <button
        type="submit"
        class="rounded-md bg-sky-600 px-4 py-2 font-medium text-white hover:bg-sky-500"
      >
        Save and continue
      </button>
    </div>
  </form>
</div>
