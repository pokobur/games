/**
 * GalleryScreen.js — ギャラリー（光るコレクション）画面
 */
import { loadGallery, deleteFromGallery } from '../logic/storage.js';

export function createGalleryScreen({ onBack, onNewArt, onReplay }) {
  const screen = document.createElement('div');
  screen.id = 'screen-gallery';
  screen.className = 'screen';
  screen.innerHTML = `
    <div class="screen-header">
      <button class="back-btn" id="gallery-back">◀</button>
      <h1>🌟 ひかるコレクション</h1>
    </div>

    <!-- 広告スロット（上） -->
    <div class="ad-slot ad-slot-top" id="ad-top">
      <span class="ad-label">広告</span>
      <!-- Google AdSense コードをここに挿入 -->
    </div>

    <div class="gallery-body" id="gallery-body">
      <!-- ギャラリーグリッド or Empty State -->
    </div>

    <!-- アフィリエイトバナー -->
    <div class="affiliate-banner" id="affiliate-banner">
      <div class="affiliate-left">
        <div class="affiliate-title">🎮 作った絵を飾ろう！</div>
        <div class="affiliate-desc">Divoomでピクセルアートを表示！</div>
      </div>
      <a href="https://www.amazon.co.jp/s?k=Divoom+pixel+clock" target="_blank" rel="noopener" class="btn btn-accent affiliate-btn">
        📦 みてみる
      </a>
    </div>

    <!-- 広告スロット（下） -->
    <div class="ad-slot ad-slot-bottom" id="ad-bottom">
      <span class="ad-label">広告</span>
      <!-- Google AdSense コードをここに挿入 -->
    </div>

    <!-- 親向けパネル -->
    <div class="parent-panel" id="parent-panel">
      <div class="parent-panel-title">📚 保護者の方へ</div>
      <a href="https://plyo.blog" target="_blank" rel="noopener" class="parent-link">
        ✏️ 子供の創造性を伸ばす声かけ術（記事を読む）
      </a>
    </div>

    <!-- モーダル（拡大・あそびなおす・ダウンロード） -->
    <div class="gallery-modal hidden" id="gallery-modal">
      <div class="gallery-modal-content">
        <button class="gallery-modal-close" id="gallery-modal-close">✕</button>
        <img src="" id="gallery-modal-img" class="gallery-modal-img" />
        <h2 id="gallery-modal-title" class="gallery-modal-title"></h2>
        
        <div class="gallery-modal-actions">
          <button class="btn btn-success gallery-modal-download" id="gallery-modal-download">
            📥 しゃしんをほぞんする
          </button>
          <button class="btn btn-primary gallery-modal-replay" id="gallery-modal-replay">
            ▶ もう１かい・あそびなおす
          </button>
        </div>
      </div>
    </div>
  `;

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
          <div class="gallery-empty-text">まだなにもないよ！<br>まほうをかけてえをつくろう！</div>
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
        </div>
        <div class="gallery-card-title">${item.title}</div>
        <button class="gallery-delete-btn" aria-label="削除">✕</button>
      `;

      // モーダルを開いて拡大表示
      card.addEventListener('click', () => {
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

      // 削除ボタン (e.stopPropagationでモーダルが開くのを防ぐ)
      card.querySelector('.gallery-delete-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('このえをけしますか？')) {
          deleteFromGallery(item.id); // dataset不要で型問題を回避
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
}

/* Ad slots */
.ad-slot {
  background: #16213E;
  border: 2px solid #0F3460;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
  flex-shrink: 0;
  position: relative;
}

.ad-label {
  font-size: 0.7rem;
  color: #A0AABA;
  position: absolute;
  top: 4px;
  right: 8px;
}

/* Gallery body */
.gallery-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 12px;
}

/* Gallery card */
.gallery-card {
  position: relative;
  background: #16213E;
  border-radius: 16px;
  overflow: hidden;
  border: 3px solid #FFD60A;
  animation: glowPulse 3s ease-in-out infinite;
  box-shadow: 0 0 12px 4px #FFD60A;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.gallery-card:hover {
  transform: scale(1.04);
}

/* Stagger animation delays */
.gallery-card:nth-child(2n)   { animation-delay: 0.5s; }
.gallery-card:nth-child(3n)   { animation-delay: 1s; }
.gallery-card:nth-child(4n)   { animation-delay: 1.5s; }
.gallery-card:nth-child(5n)   { animation-delay: 2s; }

.gallery-img {
  width: 100%;
  aspect-ratio: 1;
  display: block;
  image-rendering: pixelated;
}

.gallery-img-wrap {
  position: relative;
  overflow: hidden;
}

.gallery-card-title {
  background: #0F3460;
  color: #FFD60A;
  font-size: 0.8rem;
  font-weight: 900;
  padding: 6px 8px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gallery-delete-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #EF233C;
  color: #FFFFFF;
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  font-size: 0.65rem;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.4);
}

/* Empty state */
.gallery-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 40px 20px;
  text-align: center;
}

.gallery-empty-emoji {
  font-size: 4rem;
  animation: float 3s ease-in-out infinite;
}

.gallery-empty-text {
  font-size: 1.1rem;
  font-weight: 900;
  color: #A0AABA;
  line-height: 1.6;
}

/* Affiliate banner */
.affiliate-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  background: #16213E;
  border-top: 3px solid #7B2FBE;
  border-bottom: 3px solid #7B2FBE;
  flex-shrink: 0;
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
  font-weight: 700;
  color: #A0AABA;
}

.affiliate-btn {
  flex-shrink: 0;
  font-size: 0.9rem;
  padding: 10px 16px;
  background: #FFD60A;
  color: #1A1A2E;
  text-decoration: none;
  box-shadow: 0 4px 0 #8B7000;
}

/* Parent panel */
.parent-panel {
  padding: 12px 16px;
  background: #16213E;
  border-top: 2px solid #0F3460;
  flex-shrink: 0;
}

.parent-panel-title {
  font-size: 0.85rem;
  font-weight: 900;
  color: #A0AABA;
  margin-bottom: 6px;
}

.parent-link {
  display: block;
  color: #4CC9F0;
  font-size: 0.9rem;
  font-weight: 700;
  text-decoration: none;
  padding: 8px 12px;
  background: #0F3460;
  border-radius: 10px;
  border: 2px solid #4CC9F0;
}

.parent-link:hover {
  background: #1E4A80;
}

/* Modal */
.gallery-modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 52, 96, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.gallery-modal-content {
  background: #16213E;
  border: 4px solid #FFD60A;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.8);
  animation: bounceIn 0.3s ease;
}
.gallery-modal-close {
  position: absolute;
  top: -15px;
  right: -15px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #EF233C;
  color: white;
  border: 3px solid #16213E;
  font-size: 1.4rem;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 0 #8B0018;
}
.gallery-modal-close:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #8B0018;
}
.gallery-modal-img {
  width: 100%;
  aspect-ratio: 1;
  image-rendering: auto;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
}
.gallery-modal-title {
  color: #FFD60A;
  font-size: 1.6rem;
  margin-bottom: 24px;
  text-align: center;
}
.gallery-modal-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
.gallery-modal-download,
.gallery-modal-replay {
  width: 100%;
  padding: 16px;
  font-size: 1.2rem;
}
.gallery-modal-replay {
  background: #3A86FF;
  box-shadow: 0 6px 0 #1A3D8F;
}
.gallery-modal-replay:active {
  box-shadow: 0 2px 0 #1A3D8F;
}

`;
