export type Attribute = 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';

export const ATTRIBUTES: Attribute[] = ['fire', 'water', 'earth', 'wind', 'light', 'dark'];

export interface ImageTransform {
  x: number;
  y: number;
  scale: number;
}

/** IndexedDB: cards テーブル */
export interface CardData {
  id: string; // UUID
  name: string; // カード名 (max 12文字)
  attribute: Attribute;
  level: number; // 1〜10
  subType: string; // 種族・タイプ (max 8文字)
  effectText: string; // 効果テキスト (max 80文字)
  atk: number; // 攻撃力
  hp: number; // 体力
  imageBlob: Blob | null; // アップロード画像データ（未設定時は null）
  imageTransform: ImageTransform;
  thumbnailDataUrl: string; // 一覧用軽量サムネイル
  createdAt: number;
  updatedAt: number;
}

/** IndexedDB: decks テーブル */
export interface DeckData {
  id: string;
  name: string;
  cards: { cardId: string; count: number }[];
  updatedAt: number;
}

export const LIMITS = {
  name: 12,
  subType: 8,
  effect: 80,
  effectLines: 5,
  statMax: 9999,
  levelMin: 1,
  levelMax: 10,
  scaleMin: 0.5,
  scaleMax: 2.5,
  offsetMax: 800,
  deckMax: 40,
} as const;
