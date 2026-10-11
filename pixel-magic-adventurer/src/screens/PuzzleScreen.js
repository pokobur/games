/**
 * PuzzleScreen.js — 数字塗り絵パズル画面
 * なぞり塗り（ドラッグ・スワイプ連続塗り）＋選択色ハイライト機能
 */
import { soundManager } from '../components/SoundManager.js';
import { saveToGallery, saveWipPuzzle, clearWipPuzzle } from '../logic/storage.js';

export function createPuzzleScreen({ onBack, onComplete }) {
  const screen = document.createElement('div');
  screen.id = 'screen-puzzle';
  screen.className = 'screen';
  screen.innerHTML = `
    <div class="screen-header puzzle-header">
      <button class="back-btn" id="puzzle-back" aria-label="もどる">◀</button>
      <div class="puzzle-title-wrap">
        <h1 id="puzzle-title-text">🎨 ぬりえパズル</h1>
        <div id="puzzle-progress-text" class="puzzle-progress-text">0 / 0</div>
      </div>
      <button class="icon-btn" id="puzzle-sound-btn" aria-label="音の切り替え">
        ${soundManager.isMuted ? '🔇' : '🔊'}
      </button>
    </div>

    <div class="puzzle-body">
      <!-- Canvas エリア -->
      <div class="puzzle-canvas-wrap">
        <canvas id="puzzle-canvas" class="puzzle-canvas"></canvas>
        <div class="puzzle-sparks" id="puzzle-sparks"></div>
      </div>

      <!-- 進捗バー（ソリッド） -->
      <div class="puzzle-progress-bar-wrap">
        <div class="puzzle-progress-bar" id="puzzle-progress-bar"></div>
      </div>

      <!-- カラーパレット -->
      <div class="palette-section">
        <div class="palette-label">👇 えらんだいろとおなじ すうじをぬろう！</div>
        <div class="color-palette" id="color-palette"></div>
      </div>
    </div>

    <!-- 全完成モーダル（ソリッド完全不透明） -->
    <div class="complete-modal hidden" id="complete-modal">
      <div class="complete-modal-box">
        <div class="complete-emoji">🎉</div>
        <div class="complete-title">かんせい！！</div>
        <div class="complete-msg">すごい！ぜんぶ ぬれたよ！✨</div>
        <div class="complete-buttons">
          <button class="btn btn-accent" id="puzzle-save">💾 コレクションへ</button>
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
  let isPointerDown = false;
  let lastPaintedCell = null;

  const soundBtn = screen.querySelector('#puzzle-sound-btn');
  soundBtn.addEventListener('click', () => {
    const muted = soundManager.toggleMute();
    soundBtn.textContent = muted ? '🔇' : '🔊';
  });
  soundManager.onMuteChange((muted) => {
    soundBtn.textContent = muted ? '🔇' : '🔊';
  });

  function init(data, artTitle) {
    puzzleData = JSON.parse(JSON.stringify(data));
    title = artTitle || 'マイアート';
    screen.querySelector('#puzzle-title-text').textContent = `🎨 ${title}`;
    selectedColorIndex = 0;
    completedColors.clear();
    solvedCells = 0;
    totalCells = puzzleData.grid.length * puzzleData.grid[0].length;

    // 復元または初期化時の進捗再計算
    puzzleData.grid.forEach(row => {
      row.forEach(c => {
        if (c.solved) solvedCells++;
      });
    });

    puzzleData.palette.forEach((hex, idx) => {
      const remaining = puzzleData.grid.flat().filter(c => c.colorIndex === idx && !c.solved).length;
      if (remaining === 0) completedColors.add(idx);
    });

    // 初期選択色を未完了の最初の色にする
    for (let i = 0; i < puzzleData.palette.length; i++) {
      if (!completedColors.has(i)) {
        selectedColorIndex = i;
        break;
      }
    }

    canvas = screen.querySelector('#puzzle-canvas');
    ctx = canvas.getContext('2d');

    // Canvas の解像度を高めに設定（Retina対応）
    const gs = puzzleData.gridSize;
    const baseSize = 448;
    canvas.width = baseSize;
    canvas.height = baseSize;

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
      let remaining = 0;
      grid.forEach(row => row.forEach(cell => {
        if (cell.colorIndex === idx && !cell.solved) remaining++;
      }));

      const isCompleted = remaining === 0;
      const isSelected = idx === selectedColorIndex;

      const btn = document.createElement('button');
      btn.className = `palette-btn ${isSelected ? 'selected' : ''} ${isCompleted ? 'done' : ''}`;
      btn.style.background = hex;
      btn.innerHTML = `
        <span class="palette-num">${idx + 1}</span>
        ${isCompleted ? '<span class="palette-check">✓</span>' : `<span class="palette-badge">${remaining}</span>`}
      `;
      btn.setAttribute('aria-label', `色${idx + 1} 残り${remaining}マス`);

      btn.addEventListener('click', () => {
        if (isCompleted) return;
        selectedColorIndex = idx;
        soundManager.playPop(idx);
        renderPalette();
        renderCanvas();
      });

      palEl.appendChild(btn);
    });
  }

  function renderCanvas() {
    if (!puzzleData || !ctx) return;
    const { palette, grid, gridSize } = puzzleData;
    const cellSize = canvas.width / gridSize;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cell = grid[y][x];
        const px = x * cellSize;
        const py = y * cellSize;

        if (cell.solved) {
          ctx.fillStyle = palette[cell.colorIndex];
          ctx.fillRect(px, py, cellSize, cellSize);
        } else {
          // 未塗りマス
          const isTarget = cell.colorIndex === selectedColorIndex;
          if (isTarget) {
            // 選択中の数字のマス：明るく目立つハイライトカラー（ソリッド）
            ctx.fillStyle = '#0F3460';
            ctx.fillRect(px, py, cellSize, cellSize);

            // 内枠線
            ctx.strokeStyle = '#FFD60A';
            ctx.lineWidth = 3;
            ctx.strokeRect(px + 1.5, py + 1.5, cellSize - 3, cellSize - 3);

            ctx.fillStyle = '#FFD60A';
          } else {
            ctx.fillStyle = '#16213E';
            ctx.fillRect(px, py, cellSize, cellSize);
            ctx.fillStyle = '#A0AABA';
          }

          // 番号の描画
          ctx.font = `900 ${Math.floor(cellSize * 0.48)}px "M PLUS Rounded 1c", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(cell.colorIndex + 1), px + cellSize / 2, py + cellSize / 2);
        }

        // 外周グリッド線（ソリッド）
        ctx.strokeStyle = '#0A0E17';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, cellSize, cellSize);
      }
    }
  }

  /**
   * ポインター座標からグリッド座標(x, y)を取得
   */
  function getCellCoords(e) {
    if (!puzzleData) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (
      clientX < rect.left || clientX > rect.right ||
      clientY < rect.top || clientY > rect.bottom
    ) {
      return null;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cellSize = canvas.width / puzzleData.gridSize;

    const cx = Math.floor((clientX - rect.left) * scaleX / cellSize);
    const cy = Math.floor((clientY - rect.top) * scaleY / cellSize);
    const gs = puzzleData.gridSize;

    if (cx < 0 || cy < 0 || cx >= gs || cy >= gs) return null;
    return { cx, cy };
  }

  /**
   * 特定のマスの着色処理
   */
  function paintCell(cx, cy, isDirectTap = false) {
    if (!puzzleData) return;
    const cell = puzzleData.grid[cy][cx];
    if (cell.solved) return;

    if (cell.colorIndex !== selectedColorIndex) {
      // 単発タップの時のみエラー音（なぞり塗りの途中で他マスを跨いでもエラー音連打しない）
      if (isDirectTap) {
        soundManager.playError();
        shakeCanvas();
      }
      return;
    }

    // 正解マスを塗る！
    cell.solved = true;
    solvedCells++;
    soundManager.playPop(selectedColorIndex);
    renderCanvas();
    updateProgress();
    saveWipPuzzle({ title, puzzleData });

    // スパークエフェクト
    const rect = canvas.getBoundingClientRect();
    const gs = puzzleData.gridSize;
    const sx = rect.left + (cx + 0.5) * (rect.width / gs);
    const sy = rect.top + (cy + 0.5) * (rect.height / gs);
    spawnSparkAt(sx, sy);

    // 1色完成チェック
    const isColorDone = puzzleData.grid.every(row =>
      row.every(c => c.colorIndex !== selectedColorIndex || c.solved)
    );

    if (isColorDone && !completedColors.has(selectedColorIndex)) {
      completedColors.add(selectedColorIndex);
      soundManager.playColorComplete();

      // 次の未完了色へ自動切り替え
      let nextColor = -1;
      for (let i = 0; i < puzzleData.palette.length; i++) {
        if (!completedColors.has(i)) {
          nextColor = i;
          break;
        }
      }
      if (nextColor !== -1) {
        selectedColorIndex = nextColor;
      }
      renderPalette();
      renderCanvas();
    }

    // 全完成チェック
    if (solvedCells >= totalCells) {
      setTimeout(() => showComplete(), 300);
    }
  }

  function shakeCanvas() {
    canvas.classList.remove('shake-anim');
    void canvas.offsetWidth;
    canvas.classList.add('shake-anim');
  }

  function spawnSparkAt(x, y) {
    const sparks = screen.querySelector('#puzzle-sparks');
    const star = document.createElement('div');
    star.className = 'puzzle-spark-star';
    star.textContent = ['⭐', '✨', '🌟'][Math.floor(Math.random() * 3)];
    star.style.left = `${x}px`;
    star.style.top = `${y}px`;
    document.body.appendChild(star);
    setTimeout(() => star.remove(), 700);
  }

  function updateProgress() {
    const pct = totalCells ? (solvedCells / totalCells) * 100 : 0;
    screen.querySelector('#puzzle-progress-bar').style.width = `${pct}%`;
    screen.querySelector('#puzzle-progress-text').textContent = `${solvedCells} / ${totalCells}`;
  }

  function showComplete() {
    clearWipPuzzle();
    soundManager.playComplete();
    screen.querySelector('#complete-modal').classList.remove('hidden');

    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        spawnSparkAt(
          window.innerWidth * (0.2 + Math.random() * 0.6),
          window.innerHeight * (0.2 + Math.random() * 0.6)
        );
      }, i * 100);
    }
  }

  function getCompletedDataUrl() {
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

  // ポインターイベント（スワイプ・ドラッグなぞり塗り対応！）
  let setupDone = false;
  function setupEvents() {
    if (setupDone) return;
    setupDone = true;

    canvas = screen.querySelector('#puzzle-canvas');

    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      isPointerDown = true;
      try { canvas.setPointerCapture(e.pointerId); } catch(err) {}

      const coords = getCellCoords(e);
      if (coords) {
        lastPaintedCell = `${coords.cx},${coords.cy}`;
        paintCell(coords.cx, coords.cy, true);
      }
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!isPointerDown) return;
      e.preventDefault();

      const coords = getCellCoords(e);
      if (coords) {
        const key = `${coords.cx},${coords.cy}`;
        if (key !== lastPaintedCell) {
          lastPaintedCell = key;
          // なぞり中は isDirectTap: false で静かに正解マスだけ塗る
          paintCell(coords.cx, coords.cy, false);
        }
      }
    });

    const pointerUpHandler = (e) => {
      isPointerDown = false;
      lastPaintedCell = null;
      try { canvas.releasePointerCapture(e.pointerId); } catch(err) {}
    };

    canvas.addEventListener('pointerup', pointerUpHandler);
    canvas.addEventListener('pointercancel', pointerUpHandler);

    screen.querySelector('#puzzle-back').addEventListener('click', onBack);

    screen.querySelector('#puzzle-save').addEventListener('click', () => {
      const dataUrl = getCompletedDataUrl();
      saveToGallery({
        title,
        dataUrl,
        palette: puzzleData.palette,
        grid: puzzleData.grid
      });
      screen.querySelector('#complete-modal').classList.add('hidden');
      onComplete();
    });

    screen.querySelector('#puzzle-new').addEventListener('click', () => {
      screen.querySelector('#complete-modal').classList.add('hidden');
      onBack();
    });
  }

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
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.puzzle-title-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.puzzle-title-wrap h1 {
  font-size: 1.15rem;
  font-weight: 900;
  color: #FFD60A;
  margin: 0;
}

