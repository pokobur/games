import { store, on } from './store';
import { THEMES } from './theme';

export function renderHomeStats(): void {
  const cardCountEl = document.querySelector('#homeCardCount');
  const deckCountEl = document.querySelector('#homeDeckCount');
  if (cardCountEl) cardCountEl.textContent = String(store.cards.length);
  if (deckCountEl) deckCountEl.textContent = String(store.decks.length);

  // タイトル画面のカードプレビュー（保存済みカードがあれば最新を表示、なければ属性サンプル）
  const fan = document.querySelector<HTMLElement>('#homeCardFan');
  if (!fan) return;

  const recent = store.cards.slice(0, 3);
  if (recent.length > 0) {
    fan.innerHTML = recent
      .map(
        (c, i) => `
        <div class="home-card-item card-pos-${i}" style="--theme-color: ${THEMES[c.attribute].base};">
          <img src="${c.thumbnailDataUrl}" alt="${c.name}">
        </div>
      `,
      )
      .join('');
  } else {
    // 初期状態のデモカード展示
    fan.innerHTML = `
      <div class="home-card-item card-pos-0 demo-fire">
        <div class="demo-card-inner"><span>炎</span><strong>竜騎士</strong></div>
      </div>
      <div class="home-card-item card-pos-1 demo-dark">
        <div class="demo-card-inner"><span>闇</span><strong>魔導王</strong></div>
      </div>
      <div class="home-card-item card-pos-2 demo-light">
        <div class="demo-card-inner"><span>光</span><strong>天使</strong></div>
      </div>
    `;
  }
}

export function initHome(): void {
  on('cards', renderHomeStats);
  on('decks', renderHomeStats);
  renderHomeStats();
}
