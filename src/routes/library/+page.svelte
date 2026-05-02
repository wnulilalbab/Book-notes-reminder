<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { getBooks, getNotesByBook } from '$lib/db';
  import { getColorMeta } from '$lib/colors';
  import type { Book } from '$lib/types';

  let books: Book[] = [];
  let noteCounts: Map<string, number> = new Map();
  let loading = true;

  onMount(async () => {
    books = await getBooks();
    const counts = await Promise.all(
      books.map(async b => [b.id, (await getNotesByBook(b.id)).length] as [string, number])
    );
    noteCounts = new Map(counts);
    loading = false;
  });

  $: activeBooks = books.filter(b => !b.archived);
  $: archivedBooks = books.filter(b => b.archived);
</script>

<div class="mx-auto max-w-md px-4 pt-10">
  <div class="mb-6 flex items-center justify-between">
    <h1 class="text-2xl font-bold text-stone-900">Library</h1>
    <a href="{base}/add-book" class="btn-primary py-2.5 text-xs">+ Book</a>
  </div>

  {#if loading}
    <div class="flex h-40 items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-stone-900 border-t-transparent"></div>
    </div>

  {:else if activeBooks.length === 0}
    <div class="flex flex-col items-center gap-3 pt-16 text-center">
      <div class="text-5xl">📖</div>
      <p class="font-semibold text-stone-700">No books yet</p>
      <p class="text-sm text-stone-400">Add the first book you want to remember.</p>
      <a href="{base}/add-book" class="btn-primary mt-2">Add a Book</a>
    </div>

  {:else}
    <ul class="space-y-3">
      {#each activeBooks as book}
        {@const meta = getColorMeta(book.coverColor)}
        <li>
          <a
            href="{base}/library/{book.id}"
            class="flex items-center gap-4 rounded-2xl border border-stone-100 bg-white px-4 py-4 shadow-sm active:scale-98 transition-transform"
          >
            <div class="h-14 w-1.5 flex-shrink-0 rounded-full" style="background-color: {meta.value};"></div>
            <div class="min-w-0 flex-1">
              <p class="truncate font-semibold text-stone-900">{book.title}</p>
              {#if book.author}
                <p class="truncate text-sm text-stone-400">{book.author}</p>
              {/if}
            </div>
            <span class="flex-shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">
              {noteCounts.get(book.id) ?? 0}
            </span>
            <svg class="h-4 w-4 flex-shrink-0 text-stone-300" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </li>
      {/each}
    </ul>

    {#if archivedBooks.length > 0}
      <p class="mt-6 text-center text-xs text-stone-400">{archivedBooks.length} archived book{archivedBooks.length !== 1 ? 's' : ''}</p>
    {/if}
  {/if}
</div>
