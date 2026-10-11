import { audioManager } from './audio.js';

export class PaintCanvas {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    
    this.isDrawing = false;
    this.currentTool = 'pen'; // 'pen', 'eraser', 'bucket'
    this.currentColor = '#ff3b30';
    this.brushSize = 12;
    
    this.lastX = 0;
    this.lastY = 0;
    this.strokeMinX = 0;
    this.strokeMinY = 0;
    this.strokeMaxX = 0;
    this.strokeMaxY = 0;
    
    // Undo / Redo スタック
    this.undoStack = [];
    this.redoStack = [];
    this.maxStackSize = 15;
    
    // イベントリスナーのバインド参照を保持 (解除可能にするため)
    this.boundMouseDown = (e) => this.startDrawing(e);
    this.boundMouseMove = (e) => this.draw(e);
    this.boundMouseUp = () => this.stopDrawing();
    
    this.boundTouchStart = (e) => {
      e.preventDefault();
      this.startDrawing(e.touches[0]);
    };
    this.boundTouchMove = (e) => {
      e.preventDefault();
      this.draw(e.touches[0]);
    };
    this.boundTouchEnd = () => this.stopDrawing();
    
    this.setupResize();
    this.setupEvents();
    this.clear();
  }

  setupResize() {
    this.canvas.width = 512;
    this.canvas.height = 512;
  }

  setupEvents() {
    // マウスイベント登録
    this.canvas.addEventListener('mousedown', this.boundMouseDown);
    this.canvas.addEventListener('mousemove', this.boundMouseMove);
    window.addEventListener('mouseup', this.boundMouseUp);

    // タッチイベント登録 (モバイル対応)
    this.canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    this.canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    window.addEventListener('touchend', this.boundTouchEnd);
  }

  // キャンバス破棄とイベント解除 (メモリリーク・リスナー重複対策)
  destroy() {
    // 1. イベントリスナーの解除
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this.boundMouseDown);
      this.canvas.removeEventListener('mousemove', this.boundMouseMove);
      this.canvas.removeEventListener('touchstart', this.boundTouchStart);
      this.canvas.removeEventListener('touchmove', this.boundTouchMove);
    }
    window.removeEventListener('mouseup', this.boundMouseUp);
    window.removeEventListener('touchend', this.boundTouchEnd);

    // 2. スタック履歴メモリの明示的な解放
    this.clearHistory();
    this.undoStack = null;
    this.redoStack = null;
    
    this.canvas = null;
    this.ctx = null;
  }

  // 履歴メモリを完全にクリア
  clearHistory() {
    // 保存されているImageDataオブジェクトへの参照を切断しGCを促進
    if (this.undoStack) {
      while (this.undoStack.length > 0) {
        this.undoStack.pop();
      }
    }
    if (this.redoStack) {
      while (this.redoStack.length > 0) {
        this.redoStack.pop();
      }
    }
  }

  // キャンバス状態の保存
  saveState() {
    if (!this.ctx || !this.undoStack) return;
    
    // アクション実行前の状態を記録
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.undoStack.push(imgData);
    
    // 最大保存サイズを超えたら古いものを削除
    if (this.undoStack.length > this.maxStackSize) {
      const removed = this.undoStack.shift();
      // 参照を切断
    }
    
    // 新しいお絵かきが行われたためRedoスタックは空にする
    if (this.redoStack) {
      while (this.redoStack.length > 0) {
        this.redoStack.pop();
      }
    }
  }

  // 元に戻す (Undo)
  undo() {
    if (!this.undoStack || this.undoStack.length === 0) return;
    
    // 現在の状態をRedo用に保存
    const currentImg = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.redoStack.push(currentImg);
    
    // 直前の状態を復元
    const previousImg = this.undoStack.pop();
    this.ctx.putImageData(previousImg, 0, 0);
    audioManager.playTap();
  }

  // やり直す (Redo)
  redo() {
    if (!this.redoStack || this.redoStack.length === 0) return;
    
    // 現在の状態をUndo用に保存
    const currentImg = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.undoStack.push(currentImg);
    
    // Redoの状態を復元
    const nextImg = this.redoStack.pop();
    this.ctx.putImageData(nextImg, 0, 0);
    audioManager.playTap();
  }

  setTool(tool) {
    this.currentTool = tool;
    audioManager.playTap();
  }

  setColor(color) {
    this.currentColor = color;
    audioManager.playTap();
  }

  setBrushSize(size) {
    this.brushSize = size;
  }

  clear() {
    // 状態を保存
    this.saveState();
    if (this.ctx) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  getCoordinates(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  startDrawing(e) {
    // 描画開始前に状態を保存
    this.saveState();
    
    this.isDrawing = true;
    const { x, y } = this.getCoordinates(e);
    this.lastX = x;
    this.lastY = y;
    this.strokeMinX = x;
    this.strokeMaxX = x;
    this.strokeMinY = y;
    this.strokeMaxY = y;

    if (this.currentTool === 'bucket') {
      this.floodFill(Math.round(x), Math.round(y), this.currentColor);
      this.isDrawing = false;
    } else {
      this.drawSegment(x, y, x, y);
    }
  }

  draw(e) {
    if (!this.isDrawing || this.currentTool === 'bucket') return;
    const { x, y } = this.getCoordinates(e);
    
    this.strokeMinX = Math.min(this.strokeMinX, x);
    this.strokeMaxX = Math.max(this.strokeMaxX, x);
    this.strokeMinY = Math.min(this.strokeMinY, y);
    this.strokeMaxY = Math.max(this.strokeMaxY, y);

    this.drawSegment(this.lastX, this.lastY, x, y);
    
    this.lastX = x;
    this.lastY = y;
  }

  drawSegment(x1, y1, x2, y2) {
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    
    if (this.currentTool === 'eraser') {
      // 消しゴムモードはブレンドモードを destination-out にして消去
      this.ctx.globalCompositeOperation = 'destination-out';
      this.ctx.strokeStyle = 'rgba(0,0,0,1)';
      this.ctx.lineWidth = this.brushSize * 1.5;
    } else {
      this.ctx.globalCompositeOperation = 'source-over';
      this.ctx.strokeStyle = this.currentColor;
      this.ctx.lineWidth = this.brushSize;
    }
    
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();
    this.ctx.globalCompositeOperation = 'source-over'; // リセット
  }

  stopDrawing() {
    if (this.isDrawing) {
      this.isDrawing = false;
      if (this.currentTool === 'pen') {
        const pad = this.brushSize + 4;
        this.smoothCanvasLines({
          minX: Math.max(1, Math.floor(this.strokeMinX - pad)),
          maxX: Math.min(this.canvas.width - 2, Math.ceil(this.strokeMaxX + pad)),
          minY: Math.max(1, Math.floor(this.strokeMinY - pad)),
          maxY: Math.min(this.canvas.height - 2, Math.ceil(this.strokeMaxY + pad))
        });
      }
    }
  }

  // 輪郭自動補正 (バウンディングボックス限定の高速平滑化フィルタ)
  smoothCanvasLines(bbox) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const minX = bbox ? bbox.minX : 1;
    const maxX = bbox ? bbox.maxX : width - 2;
    const minY = bbox ? bbox.minY : 1;
    const maxY = bbox ? bbox.maxY : height - 2;
    if (minX >= maxX || minY >= maxY) return;

    const imgData = this.ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const temp = new Uint8ClampedArray(data);
    
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const idx = (y * width + x) * 4;
        if (temp[idx + 3] === 0) continue; // 透明箇所はスキップ
        
        let sumA = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            sumA += temp[((y + ky) * width + (x + kx)) * 4 + 3];
          }
        }
        const avgA = sumA / 9;
        if (avgA < 120) {
          data[idx + 3] = Math.max(0, avgA - 10);
        } else {
          data[idx + 3] = Math.min(255, avgA + 15);
        }
      }
    }
    this.ctx.putImageData(imgData, 0, 0);
  }

  // 高速バケツ塗りつぶし (O(1) スタック & カラー距離トレランス対応)
  floodFill(startX, startY, fillColorHex) {
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    if (startX < 0 || startX >= width || startY < 0 || startY >= height) return;
    
    const imgData = this.ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    
    // HEX色をRGBAに変換
    const r = parseInt(fillColorHex.slice(1, 3), 16);
    const g = parseInt(fillColorHex.slice(3, 5), 16);
    const b = parseInt(fillColorHex.slice(5, 7), 16);
    const a = 255;
    
    const fillCol = (a << 24) | (b << 16) | (g << 8) | r;
    const buffer = new Uint32Array(data.buffer);
    
    const targetIdx = startY * width + startX;
    const targetCol = buffer[targetIdx];
    
    if (targetCol === fillCol) return; // 同じ色なら何もしない
    
    // ターゲットピクセルのRGBA分解
    const tr = targetCol & 0xff;
    const tg = (targetCol >> 8) & 0xff;
    const tb = (targetCol >> 16) & 0xff;
    const ta = (targetCol >> 24) & 0xff;
    const isTargetTransparent = ta < 20;
    const tolerance = 32;

    const isMatch = (pixelVal) => {
      if (pixelVal === targetCol) return true;
      const pa = (pixelVal >> 24) & 0xff;
      if (isTargetTransparent) {
        return pa < 20;
      }
      if (pa < 20) return false;
      const pr = pixelVal & 0xff;
      const pg = (pixelVal >> 8) & 0xff;
      const pb = (pixelVal >> 16) & 0xff;
      return Math.abs(pr - tr) <= tolerance &&
             Math.abs(pg - tg) <= tolerance &&
             Math.abs(pb - tb) <= tolerance;
    };
    
    // 高速スタックベース走査 (O(1) pop)
    const stack = [targetIdx];
    buffer[targetIdx] = fillCol;
    
    while (stack.length > 0) {
      const idx = stack.pop();
      const cx = idx % width;
      const cy = (idx / width) | 0;
      
      // 4方向近傍を走査
      if (cx + 1 < width) {
        const right = idx + 1;
        if (isMatch(buffer[right])) {
          buffer[right] = fillCol;
          stack.push(right);
        }
      }
      if (cx - 1 >= 0) {
        const left = idx - 1;
        if (isMatch(buffer[left])) {
          buffer[left] = fillCol;
          stack.push(left);
        }
      }
      if (cy + 1 < height) {
        const down = idx + width;
        if (isMatch(buffer[down])) {
          buffer[down] = fillCol;
          stack.push(down);
        }
      }
      if (cy - 1 >= 0) {
        const up = idx - width;
        if (isMatch(buffer[up])) {
          buffer[up] = fillCol;
          stack.push(up);
        }
      }
    }
    
    this.ctx.putImageData(imgData, 0, 0);
    audioManager.playTap();
  }

  // 写真読み込み ＆ 背景透過処理 (カメラ・アルバムからの取り込み)
  loadImageAndExtractDrawing(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          this.clear();
          
          // キャンバスのサイズ (512x512) に合わせて画像を中央に配置
          let dw, dh, dx, dy;
          const aspect = img.width / img.height;
          if (aspect > 1) {
            dw = this.canvas.width;
            dh = this.canvas.width / aspect;
            dx = 0;
            dy = (this.canvas.height - dh) / 2;
          } else {
            dh = this.canvas.height;
            dw = this.canvas.height * aspect;
            dx = (this.canvas.width - dw) / 2;
            dy = 0;
          }
          
          this.ctx.drawImage(img, dx, dy, dw, dh);
          
          // 背景自動透過処理
          this.removeBackgroundAuto();
          
          resolve();
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // 四隅のピクセルから背景色を検出し、自動透過するクロマキーアルゴリズム
  removeBackgroundAuto() {
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imgData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 1. 四隅（左上、右上、左下、右下）および少し内側のピクセル色をサンプリング
    const corners = [
      (0 * width + 0) * 4,
      (0 * width + (width - 1)) * 4,
      ((height - 1) * width + 0) * 4,
      ((height - 1) * width + (width - 1)) * 4,
      (5 * width + 5) * 4,
      (5 * width + (width - 6)) * 4
    ];
    
    let sumR = 0, sumG = 0, sumB = 0;
    let count = 0;
    
    corners.forEach(idx => {
      // アルファ値が十分にあるピクセルのみ
      if (data[idx + 3] > 200) {
        sumR += data[idx];
        sumG += data[idx + 1];
        sumB += data[idx + 2];
        count++;
      }
    });
    
    // 背景平均色
    const bgR = count > 0 ? sumR / count : 240;
    const bgG = count > 0 ? sumG / count : 240;
    const bgB = count > 0 ? sumB / count : 240;
    
    // 2. 全ピクセルをスキャンし、背景色に近い部分（または高輝度の白に近い部分）を透過
    const threshold = 55; // 色差しきい値
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      
      if (a === 0) continue;
      
      // 背景色とのRGB距離 (Euclidean distance)
      const diff = Math.sqrt(
        Math.pow(r - bgR, 2) +
        Math.pow(g - bgG, 2) +
        Math.pow(b - bgB, 2)
      );
      
      // 白（紙の背景）または背景サンプリング色に近い場合は透過
      const isWhiteBg = (r > 200 && g > 200 && b > 200); // 一般的な紙の白
      
      if (diff < threshold || isWhiteBg) {
        data[i + 3] = 0; // 透過
      }
    }
    
    this.ctx.putImageData(imgData, 0, 0);
    this.smoothCanvasLines(); // 透過後の輪郭のエッジを滑らかにする
  }

  getDataUrl() {
    return this.canvas.toDataURL('image/png');
  }
}
