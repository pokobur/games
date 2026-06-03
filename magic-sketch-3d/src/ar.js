import * as THREE from 'three';
import { audioManager } from './audio.js';

export class ARSummoner {
  constructor(videoElementId, canvasContainerId) {
    this.video = document.getElementById(videoElementId);
    this.container = document.getElementById(canvasContainerId);
    this.reticle = document.getElementById('ar-reticle');
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    
    this.activeModel = null;
    this.summonedObject = null;
    this.isPlaced = false;
    
    // パーティクル管理用
    this.particles = [];
    
    // タッチインタラクション用
    this.touchStartDist = 0;
    this.touchStartScale = 1;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.isSingleTouch = false;
    this.isDraggingModel = false; // キャラクター移動中かフラグ
    this.touchStartPos = { x: 0, y: 0 };
    this.touchStartTime = 0;
    this.raycaster = new THREE.Raycaster();
    this.floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Y=0 平面
    
    // ジャイロセンサーデータ
    this.gyro = { alpha: 0, beta: 90, gamma: 0 };
    this.hasGyro = false;
    this.initialYaw = 0;
    this.yawCalibrated = false;

    // アニメーション状態
    this.currentAction = 'idle'; // 'idle', 'walk', 'jump', 'dance'
    this.actionTime = 0;
    this.walkDirection = 1; // 1 = 前進, -1 = 後退
    this.walkBound = 1.2;    // 歩く限界距離 (前後1.2m)
    
    this.setupCamera();
  }

  // 1. デバイスのアウトカメラ（背面カメラ）の起動
  async setupCamera() {
    try {
      const constraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = stream;
      
      // ビデオ読み込み完了後に表示を合わせる
      this.video.addEventListener('loadedmetadata', () => {
        this.video.play();
      });
    } catch (err) {
      console.warn("アウトカメラの起動に失敗しました。PC/バーチャル背景モードで動かします:", err);
      // カメラが見つからないか拒否された場合、背景色を少しお部屋っぽい半透明にしておきます
      this.video.style.background = 'linear-gradient(to bottom, #1a0c2e, #4a148c)';
    }
  }

