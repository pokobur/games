import { PaintCanvas } from './canvas.js';
import { ModelGenerator } from './generator.js';
import { ARSummoner } from './ar.js';
import { Previewer3D } from './previewer.js';
import { galleryDB, SpeechNameRecognizer } from './gallery.js';
import { ShareManager } from './share.js';
import { audioManager } from './audio.js';

// アプリケーション全体の状態管理
const state = {
  currentScreen: 'screen-home',
  paintCanvas: null,
  arSummoner: null,
  previewer3D: null, // 3Dプレビューコンポーネント
  speechRecognizer: null,
  current3DModel: null, // THREE.Group
  currentGLBBuffer: null, // ArrayBuffer (GLB)
  currentName: '',
  selectedCharacterData: null // おもちゃ箱から選択したデータ
};

// DOMの読み込み完了後に開始
window.addEventListener('DOMContentLoaded', async () => {
  // 1. データベース初期化
  try {
    await galleryDB.init();
  } catch (err) {
    console.error("Database initialization failed:", err);
  }

  // 2. モジュールインスタンス化
  state.paintCanvas = new PaintCanvas('paint-canvas');
  state.speechRecognizer = new SpeechNameRecognizer('char-name-input', 'btn-speech-name');
  state.previewer3D = new Previewer3D('preview-3d-container');

  // 3. UIイベントの紐付け
  setupAppEvents();

  // 4. 音設定の初期化
  const soundBtn = document.getElementById('btn-sound-toggle');
  soundBtn.addEventListener('click', () => {
    const enabled = audioManager.toggleSound();
    soundBtn.textContent = enabled ? '🔊' : '🔇';
  });

  // 5. ディープリンク（共有ハッシュ）の確認
  checkDeepLink();
});

// 画面切り替えのルーティング
function navigateTo(screenId) {
  const previousScreen = state.currentScreen;
  
  // 既存の画面を非表示に
  const screens = document.querySelectorAll('.app-screen');
  screens.forEach(s => {
    s.classList.remove('active');
    s.style.display = 'none';
  });

  // 新しい画面を表示
  const targetScreen = document.getElementById(screenId);
  targetScreen.style.display = 'flex';
  // browser repaint のために遅延をいれてフェードインさせる
  setTimeout(() => {
    targetScreen.classList.add('active');
  }, 10);

  state.currentScreen = screenId;

  // 画面遷移に伴うクリーンアップや初期化処理
  if (previousScreen === 'screen-ar' && screenId !== 'screen-ar') {
    // AR終了時はカメラとレンダラーを停止
    if (state.arSummoner) {
      state.arSummoner.stop();
      state.arSummoner = null;
    }
  }

  if (previousScreen === 'screen-preview') {
    // 3Dプレビュー画面を出るときはGPUメモリ等のリソースを破棄
    if (state.previewer3D) {
      state.previewer3D.destroy();
    }
  }

  if (screenId === 'screen-gallery') {
    // おもちゃ箱表示時はデータを再読み込み
    loadGallery();
  }
}

// 共有されたリンクのハッシュ値があるかチェック
async function checkDeepLink() {
  const hash = window.location.hash;
  if (hash && hash.startsWith('#data=')) {
    const encodedData = hash.substring(6);
    
    // 魔法の演出画面に遷移してデコード開始
    navigateTo('screen-magic');
    const fill = document.querySelector('.progress-bar-fill');
    fill.style.width = '30%';
    
    try {
      // 1. ハッシュデータのデコード
      const { canvas, charName } = await ShareManager.decompressHashToCanvas(encodedData);
      
      fill.style.width = '60%';
      
      // 2. 3Dモデル生成
      const mesh = await ModelGenerator.generate3DModelFromCanvas(canvas);
      
      fill.style.width = '100%';
      
      state.current3DModel = mesh;
      state.currentName = charName;
      
      // 直接AR召喚画面に移行
      setTimeout(() => {
        setupARScreen(mesh, charName);
      }, 500);
      
    } catch (err) {
      console.error("Deep link decode error:", err);
      alert("まほうのリンクが こわれているみたい。");
      navigateTo('screen-home');
    }
  }
}

