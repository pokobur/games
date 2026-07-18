import { ThemeId, RollHistoryEntry } from '../types/index.ts';
import { getFace } from '../data/themes.ts';

/**
 * RollHistory — 直近のロール結果を横スクロールで表示
 * 最新が左端、最大10件保持。
 */
export class RollHistory {
  private el: HTMLElement;
  private scrollContainer: HTMLElement;
  private entries: RollHistoryEntry[] = [];
  private maxEntries = 10;
  private nextId = 0;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'roll-history';

    const label = document.createElement('div');
    label.className = 'roll-history-label';
    label.textContent = '📋 れきし';
    this.el.appendChild(label);

    this.scrollContainer = document.createElement('div');
    this.scrollContainer.className = 'roll-history-scroll';
    this.el.appendChild(this.scrollContainer);

    // 初期メッセージ
    this.showEmpty();

    container.appendChild(this.el);
  }

  /** ロール結果を追加する */
  addEntry(diceValues: number[], themeId: ThemeId, sum: number): void {
    this.entries.unshift({
      id: this.nextId++,
      diceValues,
      themeId,
      sum,
    });

    if (this.entries.length > this.maxEntries) {
      this.entries.pop();
    }

    this.render();
  }

  /** 履歴をクリアする */
  clear(): void {
    this.entries = [];
    this.nextId = 0;
    this.showEmpty();
  }

  /** カードを描画する */
  private render(): void {
    this.scrollContainer.innerHTML = '';

    for (const entry of this.entries) {
      const card = document.createElement('div');
      card.className = 'roll-history-card roll-history-card-enter';

      // サイコロの面を表示
      const facesEl = document.createElement('span');
      facesEl.className = 'roll-history-faces';
      const faceTexts = entry.diceValues.map(
        (v) => getFace(entry.themeId, v).display
      );
      facesEl.textContent = faceTexts.join(' ');
      card.appendChild(facesEl);

      // すうじテーマで2個以上なら合計値も表示
      if (entry.themeId === 'number' && entry.diceValues.length > 1) {
        const sumEl = document.createElement('span');
        sumEl.className = 'roll-history-sum';
        sumEl.textContent = `＝${entry.sum}`;
        card.appendChild(sumEl);
      }

      this.scrollContainer.appendChild(card);
    }
  }

  /** 空の状態を表示 */
  private showEmpty(): void {
    this.scrollContainer.innerHTML =
      '<span class="roll-history-empty">まだ ころがしてないよ</span>';
  }

  destroy(): void {
    this.el.remove();
  }
}
