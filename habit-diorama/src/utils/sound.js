/**
 * Web Audio API を使った軽量な効果音（SE）生成ユーティリティ
 * 外部音声ファイル不要でどこでも確実に動作し、子どもが喜ぶポップなレトロサウンドを再生します。
 */

let audioCtx = null;
let isMuted = false;

// AudioContextの遅延初期化（ユーザー操作後にアンロック）
function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export function isAudioMuted() {
  return isMuted;
}

export function toggleAudioMute() {
  isMuted = !isMuted;
  return isMuted;
}

export function setAudioMute(muted) {
  isMuted = muted;
}

/**
 * 基本のビープ音/メロディ生成
 */
function playTone(freq, type = 'sine', duration = 0.1, delay = 0, volume = 0.15) {
  if (isMuted) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  setTimeout(() => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // AudioContext未初期化などのエラーを抑制
    }
  }, delay * 1000);
}

/**
 * ボタンクリック音（ポコッ）
 */
export function playClickSound() {
  if (isMuted) return;
  playTone(480, 'sine', 0.06, 0, 0.12);
}

/**
 * タスク送信音（シュパッ！）
 */
export function playSubmitSound() {
  if (isMuted) return;
  playTone(523.25, 'triangle', 0.08, 0, 0.15); // C5
  playTone(659.25, 'triangle', 0.12, 0.07, 0.15); // E5
  playTone(783.99, 'triangle', 0.16, 0.14, 0.15); // G5
}

/**
 * タスククリア・お祝いファンファーレ（タタラーン！）
 */
export function playSuccessSound() {
  if (isMuted) return;
  const notes = [
    { freq: 523.25, d: 0.1, t: 0 },      // C5
    { freq: 659.25, d: 0.1, t: 0.1 },    // E5
    { freq: 783.99, d: 0.1, t: 0.2 },    // G5
    { freq: 1046.50, d: 0.35, t: 0.3 },  // C6
  ];
  notes.forEach(n => playTone(n.freq, 'triangle', n.d, n.t, 0.2));
}

/**
 * ガチャ回転音（カタカタカタ）
 */
export function playGachaSpinSound() {
  if (isMuted) return;
  playTone(800 + Math.random() * 400, 'square', 0.04, 0, 0.05);
}

/**
 * ガチャ当選・レア出現ファンファーレ
 */
export function playGachaWinSound(rarity = 1) {
  if (isMuted) return;
  const baseNotes = [
    { freq: 440.00, d: 0.1, t: 0 },      // A4
    { freq: 554.37, d: 0.1, t: 0.1 },    // C#5
    { freq: 659.25, d: 0.12, t: 0.2 },   // E5
    { freq: 880.00, d: 0.4, t: 0.32 },   // A5
  ];

  if (rarity >= 3) {
    // 超レア：キラキラ追加
    baseNotes.push(
      { freq: 1108.73, d: 0.2, t: 0.45 }, // C#6
      { freq: 1318.51, d: 0.4, t: 0.55 }, // E6
      { freq: 1760.00, d: 0.6, t: 0.7 }   // A6
    );
  }

  baseNotes.forEach(n => playTone(n.freq, 'triangle', n.d, n.t, 0.22));
}

/**
 * ジオラマにパーツを置いた音（ポヨン）
 */
export function playPlaceSound() {
  if (isMuted) return;
  playTone(330, 'sine', 0.08, 0, 0.2);
  playTone(550, 'sine', 0.15, 0.04, 0.2);
}

/**
 * パーツを片付けた音（シュッ）
 */
export function playRemoveSound() {
  if (isMuted) return;
  playTone(400, 'sine', 0.08, 0, 0.15);
  playTone(250, 'sine', 0.1, 0.05, 0.12);
}