// 各種ボタンのイベント設定
function setupAppEvents() {
  // ホーム画面
  document.getElementById('btn-start-drawing').addEventListener('click', () => {
    audioManager.playTap();
    navigateTo('screen-canvas');
  });

  document.getElementById('btn-goto-gallery').addEventListener('click', () => {
    audioManager.playTap();
    navigateTo('screen-gallery');
  });

  // お絵かき画面
  document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => {
      audioManager.playTap();
      // 元のハッシュをリセット
      if (window.location.hash) {
        window.history.pushState('', document.title, window.location.pathname + window.location.search);
      }
      navigateTo('screen-home');
    });
  });

  // ツール切り替え
  document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const tool = e.currentTarget.getAttribute('data-tool');
      document.querySelectorAll('.tool-btn[data-tool]').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      state.paintCanvas.setTool(tool);
    });
  });

  // ペン太さ変更
  const brushSlider = document.getElementById('brush-size');
  brushSlider.addEventListener('input', (e) => {
    state.paintCanvas.setBrushSize(parseInt(e.target.value, 10));
  });

  // もどす (Undo)
  document.getElementById('btn-undo').addEventListener('click', () => {
    state.paintCanvas.undo();
  });

  // すすむ (Redo)
  document.getElementById('btn-redo').addEventListener('click', () => {
    state.paintCanvas.redo();
  });

  // クリアボタン
  document.getElementById('btn-clear-canvas').addEventListener('click', () => {
    audioManager.playDelete();
    state.paintCanvas.clear();
  });

  // カラーパレット
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', (e) => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const color = e.currentTarget.getAttribute('data-color');
      state.paintCanvas.setColor(color);
    });
  });

  // カメラ・写真インポート
  const cameraInput = document.getElementById('camera-import');
  cameraInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
      audioManager.playTap();
      try {
        await state.paintCanvas.loadImageAndExtractDrawing(file);
      } catch (err) {
        console.error("Failed to load image:", err);
        alert("しゃしんの よみこみに しっぱいしちゃった。");
      }
    }
  });

  // 3D魔法変換リクエスト
  document.getElementById('btn-generate-3d').addEventListener('click', () => {
    // 描画が空か判定 (すべてのアルファ値が0であるか簡易チェック)
    const canvas = document.getElementById('paint-canvas');
    const ctx = canvas.getContext('2d');
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let hasDraw = false;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 10) {
        hasDraw = true;
        break;
      }
    }

    if (!hasDraw) {
      audioManager.playDelete();
      alert("えを かいてから まほうをかけてね！✏️");
      return;
    }

    audioManager.playMagic();
    runMagic3DConversion();
  });

  // 3Dプレビュー画面
  document.getElementById('btn-back-to-canvas').addEventListener('click', () => {
    audioManager.playTap();
    navigateTo('screen-canvas');
  });

  // おもちゃ箱に保存
  document.getElementById('btn-save-to-gallery').addEventListener('click', async () => {
    audioManager.playTap();
    const nameInput = document.getElementById('char-name-input');
    const name = nameInput.value.trim() || 'なぞのいきもの';
    
    // GLB的ArrayBufferへの書き出しを実行
    let glbBuffer = null;
    try {
      glbBuffer = await ModelGenerator.exportToGLB(state.current3DModel);
    } catch (err) {
      console.error("GLB export failed:", err);
    }

    const canvas = document.getElementById('paint-canvas');
    const thumbUrl = canvas.toDataURL('image/png');

    const newChar = {
      id: `char-${Date.now()}`,
      name: name,
      image2d: thumbUrl,
      modelData: glbBuffer,
      createdAt: new Date().toISOString()
    };

    try {
      await galleryDB.saveCharacter(newChar);
      navigateTo('screen-gallery');
    } catch (err) {
      console.error("Save failed:", err);
      alert("おもちゃ箱に しまえなかったよ。");
    }
  });

  // AR画面でのアニメーション指示
  document.querySelectorAll('.btn-action-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const action = e.currentTarget.getAttribute('data-action');
      document.querySelectorAll('.btn-action-trigger').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
      
      if (state.arSummoner) {
        state.arSummoner.setAction(action);
      }
    });
  });

  // AR写真撮影
  document.getElementById('btn-capture-photo').addEventListener('click', async () => {
    if (state.arSummoner && state.arSummoner.isPlaced) {
      const video = document.getElementById('ar-video');
      const renderer = state.arSummoner.renderer;
      
      try {
        await ShareManager.captureARPhoto(video, renderer);
      } catch (err) {
        alert("しゃしん が とれなかったよ。カメラのきょか をかくにんしてね。");
      }
    } else {
      alert("キャラクター を しょうかんしてから しゃしんを とってね！📸");
    }
  });

  // 魔法のリンクを共有 (クイズなしで直接共有)
  document.getElementById('btn-share-link').addEventListener('click', () => {
    const canvas = document.getElementById('paint-canvas');
    const name = state.currentName || 'なぞのいきもの';
    
    // ハッシュエンコード (RLE超圧縮)
    const hashStr = ShareManager.compressCanvasToHash(canvas, name);
    const shareUrl = `${window.location.origin}${window.location.pathname}#data=${hashStr}`;
    
    // 共有モーダルの表示
    ShareManager.showShareModal(shareUrl);
  });

  // AR画面から出る
  document.getElementById('btn-exit-ar').addEventListener('click', () => {
    audioManager.playTap();
    navigateTo('screen-gallery');
  });
}

