<script lang="ts">
  import { onMount } from 'svelte';
  import { getContextsForNote, deleteContext } from '$lib/db';
  import { generateNoteContext } from '$lib/ai';
  import type { Note, Book, NoteContext } from '$lib/types';

  export let note: Note;
  export let book: Book;
  export let apiKey: string;
  export let modelId: string;
  export let onClose: () => void;

  let contexts: NoteContext[] = [];
  let idx = 0;
  let busy = false;
  let busyMsg = '';
  let error = '';

  onMount(async () => {
    busy = true;
    busyMsg = 'Loading…';
    try {
      contexts = await getContextsForNote(note.id);
      if (contexts.length === 0) {
        busyMsg = 'Generating context…';
        const ctx = await generateNoteContext(note, book, apiKey, modelId, false);
        contexts = [ctx];
        idx = 0;
      }
    } catch (e: any) {
      error = e.message ?? 'Something went wrong.';
    } finally {
      busy = false;
    }
  });

  async function tryAnother() {
    busy = true;
    busyMsg = 'Generating new interpretation…';
    error = '';
    try {
      const ctx = await generateNoteContext(note, book, apiKey, modelId, true);
      contexts = [ctx, ...contexts];
      idx = 0;
    } catch (e: any) {
      error = e.message ?? 'Failed to generate.';
    } finally {
      busy = false;
    }
  }

  async function remove() {
    const id = contexts[idx].id;
    await deleteContext(id);
    contexts = contexts.filter(c => c.id !== id);
    idx = Math.min(idx, Math.max(0, contexts.length - 1));
  }

  $: current = contexts[idx];
  $: total = contexts.length;
</script>

<!-- Backdrop -->
<button
  class="fixed inset-0 z-40 bg-black/50"
  on:click={onClose}
  aria-label="Close"
  tabindex="-1"
></button>

<!-- Sheet -->
<div
  class="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white shadow-2xl"
  role="dialog"
  aria-modal="true"
>
  <div class="mx-auto max-w-md px-5 pb-10 pt-5">
    <!-- Handle -->
    <div class="mb-4 flex justify-center">
      <div class="h-1 w-10 rounded-full bg-stone-200"></div>
    </div>

    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="font-semibold text-stone-900">Context Lens</span>
        {#if total > 1}
          <span class="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500">
            {idx + 1} / {total}
          </span>
        {/if}
      </div>
      <button
        on:click={onClose}
        class="flex h-8 w-8 items-center justify-center rounded-full bg-stone-100 text-stone-500 hover:bg-stone-200"
        aria-label="Close"
      >
        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Note preview -->
    <div class="mb-5 rounded-2xl bg-stone-50 px-4 py-3">
      <p class="text-sm italic text-stone-600">"{note.content}"</p>
      <p class="mt-1 text-xs text-stone-400">{book.title}{book.author ? ` · ${book.author}` : ''}</p>
    </div>

    {#if busy}
      <div class="flex flex-col items-center gap-3 py-10">
        <div class="h-7 w-7 animate-spin rounded-full border-2 border-stone-900 border-t-transparent"></div>
        <p class="text-sm text-stone-400">{busyMsg}</p>
      </div>

    {:else if error}
      <div class="rounded-2xl bg-red-50 px-4 py-4">
        <p class="text-sm font-medium text-red-700">Error</p>
        <p class="mt-1 text-sm text-red-600">{error}</p>
        <button on:click={tryAnother} class="mt-3 text-sm font-semibold text-red-700 underline">
          Try again
        </button>
      </div>

    {:else if current}
      <!-- Three sections -->
      <div class="space-y-5">
        <div>
          <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">What this means</p>
          <p class="text-sm leading-relaxed text-stone-800">{current.meaning}</p>
        </div>
        <div class="border-t border-stone-100 pt-5">
          <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">Why it matters</p>
          <p class="text-sm leading-relaxed text-stone-800">{current.whyItMatters}</p>
        </div>
        <div class="border-t border-stone-100 pt-5">
          <p class="mb-1.5 text-xs font-semibold uppercase tracking-wider text-stone-400">
            {note.type === 'action_item' ? 'In practice' : 'When to recall'}
          </p>
          <p class="text-sm leading-relaxed text-stone-800">{current.applied}</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="mt-6 flex items-center gap-2">
        {#if total > 1}
          <button
            on:click={() => (idx = (idx - 1 + total) % total)}
            class="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition-colors hover:bg-stone-50"
            aria-label="Previous"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            on:click={() => (idx = (idx + 1) % total)}
            class="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-500 transition-colors hover:bg-stone-50"
            aria-label="Next"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        {/if}

        <button
          on:click={tryAnother}
          class="flex-1 rounded-2xl border border-stone-200 bg-white py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 active:scale-95"
        >
          Try another
        </button>

        <button
          on:click={remove}
          class="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 text-stone-400 transition-colors hover:border-red-200 hover:text-red-500"
          aria-label="Delete this interpretation"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {#if total === 0}
        <p class="mt-4 text-center text-sm text-stone-400">
          All interpretations deleted. <button on:click={tryAnother} class="font-medium text-stone-600 underline">Generate one</button>
        </p>
      {/if}
    {/if}
  </div>
</div>
