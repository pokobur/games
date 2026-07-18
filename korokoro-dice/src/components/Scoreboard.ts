import { DiceState, ThemeId } from '../types/index.ts';
import { getTheme, getFace } from '../data/themes.ts';
import { buildSumText, calculateSum, getNumberWord } from '../utils/helpers.ts';

/**
 * Scoreboard — 合計値・結果表示コンポーネント
 * テーマに応じて計算式 or 個数カウントを表示する。
 */
export class Scoreboard {
  private el: HTMLElement;
  private formulaEl: HTMLElement;
  private labelEl: HTMLElement;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'scoreboard';

    this.formulaEl = document.createElement('div');
    this.formulaEl.className = 'scoreboard-formula';
    this.formulaEl.textContent = '🎲';

    this.labelEl = document.createElement('div');
    this.labelEl.className = 'scoreboard-label';
    this.labelEl.textContent = 'サイコロを ころがそう！';

    this.el.appendChild(this.formulaEl);
    this.el.appendChild(this.labelEl);
    container.appendChild(this.el);
  }

  /** ロール中の表示 */
  showRolling(): void {
    this.formulaEl.textContent = '🎲 ・・・';
    this.formulaEl.classList.remove('bounce');
    this.labelEl.textContent = 'コロコロ…';
  }

  /** 結果を更新する */
  update(dice: DiceState[], themeId: ThemeId): void {
    // バウンスアニメーション
    this.formulaEl.classList.remove('bounce');
    // リフロー発火
    void this.formulaEl.offsetWidth;
    this.formulaEl.classList.add('bounce');

    if (themeId === 'number') {
      this.updateNumber(dice);
    } else {
      this.updateTheme(dice, themeId);
    }
  }

  /** すうじテーマ: 計算式表示 */
  private updateNumber(dice: DiceState[]): void {
    if (dice.length === 1) {
      const word = getNumberWord(dice[0].value);
      this.formulaEl.textContent = `${dice[0].value}`;
      this.labelEl.textContent = `${word}！`;
    } else {
      this.formulaEl.textContent = buildSumText(dice);
      const total = calculateSum(dice);
      this.labelEl.textContent = `ごうけい ${getNumberWord(total)}！`;
    }
  }

  /** どうぶつ・いろテーマ: 個数カウント表示 */
  private updateTheme(dice: DiceState[], themeId: ThemeId): void {
    const theme = getTheme(themeId);
    const labels = dice.map((d) => getFace(themeId, d.value).display);

    this.formulaEl.textContent = labels.join('  ');

    if (dice.length === 1) {
      const face = getFace(themeId, dice[0].value);
      this.labelEl.textContent = `${face.label} が でたよ！`;
    } else {
      this.labelEl.textContent = `${dice.length} ${theme.counter}の ${theme.noun}が でたよ！`;
    }
  }

  /** 初期状態にリセットする */
  reset(): void {
    this.formulaEl.textContent = '🎲';
    this.formulaEl.classList.remove('bounce');
    this.labelEl.textContent = 'サイコロを ころがそう！';
  }

  destroy(): void {
    this.el.remove();
  }
}
