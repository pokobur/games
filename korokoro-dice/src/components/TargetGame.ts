import { getNumberWord } from '../utils/helpers.ts';

/** もくひょう値の選択肢 */
const TARGET_OPTIONS = [10, 15, 20];

/**
 * TargetGame — もくひょうゲームコンポーネント
 * 目標の数に合計を近づけるミニゲーム。
 * ぴったり → 祝福、こえちゃった → リセット促し。
 */
export class TargetGame {
  private el: HTMLElement;
  private barFill: HTMLElement;
  private totalText: HTMLElement;
  private messageText: HTMLElement;
  private rollCountText: HTMLElement;
  private resetBtn: HTMLButtonElement;
  private targetButtons: HTMLButtonElement[] = [];

  private _target = 10;
  private _currentTotal = 0;
  private _rollCount = 0;
  private _isComplete = false;

  /** ぴったり達成時のコールバック */
  public onExactHit: (() => void) | null = null;
  /** リセット時のコールバック */
  public onReset: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'target-game';
    this.el.style.display = 'none';

    // もくひょう選択
    const header = document.createElement('div');
    header.className = 'target-game-header';

    const label = document.createElement('span');
    label.className = 'target-game-label';
    label.textContent = '🎯 もくひょう';
    header.appendChild(label);

    const targets = document.createElement('div');
    targets.className = 'target-game-targets';
    for (const t of TARGET_OPTIONS) {
      const btn = document.createElement('button');
      btn.className = `control-btn${t === this._target ? ' active' : ''}`;
      btn.textContent = `${t}`;
      btn.addEventListener('click', () => {
        if (this._isComplete || this._rollCount > 0) return;
        this._target = t;
        this.updateTargetActive();
        this.updateDisplay();
      });
      targets.appendChild(btn);
      this.targetButtons.push(btn);
    }
    header.appendChild(targets);
    this.el.appendChild(header);

    // プログレスバー
    const barWrap = document.createElement('div');
    barWrap.className = 'target-game-bar';
    this.barFill = document.createElement('div');
    this.barFill.className = 'target-game-fill';
    barWrap.appendChild(this.barFill);
    this.el.appendChild(barWrap);

    // 合計 / メッセージ
    const status = document.createElement('div');
    status.className = 'target-game-status';

    this.totalText = document.createElement('div');
    this.totalText.className = 'target-game-total';

    this.messageText = document.createElement('div');
    this.messageText.className = 'target-game-message';

    this.rollCountText = document.createElement('div');
    this.rollCountText.className = 'target-game-rollcount';

    status.appendChild(this.totalText);
    status.appendChild(this.messageText);
    status.appendChild(this.rollCountText);
    this.el.appendChild(status);

    // リセットボタン
    this.resetBtn = document.createElement('button');
    this.resetBtn.className = 'target-game-reset';
    this.resetBtn.textContent = '🔄 もういちど！';
    this.resetBtn.style.display = 'none';
    this.resetBtn.addEventListener('click', () => {
      this.reset();
      this.onReset?.();
    });
    this.el.appendChild(this.resetBtn);

    container.appendChild(this.el);
    this.updateDisplay();
  }

  /** 表示する */
  show(): void {
    this.el.style.display = '';
  }

  /** 非表示にする */
  hide(): void {
    this.el.style.display = 'none';
  }

  /** ゲーム完了済みかどうか */
  get isComplete(): boolean {
    return this._isComplete;
  }

  /** ロール結果を加算する */
  addRoll(sum: number): void {
    if (this._isComplete) return;
    this._currentTotal += sum;
    this._rollCount++;
    this.updateDisplay();
    this.checkCompletion();
  }

  /** ゲームをリセットする */
  reset(): void {
    this._currentTotal = 0;
    this._rollCount = 0;
    this._isComplete = false;
    this.resetBtn.style.display = 'none';
    this.barFill.classList.remove('exact', 'bust');
    this.updateDisplay();
    // ロール中でなければ目標変更可能にする
    for (const btn of this.targetButtons) {
      btn.disabled = false;
    }
  }

  /** 表示を更新する */
  private updateDisplay(): void {
    const pct = Math.min((this._currentTotal / this._target) * 100, 110);
    this.barFill.style.width = `${Math.min(pct, 100)}%`;

    this.totalText.textContent = `${this._currentTotal} / ${this._target}`;

    if (this._rollCount === 0) {
      this.messageText.textContent = `${getNumberWord(this._target)} を めざそう！`;
      this.rollCountText.textContent = '';
    } else if (this._currentTotal === this._target) {
      this.messageText.textContent = '🎉 ぴったり！すごーい！';
      this.rollCountText.textContent = `${this._rollCount}かいで クリア！`;
    } else if (this._currentTotal > this._target) {
      const over = this._currentTotal - this._target;
      this.messageText.textContent = `😮 おしい！${over} こえちゃった！`;
      this.rollCountText.textContent = `${this._rollCount}かいめ`;
    } else {
      const remaining = this._target - this._currentTotal;
      this.messageText.textContent = `あと ${getNumberWord(remaining)}！がんばれ！`;
      this.rollCountText.textContent = `${this._rollCount}かいめ`;
    }
  }

  /** 完了チェック */
  private checkCompletion(): void {
    if (this._currentTotal >= this._target) {
      this._isComplete = true;
      this.resetBtn.style.display = '';
      // 目標変更を不可にする
      for (const btn of this.targetButtons) {
        btn.disabled = true;
      }

      if (this._currentTotal === this._target) {
        this.barFill.classList.add('exact');
        this.onExactHit?.();
      } else {
        this.barFill.classList.add('bust');
      }
    } else {
      // ロール開始したら目標変更を不可にする
      for (const btn of this.targetButtons) {
        btn.disabled = true;
      }
    }
  }

  /** 目標ボタンのアクティブ状態を更新する */
  private updateTargetActive(): void {
    this.targetButtons.forEach((btn, i) => {
      btn.classList.toggle('active', TARGET_OPTIONS[i] === this._target);
    });
  }

  destroy(): void {
    this.el.remove();
  }
}
