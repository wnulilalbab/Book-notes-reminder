<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { getBooks, getNote, saveNote, uuid } from '$lib/db';
  import { getColorMeta } from '$lib/colors';
  import type { Book, Note } from '$lib/types';

  let books: Book[] = [];
  let selectedBookId = '';
  let content = '';
  let type: 'reminder' | 'action_item' = 'reminder';
  let saving = false;
  let editId: string | null = null;

  onMount(async () => {
    books = (await getBooks()).filter(b => !b.archived);

    const bookIdParam = $page.params.bookId;
    const editParam = $page.url.searchParams.get('edit');

    if (editParam) {
      editId = editParam;
      const note = await getNote(editParam);
      if (note) {
        selectedBookId = note.bookId;
        content = note.content;
        type = note.type;
      }
    } else if (bookIdParam) {
      selectedBookId = bookIdParam;
    } else if (books.length === 1) {
      selectedBookId = books[0].id;
    }
  });

  async function save() {
    if (!content.trim() || !selectedBookId) return;
    saving = true;

    const now = Date.now();
    const note: Note = {
      id: editId ?? uuid(),
      bookId: selectedBookId,
      content: content.trim(),
      type,
      done: false,
      createdAt: now,
      updatedAt: now,
    };

    if (editId) {
      const existing = await getNote(editId);
      if (existing) {
        note.createdAt = existing.createdAt;
        note.done = existing.done;
        note.snoozedUntil = existing.snoozedUntil;
      }
    }

    await saveNote(note);
    goto(base + '/library/' + selectedBookId);
  }

  $: selectedBook = books.find(b => b.id === selectedBookId);
  $: colorMeta = selectedBook ? getColorMeta(selectedBook.coverColor) : null;
  $: canSave = content.trim().length > 0 && selectedBookId;
</script>

<div class="mx-auto max-w-md px-4 pt-10">
  <div class="mb-6 flex items-center gap-3">
    <button
      class="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500"
      on:click={() => history.back()}
    >
      <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <h1 class="text-xl font-bold text-stone-900">{editId ? 'Edit Note' : 'Add Note'}</h1>
  </div>

  <form on:submit|preventDefault={save} class="space-y-5">
    <!-- Book selector -->
    {#if books.length === 0}
      <div class="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
        You need to add a book first.
        <a href="{base}/add-book" class="font-semibold underline">Add one →</a>
      </div>

    {:else if books.length === 1}
      <div
        class="flex items-center gap-3 rounded-2xl px-4 py-3"
        style="background-color: {colorMeta?.value ?? '#f5f5f4'};"
      >
        <div class="h-3 w-3 rounded-full" style="background-color: {colorMeta?.badge ?? '#a8a29e'};"></div>
        <p class="text-sm font-semibold" style="color: {colorMeta?.text ?? '#1c1917'};">{selectedBook?.title}</p>
      </div>

    {:else}
      <div>
        <label class="label" for="book">Book</label>
        <select id="book" class="input" bind:value={selectedBookId}>
          <option value="">Select a book…</option>
          {#each books as b}
            <option value={b.id}>{b.title}{b.author ? ` — ${b.author}` : ''}</option>
          {/each}
        </select>
      </div>
    {/if}

    <!-- Note content -->
    <div>
      <label class="label" for="content">Note</label>
      <textarea
        id="content"
        class="input resize-none"
        rows="4"
        bind:value={content}
        placeholder="What do you want to remember or do?"
        autofocus
      ></textarea>
      <p class="mt-1 text-right text-xs text-stone-400">{content.length} chars</p>
    </div>

    <!-- Type toggle -->
    <div>
      <p class="label mb-2">Type</p>
      <div class="flex gap-2">
        <button
          type="button"
          class="flex-1 rounded-2xl border py-3 text-sm font-semibold transition-colors {type === 'reminder' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-500'}"
          on:click={() => (type = 'reminder')}
        >
          Reminder
        </button>
        <button
          type="button"
          class="flex-1 rounded-2xl border py-3 text-sm font-semibold transition-colors {type === 'action_item' ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-white text-stone-500'}"
          on:click={() => (type = 'action_item')}
        >
          Action Item
        </button>
      </div>
    </div>

    <button type="submit" class="btn-primary w-full" disabled={saving || !canSave}>
      {saving ? 'Saving…' : editId ? 'Save Changes' : 'Add Note'}
    </button>
  </form>
</div>
