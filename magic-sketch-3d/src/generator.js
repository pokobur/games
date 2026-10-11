import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

export const ModelGenerator = {
  /**
   * キャンバスに描いた絵から、AR空間にそのまま飛び出す高品質な自立型キャラクター（ARスタンディ）を生成
   * @param {HTMLCanvasElement} canvas 描画キャンバス
   * @returns {Promise<THREE.Group>} Three.jsの召喚用オブジェクトグループ
   */
  generate3DModelFromCanvas(canvas) {
    return new Promise((resolve, reject) => {
      try {
        const width = canvas.width;
        const height = canvas.height;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;

        // 1. 描画ピクセルのバウンディングボックスを精密スキャン
        let minX = width, minY = height, maxX = -1, maxY = -1;
        let drawnPixels = 0;

        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const alpha = data[(y * width + x) * 4 + 3];
            if (alpha > 15) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
              drawnPixels++;
            }
          }
        }

        if (drawnPixels < 20 || maxX < minX) {
          reject(new Error("えが かかれていないよ！キャンバスに えをかいてみてね。✏️"));
          return;
        }

        // 2. 絵の周囲に自然なマージンを設けて正確にクロップ
        const pad = 16;
        const cropX = Math.max(0, minX - pad);
        const cropY = Math.max(0, minY - pad);
        const cropW = Math.min(width - cropX, (maxX - minX + 1) + pad * 2);
        const cropH = Math.min(height - cropY, (maxY - minY + 1) + pad * 2);

        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = cropW;
        croppedCanvas.height = cropH;
        const cropCtx = croppedCanvas.getContext('2d');
        cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        // 3. 高解像度・sRGB対応テクスチャの生成
        const texture = new THREE.CanvasTexture(croppedCanvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.needsUpdate = true;

        // 4. AR空間（カメラ映像）での等身大スケール算出
        // テーブルや床に自然に馴染む高さ 約0.55m（55cm）基準
        const targetHeight = 0.55;
        const targetWidth = targetHeight * (cropW / cropH);

        const group = new THREE.Group();

        // 5. 前面スタンディメッシュ (描いたイラストの完全忠実再現)
        const frontGeo = new THREE.PlaneGeometry(targetWidth, targetHeight);
        // 足元がピッタリ Y=0（床面）に接地するようにセンタリング調整
        frontGeo.translate(0, targetHeight / 2, 0);

        const frontMat = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.05,
          side: THREE.FrontSide,
          roughness: 0.35,
          metalness: 0.05
        });

        // 描いたイラストの輪郭通りにリアルな影を床に落とすためのシルエット深度マテリアル
        const depthMat = new THREE.MeshDepthMaterial({
          depthPacking: THREE.RGBADepthPacking,
          map: texture,
          alphaTest: 0.05
        });

        const frontMesh = new THREE.Mesh(frontGeo, frontMat);
        frontMesh.position.z = 0.002; // 微小な厚み（前面）
        frontMesh.customDepthMaterial = depthMat;
        frontMesh.castShadow = true;
        frontMesh.receiveShadow = false;
        frontMesh.userData.isCharacterModel = true;
        group.add(frontMesh);

        // 6. 背面スタンディメッシュ（裏側から見た時も自然に見える左右反転マッピング）
        const backGeo = new THREE.PlaneGeometry(targetWidth, targetHeight);
        backGeo.translate(0, targetHeight / 2, 0);
        const uvAttr = backGeo.attributes.uv;
        for (let i = 0; i < uvAttr.count; i++) {
          uvAttr.setX(i, 1 - uvAttr.getX(i)); // UVを水平反転
        }
        backGeo.rotateY(Math.PI); // 背面向きに回転

        const backMat = new THREE.MeshStandardMaterial({
          map: texture,
          transparent: true,
          alphaTest: 0.05,
          side: THREE.FrontSide,
          roughness: 0.35,
          metalness: 0.05
        });

        const backMesh = new THREE.Mesh(backGeo, backMat);
        backMesh.position.z = -0.002; // 微小な厚み（背面）
        backMesh.customDepthMaterial = depthMat;
        backMesh.castShadow = true;
        backMesh.receiveShadow = false;
        backMesh.userData.isCharacterModel = true;
        group.add(backMesh);

        // 7. 床面との自然な接地感を演出するソフトコンタクトシャドウ
        const shadowRadius = Math.max(targetWidth, 0.25) * 0.45;
        const shadowGeo = new THREE.PlaneGeometry(shadowRadius * 2, shadowRadius * 1.3);
        shadowGeo.rotateX(-Math.PI / 2);
        shadowGeo.translate(0, 0.001, 0);

        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = 128;
        shadowCanvas.height = 128;
        const sCtx = shadowCanvas.getContext('2d');
        const grad = sCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0.42)');
        grad.addColorStop(0.45, 'rgba(0, 0, 0, 0.18)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        sCtx.fillStyle = grad;
        sCtx.fillRect(0, 0, 128, 128);

        const shadowTex = new THREE.CanvasTexture(shadowCanvas);
        const shadowMat = new THREE.MeshBasicMaterial({
          map: shadowTex,
          transparent: true,
          opacity: 0.7,
          depthWrite: false
        });

        const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
        contactShadow.userData.isCharacterModel = true;
        contactShadow.userData.isContactShadow = true;
        group.add(contactShadow);

        // 8. メタデータ設定（画面遷移時の誤破棄防止フラグ）
        group.userData.isCharacterModel = true;
        group.userData.charWidth = targetWidth;
        group.userData.charHeight = targetHeight;
        group.scale.set(1, 1, 1);

        resolve(group);
      } catch (err) {
        reject(err);
      }
    });
  },

  /**
   * キャラクターモデルを GLB バイナリにエクスポート
   */
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
