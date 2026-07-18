/** テーマの識別子 */
export type ThemeId = 'number' | 'animal' | 'color';

/** サイコロの1面分のデータ */
export interface ThemeFace {
  /** 数値 (1〜6) */
  value: number;
  /** 面に表示する内容 (数字 or 絵文字) */
  display: string;
  /** 読み上げ用テキスト */
  label: string;
}

/** テーマ定義 */
export interface Theme {
  id: ThemeId;
  /** ひらがな表示名 */
  name: string;
  /** テーマ選択用アイコン */
  emoji: string;
  /** 6面分のデータ */
  faces: ThemeFace[];
  /** 助数詞 (ひき、しゅるい、こ) */
  counter: string;
  /** 名詞 (どうぶつ、いろ) */
  noun: string;
}

/** サイコロ1個の状態 */
export interface DiceState {
  id: number;
  value: number;
  isRolling: boolean;
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
  sum: number;
}

/** アプリケーション全体の状態 */
export interface AppState {
  diceCount: DiceCount;
  currentTheme: ThemeId;
  gameMode: GameMode;
  dice: DiceState[];
  isAnyRolling: boolean;
  isStarted: boolean;
}
