import confetti from 'canvas-confetti';
import { triggerHaptic } from '../utils/helpers.ts';

/**
 * CelebrationOverlay — ぞろ目・最大値獲得時の演出
 * canvas-confetti で紙吹雪を降らせ、ポップアップで祝福する。
 */
export class CelebrationOverlay {
  private overlay: HTMLElement | null = null;

  /** ぞろ目演出を表示する */
  celebrateZorome(faceDisplay: string): void {
    triggerHaptic('success');
    this.fireConfetti();
    this.showPopup({
      emoji: faceDisplay + faceDisplay + faceDisplay,
      title: 'ぞろめだ！',
      sub: 'すごーい！おめでとう！🎉',
    });
  }

  /** 最大値演出を表示する (全部最大値) */
  celebrateMax(diceCount: number, maxSide: number = 6): void {
    triggerHaptic('success');
    this.fireConfetti();
    this.fireConfetti(); // 二重紙吹雪
    const maxVals = Array(diceCount).fill(`${maxSide}`).join(' ');
    this.showPopup({
      emoji: '👑',
      title: 'さいこう！',
      sub: `ぜんぶ ${maxSide}！（${maxVals}）ミラクル！✨`,
    });
  }

  /** 紙吹雪を発射する */
  private fireConfetti(): void {
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 80,
      origin: { x: 0, y: 0.7 },
      colors: ['#FF6B9D', '#FF9A56', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6'],
      disableForReducedMotion: true,
    });
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 80,
      origin: { x: 1, y: 0.7 },
      colors: ['#FF6B9D', '#FF9A56', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6'],
      disableForReducedMotion: true,
    });
  }

  /** ポップアップを表示する */
  private showPopup(opts: { emoji: string; title: string; sub: string }): void {
    this.dismiss();

    this.overlay = document.createElement('div');
    this.overlay.className = 'celebration-overlay';
    this.overlay.innerHTML = `
      <div class="celebration-card">
        <div class="celebration-emoji">${opts.emoji}</div>
        <div class="celebration-title">${opts.title}</div>
        <div class="celebration-sub">${opts.sub}</div>
        <button class="celebration-dismiss" id="celebration-dismiss">やったー！</button>
      </div>
    `;

    document.body.appendChild(this.overlay);

    const dismissBtn = this.overlay.querySelector('#celebration-dismiss') as HTMLButtonElement;
    dismissBtn.addEventListener('click', () => {
      triggerHaptic('tap');
      this.dismiss();
    }, { once: true });

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.dismiss();
      }
    });
  }

  /** オーバーレイを閉じる */
  private dismiss(): void {
    if (!this.overlay) return;
    const overlay = this.overlay;
    overlay.classList.add('celebration-exit');
    setTimeout(() => {
      overlay.remove();
    }, 300);
    this.overlay = null;
  }

  destroy(): void {
    this.dismiss();
  }
}