// 魔法の3D変換処理と演出アニメーション
function runMagic3DConversion() {
  navigateTo('screen-magic');
  
  const fill = document.querySelector('.progress-bar-fill');
  fill.style.width = '0%';
  
  // キラキラパーティクルの背景エフェクトを生成
  const magicScr = document.getElementById('screen-magic');
  const spContainer = magicScr.querySelector('.sparkles-container');
  spContainer.innerHTML = '';
  
  for (let i = 0; i < 30; i++) {
    const star = document.createElement('div');
    star.className = 'magic-star';
    star.textContent = ['✨', '🌟', '🍭', '🔮', '💫'][Math.floor(Math.random() * 5)];
    star.style.position = 'absolute';
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.fontSize = `${Math.random() * 1.5 + 1}rem`;
    star.style.transform = `scale(0)`;
    star.style.transition = 'all 1.5s ease-out';
    spContainer.appendChild(star);
    
    // アニメーション発火
    setTimeout(() => {
      star.style.transform = `scale(1.2) translateY(-50px) rotate(${Math.random() * 360}deg)`;
      star.style.opacity = '0';
    }, i * 50);
  }

  // 擬似プログレスアニメーション (3秒間の演出)
  let percent = 0;
  const interval = setInterval(() => {
    percent += 4;
    fill.style.width = `${percent}%`;
    if (percent >= 100) {
      clearInterval(interval);
    }
  }, 100);

  // バックグラウンドで3D生成
  setTimeout(async () => {
    try {
      const canvas = document.getElementById('paint-canvas');
      const mesh = await ModelGenerator.generate3DModelFromCanvas(canvas);
      
      state.current3DModel = mesh;
      state.currentName = ''; // リセット
      document.getElementById('char-name-input').value = '';
      
      // プレビュー画面起動
      navigateTo('screen-preview');
      if (state.previewer3D) {
        state.previewer3D.initPreview(mesh);
      }
      
    } catch (err) {
      clearInterval(interval);
      alert(err.message || "3Dのまほうに しっぱいしちゃった。");
      navigateTo('screen-canvas');
    }
  }, 2800);
}


