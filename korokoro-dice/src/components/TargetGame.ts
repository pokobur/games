import { getNumberWord, triggerHaptic } from '../utils/helpers.ts';

/**
 * TargetGame — もくひょうゲームコンポーネント
 * 多面体サイコロや個数に応じて動的に最適な目標値を提供。
 */
export class TargetGame {
  private el: HTMLElement;
  private barFill: HTMLElement;
  private totalText: HTMLElement;
  private messageText: HTMLElement;
  private rollCountText: HTMLElement;
  private resetBtn: HTMLButtonElement;
  private targetsWrap: HTMLElement;
  private targetButtons: HTMLButtonElement[] = [];

  private _targets = [10, 15, 20];
  private _target = 10;
  private _currentTotal = 0;
  private _rollCount = 0;
  private _isComplete = false;

  public onExactHit: (() => void) | null = null;
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

    this.targetsWrap = document.createElement('div');
    this.targetsWrap.className = 'target-game-targets';
    header.appendChild(this.targetsWrap);
    this.el.appendChild(header);

    this.rebuildTargetButtons();

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
      triggerHaptic('tap');
      this.reset();
      this.onReset?.();
    });
    this.el.appendChild(this.resetBtn);

    container.appendChild(this.el);
    this.updateDisplay();
  }

  /** サイコロの面数と個数に合わせて目標値を動的に調整 */
  setDiceConfig(diceCount: number, sides: number): void {
    const avgOneRoll = diceCount * ((sides + 1) / 2);
    // 2回、3回、4回振ったあたりのキリの良い数値
    const t1 = Math.max(5, Math.round((avgOneRoll * 1.8) / 5) * 5);
    const t2 = Math.max(t1 + 5, Math.round((avgOneRoll * 2.8) / 5) * 5);
    const t3 = Math.max(t2 + 5, Math.round((avgOneRoll * 4.0) / 5) * 5);

    this._targets = [t1, t2, t3];
    if (!this._targets.includes(this._target)) {
      this._target = this._targets[0];
    }
    this.rebuildTargetButtons();
    this.reset();
  }

  show(): void {
    this.el.style.display = '';
  }

  hide(): void {
    this.el.style.display = 'none';
  }

  get isComplete(): boolean {
    return this._isComplete;
  }

  addRoll(sum: number): void {
    if (this._isComplete) return;
    this._currentTotal += sum;
    this._rollCount++;
    this.updateDisplay();
    this.checkCompletion();
  }

  reset(): void {
    this._currentTotal = 0;
    this._rollCount = 0;
    this._isComplete = false;
    this.resetBtn.style.display = 'none';
    this.barFill.classList.remove('exact', 'bust');
    this.updateDisplay();
    for (const btn of this.targetButtons) {
      btn.disabled = false;
    }
  }

  private rebuildTargetButtons(): void {
    this.targetsWrap.innerHTML = '';
    this.targetButtons = [];

    for (const t of this._targets) {
      const btn = document.createElement('button');
      btn.className = `control-btn${t === this._target ? ' active' : ''}`;
      btn.textContent = `${t}`;
      btn.addEventListener('click', () => {
        if (this._isComplete || this._rollCount > 0) return;
        triggerHaptic('tap');
        this._target = t;
        this.updateTargetActive();
        this.updateDisplay();
      });
      this.targetsWrap.appendChild(btn);
      this.targetButtons.push(btn);
    }
  }

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

  private checkCompletion(): void {
    if (this._currentTotal >= this._target) {
      this._isComplete = true;
      this.resetBtn.style.display = '';
      for (const btn of this.targetButtons) {
        btn.disabled = true;
      }

      if (this._currentTotal === this._target) {
        this.barFill.classList.add('exact');
        triggerHaptic('success');
        this.onExactHit?.();
      } else {
        this.barFill.classList.add('bust');
        triggerHaptic('bounce');
      }
    } else {
      for (const btn of this.targetButtons) {
        btn.disabled = true;
      }
    }
  }

  private updateTargetActive(): void {
    this.targetButtons.forEach((btn, i) => {
      btn.classList.toggle('active', this._targets[i] === this._target);
    });
  }

  destroy(): void {
    this.el.remove();
  }
}
