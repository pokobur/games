// ==========================================
// ぷるぽよチェイン: Web Audio 音源エンジン (audio.js)
// ==========================================

class SoundSynth {
    constructor() {
        this.ctx = null;
        this.muted = false;
        this.sfxVolume = 0.8;
        this.unlocked = false;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    unlock() {
        if (this.unlocked) return;
        this.init();
        if (this.ctx) {
            // Play brief silent buffer to unlock iOS Safari
            const buffer = this.ctx.createBuffer(1, 1, 22050);
            const source = this.ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(this.ctx.destination);
            source.start(0);
            this.unlocked = true;
        }
    }

    createGainNode(volume, startTime, rampTime = null) {
        const gain = this.ctx.createGain();
        const effectiveVol = this.muted ? 0 : volume * this.sfxVolume;
        gain.gain.setValueAtTime(effectiveVol, startTime);
        if (rampTime) {
            gain.gain.exponentialRampToValueAtTime(0.0001, rampTime);
        }
        gain.connect(this.ctx.destination);
        return gain;
    }

    playGrab() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.createGainNode(0.18, now, now + 0.12);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(380, now + 0.12);
        osc.connect(gain);

        osc.start(now);
        osc.stop(now + 0.12);
    }

    playTick(urgent = false) {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.createGainNode(urgent ? 0.09 : 0.045, now, now + 0.04);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(urgent ? 980 : 660, now);
        osc.connect(gain);

        osc.start(now);
        osc.stop(now + 0.04);
    }

    playPop(combo = 0) {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        
        // Pentatonic progression scale for melodic chimes
        const pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00];
        const index = combo % 5;
        const octave = Math.floor(combo / 5);
        const freq = pentatonic[index] * Math.pow(2, octave);

        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const gain = this.createGainNode(0.2, now, now + 0.25);

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(freq, now);
        osc1.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.25);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * 1.01, now);
        osc2.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.25);

        osc1.connect(gain);
        osc2.connect(gain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.25);
        osc2.stop(now + 0.25);

        // Delayed sparkling crystal chime for combo >= 1 (2-chain and up)
        if (combo >= 1) {
            const sparkOsc = this.ctx.createOscillator();
            const sparkGain = this.createGainNode(0.14, now + 0.05, now + 0.32);

            sparkOsc.type = 'sine';
            const sparkFreq = freq * 2; // Octave higher
            sparkOsc.frequency.setValueAtTime(sparkFreq, now + 0.05);
            sparkOsc.frequency.exponentialRampToValueAtTime(sparkFreq * 2.2, now + 0.32);

            sparkOsc.connect(sparkGain);
            sparkOsc.start(now + 0.05);
            sparkOsc.stop(now + 0.32);
        }
    }

    playTimeUp() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.createGainNode(0.2, now, now + 0.3);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.3);
        osc.connect(gain);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    playDrop() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.createGainNode(0.14, now, now + 0.16);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.16);
        osc.connect(gain);

        osc.start(now);
        osc.stop(now + 0.16);
    }

    playHit() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.createGainNode(0.16, now, now + 0.12);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(75, now + 0.12);
        osc.connect(gain);

        osc.start(now);
        osc.stop(now + 0.12);
    }

    playHeal() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const noteTime = now + idx * 0.05;
            const gain = this.createGainNode(0.1, noteTime, noteTime + 0.15);

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, noteTime);
            osc.connect(gain);

            osc.start(noteTime);
            osc.stop(noteTime + 0.15);
        });
    }

    playSettle() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.createGainNode(0.12, now, now + 0.08);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);
        osc.connect(gain);

        osc.start(now);
        osc.stop(now + 0.08);
    }

    playBurst() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        // Ascending shimmering harp arpeggio
        const arpeggio = [329.63, 392.00, 523.25, 659.25, 783.99, 1046.50, 1318.51];
        arpeggio.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const noteTime = now + idx * 0.04;
            const gain = this.createGainNode(0.12, noteTime, noteTime + 0.22);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, noteTime);
            osc.connect(gain);

            osc.start(noteTime);
            osc.stop(noteTime + 0.22);
        });
    }

    playBossDefeat() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        // Comical spin-down and pop
        const osc = this.ctx.createOscillator();
        const gain = this.createGainNode(0.22, now, now + 0.45);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.45);
        osc.connect(gain);

        osc.start(now);
        osc.stop(now + 0.45);

        // Final pop explosion
        setTimeout(() => {
            if (this.muted || !this.ctx) return;
            const popTime = this.ctx.currentTime;
            const pOsc = this.ctx.createOscillator();
            const pGain = this.createGainNode(0.25, popTime, popTime + 0.2);
            pOsc.type = 'sine';
            pOsc.frequency.setValueAtTime(800, popTime);
            pOsc.frequency.exponentialRampToValueAtTime(200, popTime + 0.2);
            pOsc.connect(pGain);
            pOsc.start(popTime);
            pOsc.stop(popTime + 0.2);
        }, 300);
    }

    playGameOverTone() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const notes = [392.00, 369.99, 349.23, 329.63, 293.66, 261.63];
        notes.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const noteTime = now + idx * 0.12;
            const gain = this.createGainNode(0.18, noteTime, noteTime + 0.25);

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, noteTime);
            osc.connect(gain);

            osc.start(noteTime);
            osc.stop(noteTime + 0.25);
        });
    }

    playVictoryFanfare() {
        if (this.muted) return;
        this.init();
        const now = this.ctx.currentTime;
        const fanfare = [
            { f: 523.25, d: 0.12 },
            { f: 523.25, d: 0.12 },
            { f: 523.25, d: 0.12 },
            { f: 659.25, d: 0.35 },
            { f: 587.33, d: 0.14 },
            { f: 659.25, d: 0.14 },
            { f: 783.99, d: 0.45 }
        ];

        let offset = 0;
        fanfare.forEach(note => {
            const noteTime = now + offset;
            const osc = this.ctx.createOscillator();
            const gain = this.createGainNode(0.18, noteTime, noteTime + note.d);

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(note.f, noteTime);
            osc.connect(gain);

            osc.start(noteTime);
            osc.stop(noteTime + note.d);
            offset += note.d * 0.85;
        });
    }
}

