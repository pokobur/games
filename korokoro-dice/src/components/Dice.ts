import { DiceType, ThemeId } from '../types/index.ts';
import { DICE_TYPES, getFace } from '../data/themes.ts';
import { randomDiceValue, triggerHaptic } from '../utils/helpers.ts';

/**
 * 6面体サイコロ回転時のターゲット回転角マップ
 * 各面を正面に向けるための rotateX / rotateY の値
 */
const FACE_ROTATIONS_D6: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -180 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: -90, y: 0 },
  6: { x: 90, y: 0 },
};

/**
 * Dice — 単体のサイコロコンポーネント
 * D6キューブおよび D4/D8/D10/D12/D20 多面体に対応。
 */
export class Dice {
  private wrapper: HTMLElement;
  private scene: HTMLElement;
  private shapeEl: HTMLElement;
  private shadow: HTMLElement;
  private badgeEl: HTMLElement;
  private cubeFaces: HTMLElement[] = [];
  private polyDisplayEl: HTMLElement | null = null;

  private _id: number;
  private _value: number;
  private _isRolling = false;
  private _themeId: ThemeId;
  private _diceType: DiceType;
  private spinCount = 0;
  private tickerInterval: number | null = null;

  public onRollStart: ((id: number) => void) | null = null;
  public onRollComplete: ((id: number, value: number) => void) | null = null;

  constructor(container: HTMLElement, id: number, themeId: ThemeId, diceType: DiceType = 'd6') {
    this._id = id;
    this._themeId = themeId;
    this._diceType = diceType;
    this._value = randomDiceValue(this.sides);

    // ラッパー
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'dice-wrapper dice-enter';

    // バッジ (D4, D8, D20など多面体時に表示)
    this.badgeEl = document.createElement('div');
    this.badgeEl.className = 'dice-type-badge';
    this.wrapper.appendChild(this.badgeEl);

    // 3Dシーン
    this.scene = document.createElement('div');
    this.scene.className = 'dice-scene';

    // サイコロ本体エレメント
    this.shapeEl = document.createElement('div');
    this.shapeEl.className = 'dice-body';
    this.scene.appendChild(this.shapeEl);

    // 影
    this.shadow = document.createElement('div');
    this.shadow.className = 'dice-shadow';

    this.wrapper.appendChild(this.scene);
    this.wrapper.appendChild(this.shadow);
    container.appendChild(this.wrapper);

    // 初期ビルド
    this.buildShapeDOM();
    this.updateBadge();

    // 個別タップでロール
    this.scene.addEventListener('click', () => {
      if (!this._isRolling) {
        this.roll();
      }
    });
  }

  get id(): number {
    return this._id;
  }

  get value(): number {
    return this._value;
  }

  get isRolling(): boolean {
    return this._isRolling;
  }

  get diceType(): DiceType {
    return this._diceType;
  }

  get sides(): number {
    if (this._themeId !== 'number') return 6;
    return DICE_TYPES[this._diceType]?.sides || 6;
  }

  /** テーマを切り替える */
  setTheme(themeId: ThemeId): void {
    this._themeId = themeId;
    if (this._themeId !== 'number') {
      this._diceType = 'd6';
    }
    this.buildShapeDOM();
    this.updateBadge();
    this.renderCurrentValue(false);
  }

  /** サイコロ種別（多面体）を切り替える */
  setDiceType(diceType: DiceType): void {
    if (this._diceType === diceType) return;
    this._diceType = diceType;
    this._value = Math.min(this._value, this.sides);
    if (this._value < 1) this._value = randomDiceValue(this.sides);

    this.buildShapeDOM();
    this.updateBadge();
    this.renderCurrentValue(false);
  }

  /** サイコロをロールする */
  roll(): void {
    if (this._isRolling) return;
    this._isRolling = true;
    this.onRollStart?.(this._id);
    triggerHaptic('roll');

    this.shapeEl.classList.add('rolling');
    this.shadow.classList.add('rolling');

    const isD6Mode = this._themeId !== 'number' || this._diceType === 'd6';

    if (isD6Mode) {
      this.shapeEl.style.transition = 'none';
    } else {
      // 多面体ロール中は数字を高速パラパラ表示
      this.startPolyTicker();
    }

    // ロール時間 (0.9〜1.3秒)
    const rollDuration = 900 + Math.random() * 400;

    setTimeout(() => {
      // 新しい値を決定
      this._value = randomDiceValue(this.sides);
      this.spinCount += 2;

      this.stopPolyTicker();
      this.shapeEl.classList.remove('rolling');
      this.shadow.classList.remove('rolling');

      this.renderCurrentValue(true);
      triggerHaptic('bounce');

      // アニメーション完了後に通知
      setTimeout(() => {
        this._isRolling = false;
        this.onRollComplete?.(this._id, this._value);
      }, 500);
    }, rollDuration);
  }

