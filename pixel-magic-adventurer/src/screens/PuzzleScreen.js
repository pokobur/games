/**
 * PuzzleScreen.js — 数字塗り絵パズル画面
 */
import { soundManager } from '../components/SoundManager.js';
import { saveToGallery, saveWipPuzzle, clearWipPuzzle } from '../logic/storage.js';

const CELL_SIZE = 14; // 表示上の1マスのpx

export function createPuzzleScreen({ onBack, onComplete }) {
  const screen = document.createElement('div');
  screen.id = 'screen-puzzle';
  screen.className = 'screen';
  screen.innerHTML = `
    <div class="screen-header puzzle-header">
      <button class="back-btn" id="puzzle-back">◀</button>
      <h1>🎨 ぬりえパズル</h1>
      <div id="puzzle-progress-text" class="puzzle-progress-text"></div>
    </div>

    <div class="puzzle-body">
      <!-- Canvas エリア -->
      <div class="puzzle-canvas-wrap">
        <canvas id="puzzle-canvas" class="puzzle-canvas"></canvas>
        <!-- 完成エフェクト -->
        <div class="puzzle-sparks" id="puzzle-sparks"></div>
      </div>

      <!-- 進捗バー -->
      <div class="puzzle-progress-bar-wrap">
        <div class="puzzle-progress-bar" id="puzzle-progress-bar"></div>
      </div>

      <!-- カラーパレット -->
      <div class="palette-section">
        <div class="palette-label">👇 いろをえらぼう</div>
        <div class="color-palette" id="color-palette"></div>
      </div>
    </div>

    <!-- 全完成モーダル -->
    <div class="complete-modal hidden" id="complete-modal">
      <div class="complete-modal-box">
        <div class="complete-emoji">🎉</div>
        <div class="complete-title">できた！！</div>
        <div class="complete-msg">すごい！かんぺきだよ！</div>
        <div class="complete-buttons">
          <button class="btn btn-accent" id="puzzle-save">💾 ほぞんする</button>
          <button class="btn btn-primary" id="puzzle-new">✨ また あそぶ</button>
        </div>
      </div>
    </div>
  `;

  let puzzleData = null; // { palette, grid, gridSize }
  let selectedColorIndex = 0;
  let canvas, ctx;
  let completedColors = new Set();
  let totalCells = 0;
  let solvedCells = 0;
  let title = '';

  function init(data, artTitle) {
    puzzleData = JSON.parse(JSON.stringify(data)); // deep copy
    title = artTitle || 'マイアート';
    selectedColorIndex = 0;
    completedColors.clear();
    solvedCells = 0;
    totalCells = data.grid.length * data.grid[0].length;
    
    // 復元用にカウントと完了色を再計算
    puzzleData.grid.forEach(row => row.forEach(c => { if (c.solved) solvedCells++; }));
    puzzleData.palette.forEach((hex, idx) => {
      const remaining = puzzleData.grid.flat().filter(c => c.colorIndex === idx && !c.solved).length;
      const totalForColor = puzzleData.grid.flat().filter(c => c.colorIndex === idx).length;
      if (totalForColor > 0 && remaining === 0) completedColors.add(idx);
    });

    canvas = screen.querySelector('#puzzle-canvas');
    ctx = canvas.getContext('2d');
    const gs = data.gridSize;
    canvas.width  = gs * CELL_SIZE;
    canvas.height = gs * CELL_SIZE;

    // モーダル非表示
    screen.querySelector('#complete-modal').classList.add('hidden');

    renderPalette();
    renderCanvas();
    updateProgress();
  }

  function renderPalette() {
    const palEl = screen.querySelector('#color-palette');
    palEl.innerHTML = '';
    const { palette, grid } = puzzleData;

    palette.forEach((hex, idx) => {
      // 残りマス数をカウント
      let remaining = 0;
      grid.forEach(row => row.forEach(cell => {
        if (cell.colorIndex === idx && !cell.solved) remaining++;
      }));

      const btn = document.createElement('button');
      btn.className = 'palette-btn' + (idx === selectedColorIndex ? ' selected' : '') + (remaining === 0 ? ' done' : '');
      btn.style.background = hex;
      btn.innerHTML = `<span class="palette-num">${idx + 1}</span>${remaining === 0 ? '<span class="palette-check">✓</span>' : ''}`;
      btn.setAttribute('aria-label', `色${idx + 1}`);
      btn.addEventListener('click', () => {
        if (remaining === 0) return;
        selectedColorIndex = idx;
        renderPalette();
        renderCanvas();
      });
      palEl.appendChild(btn);
    });
  }

  function renderCanvas() {
    if (!puzzleData || !ctx) return;
    const { palette, grid, gridSize } = puzzleData;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cell = grid[y][x];
        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;

        if (cell.solved) {
          ctx.fillStyle = palette[cell.colorIndex];
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
        } else {
          // 未塗りマス
          ctx.fillStyle = cell.colorIndex === selectedColorIndex ? '#1E3A5F' : '#16213E';
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
          // 番号
          ctx.fillStyle = cell.colorIndex === selectedColorIndex ? '#FFD60A' : '#A0AABA';
          ctx.font = `bold ${CELL_SIZE * 0.55}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(cell.colorIndex + 1), px + CELL_SIZE / 2, py + CELL_SIZE / 2);
        }

        // グリッド線
        ctx.strokeStyle = '#0F1A2E';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  function handleTap(e) {
    if (!puzzleData) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const cx = Math.floor((clientX - rect.left) * scaleX / CELL_SIZE);
    const cy = Math.floor((clientY - rect.top)  * scaleY / CELL_SIZE);
    const gs = puzzleData.gridSize;

    if (cx < 0 || cy < 0 || cx >= gs || cy >= gs) return;
    const cell = puzzleData.grid[cy][cx];
    if (cell.solved) return;

    if (cell.colorIndex !== selectedColorIndex) {
      // 間違い
      soundManager.playError();
      shakeCell(cx, cy);
      return;
    }

    // 正解！
    cell.solved = true;
    solvedCells++;
    soundManager.playPop(selectedColorIndex);
    renderCanvas();
    updateProgress();
    saveWipPuzzle({ title, puzzleData });
    spawnSparkAt(canvas.getBoundingClientRect().left + (cx + 0.5) * (canvas.getBoundingClientRect().width / gs),
                 canvas.getBoundingClientRect().top  + (cy + 0.5) * (canvas.getBoundingClientRect().height / gs));

    // 1色完成チェック
    const colorDone = puzzleData.grid.every(row => row.every(c => c.colorIndex !== selectedColorIndex || c.solved));
    if (colorDone && !completedColors.has(selectedColorIndex)) {
      completedColors.add(selectedColorIndex);
      soundManager.playColorComplete();
      renderPalette();
      // 次の未完了色を自動選択
      for (let i = 0; i < puzzleData.palette.length; i++) {
        if (!completedColors.has(i)) {
          selectedColorIndex = i;
          break;
        }
      }
      renderCanvas();
    }

    // 全完成チェック
    if (solvedCells >= totalCells) {
      setTimeout(() => showComplete(), 400);
    }
  }

  function shakeCell(cx, cy) {
    // canvas を揺らすエフェクト
    canvas.style.animation = 'shake 0.3s ease';
    setTimeout(() => { canvas.style.animation = ''; }, 300);
  }

  function spawnSparkAt(x, y) {
    const sparks = screen.querySelector('#puzzle-sparks');
    for (let i = 0; i < 4; i++) {
      const star = document.createElement('div');
      star.className = 'puzzle-spark-star';
      star.textContent = ['⭐', '✨', '💫', '🌟'][i % 4];
      const angle = (i / 4) * Math.PI * 2;
      star.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        position: fixed;
        font-size: 1.2rem;
        pointer-events: none;
        z-index: 50;
        animation: starFloat 0.8s ease forwards;
        transform: rotate(${(angle * 180 / Math.PI).toFixed(0)}deg);
      `;
      document.body.appendChild(star);
      setTimeout(() => star.remove(), 900);
    }
  }

  function updateProgress() {
    const pct = totalCells ? (solvedCells / totalCells) * 100 : 0;
    screen.querySelector('#puzzle-progress-bar').style.width = pct + '%';
    screen.querySelector('#puzzle-progress-text').textContent =
      `${solvedCells} / ${totalCells}`;
  }

  function showComplete() {
    clearWipPuzzle();
    soundManager.playComplete();
    screen.querySelector('#complete-modal').classList.remove('hidden');
    // 星エフェクト
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        spawnSparkAt(
          window.innerWidth  * (0.2 + Math.random() * 0.6),
          window.innerHeight * (0.2 + Math.random() * 0.6)
        );
      }, i * 120);
    }
  }

  function getCompletedDataUrl() {
    // 解いた状態でギャラリー用のcanvasを生成
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx2 = c.getContext('2d');
    const gs = puzzleData.gridSize;
    const cs = 256 / gs;
    puzzleData.grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        ctx2.fillStyle = puzzleData.palette[cell.colorIndex];
        ctx2.fillRect(x * cs, y * cs, cs, cs);
      });
    });
    return c.toDataURL('image/png');
  }

  // タップ/クリックイベント
  let setupDone = false;
  function setupEvents() {
    if (setupDone) return;
    setupDone = true;
    canvas = screen.querySelector('#puzzle-canvas');
    canvas.addEventListener('click', handleTap);
    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      handleTap(e);
    }, { passive: false });

    screen.querySelector('#puzzle-back').addEventListener('click', onBack);

    screen.querySelector('#puzzle-save').addEventListener('click', () => {
      const dataUrl = getCompletedDataUrl();
      saveToGallery({ title, dataUrl, palette: puzzleData.palette, grid: puzzleData.grid });
      screen.querySelector('#complete-modal').classList.add('hidden');
      onComplete();
    });

    screen.querySelector('#puzzle-new').addEventListener('click', () => {
      screen.querySelector('#complete-modal').classList.add('hidden');
      onBack();
    });
  }

  // init関数とsetupEventsをexposeする
  screen._initPuzzle = (data, artTitle) => {
    setupEvents();
    init(data, artTitle);
  };

  return screen;
}

