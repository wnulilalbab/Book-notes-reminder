<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { getBook, getBooks, saveBook, deleteBook, uuid } from '$lib/db';
  import { BOOK_COLORS, getNextColor } from '$lib/colors';
  import type { Book } from '$lib/types';

  let title = '';
  let author = '';
  let context = '';
  let coverColor = BOOK_COLORS[0].value;
  let saving = false;
  let editId: string | null = null;

  onMount(async () => {
    const editParam = $page.url.searchParams.get('edit');
    if (editParam) {
      editId = editParam;
      const book = await getBook(editParam);
      if (book) {
        title = book.title;
        author = book.author ?? '';
        context = book.context ?? '';
        coverColor = book.coverColor;
      }
    } else {
      const existing = await getBooks();
      coverColor = getNextColor(existing.map(b => b.coverColor));
    }
  });

  async function save() {
    if (!title.trim()) return;
    saving = true;

    const now = Date.now();
    const book: Book = {
      id: editId ?? uuid(),
      title: title.trim(),
      author: author.trim() || undefined,
      context: context.trim() || undefined,
      coverColor,
      createdAt: now,
      updatedAt: now,
      archived: false,
    };

    if (editId) {
      const existing = await getBook(editId);
      if (existing) {
        book.createdAt = existing.createdAt;
        book.archived = existing.archived;
      }
    }

    await saveBook(book);
    goto(editId ? `${base}/library/${editId}` : `${base}/library`);
  }

  async function archive() {
    if (!editId) return;
    const book = await getBook(editId);
    if (!book) return;
    book.archived = !book.archived;
    book.updatedAt = Date.now();
    await saveBook(book);
    goto(base + '/library');
  }

  $: isEdit = !!editId;
</script>

<div class="mx-auto max-w-md px-4 pt-10">
  <div class="mb-6 flex items-center gap-3">
    <a href="{base}/library" class="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500">
      <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </a>
    <h1 class="text-xl font-bold text-stone-900">{isEdit ? 'Edit Book' : 'Add Book'}</h1>
  </div>

  <form on:submit|preventDefault={save} class="space-y-5">
    <div>
      <label class="label" for="title">Title *</label>
      <input id="title" class="input" bind:value={title} placeholder="Book title" required />
    </div>

    <div>
      <label class="label" for="author">Author</label>
      <input id="author" class="input" bind:value={author} placeholder="Author name" />
    </div>

    <div>
      <label class="label" for="context">Why I'm reading this</label>
      <textarea
        id="context"
        class="input resize-none"
        rows="2"
        bind:value={context}
        placeholder="Optional personal context..."
      ></textarea>
    </div>

    <div>
      <p class="label mb-3">Color</p>
      <div class="grid grid-cols-6 gap-2">
        {#each BOOK_COLORS as color}
          <button
            type="button"
            class="h-10 w-10 rounded-full transition-transform active:scale-90 {coverColor === color.value ? 'ring-2 ring-stone-900 ring-offset-2' : ''}"
            style="background-color: {color.value};"
            on:click={() => (coverColor = color.value)}
            title={color.name}
            aria-label="{color.name} color"
          ></button>
        {/each}
      </div>
    </div>

    <!-- Preview -->
    <div class="rounded-3xl p-5 shadow-sm" style="background-color: {coverColor}; color: {BOOK_COLORS.find(c => c.value === coverColor)?.text ?? '#1a1a1a'};">
      <p class="font-semibold">{title || 'Book Title'}</p>
      {#if author}<p class="text-sm opacity-70">{author}</p>{/if}
    </div>

    <button type="submit" class="btn-primary w-full" disabled={saving || !title.trim()}>
      {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Book'}
    </button>

    {#if isEdit}
      <button type="button" class="btn-secondary w-full" on:click={archive}>
        Archive Book
      </button>
    {/if}
  </form>
</div>
