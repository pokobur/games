/**
 * ShakeDetector — DeviceMotion API を使ったシェイク検出
 * iOS 13+ のパーミッション要求にも対応。
 */
export class ShakeDetector {
  private threshold = 15;
  private cooldownMs = 1000;
  private lastShakeTime = 0;
  private onShake: (() => void) | null = null;
  private bound: ((e: DeviceMotionEvent) => void) | null = null;
  private _isListening = false;

  /** シェイク検出を開始する */
  start(callback: () => void): void {
    this.onShake = callback;
    this.bound = this.handleMotion.bind(this);
    window.addEventListener('devicemotion', this.bound);
    this._isListening = true;
  }

  /** シェイク検出を停止する */
  stop(): void {
    if (this.bound) {
      window.removeEventListener('devicemotion', this.bound);
      this.bound = null;
    }
    this._isListening = false;
  }

  get isListening(): boolean {
    return this._isListening;
  }

  /** iOS 13+ のパーミッション要求 */
  static async requestPermission(): Promise<boolean> {
    const DME = DeviceMotionEvent as any;
    if (typeof DME.requestPermission === 'function') {
      try {
        const permission = await DME.requestPermission();
        return permission === 'granted';
      } catch {
        return false;
      }
    }
    // Android / デスクトップ等 → パーミッション不要
    return true;
  }

  /** DeviceMotion API が利用可能かどうか */
  static isAvailable(): boolean {
    return 'DeviceMotionEvent' in window;
  }

  /** iOS でパーミッション要求が必要かどうか */
  static needsPermission(): boolean {
    const DME = DeviceMotionEvent as any;
    return typeof DME.requestPermission === 'function';
  }

  private handleMotion(e: DeviceMotionEvent): void {
    const acc = e.accelerationIncludingGravity;
    if (!acc) return;

    const x = acc.x ?? 0;
    const y = acc.y ?? 0;
    const z = acc.z ?? 0;
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    if (magnitude > this.threshold) {
      const now = Date.now();
      if (now - this.lastShakeTime > this.cooldownMs) {
        this.lastShakeTime = now;
        this.onShake?.();
      }
    }
  }
}
