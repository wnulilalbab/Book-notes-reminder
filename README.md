# BookBit — Book Notes Reminder

> Capture what matters. Remember what you captured.

A lightweight Progressive Web App (PWA) that helps non-fiction readers hold on to the insights they paid attention to. The philosophy is simple: **a short note written consistently beats a perfect note written rarely.**

---

## The Problem

You finish a great non-fiction book. You highlighted things, maybe jotted something down. Three months later you remember almost none of it — not because you didn't care, but because you never revisited it. The value of the book fades.

---

## The Solution

BookBit does two things well:

1. **Frictionless capture** — add a book and attach bite-sized notes (reminders or action items) in under a minute.
2. **Spaced resurfacing** — a rotating card feed puts your own notes back in front of you every day, so insight compounds over time.

Everything else (streaks, widgets) exists only to support those two things.

---

## Target User

Someone who reads non-fiction regularly, wants to apply what they read, and knows they need a low-effort system — not a complex knowledge management tool.

---

## Core Concepts

| Concept | Description |
|---|---|
| **Book** | A title + optional author + optional cover color/thumbnail. The container for all notes from that book. |
| **Note** | A single captured insight tied to a book. Marked as either a **Reminder** (something to remember) or an **Action Item** (something to do). |
| **Daily Feed** | The home screen carousel. Surfaces a curated set of notes from across your library on a rotating schedule. |
| **Streak** | A running count of consecutive days (and weeks) where at least one note was added. Shown on the calendar view. |

---

## Features

### 1. Book Library

- Add a book: title (required), author (optional), a short personal context note ("why I read this", optional).
- **Book color** — user picks one of ~12 curated colors when creating or editing a book. The color propagates everywhere the book appears:
  - Feed cards for that book use the color as background (with auto-contrasted text).
  - The book detail page uses the color as a full-bleed header / hero band.
  - Library list shows a colored left-strip per book.
  - Streak calendar dots are colored by which book the note came from, so you can see reading patterns at a glance.
- A default color is auto-assigned on creation (rotates through the palette) so the user never has to choose before saving.
- List view of all books sorted by most recently updated.
- Tap a book to see all its notes.
- Archive a book (hide from feed without deleting).

### 2. Notes

Each note belongs to exactly one book and has:

| Field | Details |
|---|---|
| **Content** | Plain text, ideally 1–3 sentences. No rich text — friction reduction. |
| **Type** | `reminder` or `action_item` |
| **Created date** | Auto-set |
| **Snoozed** | Whether to temporarily exclude from the feed |

Adding a note should take no more than 3 taps / keystrokes from the home screen.

### 3. Home Screen — Daily Feed Carousel

- Shows **5–7 note cards** per session, drawn randomly-but-weighted from the full library.
  - Notes not seen recently are weighted higher.
  - Action items that are not yet "done" are weighted higher.
  - Notes from books read longer ago are weighted higher (counteract recency bias).
- Cards auto-refresh every **24 hours** (new selection each day).
- Each card shows: note content, book title, note type badge (`reminder` / `action`). The card background uses the book's chosen color.
- Quick actions on a card: **Snooze** (skip for 7 days), **Mark done** (action items only), **Edit**.
- Swipe left/right between cards (touch and keyboard arrow support).

### 4. PWA & Home-Screen Widget

- Full PWA: installable on Android/iOS via "Add to Home Screen".
- Manifest configured for `standalone` display mode so it feels native.
- Service worker caches the app shell and note data for full offline use.
- **Android widget (best-effort):** The Web app does not have direct widget API access on Android, but the installed PWA shortcut on the home screen acts as a one-tap entry point to the feed. A dedicated `/widget` route renders a minimal single-card view suitable for use as a PWA shortcut tile or as a target for third-party widget apps (e.g., KWGT via WebView bridge). Document this clearly for users.

### 5. Gamification — Streak Calendar

A full-screen calendar view showing:

