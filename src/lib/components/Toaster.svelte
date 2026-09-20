<script lang="ts">
  import { toasts, dismissToast } from '$lib/toast';
</script>

<div
  class="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4"
>
  {#each $toasts as t (t.id)}
    <button
      type="button"
      onclick={() => dismissToast(t.id)}
      class="glass enter pointer-events-auto flex items-center gap-2.5 rounded-control px-4 py-2.5 text-sm shadow-sm"
    >
      <span
        class="h-2 w-2 shrink-0 rounded-full {t.type === 'error'
          ? 'bg-rose-500'
          : 'bg-emerald-500'}"
        aria-hidden="true"
      ></span>
      <span class={t.type === 'error' ? 'text-rose-700' : 'text-ink'}>{t.message}</span>
    </button>
  {/each}
</div>