  // 2. Three.js の透過 3D 空間初期化
  init3D() {
    // 既存の要素をクリア
    this.container.innerHTML = '';
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.scene = new THREE.Scene();
    
    // カメラの視野角(FOV)
    this.camera = new THREE.PerspectiveCamera(60, width / height, 0.01, 100);
    // カメラはY=1.4m（人間の目線の高さ）から、少し下を見下ろすように配置
    this.camera.position.set(0, 1.4, 1.8);
    this.camera.lookAt(0, 0, 0);
    
    // レンダラー設定 (背景を透明にしてカメラ映像を重ねる)
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    this.container.appendChild(this.renderer.domElement);
    
    // 照明の追加
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(2, 5, 3);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.001;
    this.scene.add(dirLight);
    
    // 影を落とすための半透明の「床面」プレーン
    const floorGeo = new THREE.PlaneGeometry(20, 20);
    const floorMat = new THREE.ShadowMaterial({ opacity: 0.4 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    this.scene.add(floor);
    
    // 平面認識用の仮想的な床グリッド（うっすら見える程度）
    const gridHelper = new THREE.GridHelper(10, 20, 0xffcc00, 0xffffff);
    gridHelper.position.y = 0.001;
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);
    
    // リサイズ監視
    this.resizeHandler = () => this.onResize();
    window.addEventListener('resize', this.resizeHandler);
    
    // ジャイロ開始
    this.startGyro();
    
    // タッチイベント設定
    this.setupTouchGestures();
    
    // アニメーションループ開始
    this.animate();
  }

  // 3. ジャイロセンサーとの同期
  async startGyro() {
    this.hasGyro = false;
    this.yawCalibrated = false;
    
    this.orientationHandler = (e) => {
      if (e.alpha !== null && e.beta !== null) {
        this.hasGyro = true;
        this.gyro.alpha = e.alpha; // Y軸周り回転 (0 ~ 360)
        this.gyro.beta = e.beta;   // X軸周り回転 (-180 ~ 180)
        this.gyro.gamma = e.gamma; // Z軸周り回転 (-90 ~ 90)
        
        // 最初の方向を基準（正面）にする
        if (!this.yawCalibrated) {
          this.initialYaw = e.alpha;
          this.yawCalibrated = true;
        }
      }
    };

    // iOS 13+ で必要なDeviceOrientation権限リクエスト
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', this.orientationHandler);
        }
      } catch (err) {
        console.warn("DeviceOrientation権限リクエスト失敗、タッチドラッグのみでカメラ操作を行います:", err);
      }
    } else {
      // Androidや非対応ブラウザ
      window.addEventListener('deviceorientation', this.orientationHandler);
    }
  }

  // 4. キャラクター(Model)の設定
  setModel(gltfMesh) {
    this.activeModel = gltfMesh;
    this.isPlaced = false;
    this.summonedObject = null;
    
    if (this.scene) {
      // 以前の召喚物を消去
      if (this.summonedObject) {
        this.scene.remove(this.summonedObject);
      }
      this.reticle.classList.add('active'); // 照準マークを出す
    }
  }

  // 5. 床面への召喚（タップ時）
  summonCharacter() {
    if (!this.activeModel || this.isPlaced) return;
    
    // 照準（レティクル）の位置にキャラクターを配置
    this.summonedObject = this.activeModel.clone();
    
    // 照準マークの中心位置
    this.summonedObject.position.set(0, 0, 0); // Y=0 (床面)
    this.summonedObject.scale.set(0.01, 0.01, 0.01); // 縮小しておき、召喚時にズームアップ
    
    this.scene.add(this.summonedObject);
    this.isPlaced = true;
    this.reticle.classList.remove('active'); // 照準を非表示に
    
    // 召喚音
    audioManager.playSummon();
    
    // 魔法の煙・光パーティクルを吹き出す
    this.createSummonParticles(0, 0, 0);
    
    // ぷにぷに召喚演出 (Scaleアニメーション)
    let progress = 0;
    const originalScale = this.activeModel.scale.x;
    
    const summonAnimate = () => {
      progress += 0.06;
      if (progress <= 1) {
        // イージングをかけてぷにっと大きくする
        const scaleVal = originalScale * Math.sin(progress * Math.PI * 0.5) * (1 + 0.3 * Math.sin(progress * Math.PI * 2.5));
        if (this.summonedObject) {
          this.summonedObject.scale.set(scaleVal, scaleVal, scaleVal);
          requestAnimationFrame(summonAnimate);
        }
      } else {
        if (this.summonedObject) {
          this.summonedObject.scale.set(originalScale, originalScale, originalScale);
        }
      }
    };
    summonAnimate();
  }

  // キラキラ召喚パーティクル
  createSummonParticles(x, y, z) {
    const particleCount = 45;
    const geometry = new THREE.SphereGeometry(0.02, 5, 5);
    
    for (let i = 0; i < particleCount; i++) {
      const colorVal = ['#ffcc00', '#ffd54f', '#ff5252', '#ffffff', '#00e5ff'][Math.floor(Math.random() * 5)];
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colorVal),
        transparent: true,
        opacity: 0.9
      });
      
      const particle = new THREE.Mesh(geometry, material);
      particle.position.set(
        x + (Math.random() - 0.5) * 0.2,
        y + 0.05,
        z + (Math.random() - 0.5) * 0.2
      );
      
      // 初速度
      const speed = 0.03 + Math.random() * 0.05;
      const angle = Math.random() * Math.PI * 2;
      const pitch = Math.random() * Math.PI * 0.5; // 上向きのみ
      
      particle.userData = {
        vx: speed * Math.cos(angle) * Math.cos(pitch),
        vy: speed * Math.sin(pitch) + 0.02,
        vz: speed * Math.sin(angle) * Math.cos(pitch),
        life: 1.0,
        decay: 0.015 + Math.random() * 0.02
      };
      
      this.scene.add(particle);
      this.particles.push(particle);
    }
  }

  // アニメーション設定切り替え
  setAction(actionName) {
    if (this.currentAction === actionName) return;
    this.currentAction = actionName;
    this.actionTime = 0;
    audioManager.playTap();
  }

  // 6. タッチジェスチャーのハンドリング (ピンチで拡大縮小、スワイプで回転、ドラッグで床移動)
  setupTouchGestures() {
    const el = this.container; // 親コンテナに変更（クリックイベントが確実に届くように）
    
    el.addEventListener('touchstart', (e) => {
      const rect = el.getBoundingClientRect();
      
      if (e.touches.length === 1) {
        this.isSingleTouch = true;
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.touchStartPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        this.touchStartTime = Date.now();
        this.isDraggingModel = false;

        // キャラクターが配置済みの場合、タップ箇所とキャラクターの当たり判定を行う
        if (this.summonedObject && this.isPlaced) {
          const mouse = new THREE.Vector2(
            ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1,
            -((e.touches[0].clientY - rect.top) / rect.height) * 2 + 1
          );
          
          this.raycaster.setFromCamera(mouse, this.camera);
          // グループ全体のメッシュ(children)と交差判定
          const intersects = this.raycaster.intersectObjects(this.summonedObject.children, true);
          
          if (intersects.length > 0) {
            this.isDraggingModel = true; // キャラクターのドラッグ移動を開始
          }
        }
      } else if (e.touches.length === 2) {
        this.isSingleTouch = false;
        this.isDraggingModel = false;
        // ピンチズーム開始
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this.touchStartDist = Math.sqrt(dx * dx + dy * dy);
        if (this.summonedObject) {
          this.touchStartScale = this.summonedObject.scale.x;
        }
      }
    });

    el.addEventListener('touchmove', (e) => {
      if (!this.summonedObject) return;
      const rect = el.getBoundingClientRect();

      if (e.touches.length === 1 && this.isSingleTouch) {
        if (this.isDraggingModel) {
          // 1本指ドラッグ: キャラクターを床の上でスライド移動
          const mouse = new THREE.Vector2(
            ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1,
            -((e.touches[0].clientY - rect.top) / rect.height) * 2 + 1
          );
          
          this.raycaster.setFromCamera(mouse, this.camera);
          const targetPoint = new THREE.Vector3();
          
          // 床面(Y=0)との交点を計算
          if (this.raycaster.ray.intersectPlane(this.floorPlane, targetPoint)) {
            // キャラクターの位置を更新 (Y軸は床面のまま)
            this.summonedObject.position.x = targetPoint.x;
            this.summonedObject.position.z = targetPoint.z;
          }
        } else {
          // 1本指スワイプ: Y軸周り回転
          const deltaX = e.touches[0].clientX - this.touchStartX;
          this.summonedObject.rotation.y += deltaX * 0.015;
          this.touchStartX = e.touches[0].clientX;
        }
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (this.touchStartDist > 0) {
          // ピンチで拡大縮小
          const factor = dist / this.touchStartDist;
          let newScale = this.touchStartScale * factor;
          const limitMin = 0.05;
          const limitMax = 1.5;
          newScale = Math.max(limitMin, Math.min(limitMax, newScale));
          this.summonedObject.scale.set(newScale, newScale, newScale);
        }
      }
    });

    el.addEventListener('touchend', (e) => {
      // モバイル用の高反応タップ召喚検知
      if (!this.isPlaced && this.isSingleTouch) {
        const touchDuration = Date.now() - this.touchStartTime;
        const endTouch = e.changedTouches ? e.changedTouches[0] : null;
        if (endTouch && touchDuration < 300) {
          const dx = endTouch.clientX - this.touchStartPos.x;
          const dy = endTouch.clientY - this.touchStartPos.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          // 移動距離が15px未満なら純粋なタップとみなして召喚
          if (dist < 15) {
            this.summonCharacter();
          }
        }
      }
      this.isDraggingModel = false;
    });
    
    // ダブルタップでリセット
    let lastTap = 0;
    el.addEventListener('click', (e) => {
      // ジャイロ未起動ならユーザーアクションイベント直下で同期的に権限要求を起動
      if (!this.hasGyro) {
        this.startGyro();
      }

      // 召喚されていない場合は、タップ位置への召喚を実行（クリックフォールバック用）
      if (!this.isPlaced) {
        this.summonCharacter();
        return;
      }

      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      if (tapLength < 300 && tapLength > 0) {
        // ダブルタップでスケールと回転をリセット
        if (this.summonedObject && this.activeModel) {
          const orig = this.activeModel.scale.x;
          this.summonedObject.scale.set(orig, orig, orig);
          this.summonedObject.rotation.set(0, 0, 0);
          this.summonedObject.position.set(0, 0, 0);
          audioManager.playTap();
        }
      }
      lastTap = currentTime;
    });
  }

  // 7. プログラムアニメーション (ボーンを使わないポヨンポヨン動作)
  updateCharacterAnimation(deltaTime) {
    if (!this.summonedObject) return;
    
    this.actionTime += deltaTime;
    
    // ベーススケール（呼吸効果などに対応するため退避）
    // 召喚物の元々の縦横比をキープ
    const scale = this.summonedObject.scale.y; 
    
    switch (this.currentAction) {
      case 'idle':
        // ゆっくりと「息」をするように上下に伸び縮み
        const idlePulse = Math.sin(this.actionTime * 3) * 0.02;
        this.summonedObject.scale.y = scale * (1 + idlePulse);
        this.summonedObject.scale.x = scale * (1 - idlePulse * 0.5);
        this.summonedObject.scale.z = scale * (1 - idlePulse * 0.5);
        
        // 微小なユラユラ
        this.summonedObject.rotation.z = Math.sin(this.actionTime * 1.5) * 0.015;
        break;
        
      case 'walk':
        // 左右に傾きながら前後に移動
        const walkSpeed = 0.5; // 移動速度 (m/s)
        const wobbleSpeed = 10;
        const wobble = Math.sin(this.actionTime * wobbleSpeed);
        
        // 左右の傾き
        this.summonedObject.rotation.z = wobble * 0.15;
        // 上下の跳ね
        this.summonedObject.position.y = Math.abs(wobble) * 0.06;
        
        // 進行方向への移動 (Z軸の移動)
        this.summonedObject.position.z += walkSpeed * deltaTime * this.walkDirection;
        
        // 限界距離に達したら向きを変えて反転
        if (Math.abs(this.summonedObject.position.z) > this.walkBound) {
          this.walkDirection *= -1;
          this.summonedObject.rotation.y += Math.PI; // 180度向きを変える
        }
        break;
        
      case 'jump':
        // 跳ねる＋着地時にぷにっと潰れる(Squash & Stretch)
        const jumpPeriod = 1.2; // 1回のジャンプ周期
        const timeInPeriod = this.actionTime % jumpPeriod;
        
        if (timeInPeriod < 0.8) {
          // 空中フェーズ
          const jumpProgress = timeInPeriod / 0.8;
          const jumpHeight = 0.5; // ジャンプする高さ(m)
          // 放物線
          this.summonedObject.position.y = Math.sin(jumpProgress * Math.PI) * jumpHeight;
          this.summonedObject.rotation.x = Math.sin(jumpProgress * Math.PI * 2) * 0.1; // 空中回転
          
          // 空中では縦に少し伸びる
          this.summonedObject.scale.y = scale * 1.08;
          this.summonedObject.scale.x = scale * 0.95;
        } else {
          // 着地フェーズ (0.8s から 1.2s まで潰れる)
          const landProgress = (timeInPeriod - 0.8) / 0.4;
          this.summonedObject.position.y = 0;
          this.summonedObject.rotation.x = 0;
          
          // 着地のショックで縦に潰れ、横に広がる
          const squash = Math.sin(landProgress * Math.PI) * 0.25;
          this.summonedObject.scale.y = scale * (1 - squash);
          this.summonedObject.scale.x = scale * (1 + squash * 0.8);
          this.summonedObject.scale.z = scale * (1 + squash * 0.8);
        }
        break;
        
      case 'dance':
        // スピンしながら浮遊運動
        const danceSpeed = 6;
        this.summonedObject.rotation.y += deltaTime * 5; // くるくるスピン
        this.summonedObject.position.y = 0.1 + Math.sin(this.actionTime * danceSpeed) * 0.1; // 上下浮遊
        
        // 伸縮パルス
        const pulse = Math.sin(this.actionTime * danceSpeed * 2) * 0.1;
        this.summonedObject.scale.y = scale * (1 + pulse);
        this.summonedObject.scale.x = scale * (1 - pulse);
        break;
    }
  }

  // レンダリングループ
  animate() {
    if (!this.renderer) return;
    
    this.animationId = requestAnimationFrame(() => this.animate());
    
    const clock = new THREE.Clock();
    let lastTime = performance.now();
    
    const tick = () => {
      if (!this.renderer) return; // 破棄後に実行されるのを防止
      const now = performance.now();
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      
      this.updateParticles();
      this.updateCameraFromGyro();
      this.updateCharacterAnimation(dt);
      
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    };
    
    tick();
  }

  // パーティクル移動とフェードアウト
  updateParticles() {
    if (!this.scene) return;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.position.x += p.userData.vx;
      p.position.y += p.userData.vy;
      p.position.z += p.userData.vz;
      
      p.userData.vy -= 0.001;
      
      p.userData.life -= p.userData.decay;
      p.material.opacity = p.userData.life;
      
      if (p.userData.life <= 0) {
        this.scene.remove(p);
        this.particles.splice(i, 1);
      }
    }
  }

  // 8. ジャイロの値をThree.jsのカメラ回転にシンクロ
  updateCameraFromGyro() {
    if (!this.hasGyro || !this.camera) return;
    
    const alpha = this.gyro.alpha;
    const beta = this.gyro.beta;
    const gamma = this.gyro.gamma;
    
    const radBeta = (beta - 90) * Math.PI / 180;
    const radGamma = gamma * Math.PI / 180;
    const radAlpha = (alpha - this.initialYaw) * Math.PI / 180;
    
    const euler = new THREE.Euler(radBeta, -radAlpha, -radGamma, 'YXZ');
    this.camera.quaternion.setFromEuler(euler);
  }

  onResize() {
    if (!this.camera || !this.renderer || !this.container) return;
    
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }

  // 3D/ARの停止と全リソースの徹底クリーンアップ (メモリリーク防止)
  stop() {
    // 1. イベントリスナーの解除
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.orientationHandler) {
      window.removeEventListener('deviceorientation', this.orientationHandler);
      this.orientationHandler = null;
    }

    // 2. アニメーションの停止
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // 3. シーンのクリーンアップ (再帰的)
    if (this.scene) {
      this.disposeObject(this.scene);
      this.scene = null;
    }

    // 4. レンダラーのクリーンアップ
    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement && this.renderer.domElement.parentNode) {
        this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      }
      this.renderer = null;
    }

    this.camera = null;
    this.activeModel = null;
    this.summonedObject = null;
    this.particles = [];
    this.container.innerHTML = '';
    
    // 5. カメラストリームの停止
    if (this.video && this.video.srcObject) {
      const tracks = this.video.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      this.video.srcObject = null;
    }
  }

  // 再帰的オブジェクト破棄メソッド
  disposeObject(obj) {
    if (!obj) return;
    
    while (obj.children && obj.children.length > 0) {
      this.disposeObject(obj.children[0]);
      obj.remove(obj.children[0]);
    }

    if (obj.geometry) {
      obj.geometry.dispose();
    }

    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(mat => this.disposeMaterial(mat));
      } else {
        this.disposeMaterial(obj.material);
      }
    }
  }

  // マテリアル＆テクスチャ破棄メソッド
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
