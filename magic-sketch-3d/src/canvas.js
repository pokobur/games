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
    
    // Undo / Redo スタック
    this.undoStack = [];
    this.redoStack = [];
    this.maxStackSize = 15;
    
    this.setupResize();
    this.setupEvents();
    this.clear();
  }

  setupResize() {
    this.canvas.width = 512;
    this.canvas.height = 512;
  }

  setupEvents() {
    // マウスイベント
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    window.addEventListener('mouseup', () => this.stopDrawing());

    // タッチイベント (モバイル対応)
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.startDrawing(e.touches[0]);
    }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.draw(e.touches[0]);
    }, { passive: false });
    window.addEventListener('touchend', () => this.stopDrawing());
  }

  // キャンバス状態の保存
  saveState() {
    // アクション実行前の状態を記録
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    this.undoStack.push(imgData);
    
    // 最大保存サイズを超えたら古いものを削除
    if (this.undoStack.length > this.maxStackSize) {
      this.undoStack.shift();
    }
    
    // 新しいお絵かきが行われたためRedoスタックは空にする
    this.redoStack = [];
  }

  // 元に戻す (Undo)
  undo() {
    if (this.undoStack.length === 0) return;
    
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
    if (this.redoStack.length === 0) return;
    
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
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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
      this.smoothCanvasLines(); // 離した瞬間に少し線を滑らかに補正
    }
  }

  // 輪郭自動補正 (線のはみ出しや隙間をゆるやかに自動補正する機能)
  smoothCanvasLines() {
    // 描いた境界線のアンチエイリアシング/隙間のクローズを行うため、
    // キャンバスに微細なブラーとアルファしきい値処理を施し、ガタつきを整えます。
    const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
    const data = imgData.data;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 超高速の平滑化フィルタ (近傍平均による簡易ブラー処理)
    // エッジのギザギザを取り除き、3D化した際に滑らかな表面にします。
    const temp = new Uint8ClampedArray(data);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4;
        if (temp[idx + 3] === 0) continue; // 透明箇所はスキップ
        
        // 周囲3x3のアルファ値を平均
        let sumA = 0;
        let count = 0;
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const kIdx = ((y + ky) * width + (x + kx)) * 4;
            sumA += temp[kIdx + 3];
            count++;
          }
        }
        
        const avgA = sumA / count;
        // アルファ値が低すぎる場合は少し減衰、高い場合は保持
        if (avgA < 120) {
          data[idx + 3] = Math.max(0, avgA - 10);
        } else {
          data[idx + 3] = Math.min(255, avgA + 15); // 隙間を埋めるように少し太らせる
        }
      }
    }
    this.ctx.putImageData(imgData, 0, 0);
  }

  // バケツ塗りつぶし (Flood Fill アルゴリズム)
  // TypedArray (Uint32Array) を用いて、ブラウザ内で超高速に動作させます。
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
    
    // ピクセルバッファを32ビットで操作して高速化
    const buffer = new Uint32Array(data.buffer);
    
    const targetIdx = (startY * width + startX);
    const targetCol = buffer[targetIdx];
    
    if (targetCol === fillCol) return; // 同じ色なら何もしない
    
    // アルファ値やカラー距離の比較用関数
    const isMatch = (color1, color2) => {
      if (color1 === color2) return true;
      // 透明部分同士の塗りつぶしのために、アルファが0に近い場合は類似とみなす
      const a1 = (color1 >> 24) & 0xff;
      const a2 = (color2 >> 24) & 0xff;
      if (a1 < 10 && a2 < 10) return true;
      return false;
    };
    
    const queue = [[startX, startY]];
    buffer[targetIdx] = fillCol;
    
    let safetyCounter = 0;
    const maxPixels = width * height;
    
    while (queue.length > 0 && safetyCounter < maxPixels) {
      safetyCounter++;
      const [cx, cy] = queue.shift();
      
      const directions = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1]
      ];
      
      for (const [nx, ny] of directions) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const idx = ny * width + nx;
          if (isMatch(buffer[idx], targetCol)) {
            buffer[idx] = fillCol;
            queue.push([nx, ny]);
          }
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
