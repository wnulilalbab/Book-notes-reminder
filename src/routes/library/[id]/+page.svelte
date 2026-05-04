<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { getBook, getNotesByBook, saveBook, deleteNote, saveNote, deleteBook, getSettings } from '$lib/db';
  import { getColorMeta } from '$lib/colors';
  import ContextLens from '$lib/ContextLens.svelte';
  import type { Book, Note, AppSettings } from '$lib/types';

  let book: Book | undefined;
  let notes: Note[] = [];
  let loading = true;
  let settings: AppSettings | null = null;
  let lensNote: Note | null = null;
  let confirmDelete = false;

  $: id = $page.params.id;

  onMount(async () => {
    if (!id) { goto(base + '/library'); return; }
    [[book, notes], settings] = await Promise.all([
      Promise.all([getBook(id), getNotesByBook(id)]),
      getSettings(),
    ]);
    if (!book) goto(base + '/library');
    loading = false;
  });

  async function toggleArchive() {
    if (!book) return;
    book.archived = !book.archived;
    book.updatedAt = Date.now();
    await saveBook(book);
  }

  async function confirmDeleteBook() {
    if (!book) return;
    await deleteBook(book.id);
    goto(base + '/library');
  }

  async function markDone(note: Note) {
    note.done = !note.done;
    note.updatedAt = Date.now();
    await saveNote(note);
    notes = [...notes];
  }

  async function removeNote(id: string) {
    await deleteNote(id);
    notes = notes.filter(n => n.id !== id);
  }

  $: colorMeta = book ? getColorMeta(book.coverColor) : null;
  $: activeNotes = notes.filter(n => !n.done);
  $: doneNotes = notes.filter(n => n.done);
</script>

{#if loading}
  <div class="flex h-screen items-center justify-center">
    <div class="h-8 w-8 animate-spin rounded-full border-2 border-stone-900 border-t-transparent"></div>
  </div>

{:else if book && colorMeta}
  <!-- Header -->
  <div class="px-4 pb-6 pt-10" style="background-color: {colorMeta.value}; color: {colorMeta.text};">
    <div class="mx-auto max-w-md">
      <a href="{base}/library" class="mb-4 flex items-center gap-1 text-sm opacity-60 hover:opacity-100">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Library
      </a>
      <h1 class="text-2xl font-bold leading-tight">{book.title}</h1>
      {#if book.author}<p class="mt-1 text-sm opacity-70">{book.author}</p>{/if}
      {#if book.context}<p class="mt-2 text-sm opacity-60 italic">"{book.context}"</p>{/if}
      <div class="mt-4 flex items-center gap-2">
        <a
          href="{base}/add-note/{book.id}"
          class="rounded-2xl px-4 py-2 text-sm font-semibold transition-colors"
          style="background-color: {colorMeta.badge}30; color: {colorMeta.text};"
        >
          + Add Note
        </a>
        <a
          href="{base}/add-book?edit={book.id}"
          class="rounded-2xl px-4 py-2 text-sm font-semibold opacity-70 transition-colors hover:opacity-100"
          style="background-color: {colorMeta.badge}20; color: {colorMeta.text};"
        >
          Edit
        </a>
        <button
          on:click={() => (confirmDelete = true)}
          class="ml-auto flex h-9 w-9 items-center justify-center rounded-full opacity-50 hover:opacity-90 transition-opacity"
          style="background-color: {colorMeta.badge}20; color: {colorMeta.text};"
          aria-label="Delete book"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Notes -->
  <div class="mx-auto max-w-md px-4 pt-6">
    {#if notes.length === 0}
      <div class="flex flex-col items-center gap-3 py-12 text-center">
        <p class="text-stone-400">No notes yet for this book.</p>
        <a href="{base}/add-note/{book.id}" class="btn-primary">Add First Note</a>
      </div>

    {:else}
      {#if activeNotes.length > 0}
        <ul class="space-y-3">
          {#each activeNotes as note}
            <li class="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
              <div class="flex items-start gap-3">
                {#if note.type === 'action_item'}
                  <button
                    class="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 border-stone-300 transition-colors hover:border-stone-900"
                    on:click={() => markDone(note)}
                    aria-label="Mark done"
                  ></button>
                {:else}
                  <div class="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full" style="background-color: {colorMeta.value};"></div>
                {/if}
                <div class="min-w-0 flex-1">
                  <p class="text-sm leading-relaxed text-stone-800">{note.content}</p>
                  <div class="mt-2 flex items-center gap-2">
                    <span class="text-xs text-stone-400">{note.type === 'action_item' ? 'Action' : 'Reminder'}</span>
                    <span class="text-stone-200">·</span>
                    <span class="text-xs text-stone-400">{new Date(note.createdAt).toLocaleDateString()}</span>
                    {#if settings?.claudeApiKey}
                      <button
                        on:click={() => (lensNote = note)}
                        class="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-500 hover:bg-stone-200 transition-colors"
                        aria-label="Context Lens"
                      >?</button>
                    {/if}
                  </div>
                </div>
                <button
                  class="flex-shrink-0 p-1 text-stone-300 hover:text-red-400 transition-colors"
                  on:click={() => removeNote(note.id)}
                  aria-label="Delete note"
                >
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </li>
          {/each}
        </ul>
      {/if}

      {#if doneNotes.length > 0}
        <div class="mt-6">
          <p class="mb-3 text-xs font-semibold uppercase tracking-wider text-stone-400">Done ({doneNotes.length})</p>
          <ul class="space-y-2">
            {#each doneNotes as note}
              <li class="flex items-center gap-3 rounded-2xl bg-stone-50 px-4 py-3">
                <button
                  class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 border-stone-400 bg-stone-400 transition-colors hover:border-stone-600 hover:bg-stone-600"
                  on:click={() => markDone(note)}
                  aria-label="Mark undone"
                >
                  <svg class="h-3 w-3 text-white" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <p class="text-sm text-stone-400 line-through">{note.content}</p>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
    {/if}
  </div>
{/if}

{#if confirmDelete}
  <button class="fixed inset-0 z-[60] bg-black/50" on:click={() => (confirmDelete = false)} aria-label="Cancel" tabindex="-1"></button>
  <div class="fixed bottom-0 left-0 right-0 z-[70] rounded-t-3xl bg-white px-5 pb-10 pt-6 shadow-2xl">
    <div class="mx-auto max-w-md">
      <p class="text-lg font-bold text-stone-900">Delete "{book?.title}"?</p>
      <p class="mt-1 text-sm text-stone-500">This will permanently delete the book and all {notes.length} note{notes.length !== 1 ? 's' : ''}. This cannot be undone.</p>
      <div class="mt-6 flex gap-3">
        <button on:click={() => (confirmDelete = false)} class="flex-1 rounded-2xl border border-stone-200 py-3 text-sm font-semibold text-stone-700 active:scale-95 transition-transform">
          Cancel
        </button>
        <button on:click={confirmDeleteBook} class="flex-1 rounded-2xl bg-red-500 py-3 text-sm font-semibold text-white active:scale-95 transition-transform hover:bg-red-600">
          Delete
        </button>
      </div>
    </div>
  </div>
{/if}

{#if lensNote && book && settings}
  <ContextLens
    note={lensNote}
    {book}
    apiKey={settings.claudeApiKey}
    modelId={settings.aiModel}
    onClose={() => (lensNote = null)}
  />
{/if}
