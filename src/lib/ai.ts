import type { Note, Book, NoteContext } from './types';
import { saveContext, uuid } from './db';

export async function generateNoteContext(
  note: Note,
  book: Book,
  apiKey: string,
  modelId: string,
  isRetry = false
): Promise<NoteContext> {
  const system = `You help readers understand and apply insights from non-fiction books.
Given a captured note, return ONLY valid JSON with exactly these three fields:
- "meaning": 1–2 sentences explaining the concept in plain language
- "whyItMatters": the core reason this insight is worth remembering
- "applied": ${note.type === 'action_item' ? 'what doing this looks like in practice' : 'when this insight is most relevant to recall'}`;

  const user = `Book: "${book.title}"${book.author ? ` by ${book.author}` : ''}
Type: ${note.type === 'action_item' ? 'Action item' : 'Reminder'}
Note: "${note.content}"${isRetry ? '\n\nProvide a distinctly different angle from the most obvious interpretation.' : ''}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 512,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as any;
    throw new Error(err?.error?.message ?? `API error ${res.status}`);
  }

  const data = await res.json();
  const parsed = JSON.parse(data.content[0].text);

  const ctx: NoteContext = {
    id: uuid(),
    noteId: note.id,
    meaning: parsed.meaning,
    whyItMatters: parsed.whyItMatters,
    applied: parsed.applied,
    generatedAt: Date.now(),
  };

  await saveContext(ctx);
  return ctx;
}