  /** バッジの表示切り替え */
  private updateBadge(): void {
    if (this._themeId === 'number' && this._diceType !== 'd6') {
      this.badgeEl.textContent = DICE_TYPES[this._diceType].badge;
      this.badgeEl.style.display = 'block';
    } else {
      this.badgeEl.style.display = 'none';
    }
  }

  /** サイコロ本体のDOM構築（D6キューブ or 多面体ポリゴン） */
  private buildShapeDOM(): void {
    this.shapeEl.innerHTML = '';
    this.cubeFaces = [];
    this.polyDisplayEl = null;

    const isD6Cube = this._themeId !== 'number' || this._diceType === 'd6';

    if (isD6Cube) {
      // 3Dキューブ
      this.shapeEl.className = 'dice-cube dice-cube-d6';
      for (let i = 1; i <= 6; i++) {
        const face = document.createElement('div');
        face.className = `dice-face dice-face--${i}`;
        const content = document.createElement('span');
        content.className = 'dice-face-content';
        face.appendChild(content);
        this.shapeEl.appendChild(face);
        this.cubeFaces.push(face);
      }
      this.updateCubeFaces();
    } else {
      // 多面体ポリゴン
      this.shapeEl.className = `dice-poly dice-poly--${this._diceType}`;

      const facetWrapper = document.createElement('div');
      facetWrapper.className = 'dice-poly-facets';

      // 多面体の中央数字表示
      this.polyDisplayEl = document.createElement('span');
      this.polyDisplayEl.className = 'dice-poly-value';
      facetWrapper.appendChild(this.polyDisplayEl);

      this.shapeEl.appendChild(facetWrapper);
    }
  }

  /** D6キューブの各面テキスト更新 */
  private updateCubeFaces(): void {
    const isNumber = this._themeId === 'number';
    for (let i = 0; i < 6; i++) {
      const faceData = getFace(this._themeId, i + 1, this._diceType);
      const content = this.cubeFaces[i]?.querySelector('.dice-face-content') as HTMLElement;
      if (content) {
        content.textContent = faceData.display;
        content.classList.toggle('is-number', isNumber);
      }
    }
  }

  /** 現在の出目をレンダリング */
  private renderCurrentValue(animate: boolean): void {
    const isD6Cube = this._themeId !== 'number' || this._diceType === 'd6';

    if (isD6Cube) {
      this.updateCubeFaces();
      const rot = FACE_ROTATIONS_D6[this._value] || { x: 0, y: 0 };
      const extraX = this.spinCount * 360;
      const extraY = this.spinCount * 360;

      if (animate) {
        this.shapeEl.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
      } else {
        this.shapeEl.style.transition = 'none';
      }
      this.shapeEl.style.transform = `rotateX(${rot.x + extraX}deg) rotateY(${rot.y + extraY}deg)`;
    } else {
      // 多面体
      if (this.polyDisplayEl) {
        this.polyDisplayEl.textContent = `${this._value}`;
        if (animate) {
          this.polyDisplayEl.classList.remove('pop-value');
          void this.polyDisplayEl.offsetWidth;
          this.polyDisplayEl.classList.add('pop-value');
        }
      }
      if (animate) {
        this.shapeEl.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
        this.shapeEl.style.transform = `rotate(${this.spinCount * 180}deg) scale(1)`;
      } else {
        this.shapeEl.style.transition = 'none';
        this.shapeEl.style.transform = 'none';
      }
    }
  }

  /** 多面体ロール中の数字パラパラ演出 */
  private startPolyTicker(): void {
    this.stopPolyTicker();
    if (!this.polyDisplayEl) return;
    this.tickerInterval = window.setInterval(() => {
      const randomVal = randomDiceValue(this.sides);
      if (this.polyDisplayEl) {
        this.polyDisplayEl.textContent = `${randomVal}`;
      }
    }, 80);
  }

  private stopPolyTicker(): void {
    if (this.tickerInterval !== null) {
      clearInterval(this.tickerInterval);
      this.tickerInterval = null;
    }
  }

  /** 退場アニメーション付きで削除 */
  remove(): Promise<void> {
    return new Promise((resolve) => {
      this.wrapper.classList.remove('dice-enter');
      this.wrapper.classList.add('dice-exit');
      setTimeout(() => {
        this.wrapper.remove();
        resolve();
      }, 300);
    });
  }

  destroy(): void {
    this.stopPolyTicker();
    this.wrapper.remove();
  }
}
