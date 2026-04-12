/**
 * HomeScreen.js — ホーム画面
 */
import mascotUrl from '../assets/mascot.png';

export function createHomeScreen({ onStart, onGallery, onResume }) {
  const screen = document.createElement('div');
  screen.id = 'screen-home';
  screen.className = 'screen';
  screen.innerHTML = `
    <div class="home-bg">
      <!-- Stars background -->
      ${Array.from({length: 20}, (_, i) => `
        <div class="home-star" style="
          left:${Math.random()*100}%;
          top:${Math.random()*100}%;
          animation-delay:${(Math.random()*3).toFixed(1)}s;
          width:${6+Math.random()*8}px;
          height:${6+Math.random()*8}px;
        "></div>
      `).join('')}
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
        <button class="btn btn-success home-resume-btn hidden" id="home-resume" style="font-size: 1.4rem; padding: 16px 40px; width: 100%; max-width: 320px; background: #06D6A0; box-shadow: 0 6px 0 #048C68;">
          ▶ つづきから
        </button>
        <button class="btn btn-primary home-start-btn" id="home-start">
          ✨ はじめる ✨
        </button>
        <button class="btn btn-accent home-gallery-btn" id="home-gallery">
          🌟 コレクション
        </button>
        <button class="home-transfer-btn" id="home-transfer">
          ⚙️ データのひきつぎ
        </button>
        <button class="home-transfer-btn" id="home-api-setup" style="margin-top: 4px;">
          🔒 API設定
        </button>
      </div>
    </div>

    <!-- API設定モーダル -->
    <div class="transfer-modal hidden" id="api-modal">
      <div class="transfer-modal-content">
        <button class="transfer-modal-close" id="api-modal-close">✕</button>
        <h2>🔒 API設定</h2>
        <p class="transfer-desc">AIを使うためのAPIキー（Gemini）を入力してください。<br>※この端末内にのみ安全に保存されます。</p>
        <div class="transfer-actions">
          <input type="password" id="api-key-input" placeholder="Google AI Studio API Key" style="width: 100%; padding: 12px; font-size: 1rem; border-radius: 8px; border: 2px solid #06D6A0; background: #1A1A2E; color: #FFF; margin-bottom: 8px;" />
          <button class="btn btn-primary transfer-export-btn" id="api-key-save">
            💾 保存して使えるようにする
          </button>
          <button class="home-transfer-btn" id="api-key-delete" style="color: #EF233C; margin-top: 4px;">
            キーを削除する（おためし版に戻す）
          </button>
        </div>
      </div>
    </div>

    <!-- データ引き継ぎモーダル -->
    <div class="transfer-modal hidden" id="transfer-modal">
      <div class="transfer-modal-content">
        <button class="transfer-modal-close" id="transfer-modal-close">✕</button>
        <h2>データのひきつぎ</h2>
        <p class="transfer-desc">いままでの作品や途中データを<br>別のパソコンやスマホにうつすことができます。</p>
        <div class="transfer-actions">
          <button class="btn btn-primary transfer-export-btn" id="transfer-export">
            ⬆️ データをつくる (保存)
          </button>
          <div class="transfer-divider">または</div>
          <button class="btn btn-success transfer-import-btn" id="transfer-import">
            ⬇️ データをよみこむ
          </button>
          <input type="file" id="transfer-file-input" accept=".json" class="hidden" />
        </div>
      </div>
    </div>
  `;

  screen.querySelector('#home-start').addEventListener('click', onStart);
  screen.querySelector('#home-gallery').addEventListener('click', onGallery);
  screen.querySelector('#home-resume').addEventListener('click', onResume);

  // API設定モーダル制御
  screen.querySelector('#home-api-setup').addEventListener('click', async () => {
    const { loadApiKey } = await import('../logic/storage.js');
    screen.querySelector('#api-key-input').value = loadApiKey();
    screen.querySelector('#api-modal').classList.remove('hidden');
  });
  screen.querySelector('#api-modal-close').addEventListener('click', () => {
    screen.querySelector('#api-modal').classList.add('hidden');
  });
  screen.querySelector('#api-key-save').addEventListener('click', async () => {
    const { saveApiKey } = await import('../logic/storage.js');
    const key = screen.querySelector('#api-key-input').value.trim();
    saveApiKey(key);
    alert('APIキーを保存しました！\nこれで本物のAI絵しりとりや生成機能が使えます。');
    screen.querySelector('#api-modal').classList.add('hidden');
  });
  screen.querySelector('#api-key-delete').addEventListener('click', async () => {
    const { saveApiKey } = await import('../logic/storage.js');
    if (confirm('保存してあるAPIキーを削除しますか？')) {
      saveApiKey('');
      screen.querySelector('#api-key-input').value = '';
      alert('APIキーを削除しました。おためし版（モック）に戻ります。');
      screen.querySelector('#api-modal').classList.add('hidden');
    }
  });

  // 引き継ぎモーダル制御
  screen.querySelector('#home-transfer').addEventListener('click', () => {
    screen.querySelector('#transfer-modal').classList.remove('hidden');
  });
  screen.querySelector('#transfer-modal-close').addEventListener('click', () => {
    screen.querySelector('#transfer-modal').classList.add('hidden');
  });

  const fileInput = screen.querySelector('#transfer-file-input');

  screen.querySelector('#transfer-export').addEventListener('click', async () => {
    const { exportData } = await import('../logic/storage.js');
    const dataString = exportData();
    const blob = new Blob([dataString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixel_magic_data_${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  screen.querySelector('#transfer-import').addEventListener('click', () => {
    if (confirm('【注意】いまのデータが消えて、このファイルデータで上書きされます。よろしいですか？')) {
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const jsonString = event.target.result;
      const { importData } = await import('../logic/storage.js');
      const success = importData(jsonString);
      if (success) {
        alert('データのよみこみに成功しました！\n画面を再読み込みします。');
        window.location.reload();
      } else {
        alert('エラー：ファイルのデータが正しくありません。');
      }
      fileInput.value = ''; // reset
    };
    reader.readAsText(file);
  });

  screen._refresh = () => {
    import('../logic/storage.js').then(({ loadWipPuzzle }) => {
       const wip = loadWipPuzzle();
       const btn = screen.querySelector('#home-resume');
       if (wip) {
         btn.classList.remove('hidden');
       } else {
         btn.classList.add('hidden');
       }
    });
  };

  return screen;
}

export const homeScreenCSS = `
/* ====== HomeScreen ====== */
#screen-home {
  align-items: center;
  justify-content: center;
  background: #1A1A2E;
  position: relative;
  overflow: hidden;
}

.home-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.home-star {
  position: absolute;
  background: #FFD60A;
  border-radius: 50%;
  animation: glowPulse 2s ease-in-out infinite;
}

.home-content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 20px;
  width: 100%;
  max-width: 420px;
}

.home-title-wrap {
  text-align: center;
}

.home-title-jp {
  font-size: 2rem;
  font-weight: 900;
  color: #FFD60A;
  text-shadow: 3px 3px 0 #D94F1A, 0 0 20px #FFD60A;
  letter-spacing: 2px;
  animation: float 3s ease-in-out infinite;
}

.home-title-en {
  font-size: 1.2rem;
  font-weight: 900;
  color: #FF6B35;
  letter-spacing: 6px;
}

.home-title-stars {
  font-size: 1.5rem;
  animation: float 2s ease-in-out infinite reverse;
}

.mascot-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: bounceIn 0.6s ease;
}

.mascot-img {
  width: 140px;
  height: 140px;
  object-fit: contain;
  animation: float 3s ease-in-out infinite;
  image-rendering: pixelated;
}

.mascot-bubble {
  background: #FFD60A;
  color: #1A1A2E;
  font-size: 1rem;
  font-weight: 900;
  padding: 10px 18px;
  border-radius: 20px;
  border: 3px solid #D94F1A;
  text-align: center;
  line-height: 1.5;
  position: relative;
  margin-top: 8px;
}

.mascot-bubble::before {
  content: '';
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  border: 7px solid transparent;
  border-bottom-color: #D94F1A;
}

.mascot-bubble::after {
  content: '';
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-bottom-color: #FFD60A;
}

.home-buttons {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
  align-items: center;
}

.home-start-btn {
  font-size: 1.6rem;
  padding: 20px 60px;
  width: 100%;
  max-width: 320px;
  background: #FF6B35;
  animation: float 2s ease-in-out infinite;
  box-shadow: 0 8px 0 #8B3A1A;
}

.home-gallery-btn {
  font-size: 1.2rem;
  padding: 14px 40px;
  background: #FFD60A;
  color: #1A1A2E;
  box-shadow: 0 6px 0 #8B7000;
}

.home-transfer-btn {
  background: none;
  border: none;
  color: #A0AABA;
  font-size: 0.95rem;
  font-weight: bold;
  margin-top: 10px;
  cursor: pointer;
  text-decoration: underline;
  font-family: var(--font-main);
}
.home-transfer-btn:hover {
  color: #FFFFFF;
}

/* Transfer Modal */
.transfer-modal {
  position: fixed;
  inset: 0;
  background: rgba(15, 52, 96, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.transfer-modal-content {
  background: #16213E;
  border: 4px solid #06D6A0;
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.8);
  animation: bounceIn 0.3s ease;
  text-align: center;
}
.transfer-modal-content h2 {
  color: #06D6A0;
  font-size: 1.5rem;
  margin-bottom: 12px;
}
.transfer-desc {
  font-size: 0.9rem;
  color: #FFFFFF;
  line-height: 1.5;
  margin-bottom: 24px;
}
.transfer-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}
.transfer-divider {
  font-size: 0.8rem;
  color: #A0AABA;
  margin: 6px 0;
  position: relative;
}
.transfer-divider::before, 
.transfer-divider::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 35%;
  height: 2px;
  background: #0F3460;
}
.transfer-divider::before { left: 0; }
.transfer-divider::after { right: 0; }

.transfer-export-btn,
.transfer-import-btn {
  width: 100%;
  font-size: 1.1rem;
  padding: 14px;
}
.transfer-modal-close {
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
.transfer-modal-close:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #8B0018;
}
`;
