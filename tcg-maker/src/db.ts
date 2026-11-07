import Dexie, { type Table } from 'dexie';
import type { CardData, DeckData } from './types';

class TcgDatabase extends Dexie {
  cards!: Table<CardData, string>;
  decks!: Table<DeckData, string>;

  constructor() {
    super('tcg-card-maker');
    this.version(1).stores({
      cards: 'id, name, attribute, level, atk, hp, createdAt, updatedAt',
      decks: 'id, name, updatedAt',
    });
  }
}

export const db = new TcgDatabase();

/** ブラウザによるストレージ自動削除を避けるため永続化をリクエスト */
export async function requestPersistence(): Promise<void> {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
      await navigator.storage.persist();
    }
  } catch {
    /* noop */
  }
}