- **Daily streak**: green dot on every day at least one note was added. Current streak count at the top.
- **Weekly streak**: a week is "complete" if notes were added on at least 3 of 7 days. Shown as a highlighted week row.
- **Longest streak** badge (all-time record).
- Streak is **not broken** by a missed day if the user has logged notes for 5 of the last 7 days (grace buffer to avoid punishing travel/busy days). This is configurable.
- A gentle push notification (if permission granted) fires at a user-chosen time on days with no note yet: *"You haven't added a note today."*

### 6. Settings

| Setting | Default |
|---|---|
| Feed refresh time | Daily at midnight local time |
| Cards shown per day | 6 |
| Daily reminder notification time | 20:00 |
| Streak grace days | 2 of 7 |
| Theme | System (light / dark) |

---

## Screens

```
App
├── / ..................... Home (Daily Feed carousel + quick-add FAB)
├── /library .............. Book list
├── /library/:id .......... Book detail + note list
├── /add-book ............. Add / edit book form
├── /add-note/:bookId ..... Add / edit note form (bookId optional, picker shown if missing)
├── /calendar ............. Streak calendar
├── /settings ............. Settings
└── /widget ............... Minimal single-card view (PWA widget target)
```

---

## User Flows

### Add a book and first note (new user)

1. Open app → empty state on home prompts "Add your first book".
2. Tap → `/add-book` → enter title → Save.
3. Redirected to book detail → tap "+ Add Note".
4. Type note, choose type → Save.
5. Return to home — note appears in feed.

### Daily use (returning user)

1. Open app → home shows today's feed cards.
2. Swipe through, optionally mark an action item done or snooze a card.
3. Had a new insight → tap FAB → pick book → type note → Save.
4. Streak calendar updates.

### Check progress

1. Tap calendar icon → see month view with streak dots.
2. Tap a day → see which notes were added that day.

---

## Technical Stack (Recommended)

| Layer | Choice | Reason |
|---|---|---|
| Framework | **SvelteKit** (or Next.js) | Lightweight, fast, great PWA support |
| Styling | **Tailwind CSS** | Rapid UI iteration, small bundle |
| Storage | **IndexedDB** via `idb` library | Offline-first, no backend required to start |
| State | Svelte stores (or Zustand) | Simple, no boilerplate |
| PWA | `vite-plugin-pwa` | Auto-generates service worker + manifest |
| Notifications | Web Push API + service worker | Daily streak reminder |
| Sync (future) | Optional: Supabase or PocketBase | Cloud backup / multi-device |

The v1 target is **fully local** — no account, no server, no data leaves the device. This removes all onboarding friction and privacy concerns.

---

## Data Model

```ts
interface Book {
  id: string;           // uuid
  title: string;
  author?: string;
  context?: string;     // "why I read this"
  coverColor: string;   // hex; user-chosen from palette, auto-assigned on create
  createdAt: number;    // timestamp
  updatedAt: number;
  archived: boolean;
}

interface Note {
  id: string;
  bookId: string;
  content: string;
  type: 'reminder' | 'action_item';
  done: boolean;        // only relevant for action_item
  snoozedUntil?: number;
  createdAt: number;
  updatedAt: number;
}

interface DailyLog {
  date: string;         // "YYYY-MM-DD"
  noteIds: string[];    // notes added this day
}

interface NoteContext {
  id: string;           // uuid
  noteId: string;
  meaning: string;      // "What this means"
  whyItMatters: string; // "Why it matters"
  applied: string;      // "Applied to your note"
  generatedAt: number;  // timestamp
}
```

---

## AI Feature — Context Lens

The only AI feature in scope right now, solving one specific problem:

> You wrote a short note months ago. You read it again today. The words are there but the meaning has faded — why did this matter? What was the book saying around this? What did you mean?

Write mode stays completely unchanged — no extra fields, no prompts, no friction. The AI earns its place entirely on the **read side**.

---

### How it works

On any note card (in the feed or on the book detail page), a small **"?"** button appears. Tap it to open the Context Lens panel.

