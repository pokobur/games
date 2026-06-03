import * as THREE from 'three';

export class Previewer3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mesh = null;
    this.animationId = null;
    this.rotationAngle = 0;
  }

  // プレビューの初期化と表示
  initPreview(mesh) {
    this.destroy(); // 既存のプレビューがあれば破棄

    const w = this.container.clientWidth;
    const h = this.container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#f0f4f8');

    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    this.camera.position.set(0, 0.4, 0.8);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // ライティング
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);

    // グリッド
    const grid = new THREE.GridHelper(2, 10, 0x007aff, 0xcccccc);
    grid.position.y = -0.2;
    this.scene.add(grid);

    // モデルの追加
    this.mesh = mesh.clone();
    this.mesh.position.set(0, 0, 0);
    this.mesh.scale.set(0.65, 0.65, 0.65);
    this.scene.add(this.mesh);

    // アニメーションループ開始
    this.rotationAngle = 0;
    this.animate();

    // ウィンドウリサイズ時の処理を登録
    this.resizeHandler = () => this.handleResize();
    window.addEventListener('resize', this.resizeHandler);
  }

  // アニメーションループ
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    this.rotationAngle += 0.015;
    if (this.mesh) {
      this.mesh.rotation.y = this.rotationAngle;
      this.mesh.position.y = Math.sin(this.rotationAngle * 2) * 0.02;
    }

    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // リサイズハンドリング
  handleResize() {
    if (!this.camera || !this.renderer || !this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // プレビューの停止と全リソースの解放 (メモリリーク対策)
  destroy() {
    // 1. リサイズリスナーの解除
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    // 2. アニメーションの停止
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // 3. シーン内部オブジェクトのリソース解放 (重要)
    if (this.scene) {
      this.disposeObject(this.scene);
      this.scene = null;
    }

    // 4. レンダラーの破棄とDOM要素のクリーンアップ
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }

    this.camera = null;
    this.mesh = null;
    this.container.innerHTML = '';
  }

  // シーンとその子孫オブジェクトを再帰的に巡回して解放する
  disposeObject(obj) {
    if (!obj) return;
    
    // 子要素を再帰的に破棄
    while (obj.children && obj.children.length > 0) {
      this.disposeObject(obj.children[0]);
      obj.remove(obj.children[0]);
    }

    // ジオメトリの破棄
    if (obj.geometry) {
      obj.geometry.dispose();
    }

    // マテリアルの破棄 (配列マテリアルにも対応)
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(mat => this.disposeMaterial(mat));
      } else {
        this.disposeMaterial(obj.material);
      }
    }
  }

  // 個別のマテリアルとアタッチされているテクスチャを解放する
  disposeMaterial(material) {
    if (!material) return;

    // マテリアルに関連付けられた各種テクスチャマップの解放
    const textureKeys = ['map', 'lightMap', 'bumpMap', 'normalMap', 'specularMap', 'envMap', 'roughnessMap', 'metalnessMap', 'alphaMap'];
    textureKeys.forEach(key => {
      if (material[key] && typeof material[key].dispose === 'function') {
        material[key].dispose();
      }
    });

    material.dispose();
  }
}