.puzzle-progress-text {
  font-size: 0.85rem;
  font-weight: 900;
  color: #06D6A0;
}

.puzzle-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px 16px;
  gap: 8px;
  overflow: hidden;
  max-width: 480px;
  width: 100%;
  margin: 0 auto;
}

.puzzle-canvas-wrap {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex: 1;
  min-height: 0;
}

.puzzle-canvas {
  display: block;
  border: 4px solid #0A0E17;
  border-radius: 12px;
  cursor: pointer;
  touch-action: none;
  background: #16213E;
  box-shadow: 0 8px 0 #0A0E17;
  image-rendering: pixelated;
  max-width: 100%;
  max-height: 100%;
  aspect-ratio: 1;
}

.puzzle-canvas.shake-anim {
  animation: shake 0.3s ease;
}

.puzzle-sparks {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.puzzle-spark-star {
  position: fixed;
  font-size: 1.6rem;
  pointer-events: none;
  z-index: 5000;
  animation: starFloat 0.7s ease forwards;
}

/* Progress bar (完全ソリッド) */
.puzzle-progress-bar-wrap {
  width: 100%;
  height: 12px;
  background: #16213E;
  border-radius: 6px;
  overflow: hidden;
  border: 2px solid #0A0E17;
  flex-shrink: 0;
  box-shadow: 0 2px 0 #0A0E17;
}

.puzzle-progress-bar {
  height: 100%;
  background: #06D6A0;
  border-radius: 4px;
  transition: width 0.2s ease;
  width: 0%;
}

/* Palette */
.palette-section {
  width: 100%;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.palette-label {
  font-size: 0.85rem;
  font-weight: 900;
  color: #FFD60A;
  text-align: center;
  margin-bottom: 6px;
}

.color-palette {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  width: 100%;
}

.palette-btn {
  position: relative;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 3px solid #0A0E17;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 0 #0A0E17;
  transition: transform 0.1s ease;
}

.palette-btn:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #0A0E17;
}

.palette-btn.selected {
  border: 4px solid #FFFFFF;
  transform: scale(1.15) translateY(-3px);
  box-shadow: 0 8px 0 #0A0E17;
  z-index: 2;
}

.palette-btn.done {
  filter: brightness(0.45);
  cursor: default;
}

.palette-num {
  font-size: 0.95rem;
  font-weight: 900;
  color: #FFFFFF;
  text-shadow: 1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000;
}

.palette-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  background: #EF233C;
  color: #FFFFFF;
  font-size: 0.7rem;
  font-weight: 900;
  padding: 1px 5px;
  border-radius: 8px;
  border: 1px solid #0A0E17;
}

.palette-check {
  font-size: 1.4rem;
  color: #06D6A0;
  text-shadow: 1px 1px 0 #000, -1px -1px 0 #000;
}

/* Complete modal (ソリッド完全不透明) */
.complete-modal {
  position: fixed;
  inset: 0;
  background: #0A0E17;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 16px;
}

.complete-modal-box {
  background: #16213E;
  border: 6px solid #FFD60A;
  border-radius: 28px;
  padding: 28px 20px;
  text-align: center;
  max-width: 340px;
  width: 100%;
  box-shadow: 0 10px 0 #0A0E17;
  animation: fanfareJump 0.4s ease;
}

.complete-emoji {
  font-size: 3.8rem;
  animation: float 2s ease-in-out infinite;
}

.complete-title {
  font-size: 2.2rem;
  font-weight: 900;
  color: #FFD60A;
  text-shadow: 3px 3px 0 #D94F1A, -2px -2px 0 #0A0E17;
  margin: 6px 0;
}

.complete-msg {
  font-size: 1.1rem;
  font-weight: 900;
  color: #FFFFFF;
  margin-bottom: 20px;
}

.complete-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
`;
