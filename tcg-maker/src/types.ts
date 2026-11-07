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
  rarity: number; // レア度: 1〜10 (星の数)
  level: number; // レベル: 1〜99
  subType: string; // 種族・タイプ (max 8文字)
  effectText: string; // 効果テキスト (max 80文字)
  atk: number; // 攻撃力
  hp: number; // 体力
  serialCode: string; // ランダム5桁のカード番号 (例: "04829")
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

/** 印刷設定 */
export type CardSizePreset = 'standard' | 'mini' | 'custom';

export interface PrintSettings {
  preset: CardSizePreset;
  widthMm: number; // standard: 63, mini: 59
  heightMm: number; // standard: 88, mini: 86
  gapMm: number;
  cropMarks: boolean;
  backs: boolean;
}

export const DEFAULT_PRINT_SETTINGS: PrintSettings = {
  preset: 'standard',
  widthMm: 63,
  heightMm: 88,
  gapMm: 2,
  cropMarks: true,
  backs: false,
};

export const LIMITS = {
  name: 12,
  subType: 8,
  effect: 80,
  effectLines: 5,
  statMax: 999999,
  rarityMin: 1,
  rarityMax: 10,
  levelMin: 1,
  levelMax: 99,
  scaleMin: 0.5,
  scaleMax: 2.5,
  offsetMax: 800,
  deckMax: 40,
} as const;
