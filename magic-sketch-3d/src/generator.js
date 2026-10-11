import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export const ModelGenerator = {
  // キャンバスのピクセルデータから3Dモデル(THREE.Group)を作成する
  generate3DModelFromCanvas(canvas) {
    return new Promise((resolve, reject) => {
      try {
        const width = canvas.width;
        const height = canvas.height;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // 1. アルファ値のしきい値からグリッドを作成 (1 = 描画あり, 0 = 透過)
        const alphaThreshold = 30;
        const grid = new Uint8Array(width * height);
        let hasDrawnPixels = false;
        for (let i = 0; i < width * height; i++) {
          if (data[i * 4 + 3] > alphaThreshold) {
            grid[i] = 1;
            hasDrawnPixels = true;
          }
        }

        if (!hasDrawnPixels) {
          reject(new Error("えが かかれていないか、うすいよ！もっとしっかり えをかいてね。"));
          return;
        }

        // 2. 小さな線切れや隙間を塞ぎ、確実な立体形状を作るためのモルフォロジー膨張 (2px)
        const dilatedGrid = this.dilateMask(grid, width, height, 2);

        // 3. キャンバス外枠からのフラッドフィルで「真の外側背景」を特定
        // 描いた輪郭線で囲まれた内側（顔の中・体の中）は立体フィギュアの肉付けとして自動的に保持される
        const isOutside = this.floodFillExterior(dilatedGrid, width, height);

        // 4. キャラクター立体化マスク (外側背景以外のすべてのピクセル)
        const bodyMask = new Uint8Array(width * height);
        let bodyPixelCount = 0;
        for (let i = 0; i < width * height; i++) {
          if (!isOutside[i]) {
            bodyMask[i] = 1;
            bodyPixelCount++;
          }
        }

        if (bodyPixelCount < 100) {
          reject(new Error("えが小さすぎるよ！もう少し大きくかいてみてね。"));
          return;
        }

        // 5. 独立した連結コンポーネント（島）の抽出
        const islands = this.findConnectedIslands(bodyMask, width, height);
        if (islands.length === 0) {
          reject(new Error("えのかたちが認識できなかったよ！"));
          return;
        }

        // 6. 3Dモデル専用の合成テクスチャキャンバスを生成
        // （線画の内側の透明な部分には優しい白下地を敷き、その上に描いた絵を1:1で正確に投影）
        const textureCanvas = this.createModelTextureCanvas(canvas, bodyMask, width, height);
        const texture = new THREE.CanvasTexture(textureCanvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        // イラストからアクセントカラーを抽出 (側面マテリアルのクレイ色)
        const accentColor = this.extractAccentColor(data);

        // 前面/後面マテリアル
        const frontMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.35,
          metalness: 0.05,
          side: THREE.FrontSide
        });

        // 側面マテリアル (クレイ・ビニールトイ風のやさしいサイドカラー)
        const sideMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(accentColor),
          roughness: 0.35,
          metalness: 0.05
        });

        const materials = [frontMaterial, sideMaterial];

        // 7. 各パーツごとに輪郭トレースと押し出し成型
        const group = new THREE.Group();

        islands.forEach(island => {
          // ムーア近傍法による単一・自己交差のない滑らかな境界輪郭の抽出
          const boundaryPoints = this.traceIslandBoundary(island.mask, width, height);
          if (boundaryPoints.length < 4) return;

          // Ramer-Douglas-Peucker (RDP) による頂点の最適化
          const simplifiedPoints = this.simplifyPoints(boundaryPoints, 2.0);
          if (simplifiedPoints.length < 3) return;

          // Three.js 形状の構築
          const shape = new THREE.Shape();
          simplifiedPoints.forEach((pt, idx) => {
            const x = pt.x - width / 2;
            const y = (height - pt.y) - height / 2;
            if (idx === 0) shape.moveTo(x, y);
            else shape.lineTo(x, y);
          });
          shape.closePath();

          // 押し出し厚み設定（クレイ/ビニールトイ風の丸みと十分な厚み）
          const extrudeSettings = {
            depth: 22,
            bevelEnabled: true,
            bevelSegments: 4,
            steps: 1,
            bevelSize: 3.5,
            bevelThickness: 3.5
          };

          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

          // 正確なグローバルキャンバスUVマッピング (1:1 ピクセル完全整合)
          this.applyGlobalUVMapping(geometry, width, height);

          const mesh = new THREE.Mesh(geometry, materials);
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          group.add(mesh);
        });

        if (group.children.length === 0) {
          reject(new Error("えの かたちがシンプルすぎるよ！"));
          return;
        }

        // 8. グループ全体のセンタリング & 接地調整 (足元をY=0にしてAR空間で床に接地させる)
        const box = new THREE.Box3().setFromObject(group);
        const center = new THREE.Vector3();
        box.getCenter(center);
        
        // X, Zは中心に合わせ、Yは最下面 (box.min.y) を0に合わせる
        group.children.forEach(child => {
          child.position.x -= center.x;
          child.position.y -= box.min.y;
          child.position.z -= center.z;
        });

        // 9. グループ全体のスケール調整 (約25cmになるように)
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 0.25 / (maxDim || 1);
        group.scale.set(scale, scale, scale);

        // キャラクタモデルであることをマーク（画面離脱時の意図しないジオメトリ破棄を防止）
        group.userData.isCharacterModel = true;
        group.traverse(child => {
          child.userData.isCharacterModel = true;
          child.castShadow = true;
          child.receiveShadow = true;
        });

        resolve(group);
      } catch (err) {
        reject(err);
      }
    });
  },

  // モルフォロジー膨張 (小さな隙間や途切れを繋ぎ、頑丈な多角形を生成)
  dilateMask(src, w, h, radius = 2) {
    const dst = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (src[y * w + x] === 1) {
          for (let dy = -radius; dy <= radius; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= h) continue;
            for (let dx = -radius; dx <= radius; dx++) {
              const nx = x + dx;
              if (nx < 0 || nx >= w) continue;
              if (dx * dx + dy * dy <= radius * radius) {
                dst[ny * w + nx] = 1;
              }
            }
          }
        }
      }
    }
    return dst;
  },

  // キャンバス4辺からの外側フラッドフィル (真の外側背景のみを特定)
  floodFillExterior(dilatedGrid, w, h) {
    const isOutside = new Uint8Array(w * h);
    const queue = [];
    
    // 上下左右のフチから探索開始
    for (let x = 0; x < w; x++) {
      if (dilatedGrid[0 * w + x] === 0) { isOutside[0 * w + x] = 1; queue.push(x); }
      if (dilatedGrid[(h - 1) * w + x] === 0) { isOutside[(h - 1) * w + x] = 1; queue.push((h - 1) * w + x); }
    }
    for (let y = 0; y < h; y++) {
      if (dilatedGrid[y * w + 0] === 0 && !isOutside[y * w + 0]) { isOutside[y * w + 0] = 1; queue.push(y * w + 0); }
      if (dilatedGrid[y * w + (w - 1)] === 0 && !isOutside[y * w + (w - 1)]) { isOutside[y * w + (w - 1)] = 1; queue.push(y * w + (w - 1)); }
    }

    let head = 0;
    while (head < queue.length) {
      const idx = queue[head++];
      const cx = idx % w;
      const cy = (idx / w) | 0;

      if (cx > 0) { const n = idx - 1; if (!isOutside[n] && dilatedGrid[n] === 0) { isOutside[n] = 1; queue.push(n); } }
      if (cx < w - 1) { const n = idx + 1; if (!isOutside[n] && dilatedGrid[n] === 0) { isOutside[n] = 1; queue.push(n); } }
      if (cy > 0) { const n = idx - w; if (!isOutside[n] && dilatedGrid[n] === 0) { isOutside[n] = 1; queue.push(n); } }
      if (cy < h - 1) { const n = idx + w; if (!isOutside[n] && dilatedGrid[n] === 0) { isOutside[n] = 1; queue.push(n); } }
    }

    return isOutside;
  },

  // 独立した連結コンポーネント（島）の抽出
  findConnectedIslands(bodyMask, w, h) {
    const visited = new Uint8Array(w * h);
    const islands = [];

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        if (bodyMask[idx] === 1 && !visited[idx]) {
          const islandMask = new Uint8Array(w * h);
          const queue = [idx];
          visited[idx] = 1;
          islandMask[idx] = 1;
          let count = 0;
          let head = 0;

          while (head < queue.length) {
            const cIdx = queue[head++];
            count++;
            const cx = cIdx % w;
            const cy = (cIdx / w) | 0;

            const neighbors = [
              cx > 0 ? cIdx - 1 : -1,
              cx < w - 1 ? cIdx + 1 : -1,
              cy > 0 ? cIdx - w : -1,
              cy < h - 1 ? cIdx + w : -1
            ];

            for (const n of neighbors) {
              if (n !== -1 && bodyMask[n] === 1 && !visited[n]) {
                visited[n] = 1;
                islandMask[n] = 1;
                queue.push(n);
              }
            }
          }

          // 120ピクセル以上の主要パーツのみ立体化 (微細なゴミ・ノイズを除外)
          if (count > 120) {
            islands.push({ mask: islandMask, area: count });
          }
        }
      }
    }

    // 面積の大きい順にソート
    return islands.sort((a, b) => b.area - a.area);
  },

  // ムーア近傍法 (Moore-Neighbor Tracing) による輪郭抽出
  traceIslandBoundary(islandMask, w, h) {
    // 最上・最左の開始ピクセルを探索
    let startX = -1, startY = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (islandMask[y * w + x] === 1) {
          startX = x; startY = y; break;
        }
      }
      if (startX !== -1) break;
    }
    if (startX === -1) return [];

    // 時計回りの近傍8方向: [E, SE, S, SW, W, NW, N, NE]
    const dx = [1, 1, 0, -1, -1, -1, 0, 1];
    const dy = [0, 1, 1, 1, 0, -1, -1, -1];

    const points = [];
    let cx = startX, cy = startY;
    let dir = 7;
    points.push({ x: cx, y: cy });

    let steps = 0;
    while (steps < 5000) {
      let found = false;
      const startDir = (dir + 6) % 8;
      for (let i = 0; i < 8; i++) {
        const ndir = (startDir + i) % 8;
        const nx = cx + dx[ndir];
        const ny = cy + dy[ndir];
        if (nx >= 0 && nx < w && ny >= 0 && ny < h && islandMask[ny * w + nx] === 1) {
          cx = nx; cy = ny; dir = ndir; found = true; break;
        }
      }
      if (!found) break;
      if (cx === startX && cy === startY) break;
      points.push({ x: cx, y: cy });
      steps++;
    }

    return points;
  },

  // Ramer-Douglas-Peucker (RDP) アルゴリズムによる多角形頂点簡略化
  simplifyPoints(points, epsilon = 2.0) {
    if (points.length <= 2) return points;

    const p1 = points[0];
    const p2 = points[points.length - 1];
    let maxDist = 0;
    let index = 0;

    for (let i = 1; i < points.length - 1; i++) {
      const p = points[i];
      const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
      const dist = l2 === 0
        ? Math.hypot(p.x - p1.x, p.y - p1.y)
        : Math.abs((p2.y - p1.y) * p.x - (p2.x - p1.x) * p.y + p2.x * p1.y - p2.y * p1.x) / Math.sqrt(l2);

      if (dist > maxDist) {
        maxDist = dist;
        index = i;
      }
    }

    if (maxDist > epsilon) {
      const left = this.simplifyPoints(points.slice(0, index + 1), epsilon);
      const right = this.simplifyPoints(points.slice(index), epsilon);
      return left.slice(0, -1).concat(right);
    }

    return [p1, p2];
  },

  // 3Dモデル専用のテクスチャキャンバス生成（線画内部に白地を補填し、美しく立体化）
  createModelTextureCanvas(originalCanvas, bodyMask, width, height) {
    const modelCanvas = document.createElement('canvas');
    modelCanvas.width = width;
    modelCanvas.height = height;
    const mctx = modelCanvas.getContext('2d');

    // 1. 体のマスク領域にやさしいクレイホワイトの下地を敷く
    const imgData = mctx.createImageData(width, height);
    const mData = imgData.data;
    for (let i = 0; i < width * height; i++) {
      if (bodyMask[i] === 1) {
        mData[i * 4] = 255;
        mData[i * 4 + 1] = 255;
        mData[i * 4 + 2] = 255;
        mData[i * 4 + 3] = 255;
      }
    }
    mctx.putImageData(imgData, 0, 0);

    // 2. ユーザーが描いたイラスト（線画やカラー）を上に合成
    mctx.drawImage(originalCanvas, 0, 0);

    return modelCanvas;
  },

  // グローバルキャンバスUVマッピング (1:1 ピクセル完全整合・歪みなし)
  applyGlobalUVMapping(geometry, width, height) {
    const posAttr = geometry.attributes.position;
    const uvs = [];

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);

      let u = (x + width / 2) / width;
      let v = (y + height / 2) / height;

      // 背面側は視線に合わせて水平反転
      if (z <= 0) {
        u = 1.0 - u;
      }

      uvs.push(Math.max(0, Math.min(1, u)), Math.max(0, Math.min(1, v)));
    }

    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.attributes.uv.needsUpdate = true;
  },

  // イラストの画像データから最も使われているメインカラーを抽出
  extractAccentColor(pixelData) {
    const colorCounts = {};
    const sampleStep = 8;

    for (let i = 0; i < pixelData.length; i += 4 * sampleStep) {
      const r = pixelData[i];
      const g = pixelData[i + 1];
      const b = pixelData[i + 2];
      const a = pixelData[i + 3];

      if (a > 100) {
        const bucketR = Math.round(r / 8) * 8;
        const bucketG = Math.round(g / 8) * 8;
        const bucketB = Math.round(b / 8) * 8;

        // 白・黒・薄いグレーは除外
        const isWhite = bucketR > 220 && bucketG > 220 && bucketB > 220;
        const isBlack = bucketR < 35 && bucketG < 35 && bucketB < 35;
        if (isWhite || isBlack) continue;

        const hex = `#${((1 << 24) + (bucketR << 16) + (bucketG << 8) + bucketB).toString(16).slice(1)}`;
        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      }
    }

    let maxColor = '#ff5c8a'; // デフォルトはチェリーピンク
    let maxCount = 0;

    for (const color in colorCounts) {
      if (colorCounts[color] > maxCount) {
        maxCount = colorCounts[color];
        maxColor = color;
      }
    }

    return maxColor;
  },

  // 3Dモデルを GLB バイナリにエクスポート
  exportToGLB(mesh) {
    return new Promise((resolve, reject) => {
      const exporter = new GLTFExporter();
      const options = {
        binary: true,
        animations: [],
        includeCustomExtensions: false
      };

      exporter.parse(
        mesh,
        (glb) => {
          resolve(glb); // ArrayBuffer
        },
        (error) => {
          reject(error);
        },
        options
      );
    });
  }
};
