/* ==========================================================
   audio.js - Web Audio API によるプログラマティック効果音 & BGM
   (外部音声ファイル非依存・独立ボリューム調整対応)
   ========================================================== */
(function () {
    'use strict';

    let ctx = null;
    let masterGain = null;
    let gainSE = null;
    let gainBGM = null;
    let seVolume = 0.7;
    let bgmVolume = 0.4;
    let enabled = true;
    let lastTick = 0;
    let bgmTimer = null;
    let bgmStep = 0;

    function ensure() {
        if (!ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            ctx = new AC();
            masterGain = ctx.createGain();
            masterGain.gain.value = 1.0;
            masterGain.connect(ctx.destination);

            gainSE = ctx.createGain();
            gainSE.gain.value = enabled ? seVolume : 0;
            gainSE.connect(masterGain);

            gainBGM = ctx.createGain();
            gainBGM.gain.value = enabled ? bgmVolume : 0;
            gainBGM.connect(masterGain);
        }
        if (ctx.state === 'suspended') ctx.resume();
        startBGM();
        return ctx;
    }

    /** 単音 (SE用) */
    function tone(opts) {
        if (!enabled || seVolume <= 0 || !ensure()) return;
        const {
            freq = 440, to = null, type = 'sine', dur = 0.15, vol = 0.3,
            delay = 0, attack = 0.005,
        } = opts;
        const t0 = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        if (to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(g).connect(gainSE);
        osc.start(t0);
        osc.stop(t0 + dur + 0.05);
    }

    /** ノイズバースト (SE用) */
    function noise(opts) {
        if (!enabled || seVolume <= 0 || !ensure()) return;
        const { dur = 0.12, vol = 0.25, filter = 800, q = 1, delay = 0, type = 'lowpass' } = opts;
        const t0 = ctx.currentTime + delay;
        const len = Math.floor(ctx.sampleRate * dur);
        const buf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        const f = ctx.createBiquadFilter();
        f.type = type;
        f.frequency.value = filter;
        f.Q.value = q;
        const g = ctx.createGain();
        g.gain.setValueAtTime(vol, t0);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        src.connect(f).connect(g).connect(gainSE);
        src.start(t0);
    }

    /* ---------- BGM エンジン (絵本・おもちゃ箱のほのぼのメロディ) ---------- */
    // 優しいペンタトニック音階 (C4, D4, E4, G4, A4, C5, D5, E5, G5)
    const BGM_SCALE = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99];
    // 16ステップのループフレーズ (主旋律 + 伴奏ベース)
    const BGM_NOTES = [
        { mel: 5, bass: 0 }, { mel: null }, { mel: 4 }, { mel: 2 },
        { mel: 3, bass: 3 }, { mel: 4 },    { mel: 5 }, { mel: null },
        { mel: 6, bass: 4 }, { mel: 5 },    { mel: 4 }, { mel: 3 },
        { mel: 2, bass: 0 }, { mel: 4 },    { mel: 3 }, { mel: null },
    ];

    function playBgmNote(freq, vol = 0.15, dur = 0.22, isBass = false) {
        if (!ctx || !gainBGM) return;
        const t0 = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = isBass ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, t0);

        // トイピアノ調のコロコロとした減衰
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

        osc.connect(g).connect(gainBGM);
        osc.start(t0);
        osc.stop(t0 + dur + 0.05);
    }

    function startBGM() {
        if (bgmTimer || !ctx) return;
        bgmStep = 0;
        bgmTimer = setInterval(() => {
            if (!enabled || bgmVolume <= 0 || !ctx || ctx.state !== 'running') return;
            const item = BGM_NOTES[bgmStep % BGM_NOTES.length];
            if (item.mel != null) {
                playBgmNote(BGM_SCALE[item.mel], 0.14, 0.24, false);
            }
            if (item.bass != null) {
                playBgmNote(BGM_SCALE[item.bass] * 0.5, 0.11, 0.35, true);
            }
            bgmStep++;
        }, 260); // テンポ ~115 BPM
    }

    const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5, 1567.98, 1760];

    const Sound = {
        unlock() { ensure(); },

        setEnabled(on) {
            enabled = !!on;
            if (gainSE) gainSE.gain.value = enabled ? seVolume : 0;
            if (gainBGM) gainBGM.gain.value = enabled ? bgmVolume : 0;
            if (enabled) ensure();
        },

        isEnabled() { return enabled; },

        setSEVolume(val) {
            seVolume = Math.max(0, Math.min(1, val));
            if (gainSE) gainSE.gain.value = enabled ? seVolume : 0;
        },

        getSEVolume() { return seVolume; },

        setBGMVolume(val) {
            bgmVolume = Math.max(0, Math.min(1, val));
            if (gainBGM) gainBGM.gain.value = enabled ? bgmVolume : 0;
        },

        getBGMVolume() { return bgmVolume; },

        /** 回転時のカチッ */
        rotate() {
            const now = performance.now();
            if (now - lastTick < 60) return;
            lastTick = now;
            tone({ freq: 1400, type: 'triangle', dur: 0.04, vol: 0.12 });
        },

        /** 落下開始 ヒュー */
        drop() {
            tone({ freq: 900, to: 300, type: 'sine', dur: 0.25, vol: 0.18 });
        },

        /** 着地 ポン/ドスン (重さで音程変化) */
        land(weight = 1, strength = 1) {
            const v = Math.min(1, 0.25 + strength * 0.25);
            tone({ freq: 220 / weight, to: 90 / weight, type: 'sine', dur: 0.18, vol: 0.35 * v });
            noise({ dur: 0.08, vol: 0.15 * v, filter: 500 });
        },

        /** 設置成功 キラリン (段数で音階が上がる) */
        success(count) {
            const n = NOTES[Math.min(NOTES.length - 1, Math.max(0, count - 1))];
            tone({ freq: n, type: 'triangle', dur: 0.18, vol: 0.22 });
            tone({ freq: n * 1.5, type: 'triangle', dur: 0.25, vol: 0.16, delay: 0.08 });
        },

        /** ぐらっ (危ない) */
        wobble() {
            tone({ freq: 300, to: 260, type: 'triangle', dur: 0.12, vol: 0.1 });
            tone({ freq: 260, to: 300, type: 'triangle', dur: 0.12, vol: 0.1, delay: 0.12 });
        },

        /** ゲームオーバー ひゅるる〜 */
        gameOver() {
            tone({ freq: 660, to: 520, type: 'square', dur: 0.2, vol: 0.08 });
            tone({ freq: 520, to: 400, type: 'square', dur: 0.2, vol: 0.08, delay: 0.2 });
            tone({ freq: 400, to: 160, type: 'square', dur: 0.5, vol: 0.08, delay: 0.4 });
            noise({ dur: 0.3, vol: 0.12, filter: 300, delay: 0.85 });
        },

        /** クリア ファンファーレ */
        clear() {
            const seq = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
            seq.forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.22, vol: 0.2, delay: i * 0.12 }));
            tone({ freq: 1318.5, type: 'sine', dur: 0.6, vol: 0.18, delay: seq.length * 0.12 });
        },

        /** ボタン ポッ */
        click() {
            tone({ freq: 700, to: 900, type: 'sine', dur: 0.07, vol: 0.15 });
        },

        /** 出現 ポワン */
        spawn() {
            tone({ freq: 500, to: 800, type: 'sine', dur: 0.12, vol: 0.1 });
        },
    };

    window.TowerSound = Sound;
})();