export const puzzleScreenCSS = `
/* ====== PuzzleScreen ====== */
#screen-puzzle {
  background: #1A1A2E;
}

.puzzle-header {
  justify-content: space-between;
}

.puzzle-progress-text {
  font-size: 0.85rem;
  font-weight: 900;
  color: #A0AABA;
  min-width: 60px;
  text-align: right;
}

.puzzle-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  gap: 12px;
  overflow: hidden;
}

.puzzle-canvas-wrap {
  position: relative;
  flex-shrink: 0;
}

.puzzle-canvas {
  display: block;
  border: 3px solid #0F3460;
  border-radius: 8px;
  cursor: crosshair;
  touch-action: none;
  /* Scale to fit screen width */
  max-width: min(100vw - 32px, 448px);
  max-height: calc(100vh - 280px);
  width: auto;
  height: auto;
  image-rendering: pixelated;
}

.puzzle-sparks {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

/* Progress bar */
.puzzle-progress-bar-wrap {
  width: 100%;
  max-width: 448px;
  height: 10px;
  background: #16213E;
  border-radius: 5px;
  overflow: hidden;
  border: 2px solid #0F3460;
  flex-shrink: 0;
}

.puzzle-progress-bar {
  height: 100%;
  background: #06D6A0;
  border-radius: 5px;
  transition: width 0.3s ease;
  width: 0%;
}

/* Palette */
.palette-section {
  width: 100%;
  max-width: 448px;
  flex-shrink: 0;
}

.palette-label {
  font-size: 0.85rem;
  font-weight: 900;
  color: #A0AABA;
  text-align: center;
  margin-bottom: 6px;
}

.color-palette {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px;
}

.palette-btn {
  position: relative;
  width: 46px;
  height: 46px;
  border-radius: 10px;
  border: 3px solid transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 0 rgba(0,0,0,0.3);
  transition: transform 0.12s ease;
}

.palette-btn:active {
  transform: scale(0.9) translateY(3px);
  box-shadow: 0 1px 0 rgba(0,0,0,0.3);
}

.palette-btn.selected {
  border-color: #FFFFFF;
  transform: scale(1.15);
  box-shadow: 0 0 12px 4px rgba(255,255,255,0.5);
}

.palette-btn.done {
  filter: brightness(0.6);
  cursor: default;
}

.palette-num {
  font-size: 0.8rem;
  font-weight: 900;
  color: #FFFFFF;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.8);
  position: absolute;
  bottom: 3px;
  right: 4px;
}

.palette-check {
  font-size: 1.2rem;
  color: #FFFFFF;
  text-shadow: 0 0 4px rgba(0,0,0,0.8);
}

/* Complete modal */
.complete-modal {
  position: fixed;
  inset: 0;
  background: #0A0A1A;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 90;
  animation: bounceIn 0.4s ease;
}

.complete-modal.hidden {
  display: none;
}

.complete-modal-box {
  background: #16213E;
  border: 4px solid #FFD60A;
  border-radius: 28px;
  padding: 32px 24px;
  text-align: center;
  max-width: 320px;
  width: 90%;
  box-shadow: 0 0 40px 10px #FFD60A;
  animation: fanfareJump 0.5s ease;
}

.complete-emoji {
  font-size: 4rem;
  animation: float 1s ease-in-out infinite;
}

.complete-title {
  font-size: 2.4rem;
  font-weight: 900;
  color: #FFD60A;
  text-shadow: 3px 3px 0 #D94F1A;
  margin: 8px 0 4px;
}

.complete-msg {
  font-size: 1.1rem;
  font-weight: 700;
  color: #A0AABA;
  margin-bottom: 20px;
}

.complete-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
}
`;
