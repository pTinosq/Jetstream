<script lang="ts">
  // Free-text combobox: type to filter previously-used aircraft types, click to
  // reuse one, or just keep typing to enter a brand-new value. The input carries
  // the form `name` itself, so it submits like a plain text field.
  let {
    name,
    value = $bindable(''),
    suggestions,
    id = name,
    placeholder = '',
  }: {
    name: string;
    value?: string;
    suggestions: string[];
    id?: string;
    placeholder?: string;
  } = $props();

  let open = $state(false);

  const matches = $derived.by(() => {
    const q = value.trim().toLowerCase();
    const pool = q === '' ? suggestions : suggestions.filter((s) => s.toLowerCase().includes(q));
    // Drop an exact match — there'd be nothing new to pick.
    return pool.filter((s) => s.toLowerCase() !== q).slice(0, 8);
  });

  function choose(type: string): void {
    value = type;
    open = false;
  }

  // Close only when focus leaves the whole control (input + list), so clicking a
  // suggestion still registers.
  function onFocusOut(event: FocusEvent): void {
    const { currentTarget, relatedTarget } = event;
    if (
      currentTarget instanceof Node &&
      relatedTarget instanceof Node &&
      currentTarget.contains(relatedTarget)
    ) {
      return;
    }
    open = false;
  }
</script>

<div class="relative" onfocusout={onFocusOut}>
  <input
    {id}
    {name}
    {placeholder}
    type="text"
    autocomplete="off"
    bind:value
    oninput={() => (open = true)}
    onfocus={() => (open = true)}
    class="field"
  />

  {#if open && matches.length > 0}
    <ul
      class="glass absolute top-full z-20 mt-1.5 max-h-60 w-full divide-y divide-line overflow-auto rounded-control"
    >
      {#each matches as type (type)}
        <li>
          <button
            type="button"
            onclick={() => choose(type)}
            class="block w-full px-3 py-2 text-left text-sm text-ink transition-colors hover:bg-accent-wash"
          >
            {type}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
