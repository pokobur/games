import { DiceState } from '../types/index.ts';

/** 1〜N のランダムな整数を返す (デフォルト6) */
export function randomDiceValue(sides: number = 6): number {
  return Math.floor(Math.random() * sides) + 1;
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

/** 最大値かどうかを判定する (各ダイスの面数、または指定面数と一致) */
export function isMaxValue(dice: DiceState[], sides?: number): boolean {
  if (dice.length === 0) return false;
  return dice.every((d) => {
    const targetMax = sides ?? d.sides ?? 6;
    return d.value === targetMax;
  });
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

/**
 * 数値を日本語のひらがな読みに変換する (1〜100+)
 * D20 × 3個 = 最大60、またはそれ以上にも完全対応
 */
export function getNumberWord(n: number): string {
  if (n <= 0) return 'ぜろ';
  if (n === 100) return 'ひゃく';
  if (n > 100) return `${n}`;

  const ones: Record<number, string> = {
    1: 'いち',
    2: 'に',
    3: 'さん',
    4: 'よん',
    5: 'ご',
    6: 'ろく',
    7: 'なな',
    8: 'はち',
    9: 'きゅう',
  };

  if (n <= 9) {
    return ones[n] || `${n}`;
  }

  const tenDigit = Math.floor(n / 10);
  const oneDigit = n % 10;

  let tenStr = '';
  if (tenDigit === 1) {
    tenStr = 'じゅう';
  } else {
    tenStr = `${ones[tenDigit]}じゅう`;
  }

  if (oneDigit === 0) {
    return tenStr;
  }

  return `${tenStr}${ones[oneDigit]}`;
}

/** スマホ端末のバイブレーション支援（対応端末のみ） */
export function triggerHaptic(type: 'tap' | 'roll' | 'success' | 'bounce' = 'tap'): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'tap') {
        navigator.vibrate(10);
      } else if (type === 'roll') {
        navigator.vibrate([15, 30, 20]);
      } else if (type === 'success') {
        navigator.vibrate([40, 60, 40, 60, 80]);
      } else if (type === 'bounce') {
        navigator.vibrate(25);
      }
    }
  } catch {
    // 振動非対応または権限なし時はサイレントに無視
  }
}
