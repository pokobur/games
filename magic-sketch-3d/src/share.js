import { audioManager } from './audio.js';

// カラーパレット定義 (index.html のカラースウォッチと同期)
const PALETTE = [
  "#ff3b30", // 1: 赤
  "#ff9500", // 2: オレンジ
  "#ffcc00", // 3: 黄色
  "#4cd964", // 4: 緑
  "#5ac8fa", // 5: 水色
  "#007aff", // 6: 青
  "#5856d6", // 7: 紫
  "#ff2d55", // 8: ピンク
  "#ff9ccb", // 9: 薄ピンク
  "#8b5a2b", // 10: 茶色
  "#555555", // 11: グレー
  "#000000"  // 12: 黒
];

export const ShareManager = {
  // 1. AR写真撮影 (Web Share API によるダイレクト保存/共有、非対応時はダウンロード)
  async captureARPhoto(video, renderer) {
    try {
      const width = renderer.domElement.width;
      const height = renderer.domElement.height;

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = width;
      finalCanvas.height = height;
      const ctx = finalCanvas.getContext('2d');

      // ビデオ背景の描画 (カバーアスペクト)
      const videoRatio = video.videoWidth / video.videoHeight;
      const canvasRatio = width / height;
      let sx, sy, sw, sh;
      
      if (videoRatio > canvasRatio) {
        sh = video.videoHeight;
        sw = video.videoHeight * canvasRatio;
        sx = (video.videoWidth - sw) / 2;
        sy = 0;
      } else {
        sw = video.videoWidth;
        sh = video.videoWidth / canvasRatio;
        sx = 0;
        sy = (video.videoHeight - sh) / 2;
      }

      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, width, height);
      ctx.drawImage(renderer.domElement, 0, 0, width, height);

      const dataUrl = finalCanvas.toDataURL('image/png');
      
      // Blob に変換して Web Share API を使用できるか検証
      const blob = await new Promise(resolve => finalCanvas.toBlob(resolve, 'image/png'));
      const file = new File([blob], `magic-ar-${Date.now()}.png`, { type: 'image/png' });

      // Web Share API による写真のダイレクトアルバム保存・共有
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'らくがき3Dしょうかん',
          text: '現実世界にラクガキを召喚したよ！'
        });
        audioManager.playSuccess();
      } else {
        // 非対応ブラウザでのダウンロードフォールバック
        const link = document.createElement('a');
        link.download = `magic-sketch-ar-${Date.now()}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        audioManager.playSuccess();
      }
      return dataUrl;
    } catch (err) {
      // ユーザーによるシェアキャンセル等は例外スローされるため警告で逃がす
      console.warn("Share or capture canceled:", err);
      throw err;
    }
  },

  // 2. 魔法のリンク共有 (RLE + パレット色インデックスによる超圧縮URLハッシュ生成)
  compressCanvasToHash(canvas, charName) {
    // 64x64の一時キャンバスに縮小
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 64;
    tempCanvas.height = 64;
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(canvas, 0, 0, 64, 64);
    const imgData = tempCtx.getImageData(0, 0, 64, 64);
    const pixels = imgData.data;

    // パレットカラーをRGBに変換しておく (距離計算用)
    const rgbPalette = PALETTE.map(hex => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return { r, g, b };
    });

    // 各ピクセルをパレットインデックス (0 = 透明, 1〜12 = PALETTEの色) に変換
    const indexArray = new Uint8Array(64 * 64);
    
    for (let i = 0; i < 64 * 64; i++) {
      const idx = i * 4;
      const r = pixels[idx];
      const g = pixels[idx + 1];
      const b = pixels[idx + 2];
      const a = pixels[idx + 3];

      if (a < 40) {
        indexArray[i] = 0; // 透明
      } else {
        // 最も近いパレット色を探す (Euclidean distance)
        let minDistance = Infinity;
        let bestColorIndex = 1; // 1-indexed

        rgbPalette.forEach((col, pIdx) => {
          const dist = Math.sqrt(
            Math.pow(r - col.r, 2) +
            Math.pow(g - col.g, 2) +
            Math.pow(b - col.b, 2)
          );
          if (dist < minDistance) {
            minDistance = dist;
            bestColorIndex = pIdx + 1; // 1-indexed
          }
        });
        indexArray[i] = bestColorIndex;
      }
    }

    // ランレングス圧縮 (Run-Length Encoding)
    // [色インデックス (1バイト), 連続カウント (1バイト)] をバッファに格納
    const rleBuffer = [];
    let currentColor = indexArray[0];
    let count = 1;

    for (let i = 1; i < indexArray.length; i++) {
      if (indexArray[i] === currentColor && count < 255) {
        count++;
      } else {
        rleBuffer.push(currentColor, count);
        currentColor = indexArray[i];
        count = 1;
      }
    }
    rleBuffer.push(currentColor, count); // 最後のグループ

    // Uint8Array に変換
    const compressedBytes = new Uint8Array(rleBuffer);

    // バイト配列をバイナリ文字列に変換してBase64符号化
    let binaryString = '';
    for (let i = 0; i < compressedBytes.length; i++) {
      binaryString += String.fromCharCode(compressedBytes[i]);
    }
    const base64Data = btoa(binaryString);

    const payload = {
      n: charName || 'なまえなし',
      rle: base64Data
    };

    const jsonStr = JSON.stringify(payload);
    // URLセーフなBase64へエンコード
    const encodedHash = btoa(encodeURIComponent(jsonStr));
    return encodedHash;
  },

  // 3. RLEデコードとキャンバス復元
  decompressHashToCanvas(hashString) {
    try {
      const decodedJson = decodeURIComponent(atob(hashString));
      const payload = JSON.parse(decodedJson);
      
      const charName = payload.n;
      const rleBase64 = payload.rle;
      
      // Base64からバイト配列へ復元
      const binaryString = atob(rleBase64);
      const compressedBytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        compressedBytes[i] = binaryString.charCodeAt(i);
      }

      // RLE展開
      const indexArray = new Uint8Array(64 * 64);
      let indexPointer = 0;
      
      for (let i = 0; i < compressedBytes.length; i += 2) {
        const colorVal = compressedBytes[i];
        const count = compressedBytes[i + 1];
        
        for (let c = 0; c < count; c++) {
          if (indexPointer < 64 * 64) {
            indexArray[indexPointer++] = colorVal;
          }
        }
      }

      // 64x64 のピクセルデータ作成
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 64;
      tempCanvas.height = 64;
      const tempCtx = tempCanvas.getContext('2d');
      const imgData = tempCtx.createImageData(64, 64);
      const data = imgData.data;

      // HEXをRGB値に変換するヘルパー
      const hexToRgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
      };

      for (let i = 0; i < 64 * 64; i++) {
        const colorIdx = indexArray[i];
        const pixelOffset = i * 4;

        if (colorIdx === 0) {
          // 透明
          data[pixelOffset] = 0;
          data[pixelOffset + 1] = 0;
          data[pixelOffset + 2] = 0;
          data[pixelOffset + 3] = 0;
        } else {
          // パレット色
          const { r, g, b } = hexToRgb(PALETTE[colorIdx - 1]);
          data[pixelOffset] = r;
          data[pixelOffset + 1] = g;
          data[pixelOffset + 2] = b;
          data[pixelOffset + 3] = 255;
        }
      }

      tempCtx.putImageData(imgData, 0, 0);

      return new Promise((resolve, reject) => {
        // 512x512の最終キャンバスに拡大コピー
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = 512;
        finalCanvas.height = 512;
        const finalCtx = finalCanvas.getContext('2d');
        
        // ピクセルアートをシャープに表示 (子供がよろこぶおもちゃ感)
        finalCtx.imageSmoothingEnabled = false;
        
        // 縮小画像を拡大して描画
        const img = new Image();
        img.onload = () => {
          finalCtx.drawImage(img, 0, 0, 512, 512);
          resolve({ canvas: finalCanvas, charName });
        };
        img.onerror = reject;
        img.src = tempCanvas.toDataURL('image/png');
      });

    } catch (err) {
      return Promise.reject(err);
    }
  },

  // 4. 共有モーダルの表示
  showShareModal(shareUrl) {
    const modal = document.getElementById('modal-share-result');
    const urlInput = document.getElementById('share-url-text');
    const qrContainer = document.getElementById('share-qr-container');
    const copyBtn = document.getElementById('btn-copy-link');
    const closeBtn = document.getElementById('btn-close-share');

    urlInput.value = shareUrl;
    
    // QRコードの生成 (QR Server API)
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`;
    qrContainer.innerHTML = `<img src="${qrApiUrl}" alt="QR Code" style="width: 150px; height: 150px; border: none;">`;
    
    modal.classList.add('active');
    audioManager.playSuccess();

    copyBtn.onclick = () => {
      urlInput.select();
      navigator.clipboard.writeText(shareUrl).then(() => {
        copyBtn.textContent = 'コピーした！';
        audioManager.playSuccess();
        setTimeout(() => {
          copyBtn.textContent = 'コピー';
        }, 1500);
      });
    };

    closeBtn.onclick = () => {
      modal.classList.remove('active');
      audioManager.playTap();
    };
  }
};
