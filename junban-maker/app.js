// app.js - じゅんばんメーカー メインスクリプト

import { gameSpecs } from './gameManager.js';

// --- アプリのグローバル状態 (State) ---
const state = {
    players: [],
    soundMuted: false,
    selectedGame: null,
    audioCtx: null,
    masterGainNode: null,
    confettiInterval: null
};

// --- Web Audio API 効果音合成 (Sound Synthesizer) ---
function initAudio() {
    if (state.audioCtx) return;
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        state.audioCtx = new AudioContext();
        state.masterGainNode = state.audioCtx.createGain();
        state.masterGainNode.gain.setValueAtTime(state.soundMuted ? 0 : 0.6, state.audioCtx.currentTime);
        state.masterGainNode.connect(state.audioCtx.destination);
    } catch (e) {
        console.warn("AudioContext を初期化できませんでした:", e);
    }
}

function playSound(type) {
    initAudio();
    if (!state.audioCtx || state.soundMuted) return;
    
    // ブラウザの省電力制限解除
    if (state.audioCtx.state === 'suspended') {
        state.audioCtx.resume();
    }

    const t = state.audioCtx.currentTime;
    
    switch (type) {
        case 'click': { // ピコッ（ボタンクリック）
            const osc = state.audioCtx.createOscillator();
            const gain = state.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(600, t);
            osc.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
            osc.connect(gain);
            gain.connect(state.masterGainNode);
            osc.start(t);
            osc.stop(t + 0.12);
            break;
        }
        case 'ding': { // ピコーン（決定・追加）
            const osc = state.audioCtx.createOscillator();
            const gain = state.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, t);
            osc.frequency.setValueAtTime(1000, t + 0.08);
            gain.gain.setValueAtTime(0.25, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            osc.connect(gain);
            gain.connect(state.masterGainNode);
            osc.start(t);
            osc.stop(t + 0.35);
            break;
        }
        case 'buzz': { // ブブー（削除・エラー）
            const osc = state.audioCtx.createOscillator();
            const gain = state.audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.setValueAtTime(130, t + 0.15);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
            osc.connect(gain);
            gain.connect(state.masterGainNode);
            osc.start(t);
            osc.stop(t + 0.3);
            break;
        }
        case 'squeak': { // ギシギシ（風船が膨らむ）
            const osc = state.audioCtx.createOscillator();
            const gain = state.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(200, t);
            osc.frequency.exponentialRampToValueAtTime(500, t + 0.15);
            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            osc.connect(gain);
            gain.connect(state.masterGainNode);
            osc.start(t);
            osc.stop(t + 0.16);
            break;
        }
        case 'explosion': { // ドカン！（風船破裂、ルーレット決定）
            // ノイズジェネレータで爆発音を作成
            const bufferSize = state.audioCtx.sampleRate * 0.5; // 0.5秒
            const buffer = state.audioCtx.createBuffer(1, bufferSize, state.audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = state.audioCtx.createBufferSource();
            noise.buffer = buffer;
            
            // フィルターで低音に寄せる
            const filter = state.audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, t);
            filter.frequency.exponentialRampToValueAtTime(80, t + 0.4);
            
            const gain = state.audioCtx.createGain();
            gain.gain.setValueAtTime(0.6, t);
            gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
            
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(state.masterGainNode);
            noise.start(t);
            noise.stop(t + 0.5);
            break;
        }
        case 'sword': { // ザシュッ・カチッ（剣が刺さる音）
            const osc1 = state.audioCtx.createOscillator();
            const osc2 = state.audioCtx.createOscillator();
            const gain1 = state.audioCtx.createGain();
            const gain2 = state.audioCtx.createGain();
            
            // 刺さる摩擦音 (低めの三角波スライド)
            osc1.type = 'triangle';
            osc1.frequency.setValueAtTime(450, t);
            osc1.frequency.exponentialRampToValueAtTime(90, t + 0.12);
            gain1.gain.setValueAtTime(0.25, t);
            gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
            
            // 奥で固定される金属音
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(900, t + 0.05);
            osc2.frequency.setValueAtTime(1400, t + 0.08);
            gain2.gain.setValueAtTime(0.15, t + 0.05);
            gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            
            osc1.connect(gain1);
            gain1.connect(state.masterGainNode);
            osc2.connect(gain2);
            gain2.connect(state.masterGainNode);
            
            osc1.start(t);
            osc1.stop(t + 0.13);
            osc2.start(t + 0.05);
            osc2.stop(t + 0.16);
            break;
        }
        case 'drumroll': { // ドロロロ（ドラムロール）
            // テンションを高める細かなパルス
            const duration = 1.0;
            const osc = state.audioCtx.createOscillator();
            const osc2 = state.audioCtx.createOscillator();
            const gain = state.audioCtx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(70, t);
            osc.frequency.linearRampToValueAtTime(120, t + duration);
            
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(5, t); // モジュレータ
            
            const modGain = state.audioCtx.createGain();
            modGain.gain.setValueAtTime(30, t);
            
            osc2.connect(modGain);
            modGain.connect(osc.frequency);
            
            gain.gain.setValueAtTime(0.25, t);
            gain.gain.linearRampToValueAtTime(0.3, t + duration - 0.1);
            gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
            
            osc.connect(gain);
            gain.connect(state.masterGainNode);
            
            osc2.start(t);
            osc.start(t);
            osc2.stop(t + duration);
            osc.stop(t + duration);
            break;
        }
        case 'fanfare': { // ファンファーレ（勝利）
            // 明るいメロディ
            const notes = [261.63, 329.63, 392.00, 523.25, 392.00, 523.25, 659.25]; // C E G C2 G C2 E2
            const rhythm = [0.15, 0.15, 0.15, 0.25, 0.15, 0.15, 0.6];
            let currentOffset = 0;
            
            notes.forEach((freq, idx) => {
                const noteTime = t + currentOffset;
                const noteDur = rhythm[idx];
                
                const osc = state.audioCtx.createOscillator();
                const gain = state.audioCtx.createGain();
                
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, noteTime);
                
                gain.gain.setValueAtTime(0.2, noteTime);
                gain.gain.exponentialRampToValueAtTime(0.01, noteTime + noteDur - 0.02);
                
                osc.connect(gain);
                gain.connect(state.masterGainNode);
                
                osc.start(noteTime);
                osc.stop(noteTime + noteDur);
                
                currentOffset += noteDur * 0.85;
            });
            break;
        }
    }
}

