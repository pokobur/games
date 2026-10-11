/**
 * SoundManager.js
 * Web Audio API を使った効果音マネージャー
 * ミュート機能・アンロック対応
 */

const MUTE_STORAGE_KEY = 'pma_sound_muted';

class SoundManager {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem(MUTE_STORAGE_KEY) === 'true';
    this.enabled = true;
    this._listeners = new Set();
    this._init();
  }

  _init() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }

    // 初回のタッチやクリックでAudioContextをアンロック
    const unlock = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  _resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, String(this.isMuted));
    } catch (e) {}
    this._listeners.forEach(fn => fn(this.isMuted));
    return this.isMuted;
  }

  onMuteChange(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  /**
   * マスを塗ったときの効果音（心地よいポコッというポップ音）
   */
  playPop(colorIndex = 0) {
    if (!this.ctx || !this.enabled || this.isMuted) return;
    this._resume();
    const notes = [440, 494, 554, 587, 659, 740, 831, 880];
    const freq = notes[colorIndex % notes.length];
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'triangle';
    const t = this.ctx.currentTime;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.4, t + 0.05);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  /**
   * 1色が完成したときのファンファーレ
   */
  playColorComplete() {
    if (!this.ctx || !this.enabled || this.isMuted) return;
    this._resume();
    const melody = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    const t0 = this.ctx.currentTime;

    melody.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'square';
      const t = t0 + i * 0.09;
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.start(t);
      osc.stop(t + 0.18);
    });
  }

  /**
   * 全完成時のビッグファンファーレ
   */
  playComplete() {
    if (!this.ctx || !this.enabled || this.isMuted) return;
    this._resume();
    const melody = [523.25, 659.25, 783.99, 659.25, 783.99, 1046.50, 1046.50];
    const timing = [0, 0.12, 0.24, 0.40, 0.52, 0.64, 0.82];
    const t0 = this.ctx.currentTime;

    melody.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.type = 'sawtooth';
      const t = t0 + timing[i];
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      osc.start(t);
      osc.stop(t + 0.24);
    });
  }

  /**
   * 録音開始音
   */
  playRecord() {
    if (!this.ctx || !this.enabled || this.isMuted) return;
    this._resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    const t = this.ctx.currentTime;
    osc.frequency.setValueAtTime(587.33, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.15);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  /**
   * エラー音（低音のブブッ）
   */
  playError() {
    if (!this.ctx || !this.enabled || this.isMuted) return;
    this._resume();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    const t = this.ctx.currentTime;
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.18);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.start(t);
    osc.stop(t + 0.2);
  }
}

export const soundManager = new SoundManager();
