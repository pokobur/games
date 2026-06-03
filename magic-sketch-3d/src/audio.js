let audioCtx = null;
let soundEnabled = true;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

export const audioManager = {
  toggleSound() {
    soundEnabled = !soundEnabled;
    return soundEnabled;
  },

  isSoundEnabled() {
    return soundEnabled;
  },

  playTap() {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
      
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  },

  playMagic() {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // キラキラしたアルペジオ風の上昇音を何個か生成
      for (let i = 0; i < 6; i++) {
        const timeOffset = i * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        const freq = 523.25 * Math.pow(1.2, i); // C5 から上昇
        osc.frequency.setValueAtTime(freq, now + timeOffset);
        
        gain.gain.setValueAtTime(0, now + timeOffset);
        gain.gain.linearRampToValueAtTime(0.08, now + timeOffset + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.2);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + timeOffset);
        osc.stop(now + timeOffset + 0.25);
      }
    } catch (e) {
      console.warn("Audio error:", e);
    }
  },

  playSuccess() {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // ポップなメロディ (C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.50];
      const durations = [0.1, 0.1, 0.1, 0.3];
      
      let accumTime = 0;
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + accumTime);
        
        gain.gain.setValueAtTime(0, now + accumTime);
        gain.gain.linearRampToValueAtTime(0.12, now + accumTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + accumTime + durations[idx]);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + accumTime);
        osc.stop(now + accumTime + durations[idx]);
        accumTime += durations[idx] - 0.02;
      });
    } catch (e) {
      console.warn("Audio error:", e);
    }
  },

  playSummon() {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      
      // 1. 魔法召喚風のヒューンという上昇
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(100, now);
      osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.5);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // 2. 着地時のズシンという低音
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(150, now + 0.45);
      osc2.frequency.linearRampToValueAtTime(40, now + 0.85);
      gain2.gain.setValueAtTime(0, now + 0.45);
      gain2.gain.linearRampToValueAtTime(0.2, now + 0.48);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.45);
      osc2.stop(now + 0.85);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  },

  playDelete() {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.3);
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }
};
