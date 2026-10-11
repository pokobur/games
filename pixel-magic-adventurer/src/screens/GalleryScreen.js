/**
 * GalleryScreen.js — ギャラリー（光るコレクション）画面
 */
import { loadGallery, deleteFromGallery } from '../logic/storage.js';
import { soundManager } from '../components/SoundManager.js';

export function createGalleryScreen({ onBack, onNewArt, onReplay }) {
  const screen = document.createElement('div');
  screen.id = 'screen-gallery';
  screen.className = 'screen';
  screen.innerHTML = `
    <div class="screen-header">
      <button class="back-btn" id="gallery-back" aria-label="もどる">◀</button>
      <h1>🌟 ひかるコレクション</h1>
      <button class="icon-btn" id="gallery-sound-btn" aria-label="音の切り替え">
        ${soundManager.isMuted ? '🔇' : '🔊'}
      </button>
    </div>

    <!-- 広告スロット（上）Google AdSense 常設 -->
    <div class="ad-slot ad-slot-top" id="ad-top">
      <span class="ad-label">こうこく</span>
      <div class="ad-placeholder">
        <span>🎮 たのしいゲームがいっぱい！</span>
      </div>
    </div>

    <div class="gallery-body" id="gallery-body">
      <!-- ギャラリーグリッド or Empty State -->
    </div>

    <!-- アフィリエイトバナー（実製品Divoom連携） -->
    <div class="affiliate-banner" id="affiliate-banner">
      <div class="affiliate-left">
        <div class="affiliate-title">📺 つくった絵をおへやにかざろう！</div>
        <div class="affiliate-desc">Divoomのピクセルクロックで光らせよう！</div>
      </div>
      <a href="https://www.amazon.co.jp/s?k=Divoom+pixel+clock" target="_blank" rel="noopener" class="btn btn-accent affiliate-btn">
        📦 みてみる
      </a>
    </div>

    <!-- 広告スロット（下）Google AdSense 常設 -->
    <div class="ad-slot ad-slot-bottom" id="ad-bottom">
      <span class="ad-label">こうこく</span>
      <div class="ad-placeholder">
        <span>🌟 ピクセルマジックアドベンチャー</span>
      </div>
    </div>

    <!-- 親向けパネル（知育オウンドメディア送客） -->
    <div class="parent-panel" id="parent-panel">
      <div class="parent-panel-title">📚 ほごしゃのかたへ</div>
      <a href="https://plyo.blog" target="_blank" rel="noopener" class="parent-link">
        ✏️ 子供の創造性を伸ばす声かけ術（plyo.blogで読む）
      </a>
    </div>

    <!-- モーダル（拡大・あそびなおす・ダウンロード）ソリッド完全不透明 -->
    <div class="modal-backdrop hidden" id="gallery-modal">
      <div class="modal-card">
        <button class="modal-close-btn" id="gallery-modal-close">✕</button>
        <img src="" id="gallery-modal-img" class="gallery-modal-img" alt="作品の拡大" />
        <h2 id="gallery-modal-title" class="gallery-modal-title"></h2>

        <div class="modal-actions">
          <button class="btn btn-success" id="gallery-modal-download">
            📥 画像をほぞんする
          </button>
          <button class="btn btn-primary" id="gallery-modal-replay">
            ▶ もう１回あそびなおす！
          </button>
        </div>
      </div>
    </div>
  `;

  const soundBtn = screen.querySelector('#gallery-sound-btn');
  soundBtn.addEventListener('click', () => {
    const muted = soundManager.toggleMute();
    soundBtn.textContent = muted ? '🔇' : '🔊';
  });
  soundManager.onMuteChange((muted) => {
    soundBtn.textContent = muted ? '🔇' : '🔊';
  });

  screen.querySelector('#gallery-back').addEventListener('click', onBack);
  screen.querySelector('#gallery-modal-close').addEventListener('click', () => {
    screen.querySelector('#gallery-modal').classList.add('hidden');
  });

  function refresh() {
    const body = screen.querySelector('#gallery-body');
    const gallery = loadGallery();

    if (gallery.length === 0) {
      body.innerHTML = `
        <div class="gallery-empty">
          <div class="gallery-empty-emoji">🎨</div>
          <div class="gallery-empty-text">まだ さくひんが ないよ！<br>まほうをかけて えをつくろう！</div>
          <button class="btn btn-primary" id="gallery-new">✨ はじめる</button>
        </div>
      `;
      body.querySelector('#gallery-new').addEventListener('click', onNewArt);
      return;
    }

    body.innerHTML = '<div class="gallery-grid" id="gallery-grid"></div>';
    const grid = body.querySelector('#gallery-grid');

    gallery.forEach(item => {
      const card = document.createElement('div');
      card.className = 'gallery-card';
      card.innerHTML = `
        <div class="gallery-img-wrap">
          <img src="${item.dataUrl}" class="gallery-img" alt="${item.title}" />
          <div class="gallery-card-badge">▶</div>
        </div>
        <div class="gallery-card-title">${item.title}</div>
        <button class="gallery-delete-btn" aria-label="削除">✕</button>
      `;

      // モーダルを開いて拡大・リプレイ・保存
      card.addEventListener('click', () => {
        soundManager.playPop(2);
        const modal = screen.querySelector('#gallery-modal');
        modal.querySelector('#gallery-modal-img').src = item.dataUrl;
        modal.querySelector('#gallery-modal-title').textContent = item.title;

        const replayBtn = modal.querySelector('#gallery-modal-replay');
        const newReplayBtn = replayBtn.cloneNode(true);
        replayBtn.replaceWith(newReplayBtn);
        newReplayBtn.addEventListener('click', () => {
          modal.classList.add('hidden');
          if (onReplay) onReplay(item);
        });

        const downloadBtn = modal.querySelector('#gallery-modal-download');
        const newDownloadBtn = downloadBtn.cloneNode(true);
        downloadBtn.replaceWith(newDownloadBtn);
        newDownloadBtn.addEventListener('click', () => {
          const a = document.createElement('a');
          a.href = item.dataUrl;
          a.download = `${item.title || 'pixelmagic'}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        });

        modal.classList.remove('hidden');
      });

      // 削除ボタン
      card.querySelector('.gallery-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('このえを けしますか？')) {
          deleteFromGallery(item.id);
          refresh();
        }
      });

      grid.appendChild(card);
    });
  }

  screen._refresh = refresh;
  return screen;
}

export const galleryScreenCSS = `
/* ====== GalleryScreen ====== */
#screen-gallery {
  background: #1A1A2E;
  overflow-y: auto;
}

/* Ad slots (ソリッド色) */
.ad-slot {
  background: #0E1424;
  border-top: 3px solid #0A0E17;
  border-bottom: 3px solid #0A0E17;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 54px;
  flex-shrink: 0;
  position: relative;
  padding: 6px;
}

.ad-label {
  font-size: 0.65rem;
  font-weight: 900;
  color: #A0AABA;
  position: absolute;
  top: 3px;
  right: 8px;
}

.ad-placeholder {
  color: #FFD60A;
  font-size: 0.85rem;
  font-weight: 900;
}

/* Gallery body */
.gallery-body {
  flex: 1;
  padding: 14px;
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}

/* Gallery card (Divoomピクセルモニターのようなソリッド発光アニメーション) */
.gallery-card {
  position: relative;
  background: #16213E;
  border-radius: 18px;
  overflow: hidden;
  border: 4px solid #FFD60A;
  box-shadow: 0 6px 0 #0A0E17;
  cursor: pointer;
  transition: transform 0.12s ease;
  animation: pixelBorderGlow 2.5s infinite;
}

@keyframes pixelBorderGlow {
  0%, 100% { border-color: #FFD60A; }
  33%       { border-color: #FF6B35; }
  66%       { border-color: #06D6A0; }
}

.gallery-card:active {
  transform: translateY(3px);
  box-shadow: 0 3px 0 #0A0E17;
}

.gallery-card:nth-child(2n) { animation-delay: 0.4s; }
.gallery-card:nth-child(3n) { animation-delay: 0.8s; }

.gallery-img-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background: #0A0E17;
}

.gallery-img {
  width: 100%;
  height: 100%;
  display: block;
  image-rendering: pixelated;
  object-fit: cover;
}

.gallery-card-badge {
  position: absolute;
  bottom: 6px;
  right: 6px;
  background: #3A86FF;
  color: #FFFFFF;
  border: 2px solid #0A0E17;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  font-size: 0.85rem;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 0 #0A0E17;
}

.gallery-card-title {
  background: #0F3460;
  color: #FFD60A;
  font-size: 0.9rem;
  font-weight: 900;
  padding: 8px 10px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  border-top: 3px solid #0A0E17;
}

.gallery-delete-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  background: #EF233C;
  color: #FFFFFF;
  border: 2px solid #0A0E17;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  font-size: 0.75rem;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 0 #0A0E17;
  z-index: 5;
}

/* Empty State */
.gallery-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px 16px;
  text-align: center;
}

.gallery-empty-emoji {
  font-size: 4rem;
  animation: float 2.5s ease-in-out infinite;
}

.gallery-empty-text {
  font-size: 1.15rem;
  font-weight: 900;
  color: #A0AABA;
  line-height: 1.6;
}

/* Affiliate Banner */
.affiliate-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: #16213E;
  border-top: 4px solid #7B2FBE;
  border-bottom: 4px solid #7B2FBE;
  flex-shrink: 0;
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
}

.affiliate-left {
  flex: 1;
}

.affiliate-title {
  font-size: 0.95rem;
  font-weight: 900;
  color: #FFD60A;
}

.affiliate-desc {
  font-size: 0.8rem;
  font-weight: 900;
  color: #A0AABA;
}

.affiliate-btn {
  flex-shrink: 0;
  font-size: 0.95rem;
  padding: 10px 18px;
  text-decoration: none;
}

/* Parent Panel */
.parent-panel {
  padding: 14px 16px;
  background: #0E1424;
  border-top: 3px solid #0A0E17;
  flex-shrink: 0;
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
}

.parent-panel-title {
  font-size: 0.85rem;
  font-weight: 900;
  color: #FFD60A;
  margin-bottom: 6px;
}

.parent-link {
  display: block;
  color: #4CC9F0;
  font-size: 0.9rem;
  font-weight: 900;
  text-decoration: none;
  padding: 10px 14px;
  background: #16213E;
  border-radius: 12px;
  border: 3px solid #4CC9F0;
  box-shadow: 0 4px 0 #0A0E17;
}

.parent-link:hover {
  background: #0F3460;
}

.gallery-modal-img {
  width: 220px;
  height: 220px;
  object-fit: cover;
  image-rendering: pixelated;
  border-radius: 16px;
  border: 4px solid #0A0E17;
  margin-bottom: 12px;
}

.gallery-modal-title {
  color: #FFD60A;
  font-size: 1.5rem;
  font-weight: 900;
  margin-bottom: 16px;
}
`;
