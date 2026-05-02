<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { getNotes, getBooks } from '$lib/db';
  import { buildDailyFeed } from '$lib/feed';
  import { getColorMeta } from '$lib/colors';
  import type { Note, Book } from '$lib/types';

  let note: Note | undefined;
  let book: Book | undefined;
  let loading = true;

  onMount(async () => {
    const [notes, books] = await Promise.all([getNotes(), getBooks()]);
    const bookMap = new Map(books.map(b => [b.id, b]));
    const feed = buildDailyFeed(notes, 1);
    note = feed[0];
    if (note) book = bookMap.get(note.bookId);
    loading = false;
  });

  $: colorMeta = book ? getColorMeta(book.coverColor) : null;
</script>

<div class="flex h-screen items-center justify-center p-4">
  {#if loading}
    <div class="h-6 w-6 animate-spin rounded-full border-2 border-stone-900 border-t-transparent"></div>

  {:else if note && colorMeta && book}
    <a
      href="{base}/"
      class="block w-full max-w-xs rounded-3xl p-5 shadow-lg"
      style="background-color: {colorMeta.value}; color: {colorMeta.text};"
    >
      <span
        class="mb-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider"
        style="background-color: {colorMeta.badge}25; color: {colorMeta.badge};"
      >
        {note.type === 'action_item' ? 'Action' : 'Reminder'}
      </span>
      <p class="font-medium leading-snug">{note.content}</p>
      <p class="mt-3 text-xs opacity-50">{book.title}</p>
    </a>

  {:else}
    <a href="{base}/" class="card bg-white text-center text-sm text-stone-400">
      No notes yet — tap to add one.
    </a>
  {/if}
</div>
