import { DiceState } from '../types/index.ts';

/** 1〜6 のランダムな整数を返す */
export function randomDiceValue(): number {
  return Math.floor(Math.random() * 6) + 1;
}

/** ぞろ目かどうかを判定する (2個以上) */
export function isZorome(dice: DiceState[]): boolean {
  if (dice.length < 2) return false;
  return dice.every((d) => d.value === dice[0].value);
}

/** 合計値を計算する */
export function calculateSum(dice: DiceState[]): number {
  return dice.reduce((sum, d) => sum + d.value, 0);
}

/** 最大値かどうかを判定する */
export function isMaxValue(dice: DiceState[]): boolean {
  return dice.every((d) => d.value === 6);
}

/** 数字テーマ用: 計算式テキストを生成する (例: 2 ＋ 3 ＝ 5) */
export function buildSumText(dice: DiceState[]): string {
  if (dice.length === 1) {
    return `${dice[0].value}`;
  }
  const parts = dice.map((d) => `${d.value}`).join(' ＋ ');
  const total = calculateSum(dice);
  return `${parts} ＝ ${total}`;
}

/** 数値を日本語の読みに変換する (1〜18) */
export function getNumberWord(n: number): string {
  const words: Record<number, string> = {
    1: 'いち',
    2: 'に',
    3: 'さん',
    4: 'よん',
    5: 'ご',
    6: 'ろく',
    7: 'なな',
    8: 'はち',
    9: 'きゅう',
    10: 'じゅう',
    11: 'じゅういち',
    12: 'じゅうに',
    13: 'じゅうさん',
    14: 'じゅうよん',
    15: 'じゅうご',
    16: 'じゅうろく',
    17: 'じゅうなな',
    18: 'じゅうはち',
  };
  return words[n] || `${n}`;
}
