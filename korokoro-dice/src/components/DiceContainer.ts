import { DiceCount, DiceState, ThemeId } from '../types/index.ts';
import { Dice } from './Dice.ts';

/**
 * DiceContainer — 複数のサイコロを管理するコンテナ
 * 個数変更、一括ロール、全停止検知を担当する。
 */
export class DiceContainer {
  private el: HTMLElement;
  private diceInstances: Dice[] = [];
  private _themeId: ThemeId;
  private _count: DiceCount;
  private pendingRolls = 0;

  /** 全サイコロの回転が完了した時のコールバック */
  public onAllComplete: ((dice: DiceState[]) => void) | null = null;

  /** 個別サイコロの回転完了時のコールバック (音用) */
  public onSingleComplete: ((id: number, value: number) => void) | null = null;

  constructor(container: HTMLElement, themeId: ThemeId, count: DiceCount) {
    this._themeId = themeId;
    this._count = count;

    this.el = document.createElement('div');
    this.el.className = 'dice-area';
    container.appendChild(this.el);

    this.createDice(count);
  }

  /** 現在のサイコロの状態を取得する */
  getDiceStates(): DiceState[] {
    return this.diceInstances.map((d) => ({
      id: d.id,
      value: d.value,
      isRolling: d.isRolling,
    }));
  }

  /** いずれかのサイコロがロール中かどうか */
  get isAnyRolling(): boolean {
    return this.diceInstances.some((d) => d.isRolling);
  }

  /** 全サイコロを一括ロールする */
  rollAll(): void {
    if (this.isAnyRolling) return;
    this.pendingRolls = this.diceInstances.length;
    for (const dice of this.diceInstances) {
      dice.roll();
    }
  }

  /** サイコロの個数を変更する */
  setDiceCount(count: DiceCount): void {
    if (count === this._count) return;
    if (this.isAnyRolling) return;

    const diff = count - this._count;
    this._count = count;

    if (diff > 0) {
      // 追加
      for (let i = 0; i < diff; i++) {
        this.addDie();
      }
    } else {
      // 削除
      for (let i = 0; i < -diff; i++) {
        this.removeLastDie();
      }
    }
  }

  /** テーマを変更する */
  setTheme(themeId: ThemeId): void {
    this._themeId = themeId;
    for (const dice of this.diceInstances) {
      dice.setTheme(themeId);
    }
  }

  /** 初期サイコロを生成する */
  private createDice(count: number): void {
    for (let i = 0; i < count; i++) {
      this.addDie();
    }
  }

  /** サイコロを1個追加する */
  private addDie(): void {
    const id = this.diceInstances.length;
    const dice = new Dice(this.el, id, this._themeId);
    dice.onRollComplete = this.handleRollComplete.bind(this);
    this.diceInstances.push(dice);
  }

  /** 末尾のサイコロを1個削除する */
  private removeLastDie(): void {
    const dice = this.diceInstances.pop();
    dice?.remove();
  }

  /** 個別ロール完了ハンドラ */
  private handleRollComplete(id: number, value: number): void {
    this.onSingleComplete?.(id, value);
    this.pendingRolls--;

    if (this.pendingRolls <= 0 && !this.isAnyRolling) {
      this.pendingRolls = 0;
      this.onAllComplete?.(this.getDiceStates());
    }
  }

  destroy(): void {
    for (const dice of this.diceInstances) {
      dice.destroy();
    }
    this.diceInstances = [];
    this.el.remove();
  }
}
