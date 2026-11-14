/* ==========================================================
   audio.js - Web Audio API によるプログラマティック効果音 & BGM
   (外部ファイル不要・失敗音/ペナルティ音なしの安心設計)
   ========================================================== */
(function () {
    'use strict';
    const DM = (window.DM = window.DM || {});

    let ctx = null;
    let masterGain = null;
    let gainSE = null;
    let gainBGM = null;
    let seVolume = 0.7;
    let bgmVolume = 0.35;
    let enabled = true;
    let bgmTimer = null;
    let bgmStep = 0;
    let currentBgmTheme = 'theme_jungle';

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
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        return ctx;
    }

    /** 単音生成 (SE用) */
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

    /** ページめくり等の風・摩擦音用ノイズ */
    function noise(opts) {
        if (!enabled || seVolume <= 0 || !ensure()) return;
        const { dur = 0.15, vol = 0.2, filter = 1200, q = 1, delay = 0, type = 'bandpass' } = opts;
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
        src.stop(t0 + dur + 0.05);
    }

    // ---------- 効果音一覧（失敗音は一切なし！） ----------
    const Sound = {
        init() {
            ensure();
        },

        // ボタンのやさしいタップ音
        click() {
            tone({ freq: 620, to: 780, dur: 0.06, vol: 0.22, type: 'sine' });
        },

        // お題ターゲットを発見したときのキラキラ音
        found() {
            // ド・ミ・ソ・ドの明るいアルペジオ＋きらめき
            const notes = [523.25, 659.25, 783.99, 1046.50];
            notes.forEach((freq, idx) => {
                tone({ freq, dur: 0.22, vol: 0.28, delay: idx * 0.06, type: 'triangle' });
                tone({ freq: freq * 2, dur: 0.15, vol: 0.12, delay: idx * 0.06 + 0.02, type: 'sine' });
            });
        },

        // お題外のオブジェクトをタップしたときの探索音（失敗ではなく「ガサガサ」「ぽよん」という発見リアクション）
        rustle() {
            noise({ dur: 0.08, vol: 0.12, filter: 1400 });
            tone({ freq: 280, to: 340, dur: 0.09, vol: 0.14, type: 'sine', attack: 0.01 });
        },

        // ページをめくる音（絵本をパサッとめくる心地よさ）
        pageFlip() {
            noise({ dur: 0.22, vol: 0.25, filter: 1600, q: 0.8 });
            noise({ dur: 0.16, vol: 0.18, filter: 900, delay: 0.05 });
            tone({ freq: 320, to: 220, dur: 0.14, vol: 0.08, delay: 0.03, type: 'triangle' });
        },

        // 1ページ完了のファンファーレ
        pageClear() {
            const chord = [523.25, 659.25, 783.99, 1046.5];
            chord.forEach((f, i) => {
                tone({ freq: f, dur: 0.45, vol: 0.25, delay: i * 0.08, type: 'sine' });
                tone({ freq: f * 1.5, dur: 0.35, vol: 0.12, delay: i * 0.08, type: 'triangle' });
            });
            // キラキラ余韻
            [1318.5, 1567.98, 2093.0].forEach((f, i) => {
                tone({ freq: f, dur: 0.3, vol: 0.15, delay: 0.35 + i * 0.07, type: 'sine' });
            });
        },

        // 全5ページ読了！絵本クリアの大歓喜ファンファーレ
        bookClear() {
            const melody = [
                { f: 523.25, d: 0.15, t: 0 },
                { f: 659.25, d: 0.15, t: 0.14 },
                { f: 783.99, d: 0.15, t: 0.28 },
                { f: 1046.50, d: 0.45, t: 0.42 },
                { f: 880.00, d: 0.15, t: 0.72 },
                { f: 1046.50, d: 0.7, t: 0.90 },
            ];
            melody.forEach((m) => {
                tone({ freq: m.f, dur: m.d, vol: 0.32, delay: m.t, type: 'triangle' });
                tone({ freq: m.f * 0.5, dur: m.d, vol: 0.18, delay: m.t, type: 'sine' });
                tone({ freq: m.f * 2, dur: m.d * 0.8, vol: 0.12, delay: m.t, type: 'sine' });
            });
        },

        // ヒント表示音
        hint() {
            tone({ freq: 880, dur: 0.18, vol: 0.2, type: 'sine' });
            tone({ freq: 1174.66, dur: 0.28, vol: 0.22, delay: 0.08, type: 'sine' });
        },

        // ズーム操作音
        zoom() {
            tone({ freq: 520, to: 640, dur: 0.05, vol: 0.12, type: 'sine' });
        },

        // ---------- BGM 管理 ----------
        startBGM(themeId) {
            currentBgmTheme = themeId || currentBgmTheme;
            if (!enabled || bgmVolume <= 0) return;
            ensure();
            if (bgmTimer) return;
            bgmStep = 0;
            scheduleBgmTick();
        },

        stopBGM() {
            if (bgmTimer) {
                clearTimeout(bgmTimer);
                bgmTimer = null;
            }
        },

        setBgmTheme(themeId) {
            currentBgmTheme = themeId;
        },

        // ボリューム設定
        setVolume(seVal, bgmVal) {
            seVolume = Math.max(0, Math.min(1, seVal));
            bgmVolume = Math.max(0, Math.min(1, bgmVal));
            if (gainSE) gainSE.gain.value = enabled ? seVolume : 0;
            if (gainBGM) gainBGM.gain.value = enabled ? bgmVolume : 0;
            if (bgmVolume > 0 && !bgmTimer && enabled) {
                Sound.startBGM();
            } else if (bgmVolume <= 0 && bgmTimer) {
                Sound.stopBGM();
            }
        },

        setEnabled(flag) {
            enabled = !!flag;
            if (gainSE) gainSE.gain.value = enabled ? seVolume : 0;
            if (gainBGM) gainBGM.gain.value = enabled ? bgmVolume : 0;
            if (enabled) {
                ensure();
                Sound.startBGM();
            } else {
                Sound.stopBGM();
            }
        },

        isEnabled: () => enabled,
        getSeVolume: () => seVolume,
        getBgmVolume: () => bgmVolume,
    };

    // ---------- おだやかな絵本風プログラマティックBGM ----------
    const SCALES = {
        // ペンタトニック（童謡・絵本にぴったりの安心感）
        theme_jungle: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25], // C Major penta
        theme_volcano: [220.00, 261.63, 293.66, 329.63, 392.00, 440.00], // A Minor penta
        theme_ocean: [261.63, 329.63, 392.00, 440.00, 523.25, 587.33], // F Major / C
        theme_night: [261.63, 311.13, 349.23, 392.00, 466.16, 523.25], // おだやかな夜の和音
        theme_ice: [293.66, 329.63, 369.99, 440.00, 493.88, 587.33], // 澄んだ氷・雪山ペンタ
        theme_canyon: [220.00, 246.94, 293.66, 329.63, 369.99, 440.00], // 雄大な渓谷・砂漠調
    };

    function playBgmNote(freq, dur, vol, type = 'sine') {
        if (!enabled || bgmVolume <= 0 || !ctx) return;
        const t0 = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(vol * bgmVolume, t0 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        osc.connect(g).connect(gainBGM);
        osc.start(t0);
        osc.stop(t0 + dur + 0.1);
    }

    function scheduleBgmTick() {
        if (!enabled || bgmVolume <= 0) {
            bgmTimer = null;
            return;
        }
        const scale = SCALES[currentBgmTheme] || SCALES.theme_jungle;
        // ゆったりしたオルゴール・トイピアノ調のステップ進行
        const root = scale[0] * 0.5;
        if (bgmStep % 4 === 0) {
            // ベース音（やさしく鳴る）
            playBgmNote(root, 0.8, 0.14, 'triangle');
        } else if (bgmStep % 4 === 2) {
            playBgmNote(scale[3] * 0.5, 0.6, 0.10, 'triangle');
        }

        // メロディ音（ランダムだが調和したペンタトニック音）
        const melIdx = [0, 2, 4, 3, 1, 2, 5, 3][bgmStep % 8];
        const freq = scale[melIdx];
        playBgmNote(freq, 0.35, 0.16, 'sine');
        // 高音のオルゴール倍音
        if (bgmStep % 2 === 0) {
            playBgmNote(freq * 2, 0.25, 0.06, 'sine');
        }

        bgmStep++;
        bgmTimer = setTimeout(scheduleBgmTick, 420);
    }

    DM.audio = Sound;
})();