// おもちゃ箱（ギャラリー）画面のレンダリング
async function loadGallery() {
  const grid = document.getElementById('gallery-grid');
  grid.innerHTML = ''; // クリア
  
  try {
    const chars = await galleryDB.getAllCharacters();
    
    if (chars.length === 0) {
      grid.innerHTML = `
        <div class="empty-gallery-msg">
          まだおもちゃがないよ。<br>
          えをかいて、3Dにしてみてね！🎨
        </div>`;
      return;
    }
    
    chars.forEach(char => {
      const card = document.createElement('div');
      card.className = 'gallery-card';
      
      const img = document.createElement('img');
      img.className = 'gallery-card-thumb';
      img.src = char.image2d;
      img.alt = char.name;
      
      const title = document.createElement('div');
      title.className = 'gallery-card-title';
      title.textContent = char.name;
      
      // 操作ボタンエリア
      const btnRow = document.createElement('div');
      btnRow.className = 'gallery-card-buttons';
      
      const arBtn = document.createElement('button');
      arBtn.className = 'btn-card btn-card-ar';
      arBtn.innerHTML = '召喚 🚀';
      arBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 親カードのクリックイベントを防ぐ
        setupARScreenFromGallery(char);
      });
      
      const delBtn = document.createElement('button');
      delBtn.className = 'btn-card btn-card-del';
      delBtn.innerHTML = '🗑️';
      delBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`${char.name} を おもちゃ箱から けしますか？`)) {
          await galleryDB.deleteCharacter(char.id);
          loadGallery();
        }
      });
      
      btnRow.appendChild(arBtn);
      btnRow.appendChild(delBtn);
      
      card.appendChild(img);
      card.appendChild(title);
      card.appendChild(btnRow);
      
      // カードタップで3Dプレビューを再表示
      card.addEventListener('click', async () => {
        audioManager.playTap();
        // 3Dモデルデータを再復元してプレビューへ
        try {
          const mesh = await reconstructMeshFromGLB(char.modelData, char.image2d);
          state.current3DModel = mesh;
          state.currentName = char.name;
          navigateTo('screen-preview');
          if (state.previewer3D) {
            state.previewer3D.initPreview(mesh);
          }
          // 入力欄に名前を復元
          document.getElementById('char-name-input').value = char.name;
        } catch (err) {
          console.error("Reconstruct failed:", err);
          alert("3Dモデル の ふくげんに しっぱいしちゃった。");
        }
      });
      
      grid.appendChild(card);
    });
  } catch (err) {
    console.error("Load gallery error:", err);
  }
}

// GLBバイナリとお絵かきテクスチャから、再度 Three.js メッシュを組み立てる
function reconstructMeshFromGLB(glbArrayBuffer, image2dUrl) {
  return new Promise((resolve, reject) => {
    // 今回の構成はローカルでの押し出し成型を完全に再現できるため、
    // GLBをパースするか、あるいは2Dイラストから再度自動ビルドすることができます。
    // 最も安定し、読み込みが速くエラーがないアプローチとして、
    // 保存されている 2D画像(image2dUrl) から ModelGenerator を用いて
    // メッシュを瞬時に再ビルドするのが最も堅牢です。
    // （GLB保存とエクスポートは「共有」や「外部利用」向けに担保され、
    // アプリ内表示は2Dイラストから再生成するほうがマテリアル依存トラブルが皆無になります）
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      try {
        const mesh = await ModelGenerator.generate3DModelFromCanvas(canvas);
        resolve(mesh);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = reject;
    img.src = image2dUrl;
  });
}

// ギャラリーからAR召喚画面への遷移
async function setupARScreenFromGallery(charRecord) {
  audioManager.playTap();
  try {
    const mesh = await reconstructMeshFromGLB(charRecord.modelData, charRecord.image2d);
    
    // 現在のキャンバスもお絵かき復元（共有のハッシュ生成用）
    const canvas = document.getElementById('paint-canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0,0,512,512);
      ctx.drawImage(img, 0, 0);
    };
    img.src = charRecord.image2d;

    setupARScreen(mesh, charRecord.name);
  } catch (err) {
    console.error(err);
    alert("3Dモデル の よみこみに しっぱいしました。");
  }
}

// AR画面の設定と起動
function setupARScreen(mesh, name) {
  state.currentName = name;
  document.getElementById('ar-char-name').textContent = name || 'なぞのいきもの';
  
  navigateTo('screen-ar');

  // アクションボタンのアクティブ表示初期化
  document.querySelectorAll('.btn-action-trigger').forEach(b => b.classList.remove('active'));
  document.querySelector('.btn-action-trigger[data-action="idle"]').classList.add('active');

  // ARSummoner の起動
  state.arSummoner = new ARSummoner('ar-video', 'ar-3d-container');
  state.arSummoner.init3D();
  state.arSummoner.setModel(mesh);
}