// ==========================================
// Sequenced Chiptune BGM Engine (Rhythmic Scheduler)
// ==========================================
class BGMSequencer {
    constructor(soundSynth) {
        this.synth = soundSynth;
        this.step = 0;
        this.isPlaying = false;
        this.timerId = null;
        this.bgmVolume = 0.55;

        // Pentatonic melody loop
        this.melody = [
            261.63, 293.66, 329.63, 392.00, 329.63, 293.66, 261.63, 196.00,
            220.00, 261.63, 293.66, 329.63, 220.00, 196.00, 220.00, 261.63
        ];
        this.bass = [
            130.81, 130.81, 146.83, 146.83, 164.81, 164.81, 196.00, 196.00,
            110.00, 110.00, 130.81, 130.81, 110.00, 98.00, 110.00, 130.81
        ];

        this.scheduleNext = this.scheduleNext.bind(this);
    }

    start() {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.step = 0;
        this.scheduleNext();
    }

    stop() {
        this.isPlaying = false;
        if (this.timerId) {
            clearTimeout(this.timerId);
            this.timerId = null;
        }
    }

    scheduleNext() {
        if (!this.isPlaying) return;

        // Check if game state should mute BGM
        const shouldMute = this.synth.muted || 
            (typeof gameState !== 'undefined' && 
             (gameState === STATE_TITLE || gameState === STATE_GAME_OVER || 
              gameState === STATE_VICTORY || gameState === STATE_STAGE_CLEAR || 
              gameState === STATE_PAUSED));

        if (!shouldMute && this.synth.ctx) {
            this.synth.init();
            const now = this.synth.ctx.currentTime;
            
            // Speed up during Fever or Danger!
            const isFever = (typeof isFeverMode !== 'undefined' && isFeverMode);
            const inDanger = (typeof inDangerZone !== 'undefined' && inDangerZone);
            const tempoScale = isFever ? 0.72 : (inDanger ? 0.85 : 1.0);

            // Play Melody Note
            const osc = this.synth.ctx.createOscillator();
            const gain = this.synth.ctx.createGain();
            const melVol = (isFever ? 0.018 : 0.012) * this.bgmVolume;

            gain.gain.setValueAtTime(melVol, now);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16 * tempoScale);
            osc.connect(gain);
            gain.connect(this.synth.ctx.destination);

            osc.type = 'triangle';
            const melFreq = this.melody[this.step % this.melody.length] * (isFever ? 1.5 : 1.0);
            osc.frequency.setValueAtTime(melFreq, now);

            osc.start(now);
            osc.stop(now + 0.16 * tempoScale);

            // Play Bass Note on even steps
            if (this.step % 2 === 0) {
                const oscB = this.synth.ctx.createOscillator();
                const gainB = this.synth.ctx.createGain();
                const bassVol = (isFever ? 0.04 : 0.025) * this.bgmVolume;

                gainB.gain.setValueAtTime(bassVol, now);
                gainB.gain.exponentialRampToValueAtTime(0.0001, now + 0.3 * tempoScale);
                oscB.connect(gainB);
                gainB.connect(this.synth.ctx.destination);

                oscB.type = 'sine';
                const bassFreq = this.bass[Math.floor(this.step / 2) % this.bass.length];
                oscB.frequency.setValueAtTime(bassFreq, now);

                oscB.start(now);
                oscB.stop(now + 0.3 * tempoScale);
            }

            this.step++;
        }

        // Dynamically compute next delay based on fever / tempo scale!
        const isFever = (typeof isFeverMode !== 'undefined' && isFeverMode);
        const inDanger = (typeof inDangerZone !== 'undefined' && inDangerZone);
        const nextDelayMs = (isFever ? 160 : (inDanger ? 185 : 220));

        this.timerId = setTimeout(this.scheduleNext, nextDelayMs);
    }
}
