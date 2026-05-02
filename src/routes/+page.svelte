<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { getNotes, getBooks } from '$lib/db';
  import { buildDailyFeed } from '$lib/feed';
  import { getColorMeta } from '$lib/colors';
  import type { Note, Book } from '$lib/types';

  let notes: Note[] = [];
  let books: Map<string, Book> = new Map();
  let feed: Note[] = [];
  let cardIndex = 0;
  let loading = true;

  onMount(async () => {
    const [allNotes, allBooks] = await Promise.all([getNotes(), getBooks()]);
    books = new Map(allBooks.map(b => [b.id, b]));
    notes = allNotes;
    feed = buildDailyFeed(allNotes, 6);
    loading = false;
  });

  function prev() { if (cardIndex > 0) cardIndex--; }
  function next() { if (cardIndex < feed.length - 1) cardIndex++; }

  function handleKey(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  }

  let touchStartX = 0;
  function touchStart(e: TouchEvent) { touchStartX = e.touches[0].clientX; }
  function touchEnd(e: TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
  }

  $: current = feed[cardIndex];
  $: currentBook = current ? books.get(current.bookId) : undefined;
  $: colorMeta = currentBook ? getColorMeta(currentBook.coverColor) : null;
</script>

<svelte:window on:keydown={handleKey} />

<div class="mx-auto max-w-md px-4 pt-10">
  <div class="mb-6 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-stone-900">Today's Notes</h1>
      <p class="text-sm text-stone-400">{new Date().toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
    </div>
    <a href="{base}/add-note" class="btn-primary py-2.5 text-xs">+ Note</a>
  </div>

  {#if loading}
    <div class="flex h-64 items-center justify-center">
      <div class="h-8 w-8 animate-spin rounded-full border-2 border-stone-900 border-t-transparent"></div>
    </div>

  {:else if feed.length === 0}
    <div class="flex flex-col items-center gap-4 pt-20 text-center">
      <div class="text-5xl">📚</div>
      <p class="font-semibold text-stone-700">No notes yet</p>
      <p class="text-sm text-stone-400">Add your first book and start capturing insights.</p>
      <a href="{base}/add-book" class="btn-primary mt-2">Add a Book</a>
    </div>

  {:else}
    <!-- Card -->
    <div
      class="relative select-none"
      on:touchstart={touchStart}
      on:touchend={touchEnd}
      role="region"
      aria-label="Note card"
    >
      {#if colorMeta && current}
        <div
          class="card min-h-56 transition-all duration-300"
          style="background-color: {colorMeta.value}; color: {colorMeta.text};"
        >
          <!-- Type badge -->
          <span
            class="mb-4 inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
            style="background-color: {colorMeta.badge}20; color: {colorMeta.badge};"
          >
            {current.type === 'action_item' ? 'Action' : 'Reminder'}
          </span>

          <p class="mb-6 text-lg font-medium leading-relaxed">{current.content}</p>

          <div class="flex items-center justify-between">
            <span class="text-sm opacity-60">{currentBook?.title ?? ''}</span>
            {#if currentBook?.author}
              <span class="text-xs opacity-40">{currentBook.author}</span>
            {/if}
          </div>
        </div>
      {/if}
    </div>

    <!-- Pagination dots -->
    <div class="mt-4 flex items-center justify-center gap-1.5">
      {#each feed as _, i}
        <button
          class="h-1.5 rounded-full transition-all {i === cardIndex ? 'w-6 bg-stone-900' : 'w-1.5 bg-stone-300'}"
          on:click={() => (cardIndex = i)}
          aria-label="Go to card {i + 1}"
        ></button>
      {/each}
    </div>

    <!-- Nav arrows -->
    <div class="mt-4 flex items-center justify-between px-2">
      <button
        class="flex h-12 w-12 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 disabled:opacity-30 active:scale-95 transition-transform"
        on:click={prev}
        disabled={cardIndex === 0}
        aria-label="Previous"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <span class="text-xs text-stone-400">{cardIndex + 1} / {feed.length}</span>

      <button
        class="flex h-12 w-12 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 disabled:opacity-30 active:scale-95 transition-transform"
        on:click={next}
        disabled={cardIndex === feed.length - 1}
        aria-label="Next"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  {/if}
</div>