// --- 画面遷移の制御 ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(scr => {
        scr.classList.remove('active');
    });
    
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        window.scrollTo(0, 0);
    }
}

// --- 参加者登録機能のロジック ---
function renderPlayerList() {
    const container = document.getElementById('player-list-container');
    container.innerHTML = '';
    
    state.players.forEach((p, idx) => {
        const chip = document.createElement('div');
        chip.className = 'player-chip';
        chip.innerHTML = `
            <span class="player-chip-name">${escapeHtml(p)}</span>
            <button class="btn-remove-player" data-index="${idx}" aria-label="${p}さんを消す">×</button>
        `;
        container.appendChild(chip);
    });
    
    // 人数表示の更新
    document.getElementById('current-count').textContent = state.players.length;
    
    // 次へボタンの活性・非活性
    const btnNext = document.getElementById('btn-to-game-select');
    if (state.players.length >= 2) {
        btnNext.classList.remove('disabled');
        btnNext.removeAttribute('disabled');
    } else {
        btnNext.classList.add('disabled');
        btnNext.setAttribute('disabled', 'true');
    }
    
    // ローカルストレージに保存
    localStorage.setItem('junban_players', JSON.stringify(state.players));
}

function escapeHtml(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&#039;');
}

function addPlayer(name) {
    const cleanName = name.trim();
    if (!cleanName) return;
    
    if (state.players.length >= 40) {
        alert("参加者は最大40人まで登録できます。");
        playSound('buzz');
        return;
    }
    
    state.players.push(cleanName);
    playSound('ding');
    renderPlayerList();
}

function removePlayer(index) {
    state.players.splice(index, 1);
    playSound('buzz');
    renderPlayerList();
}

function generatePlayers(count) {
    const list = [];
    for (let i = 1; i <= count; i++) {
        list.push(`プレイヤー${i}`);
    }
    state.players = list;
    playSound('ding');
    renderPlayerList();
}

