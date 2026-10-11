/**
 * pixelate.js
 * Canvasを使った画像のモザイク化・減色処理（k-means法）
 */

import { getPresetPuzzle } from './presets.js';

const DEFAULT_GRID_SIZE = 16;

/**
 * 画像URLからパズルデータを生成する
 * @param {string} imageUrl
 * @param {number} numColors — 使用色数 (6〜12色)
 * @param {number} gridSize — グリッドの分割数 (16)
 * @returns {Promise<{ palette: string[], grid: Array<Array<{colorIndex:number, solved:boolean}>>, gridSize: number }>}
 */
export async function pixelateImage(imageUrl, numColors = 8, gridSize = DEFAULT_GRID_SIZE) {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = gridSize;
  canvas.height = gridSize;
  const ctx = canvas.getContext('2d');

  // グリッドサイズにリサイズして描画
  ctx.drawImage(img, 0, 0, gridSize, gridSize);
  const imageData = ctx.getImageData(0, 0, gridSize, gridSize);
  const pixels = imageData.data; // Uint8ClampedArray [r,g,b,a, ...]

  // RGBピクセル配列を抽出
  const rgbPixels = [];
  for (let i = 0; i < pixels.length; i += 4) {
    // アルファ値が低い場合は背景色（ダークネイビー #1A1A2E）とみなす
    if (pixels[i + 3] < 50) {
      rgbPixels.push([26, 26, 46]);
    } else {
      rgbPixels.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
    }
  }

  // k-means減色
  const palette = kMeans(rgbPixels, numColors);

  // 各ピクセルを最近傍カラーのインデックスに変換
  const grid = [];
  for (let y = 0; y < gridSize; y++) {
    const row = [];
    for (let x = 0; x < gridSize; x++) {
      const pixel = rgbPixels[y * gridSize + x];
      const colorIndex = nearestColor(pixel, palette);
      row.push({ colorIndex, solved: false });
    }
    grid.push(row);
  }

  // hex文字列に変換
  const hexPalette = palette.map(([r, g, b]) => rgbToHex(r, g, b));

  return { palette: hexPalette, grid, gridSize };
}

/**
 * 画像URLを読み込んでImageオブジェクトを返す
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (!url.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + url));
    img.src = url;
  });
}

/**
 * k-means クラスタリングによる減色
 */
function kMeans(pixels, k, maxIter = 20) {
  if (pixels.length === 0) return [[0, 0, 0]];
  const actualK = Math.min(k, pixels.length);

  // 初期セントロイド: 均等サンプリング
  let centroids = [];
  const step = Math.floor(pixels.length / actualK);
  for (let i = 0; i < actualK; i++) {
    centroids.push([...pixels[i * step]]);
  }

  let assignments = new Array(pixels.length).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    let changed = false;
    for (let i = 0; i < pixels.length; i++) {
      const nearest = nearestColor(pixels[i], centroids);
      if (nearest !== assignments[i]) {
        assignments[i] = nearest;
        changed = true;
      }
    }
    if (!changed) break;

    // セントロイドを更新
    const sums = Array.from({ length: actualK }, () => [0, 0, 0]);
    const counts = new Array(actualK).fill(0);

    for (let i = 0; i < pixels.length; i++) {
      const ci = assignments[i];
      sums[ci][0] += pixels[i][0];
      sums[ci][1] += pixels[i][1];
      sums[ci][2] += pixels[i][2];
      counts[ci]++;
    }

    for (let c = 0; c < actualK; c++) {
      if (counts[c] > 0) {
        centroids[c] = [
          Math.round(sums[c][0] / counts[c]),
          Math.round(sums[c][1] / counts[c]),
          Math.round(sums[c][2] / counts[c]),
        ];
      }
    }
  }

  return centroids;
}

/**
 * 最近傍カラーのインデックスを返す（ユークリッド距離）
 */
function nearestColor(pixel, palette) {
  let minDist = Infinity;
  let minIdx = 0;
  for (let i = 0; i < palette.length; i++) {
    const dr = pixel[0] - palette[i][0];
    const dg = pixel[1] - palette[i][1];
    const db = pixel[2] - palette[i][2];
    const dist = dr * dr + dg * dg + db * db;
    if (dist < minDist) {
      minDist = dist;
      minIdx = i;
    }
  }
  return minIdx;
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * モックパズルを生成（プリセットから取得）
 */
export function generateMockPuzzle(query = 'ねこ') {
  return getPresetPuzzle(query);
}
