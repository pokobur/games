import { ThemeId } from '../types/index.ts';
import { getFace } from '../data/themes.ts';
import { randomDiceValue } from '../utils/helpers.ts';

/**
 * 3Dサイコロ回転時のターゲット回転角マップ
 * 各面を正面に向けるための rotateX / rotateY の値
 */
const FACE_ROTATIONS: Record<number, { x: number; y: number }> = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -180 },
  3: { x: 0, y: -90 },
  4: { x: 0, y: 90 },
  5: { x: -90, y: 0 },
  6: { x: 90, y: 0 },
};

/**
 * Dice — 単体の3Dサイコロコンポーネント
 * CSS 3D Transforms で立体的に描画し、ロールアニメーションを行う。
 */
export class Dice {
  private scene: HTMLElement;
  private cube: HTMLElement;
  private shadow: HTMLElement;
  private wrapper: HTMLElement;
  private faces: HTMLElement[] = [];

  private _id: number;
  private _value: number;
  private _isRolling = false;
  private _themeId: ThemeId;
  private spinCount = 0; // ロールごとに回転量を蓄積して方向感を出す

  public onRollComplete: ((id: number, value: number) => void) | null = null;

  constructor(container: HTMLElement, id: number, themeId: ThemeId) {
    this._id = id;
    this._themeId = themeId;
    this._value = randomDiceValue();

    // ラッパー (入退場アニメーション用)
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'dice-enter';
    this.wrapper.style.display = 'flex';
    this.wrapper.style.flexDirection = 'column';
    this.wrapper.style.alignItems = 'center';

    // 3Dシーン
    this.scene = document.createElement('div');
    this.scene.className = 'dice-scene';

    // 3Dキューブ
    this.cube = document.createElement('div');
    this.cube.className = 'dice-cube';

    // 6面を生成
    for (let i = 1; i <= 6; i++) {
      const face = document.createElement('div');
      face.className = `dice-face dice-face--${i}`;
      const content = document.createElement('span');
      content.className = 'dice-face-content';
      face.appendChild(content);
      this.cube.appendChild(face);
      this.faces.push(face);
    }

    this.scene.appendChild(this.cube);

    // 影
    this.shadow = document.createElement('div');
    this.shadow.className = 'dice-shadow';

    this.wrapper.appendChild(this.scene);
    this.wrapper.appendChild(this.shadow);
    container.appendChild(this.wrapper);

    // 面のコンテンツを初期設定
    this.updateFaces();
    this.showFace(this._value, false);

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

  /** テーマを切り替える */
  setTheme(themeId: ThemeId): void {
    this._themeId = themeId;
    this.updateFaces();
    this.showFace(this._value, false);
  }

  /** サイコロをロールする */
  roll(): void {
    if (this._isRolling) return;
    this._isRolling = true;

    // ロールアニメーション開始
    this.cube.classList.add('rolling');
    this.shadow.classList.add('rolling');
    this.cube.style.transition = 'none';

    // ロール時間 (1.0〜1.5秒のランダム)
    const rollDuration = 1000 + Math.random() * 500;

    setTimeout(() => {
      // 新しい値を決定
      this._value = randomDiceValue();
      this.spinCount += 2;

      // ロールアニメーションを停止し、ターゲット面に遷移
      this.cube.classList.remove('rolling');
      this.shadow.classList.remove('rolling');
      this.showFace(this._value, true);

      // 遷移完了後にコールバック
      setTimeout(() => {
        this._isRolling = false;
        this.onRollComplete?.(this._id, this._value);
      }, 500);
    }, rollDuration);
  }

  /** 退場アニメーション付きで削除する */
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

  /** 即座に削除する */
  destroy(): void {
    this.wrapper.remove();
  }

  /** 面のコンテンツを更新する */
  private updateFaces(): void {
    const isNumber = this._themeId === 'number';
    for (let i = 0; i < 6; i++) {
      const faceData = getFace(this._themeId, i + 1);
      const content = this.faces[i].querySelector('.dice-face-content') as HTMLElement;
      content.textContent = faceData.display;
      content.classList.toggle('is-number', isNumber);
    }
  }

  /** 指定した面を正面に向ける */
  private showFace(value: number, animate: boolean): void {
    const rot = FACE_ROTATIONS[value];
    // spinCount で余分な360度回転を加えて「たくさん回った感」を出す
    const extraX = this.spinCount * 360;
    const extraY = this.spinCount * 360;

    if (animate) {
      this.cube.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
    } else {
      this.cube.style.transition = 'none';
    }

    this.cube.style.transform = `rotateX(${rot.x + extraX}deg) rotateY(${rot.y + extraY}deg)`;
  }
}
