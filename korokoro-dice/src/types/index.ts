/** テーマの識別子 */
export type ThemeId = 'number' | 'animal' | 'color' | 'fruit' | 'vehicle';

/** 多面体サイコロの種類 */
export type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

/** 多面体サイコロの定義情報 */
export interface DiceTypeDef {
  type: DiceType;
  sides: number;
  name: string;        // "4めん", "6めん", etc.
  label: string;       // ひらがな表示名 "よんめん", "ろくめん", etc.
  badge: string;       // "D4", "D6", etc.
  description: string; // "1〜4までの さんかくサイコロ"
}

/** サイコロの1面分のデータ */
export interface ThemeFace {
  /** 数値 (1〜N) */
  value: number;
  /** 面に表示する内容 (数字 or 絵文字) */
  display: string;
  /** 読み上げ/名前用テキスト (ひらがな) */
  label: string;
  /** なかみ一覧用のひとこと説明 */
  desc?: string;
}

/** テーマ定義 */
export interface Theme {
  id: ThemeId;
  /** ひらがな表示名 */
  name: string;
  /** テーマ選択用アイコン */
  emoji: string;
  /** 面データ */
  faces: ThemeFace[];
  /** 助数詞 (ひき、しゅるい、こ、だい) */
  counter: string;
  /** 名詞 (どうぶつ、いろ、くだもの、のりもの) */
  noun: string;
}

/** サイコロ1個の状態 */
export interface DiceState {
  id: number;
  value: number;
  isRolling: boolean;
  diceType: DiceType;
  sides: number;
}

/** サイコロの個数 */
export type DiceCount = 1 | 2 | 3;

/** ゲームモード */
export type GameMode = 'normal' | 'target';

/** ロール履歴の1エントリ */
export interface RollHistoryEntry {
  id: number;
  diceValues: number[];
  themeId: ThemeId;
  diceType: DiceType;
  sum: number;
}

/** アプリケーション全体の状態 */
export interface AppState {
  diceCount: DiceCount;
  currentTheme: ThemeId;
  diceType: DiceType;
  gameMode: GameMode;
  dice: DiceState[];
  isAnyRolling: boolean;
  isStarted: boolean;
}
