import { db } from './db';
import type { CardData, DeckData } from './types';
import { LIMITS } from './types';
import { uuid } from './utils';

type EventName = 'cards' | 'decks' | 'current-deck';
type Listener = () => void;

const listeners = new Map<EventName, Set<Listener>>();

export function on(event: EventName, fn: Listener): void {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event)!.add(fn);
}

function emit(event: EventName): void {
  listeners.get(event)?.forEach((fn) => fn());
}

/** アプリ全体で共有するキャッシュ */
export const store = {
  cards: [] as CardData[],
  decks: [] as DeckData[],
  currentDeckId: localStorage.getItem('tcg.currentDeck') ?? '',
};

export function getCard(id: string): CardData | undefined {
  return store.cards.find((c) => c.id === id);
}

export async function refreshCards(): Promise<void> {
  store.cards = await db.cards.orderBy('updatedAt').reverse().toArray();
  emit('cards');
}

export async function refreshDecks(): Promise<void> {
  store.decks = await db.decks.orderBy('updatedAt').reverse().toArray();
  if (!store.decks.some((d) => d.id === store.currentDeckId)) {
    setCurrentDeck(store.decks[0]?.id ?? '');
  }
  emit('decks');
}

export function setCurrentDeck(id: string): void {
  store.currentDeckId = id;
  localStorage.setItem('tcg.currentDeck', id);
  emit('current-deck');
}

export function currentDeck(): DeckData | undefined {
  return store.decks.find((d) => d.id === store.currentDeckId);
}

/* ---------------- Cards ---------------- */

export async function saveCard(card: CardData): Promise<void> {
  await db.cards.put(card);
  await refreshCards();
}

export async function deleteCard(id: string): Promise<void> {
  await db.transaction('rw', db.cards, db.decks, async () => {
    await db.cards.delete(id);
    // デッキからも除去
    const decks = await db.decks.toArray();
    for (const d of decks) {
      if (d.cards.some((c) => c.cardId === id)) {
        d.cards = d.cards.filter((c) => c.cardId !== id);
        d.updatedAt = Date.now();
        await db.decks.put(d);
      }
    }
  });
  await Promise.all([refreshCards(), refreshDecks()]);
}

/* ---------------- Decks ---------------- */

export function deckTotal(deck: DeckData): number {
  return deck.cards.reduce((s, c) => s + c.count, 0);
}

export async function createDeck(name: string): Promise<DeckData> {
  const deck: DeckData = { id: uuid(), name, cards: [], updatedAt: Date.now() };
  await db.decks.put(deck);
  store.currentDeckId = deck.id;
  localStorage.setItem('tcg.currentDeck', deck.id);
  await refreshDecks();
  emit('current-deck');
  return deck;
}

export async function updateDeck(deck: DeckData): Promise<void> {
  deck.updatedAt = Date.now();
  await db.decks.put(deck);
  await refreshDecks();
}

export async function deleteDeck(id: string): Promise<void> {
  await db.decks.delete(id);
  await refreshDecks();
}

/** デッキ内の枚数を増減。結果メッセージ（上限など）を返す */
export async function changeDeckCount(deckId: string, cardId: string, delta: number): Promise<string | null> {
  const deck = store.decks.find((d) => d.id === deckId);
  if (!deck) return 'デッキが選択されていません';
  const total = deckTotal(deck);
  if (delta > 0 && total + delta > LIMITS.deckMax) {
    return `デッキは最大${LIMITS.deckMax}枚までです`;
  }
  const entry = deck.cards.find((c) => c.cardId === cardId);
  if (entry) {
    entry.count += delta;
    if (entry.count <= 0) deck.cards = deck.cards.filter((c) => c !== entry);
  } else if (delta > 0) {
    deck.cards.push({ cardId, count: delta });
  }
  await updateDeck(deck);
  return null;
}

/** 現在のデッキが無ければ作成して返す */
export async function ensureCurrentDeck(): Promise<DeckData> {
  return currentDeck() ?? (await createDeck('マイデッキ'));
}
