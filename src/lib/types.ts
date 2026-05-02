export interface Book {
  id: string;
  title: string;
  author?: string;
  context?: string;
  coverColor: string;
  createdAt: number;
  updatedAt: number;
  archived: boolean;
}

export interface Note {
  id: string;
  bookId: string;
  content: string;
  type: 'reminder' | 'action_item';
  done: boolean;
  snoozedUntil?: number;
  createdAt: number;
  updatedAt: number;
}

export interface DailyLog {
  date: string;
  noteIds: string[];
}

export interface NoteContext {
  id: string;
  noteId: string;
  meaning: string;
  whyItMatters: string;
  applied: string;
  generatedAt: number;
}

export interface AppSettings {
  cardsPerDay: number;
  notificationTime: string;
  streakGraceDays: number;
  theme: 'system' | 'light' | 'dark';
  claudeApiKey: string;
  aiModel: 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6' | 'claude-opus-4-7';
}
