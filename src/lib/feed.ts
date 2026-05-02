import type { Note } from './types';
import { todayStr } from './db';

const FEED_KEY_PREFIX = 'bookbit-feed-';

export function getFeedNoteIds(date: string): string[] | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(FEED_KEY_PREFIX + date);
  return raw ? JSON.parse(raw) : null;
}

export function saveFeedNoteIds(date: string, ids: string[]): void {
  localStorage.setItem(FEED_KEY_PREFIX + date, JSON.stringify(ids));
}

export function selectFeedNotes(notes: Note[], count: number): Note[] {
  const now = Date.now();
  const DAY_MS = 86_400_000;

  const candidates = notes.filter(n => {
    if (n.done) return false;
    if (n.snoozedUntil && n.snoozedUntil > now) return false;
    return true;
  });

  if (candidates.length === 0) return [];

  const scored = candidates.map(note => {
    const ageDays = (now - note.createdAt) / DAY_MS;
    let score = 1;
    score += Math.min(ageDays / 30, 4);       // older notes resurface more
    if (note.type === 'action_item') score += 2; // undone actions weighted up
    if (ageDays < 2) score += 0.5;             // tiny freshness bump
    return { note, score };
  });

  const selected: Note[] = [];
  const pool = [...scored];
  const target = Math.min(count, pool.length);

  for (let i = 0; i < target; i++) {
    const total = pool.reduce((s, x) => s + x.score, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let j = 0; j < pool.length; j++) {
      r -= pool[j].score;
      if (r <= 0) { idx = j; break; }
    }
    selected.push(pool[idx].note);
    pool.splice(idx, 1);
  }

  return selected;
}

export function buildDailyFeed(notes: Note[], count: number): Note[] {
  const today = todayStr();
  const now = Date.now();
  const available = notes.filter(n => !n.done && !(n.snoozedUntil && n.snoozedUntil > now));
  const target = Math.min(count, available.length);

  const cachedIds = getFeedNoteIds(today);
  if (cachedIds) {
    const idSet = new Set(cachedIds);
    const cached = notes.filter(n => idSet.has(n.id) && !n.done);
    // Use cache only when it already fills the feed (or covers all available notes)
    if (cached.length > 0 && cached.length >= target) return cached;
  }

  const selected = selectFeedNotes(notes, count);
  saveFeedNoteIds(today, selected.map(n => n.id));
  return selected;
}
