/**
 * HomeScreen.js — ホーム画面
 */
import mascotUrl from '../assets/mascot.png';
import { loadApiKey, saveApiKey, exportData, importData, loadWipPuzzle } from '../logic/storage.js';
import { soundManager } from '../components/SoundManager.js';

export function createHomeScreen({ onStart, onGallery, onResume }) {
  const screen = document.createElement('div');
  screen.id = 'screen-home';
  screen.className = 'screen';
  screen.innerHTML = `
    <div class="home-top-bar">
      <button class="icon-btn" id="home-sound-btn" aria-label="音の切り替え">
        ${soundManager.isMuted ? '🔇' : '🔊'}
      </button>
      <div class="home-top-right">
        <button class="icon-btn" id="home-api-setup" title="API設定" aria-label="API設定">
          🔒
        </button>
        <button class="icon-btn" id="home-transfer" title="データ引き継ぎ" aria-label="データ引き継ぎ">
          ⚙️
        </button>
      </div>
    </div>

    <div class="home-content">
      <div class="home-title-wrap">
        <div class="home-title-jp">ピクセル・マジック</div>
        <div class="home-title-en">ADVENTURER</div>
        <div class="home-title-stars">⭐ ✨ ⭐</div>
      </div>

      <div class="mascot-wrap" id="home-mascot">
        <img src="${mascotUrl}" alt="まほうつかいのマスコット" class="mascot-img" />
        <div class="mascot-bubble">
          まほうのことばで<br>えをつくろう！
        </div>
      </div>

      <div class="home-buttons">
        <button class="btn btn-success home-resume-btn hidden" id="home-resume">
          ▶ つづきから あそぶ！
        </button>
        <button class="btn btn-primary home-start-btn" id="home-start">
          ✨ はじめる ✨
        </button>
        <button class="btn btn-accent home-gallery-btn" id="home-gallery">
          🌟 コレクション
        </button>
      </div>
    </div>

    <!-- API設定モーダル（ソリッド完全不透明） -->
    <div class="modal-backdrop hidden" id="api-modal">
      <div class="modal-card">
        <button class="modal-close-btn" id="api-modal-close">✕</button>
        <h2>🔒 おとなのせってい (API)</h2>
        <p class="modal-desc">Google AI Studio の Gemini APIキーを入力すると、本物のAI画像生成が楽しめます。<br>※未入力でも楽しいプリセットで遊べます！</p>
        <div class="modal-actions">
          <input type="password" id="api-key-input" placeholder="AIzaSy..." class="modal-input" />
          <button class="btn btn-primary" id="api-key-save">
            💾 保存する
          </button>
          <button class="btn btn-danger btn-sm" id="api-key-delete" style="margin-top: 6px;">
            キーを消去（おためし版に戻す）
          </button>
        </div>
      </div>
    </div>

    <!-- データ引き継ぎモーダル（ソリッド完全不透明） -->
    <div class="modal-backdrop hidden" id="transfer-modal">
      <div class="modal-card">
        <button class="modal-close-btn" id="transfer-modal-close">✕</button>
        <h2>⚙️ データのひきつぎ</h2>
        <p class="modal-desc">いままでの作品やプレイデータを<br>別のスマホやパソコンに移動できます。</p>
        <div class="modal-actions">
          <button class="btn btn-primary" id="transfer-export">
            ⬆️ データを保存（ダウンロード）
          </button>
          <div class="modal-divider">または</div>
          <button class="btn btn-success" id="transfer-import">
            ⬇️ ファイルを読み込む
          </button>
          <input type="file" id="transfer-file-input" accept=".json" class="hidden" />
        </div>
      </div>
    </div>
  `;

  // サウンドボタン
  const soundBtn = screen.querySelector('#home-sound-btn');
  soundBtn.addEventListener('click', () => {
    const muted = soundManager.toggleMute();
    soundBtn.textContent = muted ? '🔇' : '🔊';
  });

  soundManager.onMuteChange((muted) => {
    soundBtn.textContent = muted ? '🔇' : '🔊';
  });

  // ナビゲーション
  screen.querySelector('#home-start').addEventListener('click', onStart);
  screen.querySelector('#home-gallery').addEventListener('click', onGallery);
  screen.querySelector('#home-resume').addEventListener('click', onResume);

  // API設定
  const apiModal = screen.querySelector('#api-modal');
  const apiKeyInput = screen.querySelector('#api-key-input');

  screen.querySelector('#home-api-setup').addEventListener('click', () => {
    apiKeyInput.value = loadApiKey();
    apiModal.classList.remove('hidden');
  });

  screen.querySelector('#api-modal-close').addEventListener('click', () => {
    apiModal.classList.add('hidden');
  });

  screen.querySelector('#api-key-save').addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    saveApiKey(key);
    alert('APIキーを保存しました！✨');
    apiModal.classList.add('hidden');
  });

  screen.querySelector('#api-key-delete').addEventListener('click', () => {
    if (confirm('APIキーを削除しておためし版に戻しますか？')) {
      saveApiKey('');
      apiKeyInput.value = '';
      alert('APIキーを削除しました。');
      apiModal.classList.add('hidden');
    }
  });

  // データ引き継ぎ
  const transferModal = screen.querySelector('#transfer-modal');
  screen.querySelector('#home-transfer').addEventListener('click', () => {
    transferModal.classList.remove('hidden');
  });
  screen.querySelector('#transfer-modal-close').addEventListener('click', () => {
    transferModal.classList.add('hidden');
  });

  const fileInput = screen.querySelector('#transfer-file-input');

  screen.querySelector('#transfer-export').addEventListener('click', () => {
    const dataString = exportData();
    const blob = new Blob([dataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixel_magic_data_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  screen.querySelector('#transfer-import').addEventListener('click', () => {
    if (confirm('いまのデータが上書きされます。よろしいですか？')) {
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const jsonString = event.target.result;
      const success = importData(jsonString);
      if (success) {
        alert('データを読み込みました！アプリを再読み込みします。');
        window.location.reload();
      } else {
        alert('エラー：ファイルが正しくありません。');
      }
      fileInput.value = '';
    };
    reader.readAsText(file);
  });

  screen._refresh = () => {
    const wip = loadWipPuzzle();
    const resumeBtn = screen.querySelector('#home-resume');
    if (wip) {
      resumeBtn.classList.remove('hidden');
    } else {
      resumeBtn.classList.add('hidden');
    }
  };

  return screen;
}

export const homeScreenCSS = `
/* ====== HomeScreen ====== */
#screen-home {
  align-items: center;
  justify-content: space-between;
  background: #1A1A2E;
  position: relative;
  overflow-y: auto;
  padding: 12px 16px 24px;
}

.home-top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 440px;
  z-index: 10;
}

.home-top-right {
  display: flex;
  gap: 8px;
}

.home-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  max-width: 420px;
  margin: auto 0;
}

.home-title-wrap {
  text-align: center;
}

.home-title-jp {
  font-size: 2.2rem;
  font-weight: 900;
  color: #FFD60A;
  text-shadow: 4px 4px 0 #D94F1A, -2px -2px 0 #0A0E17;
  letter-spacing: 2px;
  line-height: 1.1;
  animation: float 3s ease-in-out infinite;
}

.home-title-en {
  font-size: 1.1rem;
  font-weight: 900;
  color: #FF6B35;
  letter-spacing: 5px;
  text-shadow: 2px 2px 0 #0A0E17;
}

.home-title-stars {
  font-size: 1.4rem;
}

.mascot-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: bounceIn 0.5s ease;
}

.mascot-img {
  width: 130px;
  height: 130px;
  object-fit: contain;
  image-rendering: pixelated;
  animation: float 2.5s ease-in-out infinite;
}

.mascot-bubble {
  background: #FFD60A;
  color: #1A1A2E;
  font-size: 1.05rem;
  font-weight: 900;
  padding: 10px 20px;
  border-radius: 20px;
  border: 4px solid #0A0E17;
  text-align: center;
  line-height: 1.4;
  position: relative;
  margin-top: 6px;
  box-shadow: 0 4px 0 #0A0E17;
}

.home-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  align-items: center;
  margin-top: 6px;
}

.home-start-btn {
  font-size: 1.6rem;
  padding: 18px 48px;
  width: 100%;
  max-width: 320px;
  background: #FF6B35;
}

.home-resume-btn {
  font-size: 1.3rem;
  padding: 16px 36px;
  width: 100%;
  max-width: 320px;
  background: #06D6A0;
}

.home-gallery-btn {
  font-size: 1.25rem;
  padding: 14px 40px;
  width: 100%;
  max-width: 320px;
  background: #FFD60A;
  color: #1A1A2E;
}

/* Modals (ソリッド完全不透明) */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: #0A0E17;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 16px;
}

.modal-card {
  background: #16213E;
  border: 5px solid #FFD60A;
  border-radius: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 10px 0 #0A0E17;
  text-align: center;
  animation: bounceIn 0.3s ease;
}

.modal-card h2 {
  color: #FFD60A;
  font-size: 1.4rem;
  font-weight: 900;
  margin-bottom: 10px;
}

.modal-desc {
  font-size: 0.9rem;
  color: #FFFFFF;
  line-height: 1.5;
  margin-bottom: 18px;
}

.modal-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.modal-input {
  width: 100%;
  padding: 12px 14px;
  font-size: 1rem;
  border-radius: 12px;
  border: 3px solid #06D6A0;
  background: #0F172A;
  color: #FFFFFF;
  outline: none;
  font-family: inherit;
}

.modal-divider {
  font-size: 0.85rem;
  font-weight: 900;
  color: #A0AABA;
  margin: 4px 0;
}

.modal-close-btn {
  position: absolute;
  top: -16px;
  right: -16px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #EF233C;
  color: white;
  border: 3px solid #0A0E17;
  font-size: 1.3rem;
  font-weight: 900;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 0 #0A0E17;
}

.modal-close-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #0A0E17;
}
`;
