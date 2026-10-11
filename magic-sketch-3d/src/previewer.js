import * as THREE from 'three';

export class Previewer3D {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mesh = null;
    this.animationId = null;
    
    // 回転・インタラクション状態
    this.rotationAngleY = 0;
    this.rotationAngleX = 0;
    this.isDragging = false;
    this.lastPointerX = 0;
    this.lastPointerY = 0;
    this.autoSpin = true;
    this.userInteractedTimer = null;
    
    // ピンチズーム
    this.touchStartDist = 0;
    this.initialCameraZ = 0.8;

    // リスナークリーンアップ用
    this.boundPointerDown = null;
    this.boundPointerMove = null;
    this.boundPointerUp = null;
    this.boundWheel = null;
    this.resizeHandler = null;
  }

  // プレビューの初期化と表示
  initPreview(mesh) {
    this.destroy(); // 既存のプレビューがあれば破棄

    const w = this.container.clientWidth || 300;
    const h = this.container.clientHeight || 300;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#f0f4f8');

    this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    this.initialCameraZ = 0.8;
    this.camera.position.set(0, 0.25, this.initialCameraZ);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // ライティング
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(5, 10, 7);
    this.scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.5);
    backLight.position.set(-5, 5, -5);
    this.scene.add(backLight);

    // おもちゃの台座（グリッド）
    const pedestalY = -0.12;
    const grid = new THREE.GridHelper(1.8, 10, 0x4ecdc4, 0xdfe4ea);
    grid.position.y = pedestalY;
    this.scene.add(grid);

    // モデルの追加 (クローンを作成して配置)
    this.mesh = mesh.clone();
    this.mesh.position.set(0, pedestalY, 0);
    this.mesh.scale.set(0.65, 0.65, 0.65);
    this.scene.add(this.mesh);

    // インタラクティブ操作イベントの登録
    this.setupInteractions();

    // アニメーションループ開始
    this.rotationAngleY = 0;
    this.rotationAngleX = 0;
    this.autoSpin = true;
    this.animate();

    // ウィンドウリサイズ時の処理を登録
    this.resizeHandler = () => this.handleResize();
    window.addEventListener('resize', this.resizeHandler);
  }

  // ドラッグ回転＆ズームのセットアップ
  setupInteractions() {
    const el = this.renderer.domElement;
    el.style.touchAction = 'none';
    el.style.cursor = 'grab';

    this.boundPointerDown = (e) => {
      this.isDragging = true;
      this.autoSpin = false;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;
      el.style.cursor = 'grabbing';
      if (this.userInteractedTimer) clearTimeout(this.userInteractedTimer);
    };

    this.boundPointerMove = (e) => {
      if (!this.isDragging || !this.mesh) return;

      const deltaX = e.clientX - this.lastPointerX;
      const deltaY = e.clientY - this.lastPointerY;
      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;

      // Y軸（左右）回転
      this.rotationAngleY += deltaX * 0.015;
      // X軸（上下）チルト（-0.5〜0.5 rad にクランプ）
      this.rotationAngleX = Math.max(-0.5, Math.min(0.5, this.rotationAngleX + deltaY * 0.008));

      this.mesh.rotation.y = this.rotationAngleY;
      this.mesh.rotation.x = this.rotationAngleX;
    };

    this.boundPointerUp = () => {
      if (this.isDragging) {
        this.isDragging = false;
        el.style.cursor = 'grab';
        // 2秒操作がなければ自動回転を再開
        this.userInteractedTimer = setTimeout(() => {
          this.autoSpin = true;
        }, 2000);
      }
    };

    // マウスホイールでのズーム
    this.boundWheel = (e) => {
      e.preventDefault();
      if (!this.camera) return;
      const zoomSpeed = 0.001;
      this.camera.position.z = Math.max(0.4, Math.min(1.5, this.camera.position.z + e.deltaY * zoomSpeed));
    };

    // 2本指ピンチズーム対応
    this.boundTouchStart = (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this.touchStartDist = Math.hypot(dx, dy);
      }
    };

    this.boundTouchMove = (e) => {
      if (e.touches.length === 2 && this.touchStartDist > 0 && this.camera) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const factor = this.touchStartDist / dist;
        this.camera.position.z = Math.max(0.4, Math.min(1.5, this.camera.position.z * (1 + (factor - 1) * 0.05)));
        this.touchStartDist = dist;
      }
    };

    el.addEventListener('pointerdown', this.boundPointerDown);
    window.addEventListener('pointermove', this.boundPointerMove);
    window.addEventListener('pointerup', this.boundPointerUp);
    el.addEventListener('wheel', this.boundWheel, { passive: false });
    el.addEventListener('touchstart', this.boundTouchStart, { passive: true });
    el.addEventListener('touchmove', this.boundTouchMove, { passive: true });
  }

  // アニメーションループ
  animate() {
    this.animationId = requestAnimationFrame(() => this.animate());

    if (this.mesh) {
      if (this.autoSpin) {
        this.rotationAngleY += 0.015;
        this.mesh.rotation.y = this.rotationAngleY;
        // 少し滑らかにXチルトを0に戻す
        this.rotationAngleX *= 0.96;
        this.mesh.rotation.x = this.rotationAngleX;
      }
      // プニプニ微振動
      this.mesh.position.y = -0.12 + Math.sin(this.rotationAngleY * 2) * 0.015;
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
    if (w === 0 || h === 0) return;
    
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  // プレビューの停止と全リソースの安全な解放
  destroy() {
    if (this.userInteractedTimer) {
      clearTimeout(this.userInteractedTimer);
      this.userInteractedTimer = null;
    }

    // 1. リスナーの解除
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.boundPointerMove) {
      window.removeEventListener('pointermove', this.boundPointerMove);
      this.boundPointerMove = null;
    }
    if (this.boundPointerUp) {
      window.removeEventListener('pointerup', this.boundPointerUp);
      this.boundPointerUp = null;
    }

    // 2. アニメーションの停止
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // 3. シーン内部オブジェクトのリソース解放
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
    if (this.container) {
      this.container.innerHTML = '';
    }
  }

  // シーンとその子孫オブジェクトを再帰的に破棄
  disposeObject(obj) {
    if (!obj) return;
    
    // 子要素を再帰的に破棄
    while (obj.children && obj.children.length > 0) {
      this.disposeObject(obj.children[0]);
      obj.remove(obj.children[0]);
    }

    // ユーザーモデルのジオメトリ・マテリアルは共有されるため破棄しない
    if (obj.userData && obj.userData.isCharacterModel) {
      return;
    }

    // ジオメトリの破棄
    if (obj.geometry) {
      obj.geometry.dispose();
    }

    // マテリアルの破棄
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(mat => this.disposeMaterial(mat));
      } else {
        this.disposeMaterial(obj.material);
      }
    }
  }

  // 個別のマテリアルとアタッチされているテクスチャを解放
  disposeMaterial(material) {
    if (!material) return;

    const textureKeys = ['map', 'lightMap', 'bumpMap', 'normalMap', 'specularMap', 'envMap', 'roughnessMap', 'metalnessMap', 'alphaMap'];
    textureKeys.forEach(key => {
      if (material[key] && typeof material[key].dispose === 'function') {
        material[key].dispose();
      }
    });

    material.dispose();
  }
}
