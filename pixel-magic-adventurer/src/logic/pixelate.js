/**
 * pixelate.js
 * Canvasを使った画像のモザイク化・減色処理（k-means法）
 */

const GRID_SIZE = 16;

/**
 * 画像URLからパズルデータを生成する
 * @param {string} imageUrl
 * @param {number} numColors — 使用色数 (8〜16)
 * @returns {{ palette: string[], grid: Array<Array<{colorIndex:number, solved:boolean}>> }}
 */
export async function pixelateImage(imageUrl, numColors = 12) {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  canvas.width = GRID_SIZE;
  canvas.height = GRID_SIZE;
  const ctx = canvas.getContext('2d');

  // 32×32にリサイズして描画
  ctx.drawImage(img, 0, 0, GRID_SIZE, GRID_SIZE);
  const imageData = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE);
  const pixels = imageData.data; // Uint8ClampedArray [r,g,b,a, r,g,b,a, ...]

  // RGBピクセル配列を抽出
  const rgbPixels = [];
  for (let i = 0; i < pixels.length; i += 4) {
    rgbPixels.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
  }

  // k-means減色
  const palette = kMeans(rgbPixels, numColors);

  // 各ピクセルを最近傍カラーのインデックスに変換
  const grid = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      const pixel = rgbPixels[y * GRID_SIZE + x];
      const colorIndex = nearestColor(pixel, palette);
      row.push({ colorIndex, solved: false });
    }
    grid.push(row);
  }

  // hex文字列に変換
  const hexPalette = palette.map(([r, g, b]) => rgbToHex(r, g, b));

  return { palette: hexPalette, grid, gridSize: GRID_SIZE };
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
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * k-means クラスタリングによる減色
 */
function kMeans(pixels, k, maxIter = 20) {
  // 初期セントロイド: ランダムに選ぶ
  let centroids = [];
  const step = Math.floor(pixels.length / k);
  for (let i = 0; i < k; i++) {
    centroids.push([...pixels[i * step]]);
  }

  let assignments = new Array(pixels.length).fill(0);

  for (let iter = 0; iter < maxIter; iter++) {
    // 各ピクセルを最近傍セントロイドに割り当て
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
    const sums = Array.from({ length: k }, () => [0, 0, 0]);
    const counts = new Array(k).fill(0);
    for (let i = 0; i < pixels.length; i++) {
      const ci = assignments[i];
      sums[ci][0] += pixels[i][0];
      sums[ci][1] += pixels[i][1];
      sums[ci][2] += pixels[i][2];
      counts[ci]++;
    }
    for (let c = 0; c < k; c++) {
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
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

/**
 * デモ用モック: ランダムなカラフルグリッドを生成
 */
export function generateMockPuzzle() {
  const palette = [
    '#FF6B35', '#FFD60A', '#06D6A0', '#4CC9F0',
    '#7B2FBE', '#EF233C', '#3A86FF', '#FB5607',
    '#8338EC', '#FFBE0B', '#06C67A', '#F72585',
  ];

  const grid = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      // シンプルなパターン（実際はAPI生成画像を使用）
      const regions = [
        { cx: 4, cy: 4, r: 3, ci: 0 },
        { cx: 12, cy: 4, r: 3, ci: 1 },
        { cx: 8, cy: 10, r: 4, ci: 2 },
        { cx: 4, cy: 12, r: 2, ci: 3 },
        { cx: 12, cy: 12, r: 2, ci: 4 },
      ];
      let colorIndex = 5;
      for (const { cx, cy, r, ci } of regions) {
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r ** 2) {
          colorIndex = ci;
          break;
        }
      }
      row.push({ colorIndex, solved: false });
    }
    grid.push(row);
  }
  return { palette, grid, gridSize: GRID_SIZE };
}
