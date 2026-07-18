/**
 * SplashScreen — アプリ起動時の「はじめる」画面
 * ユーザータップで AudioContext / SpeechSynthesis を初期化する。
 */
export class SplashScreen {
  private el: HTMLElement;
  private onStart: () => void;

  constructor(container: HTMLElement, onStart: () => void) {
    this.onStart = onStart;
    this.el = document.createElement('div');
    this.el.className = 'splash';
    this.el.innerHTML = `
      <div class="splash-dice-preview">
        <div class="splash-dice-mini">🎲</div>
        <div class="splash-dice-mini" style="animation-delay: 0.2s;">🎯</div>
        <div class="splash-dice-mini" style="animation-delay: 0.4s;">⭐</div>
      </div>
      <div class="splash-title">コロコロ<br>サイコロ</div>
      <button class="splash-start-btn" id="splash-start">🎲 はじめる！</button>
      <div class="splash-subtitle">タップして はじめよう！</div>
    `;
    container.appendChild(this.el);

    const btn = this.el.querySelector('#splash-start') as HTMLButtonElement;
    btn.addEventListener('click', this.handleStart.bind(this), { once: true });
  }

  private handleStart(): void {
    this.el.classList.add('splash-exit');
    this.onStart();
    setTimeout(() => {
      this.el.remove();
    }, 500);
  }

  destroy(): void {
    this.el.remove();
  }
}