The Context Lens shows three things per interpretation:

| | |
|---|---|
| **What this means** | A 1–2 sentence plain-language explanation of the concept as the book uses it |
| **Why it matters** | The author's core argument for why this is worth remembering |
| **Applied to your note** | If it's an action item: what doing this actually looks like in practice. If it's a reminder: when this insight is most relevant to recall |

---

### Caching and multiple interpretations

Because AI is predicting context from a short note, its first guess may not match what you actually meant. The model stores interpretations as an **array** per note in IndexedDB:

**First open (no stored contexts):**
- API call is made, result stored as the first `NoteContext` entry.
- Shown immediately.

**Subsequent opens (context already stored):**
- Most recent interpretation shown by default.
- No API call made.

**"Try another interpretation" button:**
- User can request a new interpretation at any time.
- New API call made with a prompt variant that asks for a different angle.
- Result appended to the array — previous interpretations are never overwritten.

**Managing interpretations:**
- If more than one exists, a counter shows **"1 of N interpretations"** with prev/next arrows to browse all of them.
- Each interpretation has a **delete (×) button** — user removes ones that feel wrong or irrelevant.
- Deleting does not trigger a new API call. The remaining interpretations stay.

**Result:** after a few visits to the same note, the user has curated a small set of interpretations that actually resonate — and no API is ever called again unless they explicitly ask.

---

### Why this fits the philosophy

- **Zero write-time friction** — nothing changes about how you capture.
- **On demand, not automatic** — the feed card looks the same; the panel only opens when you tap "?".
- **API calls are earned, not automatic** — first open pays the cost once; every revisit is free.
- **User curates, AI suggests** — the user is always in control of what stays.
- **Uses what you already gave it** — no extra metadata required. Book title + author + your words is enough.
- **Opt-in via API key** — works via Claude API. If no key is configured, the "?" button is hidden. No degraded experience, just the feature absent.

---

### Setup

Add a Claude API key in Settings. The key is stored only in the device's local storage and never sent anywhere except the Anthropic API.

---

## Out of Scope (v1)

- Social / sharing features
- Highlight import from Kindle / Readwise
- AI writing notes for you, summarizing books, or rewriting your words
- AI features beyond the Context Lens (cross-book connections, weekly synthesis, etc.)
- Native Android/iOS app
- Multi-device sync (cloud)
- Tags or search (add after library exceeds ~50 books)

These are explicitly deferred to keep v1 shippable and the habit-loop tight.

---

## Success Metrics

| Metric | Target |
|---|---|
| Time to add first note (new user) | < 60 seconds |
| Daily active use after 30 days | User maintains a streak |
| Notes per book | 3–10 (enough to resurface, not overwhelming) |
| App install size | < 200 KB (JS bundle, gzipped) |

---

## Milestones

| Phase | Scope |
|---|---|
| **M1 — Core** | Book CRUD (with color picker), Note CRUD, local IndexedDB storage |
| **M2 — Feed** | Home carousel with color-themed cards, rotation algorithm, quick-actions |
| **M3 — PWA** | Install prompt, service worker, offline mode, `/widget` route |
| **M4 — Gamification** | Streak calendar (book-colored dots), daily notification |
| **M5 — AI Context Lens** | On-demand context explanation for any note card, Claude API key setup in Settings |
| **M6 — Polish** | Animations, empty states, onboarding flow |
| **M7 — Sync (optional)** | Cloud backup via Supabase |

---

## Design Principles

1. **One thumb, one minute** — every interaction must be completable with one hand on a phone in under 60 seconds.
2. **Nothing to configure before you start** — no account, no setup wizard.
3. **Your words, not ours** — the app surfaces your notes verbatim. AI only adds context on demand; it never rewrites or replaces what you wrote.
4. **Earn the notification** — only one push notification per day, only if the user set it up themselves.
5. **Data belongs to you** — export to JSON at any time. No lock-in.
