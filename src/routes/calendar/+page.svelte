<script lang="ts">
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { getDailyLogs, getNotes, getBooks } from '$lib/db';
  import type { DailyLog, Note, Book } from '$lib/types';

  let logs: DailyLog[] = [];
  let noteMap = new Map<string, Note>();
  let bookMap = new Map<string, Book>();
  let loading = true;

  let viewYear = new Date().getFullYear();
  let viewMonth = new Date().getMonth();

  onMount(async () => {
    const [allLogs, allNotes, allBooks] = await Promise.all([
      getDailyLogs(), getNotes(), getBooks()
    ]);
    logs = allLogs;
    noteMap = new Map(allNotes.map(n => [n.id, n]));
    bookMap = new Map(allBooks.map(b => [b.id, b]));
    loading = false;
  });

  $: logMap = new Map(logs.map(l => [l.date, l]));

  function bookColorsForDay(date: string): string[] {
    const log = logMap.get(date);
    if (!log) return [];
    const seen = new Set<string>();
    const colors: string[] = [];
    for (const noteId of log.noteIds) {
      const bookId = noteMap.get(noteId)?.bookId;
      if (bookId && !seen.has(bookId)) {
        seen.add(bookId);
        const color = bookMap.get(bookId)?.coverColor;
        if (color) colors.push(color);
      }
      if (colors.length === 3) break;
    }
    return colors;
  }

  function pad(n: number) { return String(n).padStart(2, '0'); }
  function dateStr(y: number, m: number, d: number) {
    return `${y}-${pad(m + 1)}-${pad(d)}`;
  }

  $: calDays = (() => {
    const firstDow = new Date(viewYear, viewMonth, 1).getDay();
    const total = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (string | null)[] = Array(firstDow).fill(null);
    for (let d = 1; d <= total; d++) cells.push(dateStr(viewYear, viewMonth, d));
    while (cells.length % 7) cells.push(null);
    return cells;
  })();

  const today = new Date().toISOString().slice(0, 10);

  $: currentStreak = (() => {
    let n = 0;
    const d = new Date();
    while (logMap.has(d.toISOString().slice(0, 10))) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  })();

  $: longestStreak = (() => {
    const sorted = [...logMap.keys()].sort();
    let best = 0, cur = 0;
    for (let i = 0; i < sorted.length; i++) {
      if (i === 0) { cur = 1; }
      else {
        const gap = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
        cur = gap === 1 ? cur + 1 : 1;
      }
      if (cur > best) best = cur;
    }
    return best;
  })();

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  function prevMonth() {
    if (viewMonth === 0) { viewMonth = 11; viewYear--; } else viewMonth--;
  }
  function nextMonth() {
    if (viewMonth === 11) { viewMonth = 0; viewYear++; } else viewMonth++;
  }

  $: canNext = viewYear < new Date().getFullYear() ||
    (viewYear === new Date().getFullYear() && viewMonth < new Date().getMonth());
</script>

<div class="mx-auto max-w-md px-4 pb-8 pt-10">
  <!-- Stats -->
  <div class="mb-6 grid grid-cols-2 gap-3">
    <div class="rounded-2xl bg-stone-900 px-4 py-4 text-white">
      <p class="text-xs text-stone-400">Current streak</p>
      <p class="mt-1 text-3xl font-bold">{currentStreak}</p>
      <p class="text-xs text-stone-400">{currentStreak === 1 ? 'day' : 'days'}</p>
    </div>
    <div class="rounded-2xl border border-stone-100 bg-white px-4 py-4">
      <p class="text-xs text-stone-500">Longest streak</p>
      <p class="mt-1 text-3xl font-bold text-stone-900">{longestStreak}</p>
      <p class="text-xs text-stone-500">{longestStreak === 1 ? 'day' : 'days'}</p>
    </div>
  </div>

  <!-- Month nav -->
  <div class="mb-4 flex items-center justify-between">
    <button
      on:click={prevMonth}
      class="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-500 hover:bg-stone-50 active:scale-95 transition-transform"
      aria-label="Previous month"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <p class="font-semibold text-stone-900">{MONTHS[viewMonth]} {viewYear}</p>
    <button
      on:click={nextMonth}
      disabled={!canNext}
      class="flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 text-stone-500 hover:bg-stone-50 active:scale-95 transition-transform disabled:opacity-30"
      aria-label="Next month"
    >
      <svg class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>

  {#if loading}
    <div class="flex justify-center py-16">
      <div class="h-6 w-6 animate-spin rounded-full border-2 border-stone-900 border-t-transparent"></div>
    </div>
  {:else}
    <!-- Day-of-week headers -->
    <div class="mb-1 grid grid-cols-7 text-center">
      {#each DOW as d}
        <p class="text-xs text-stone-400">{d}</p>
      {/each}
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-7 gap-y-1">
      {#each calDays as date}
        {#if date === null}
          <div></div>
        {:else}
          {@const colors = bookColorsForDay(date)}
          {@const isToday = date === today}
          {@const hasNotes = colors.length > 0}
          <div class="flex flex-col items-center py-1">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-full text-sm
                {isToday ? 'bg-stone-900 font-bold text-white' :
                 hasNotes ? 'font-semibold text-stone-900' : 'text-stone-400'}"
            >
              {parseInt(date.slice(8))}
            </div>
            {#if hasNotes}
              <div class="mt-0.5 flex gap-0.5">
                {#each colors as color}
                  <div class="h-1.5 w-1.5 rounded-full" style="background-color: {color};"></div>
                {/each}
              </div>
            {:else}
              <div class="mt-0.5 h-1.5"></div>
            {/if}
          </div>
        {/if}
      {/each}
    </div>

    {#if logs.length === 0}
      <p class="mt-10 text-center text-sm text-stone-400">
        No notes logged yet. Add notes to start your streak!
      </p>
    {/if}
  {/if}
</div>
