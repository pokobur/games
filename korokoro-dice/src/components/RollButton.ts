/**
 * RollButton — メインロールボタン
 * 画面下部に大きく表示。3Dプレスエフェクト付き。
 */
export class RollButton {
  private el: HTMLElement;
  private btn: HTMLButtonElement;
  private icon: HTMLSpanElement;

  /** ロールボタン押下時のコールバック */
  public onClick: (() => void) | null = null;

  constructor(container: HTMLElement) {
    this.el = document.createElement('div');
    this.el.className = 'roll-btn-wrapper';

    this.btn = document.createElement('button');
    this.btn.className = 'roll-btn';
    this.btn.id = 'roll-all';

    this.icon = document.createElement('span');
    this.icon.className = 'roll-btn-icon';
    this.icon.textContent = '🎲';

    const label = document.createElement('span');
    label.textContent = 'ころがす！';

    this.btn.appendChild(this.icon);
    this.btn.appendChild(label);
    this.el.appendChild(this.btn);
    container.appendChild(this.el);

    this.btn.addEventListener('click', () => {
      if (!this.btn.disabled) {
        this.onClick?.();
      }
    });
  }

  /** ロール中状態にする */
  setRolling(rolling: boolean): void {
    this.btn.disabled = rolling;
    this.icon.classList.toggle('spinning', rolling);
  }

  destroy(): void {
    this.el.remove();
  }
}
