import { openDB } from 'idb';
import type { Book, Note, DailyLog, NoteContext, AppSettings } from './types';

const DB_NAME = 'bookbit';
const DB_VERSION = 1;

function db() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      const books = database.createObjectStore('books', { keyPath: 'id' });
      books.createIndex('by-updatedAt', 'updatedAt');

      const notes = database.createObjectStore('notes', { keyPath: 'id' });
      notes.createIndex('by-bookId', 'bookId');
      notes.createIndex('by-createdAt', 'createdAt');

      database.createObjectStore('dailyLogs', { keyPath: 'date' });

      const contexts = database.createObjectStore('noteContexts', { keyPath: 'id' });
      contexts.createIndex('by-noteId', 'noteId');

      database.createObjectStore('settings', { keyPath: 'id' });
    }
  });
}

// ── Books ────────────────────────────────────────────────────────────────────

export async function getBooks(): Promise<Book[]> {
  const d = await db();
  const all = await d.getAll('books') as Book[];
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getBook(id: string): Promise<Book | undefined> {
  return (await db()).get('books', id) as Promise<Book | undefined>;
}

export async function saveBook(book: Book): Promise<void> {
  await (await db()).put('books', book);
}

export async function deleteBook(id: string): Promise<void> {
  const d = await db();
  const notes = await d.getAllFromIndex('notes', 'by-bookId', id) as Note[];
  const tx = d.transaction(['books', 'notes'], 'readwrite');
  tx.objectStore('books').delete(id);
  for (const n of notes) tx.objectStore('notes').delete(n.id);
  await tx.done;
}

// ── Notes ────────────────────────────────────────────────────────────────────

export async function getNotes(): Promise<Note[]> {
  return (await db()).getAll('notes') as Promise<Note[]>;
}

export async function getNotesByBook(bookId: string): Promise<Note[]> {
  const d = await db();
  const notes = await d.getAllFromIndex('notes', 'by-bookId', bookId) as Note[];
  return notes.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getNote(id: string): Promise<Note | undefined> {
  return (await db()).get('notes', id) as Promise<Note | undefined>;
}

export async function saveNote(note: Note): Promise<void> {
  await (await db()).put('notes', note);
  await logNoteToday(note.id);
}

export async function deleteNote(id: string): Promise<void> {
  await (await db()).delete('notes', id);
}

// ── Daily logs ───────────────────────────────────────────────────────────────

async function logNoteToday(noteId: string): Promise<void> {
  const d = await db();
  const today = todayStr();
  const existing = await d.get('dailyLogs', today) as DailyLog | undefined;
  if (existing) {
    if (!existing.noteIds.includes(noteId)) {
      existing.noteIds.push(noteId);
      await d.put('dailyLogs', existing);
    }
  } else {
    await d.put('dailyLogs', { date: today, noteIds: [noteId] });
  }
}

export async function getDailyLogs(): Promise<DailyLog[]> {
  return (await db()).getAll('dailyLogs') as Promise<DailyLog[]>;
}

// ── Note contexts ─────────────────────────────────────────────────────────────

export async function getContextsForNote(noteId: string): Promise<NoteContext[]> {
  const d = await db();
  const all = await d.getAllFromIndex('noteContexts', 'by-noteId', noteId) as NoteContext[];
  return all.sort((a, b) => b.generatedAt - a.generatedAt);
}

export async function saveContext(ctx: NoteContext): Promise<void> {
  await (await db()).put('noteContexts', ctx);
}

export async function deleteContext(id: string): Promise<void> {
  await (await db()).delete('noteContexts', id);
}

// ── Settings ──────────────────────────────────────────────────────────────────

const SETTINGS_ID = 'app';

export const DEFAULT_SETTINGS: AppSettings = {
  cardsPerDay: 6,
  notificationTime: '20:00',
  streakGraceDays: 2,
  theme: 'system',
  claudeApiKey: '',
  aiModel: 'claude-haiku-4-5-20251001',
};

export async function getSettings(): Promise<AppSettings> {
  const d = await db();
  const stored = await d.get('settings', SETTINGS_ID) as (AppSettings & { id: string }) | undefined;
  if (!stored) return { ...DEFAULT_SETTINGS };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _, ...settings } = stored;
  return { ...DEFAULT_SETTINGS, ...settings };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await (await db()).put('settings', { ...settings, id: SETTINGS_ID });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function uuid(): string {
  return crypto.randomUUID();
}