// --- 紙吹雪お祝い演出 (Confetti Particle System) ---
function startConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    canvas.style.display = 'block';
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });
    
    const colors = ['#f56565', '#ed8936', '#ecc94b', '#48bb78', '#38b2ac', '#4299e1', '#667eea', '#9f7aea', '#ed64a6'];
    const particles = [];
    
    for (let i = 0; i < 150; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height - height,
            r: Math.random() * 6 + 4,
            d: Math.random() * height,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.random() * 10 - 5,
            tiltAngleIncremental: Math.random() * 0.07 + 0.02,
            tiltAngle: 0,
            speed: Math.random() * 3 + 2
        });
    }
    
    function draw() {
        ctx.clearRect(0, 0, width, height);
        
        let active = false;
        particles.forEach((p, idx) => {
            p.tiltAngle += p.tiltAngleIncremental;
            p.y += p.speed;
            p.x += Math.sin(p.tiltAngle) * 0.5;
            p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15;
            
            if (p.y < height) {
                active = true;
            }
            
            ctx.beginPath();
            ctx.lineWidth = p.r;
            ctx.strokeStyle = p.color;
            ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
            ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
            ctx.stroke();
        });
        
        if (active) {
            requestAnimationFrame(draw);
        } else {
            canvas.style.display = 'none';
        }
    }
    
    draw();
}

// --- ゲーム実行管理 ---
let activeGameObject = null;

function loadGame(gameId) {
    const spec = gameSpecs[gameId];
    if (!spec) return;
    
    state.selectedGame = gameId;
    
    // タイトル更新
    document.getElementById('active-game-title').innerHTML = spec.title;
    
    // ルール表示ポップアップを設定
    document.getElementById('popup-game-title').innerHTML = spec.title;
    document.getElementById('popup-game-icon').textContent = spec.icon;
    document.getElementById('popup-game-desc').innerHTML = spec.rules;
    
    const popup = document.getElementById('popup-rules');
    popup.classList.add('active');
}

function startGame() {
    const container = document.getElementById('game-canvas-container');
    container.innerHTML = '';
    
    if (activeGameObject) {
        activeGameObject.destroy();
        activeGameObject = null;
    }
    
    const spec = gameSpecs[state.selectedGame];
    if (!spec) return;
    
    showScreen('screen-game-play');
    
    // ゲームインスタンスを作成
    activeGameObject = new spec.GameClass(
        container,
        [...state.players], // プレイヤーのシャローコピーを渡す
        (rankings) => {
            // ゲーム終了時のコールバック
            showResults(rankings);
        },
        playSound
    );
}

