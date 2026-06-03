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

        // 1. アルファ値のしきい値からグリッドを作成 (1 = ソリッド, 0 = 透過)
        const alphaThreshold = 40;
        const grid = new Uint8Array(width * height);
        for (let i = 0; i < width * height; i++) {
          grid[i] = data[i * 4 + 3] > alphaThreshold ? 1 : 0;
        }

        // 2. すべての輪郭を抽出
        const contours = this.findContours(grid, width, height);
        
        if (contours.length === 0) {
          reject(new Error("えが かかれていないか、うすいよ！もっとしっかり えをかいてね。"));
          return;
        }

        // 一定サイズ以上の有効なパーツのみを対象にする (ゴミや細かいノイズを除外)
        // 頂点数が12個以上のものを有効な輪郭とみなす
        const validContours = contours.filter(c => c.length >= 12);

        if (validContours.length === 0) {
          reject(new Error("えの かたちがシンプルすぎるよ！もう少し大きくかいてみてね。"));
          return;
        }

        // 3Dグループの作成
        const group = new THREE.Group();

        // 共通テクスチャの読み込み
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;

        // イラストから最も多く使われているメインカラーを抽出
        const accentColor = this.extractAccentColor(data);

        // 前面/後面マテリアル
        const frontMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.3,
          metalness: 0.1,
          side: THREE.DoubleSide
        });

        // 側面マテリアル
        const sideMaterial = new THREE.MeshStandardMaterial({
          color: new THREE.Color(accentColor),
          roughness: 0.4,
          metalness: 0.1
        });

        const materials = [frontMaterial, sideMaterial];

        // 3. 各輪郭（パーツ）ごとにメッシュを生成してグループに追加
        validContours.forEach(contour => {
          // 頂点数の簡略化 (RDP)
          const simplifiedPoints = this.simplifyPoints(contour, 2.5);
          
          if (simplifiedPoints.length < 3) return; // 三角形未満はスキップ

          const shape = new THREE.Shape();
          // ピクセル相対座標 (キャンバス中心を基準とするオフセット)
          const toVector = (pt) => new THREE.Vector2(pt.x - width / 2, (height - pt.y) - height / 2);
          
          const startPt = toVector(simplifiedPoints[0]);
          shape.moveTo(startPt.x, startPt.y);
          for (let i = 1; i < simplifiedPoints.length; i++) {
            const pt = toVector(simplifiedPoints[i]);
            shape.lineTo(pt.x, pt.y);
          }
          shape.closePath();

          // 押し出し厚み設定
          const extrudeSettings = {
            depth: 25,
            bevelEnabled: true,
            bevelSegments: 4,
            steps: 1,
            bevelSize: 3,
            bevelThickness: 3
          };

          const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
          
          // 個別にセンター調整せず、全体のUVマッピングを実行
          this.applyUVMapping(geometry, width, height);

          const mesh = new THREE.Mesh(geometry, materials);
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          group.add(mesh);
        });

        if (group.children.length === 0) {
          reject(new Error("えの かたちがシンプルすぎるよ！"));
          return;
        }

        // 4. グループ全体のセンター調整 (バウンディングボックスを求めてオフセット移動)
        const box = new THREE.Box3().setFromObject(group);
        const center = new THREE.Vector3();
        box.getCenter(center);
        
        // すべてのパーツをグループ中心に移動
        group.children.forEach(child => {
          child.position.sub(center);
        });

        // 5. グループ全体のスケール調整 (約25cmになるように)
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 0.25 / maxDim; // 最大辺が25cm
        group.scale.set(scale, scale, scale);

        // ダミープロパティ (castShadow等をグループ全体の認識用に)
        group.castShadow = true;
        group.receiveShadow = true;

        resolve(group);
      } catch (err) {
        reject(err);
      }
    });
  },

  // シンプルなエッジ追跡 (不透明な画素の島をスキャンして輪郭点をリストアップ)
  findContours(grid, width, height) {
    const contours = [];
    const visited = new Uint8Array(width * height);
    
    // 近傍8方向
    const dx = [1, 1, 0, -1, -1, -1, 0, 1];
    const dy = [0, 1, 1, 1, 0, -1, -1, -1];
    
    for (let y = 1; y < height - 1; y += 2) { // 走査を少し飛ばして高速化
      for (let x = 1; x < width - 1; x += 2) {
        const idx = y * width + x;
        
        // 未訪問かつ不透明部分の境界を検知
        if (grid[idx] === 1 && !visited[idx]) {
          // 境界の開始点を見つけたら、周囲を辿ってクローズドパスを抽出
          const contour = [];
          let cx = x;
          let cy = y;
          let dir = 0;
          
          let steps = 0;
          const maxSteps = 5000;
          
          while (steps < maxSteps) {
            contour.push({ x: cx, y: cy });
            visited[cy * width + cx] = 1;
            
            let foundNext = false;
            // 8方向を順に走査
            for (let i = 0; i < 8; i++) {
              const ndir = (dir + i) % 8;
              const nx = cx + dx[ndir];
              const ny = cy + dy[ndir];
              const nidx = ny * width + nx;
              
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                if (grid[nidx] === 1) {
                  cx = nx;
                  cy = ny;
                  // 次の探索方向は、発見した方向の逆から時計回りに
                  dir = (ndir + 5) % 8;
                  foundNext = true;
                  break;
                }
              }
            }
            
            if (!foundNext) break;
            
            // 開始点に戻ってきたら終了
            if (Math.abs(cx - x) <= 1 && Math.abs(cy - y) <= 1 && contour.length > 5) {
              break;
            }
            steps++;
          }
          
          if (contour.length > 10) {
            contours.push(contour);
          }
        }
      }
    }
    return contours;
  },

  // 頂点の間引き (Ramer-Douglas-Peuckerアルゴリズムの簡易実装)
  simplifyPoints(points, epsilon) {
    if (points.length <= 2) return points;
    
    const simplifySection = (start, end) => {
      let maxDist = 0;
      let index = 0;
      
      const pStart = points[start];
      const pEnd = points[end];
      
      for (let i = start + 1; i < end; i++) {
        const p = points[i];
        // 点と線の距離
        const dist = this.getPointToLineDistance(p, pStart, pEnd);
        if (dist > maxDist) {
          maxDist = dist;
          index = i;
        }
      }
      
      if (maxDist > epsilon) {
        const results1 = simplifySection(start, index);
        const results2 = simplifySection(index, end);
        return results1.slice(0, results1.length - 1).concat(results2);
      } else {
        return [pStart, pEnd];
      }
    };
    
    return simplifySection(0, points.length - 1);
  },

  getPointToLineDistance(p, a, b) {
    const l2 = Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2);
    if (l2 === 0) return Math.sqrt(Math.pow(p.x - a.x, 2) + Math.pow(p.y - a.y, 2));
    
    let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    
    return Math.sqrt(
      Math.pow(p.x - (a.x + t * (b.x - a.x)), 2) +
      Math.pow(p.y - (a.y + t * (b.y - a.y)), 2)
    );
  },

  // UVマッピングの適用
  // ExtrudeGeometry の頂点座標から、テクスチャ画像上でのUV座標 (0.0〜1.0) を生成
  applyUVMapping(geometry, width, height) {
    const uvAttribute = geometry.attributes.uv;
    const posAttribute = geometry.attributes.position;
    
    // バウンディングボックスの取得
    geometry.computeBoundingBox();
    const min = geometry.boundingBox.min;
    const max = geometry.boundingBox.max;
    const sizeX = max.x - min.x;
    const sizeY = max.y - min.y;
    
    const uvs = [];
    
    for (let i = 0; i < posAttribute.count; i++) {
      const x = posAttribute.getX(i);
      const y = posAttribute.getY(i);
      const z = posAttribute.getZ(i);
      
      // 前面または後面 (Zがバウンディングの端に近いピクセル)
      // UVは、中心からの正規化位置を割り当てる
      let u = (x - min.x) / sizeX;
      let v = (y - min.y) / sizeY;
      
      // Z座標が後ろにある場合、テクスチャを反転させて正しい向きにする
      if (z < 0) {
        u = 1 - u; // 左右反転
      }
      
      // クランプ処理
      u = Math.max(0, Math.min(1, u));
      v = Math.max(0, Math.min(1, v));
      
      uvs.push(u, v);
    }
    
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.attributes.uv.needsUpdate = true;
  },

  // イラストの画像データから最も使われているメインカラーを抽出
  // (側面のカラーに設定するため)
  extractAccentColor(pixelData) {
    // 透過していない画素の色（RGB）を集計
    const colorCounts = {};
    let sampleStep = 8; // 走査を間引いて高速化
    
    for (let i = 0; i < pixelData.length; i += 4 * sampleStep) {
      const r = pixelData[i];
      const g = pixelData[i + 1];
      const b = pixelData[i + 2];
      const a = pixelData[i + 3];
      
      if (a > 100) {
        // 色を少し丸めて集計しやすくする (5ビット表現)
        const bucketR = Math.round(r / 8) * 8;
        const bucketG = Math.round(g / 8) * 8;
        const bucketB = Math.round(b / 8) * 8;
        
        // 白・黒・極めて薄いグレーは避ける（おもちゃの側面カラーとして映えないため）
        const isWhite = bucketR > 220 && bucketG > 220 && bucketB > 220;
        const isBlack = bucketR < 35 && bucketG < 35 && bucketB < 35;
        
        if (isWhite || isBlack) continue;
        
        const hex = `#${((1 << 24) + (bucketR << 16) + (bucketG << 8) + bucketB).toString(16).slice(1)}`;
        colorCounts[hex] = (colorCounts[hex] || 0) + 1;
      }
    }
    
    // 最多頻出カラーを見つける
    let maxColor = '#ff5252'; // デフォルトはポップな赤
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