function showResults(rankings) {
    if (activeGameObject) {
        activeGameObject.destroy();
        activeGameObject = null;
    }
    
    playSound('fanfare');
    startConfetti();
    
    const tbody = document.getElementById('results-tbody');
    tbody.innerHTML = '';
    
    rankings.forEach((p, idx) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${idx + 1}<ruby>位<rt>い</rt></ruby></strong></td>
            <td>${escapeHtml(p)}</td>
        `;
        tbody.appendChild(row);
    });
    
    showScreen('screen-results');
}

// --- イベントリスナーのバインディング ---
document.addEventListener('DOMContentLoaded', () => {
    // 最初の画面でのジェスチャー時にオーディオコンテキストを初期化
    document.addEventListener('click', () => {
        initAudio();
    }, { once: true });
    document.addEventListener('touchstart', () => {
        initAudio();
    }, { once: true });

    // ローカルストレージからプレイヤー一覧を読み込み
    const saved = localStorage.getItem('junban_players');
    if (saved) {
        try {
            state.players = JSON.parse(saved);
            renderPlayerList();
        } catch (e) {
            state.players = [];
        }
    }

    // ミュート状態の読み込み
    const savedMute = localStorage.getItem('junban_sound_muted');
    if (savedMute !== null) {
        state.soundMuted = savedMute === 'true';
        const iconSpan = document.querySelector('#btn-audio-toggle .icon');
        iconSpan.textContent = state.soundMuted ? '🔇' : '🔊';
    }

    // ミュート切り替えボタン
    document.getElementById('btn-audio-toggle').addEventListener('click', (e) => {
        e.stopPropagation();
        state.soundMuted = !state.soundMuted;
        localStorage.setItem('junban_sound_muted', state.soundMuted);
        
        if (state.masterGainNode) {
            state.masterGainNode.gain.setValueAtTime(state.soundMuted ? 0 : 0.6, state.audioCtx ? state.audioCtx.currentTime : 0);
        }
        
        const iconSpan = document.querySelector('#btn-audio-toggle .icon');
        iconSpan.textContent = state.soundMuted ? '🔇' : '🔊';
        
        playSound('click');
    });

    // 登録タブの切り替え
    const tabName = document.getElementById('tab-name-input');
    const tabNum = document.getElementById('tab-number-input');
    const formName = document.getElementById('form-name-input');
    const formNum = document.getElementById('form-number-input');

    tabName.addEventListener('click', () => {
        playSound('click');
        tabName.classList.add('active');
        tabNum.classList.remove('active');
        formName.classList.add('active');
        formNum.classList.remove('active');
    });

    tabNum.addEventListener('click', () => {
        playSound('click');
        tabNum.classList.add('active');
        tabName.classList.remove('active');
        formNum.classList.add('active');
        formName.classList.remove('active');
    });

    // プレイヤーの追加
    const nameInput = document.getElementById('player-name-input');
    document.getElementById('btn-add-player').addEventListener('click', () => {
        addPlayer(nameInput.value);
        nameInput.value = '';
        nameInput.focus();
    });

    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addPlayer(nameInput.value);
            nameInput.value = '';
        }
    });

    // プレイヤー削除のハンドリング（デリゲーション）
    document.getElementById('player-list-container').addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove-player')) {
            const index = parseInt(e.target.getAttribute('data-index'), 10);
            removePlayer(index);
        }
    });

    // 人数カウンター調整
    const countInput = document.getElementById('player-count-input');
    document.getElementById('btn-dec-num').addEventListener('click', () => {
        playSound('click');
        let val = parseInt(countInput.value, 10);
        if (val > 2) countInput.value = val - 1;
    });

    document.getElementById('btn-inc-num').addEventListener('click', () => {
        playSound('click');
        let val = parseInt(countInput.value, 10);
        if (val < 40) countInput.value = val + 1;
    });

    // 自動生成ボタン
    document.getElementById('btn-generate-players').addEventListener('click', () => {
        const val = parseInt(countInput.value, 10);
        generatePlayers(val);
    });

    // 全員消すボタン
    document.getElementById('btn-clear-players').addEventListener('click', () => {
        if (state.players.length === 0) return;
        if (confirm("全員消してもいいですか？")) {
            state.players = [];
            playSound('buzz');
            renderPlayerList();
        }
    });

    // 画面1から画面2への遷移
    document.getElementById('btn-to-game-select').addEventListener('click', () => {
        if (state.players.length < 2) return;
        playSound('click');
        showScreen('screen-game-select');
    });

    // 画面2からもどる
    document.getElementById('btn-back-to-register').addEventListener('click', () => {
        playSound('click');
        showScreen('screen-register');
    });

    // ゲームカードの選択
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', () => {
            playSound('click');
            const gameId = card.getAttribute('data-game');
            loadGame(gameId);
        });
    });

    // ポップアップのボタン
    document.getElementById('btn-popup-close').addEventListener('click', () => {
        playSound('click');
        document.getElementById('popup-rules').classList.remove('active');
    });

    document.getElementById('btn-popup-start').addEventListener('click', () => {
        playSound('click');
        document.getElementById('popup-rules').classList.remove('active');
        startGame();
    });

    // ゲームプレイからやめる
    document.getElementById('btn-back-to-select').addEventListener('click', () => {
        if (confirm("ゲームをとちゅうでやめますか？")) {
            playSound('click');
            if (activeGameObject) {
                activeGameObject.destroy();
                activeGameObject = null;
            }
            showScreen('screen-game-select');
        }
    });

    // 結果画面のボタン
    document.getElementById('btn-replay-game').addEventListener('click', () => {
        playSound('click');
        startGame();
    });

    document.getElementById('btn-change-game').addEventListener('click', () => {
        playSound('click');
        showScreen('screen-game-select');
    });

    document.getElementById('btn-restart-app').addEventListener('click', () => {
        playSound('click');
        showScreen('screen-register');
    });
});
