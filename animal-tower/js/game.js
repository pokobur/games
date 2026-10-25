/* ==========================================================
   game.js - ぐらぐら どうぶつタワー メインロジック
   ========================================================== */
(function () {
    'use strict';

    const { Engine, Composite, Bodies, Body, Events } = Matter;
    const Storage = window.TowerStorage;
    const Sound = window.TowerSound;
    const Animals = window.Animals;
    const BG = window.TowerBackground;

    /* ---------- 定数 ---------- */
    const W = 400;                // 論理キャンバス幅
    const H = 600;                // 論理キャンバス高さ (2:3 ≒ 縦型)
    const BASE = { x: W / 2, top: 530, w: 230, h: 18 };   // 台座 (幅 = キャンバスの57.5%)
    const SPAWN_Y = 72;           // スタンバイ位置
    const GOAL_Y = 138;           // タワーがここに届いたら「てっぺん」
    const PX_PER_CM = 5;          // 5px = 1cm 換算
    const STEP = 1000 / 120;      // 物理サブステップ (ms)
    const ROT_STEP = Math.PI / 12;            // 15°
    const ROT_SPEED = (75 * Math.PI) / 180;   // 長押し時 75°/秒
    const HOLD_DELAY = 280;       // 長押し判定 (ms)
    const FALL_LINE = BASE.top + 12;          // これより下に重心が落ちたら落下
    const CLEAR_BONUS = 1000;

    /* ---------- DOM ---------- */
    const $ = (id) => document.getElementById(id);
    const canvas = $('game');
    const ctx = canvas.getContext('2d');
    const ui = {
        count: $('hud-count'), height: $('hud-height'), score: $('hud-score'),
        btnSound: $('btn-sound'), btnRanking: $('btn-ranking'), btnHome: $('btn-home'),
        btnLeft: $('btn-rot-left'), btnRight: $('btn-rot-right'),
        title: $('screen-title'), result: $('screen-result'), ranking: $('screen-ranking'),
        rules: $('screen-rules'), settings: $('screen-settings'),
        btnRulesOpen: $('btn-rules-open'), btnRulesClose: $('btn-rules-close'), btnRulesOk: $('btn-rules-ok'),
        btnSettingsOpen: $('btn-settings-open'), btnSettingsClose: $('btn-settings-close'),
        sliderSE: $('slider-se'), sliderBGM: $('slider-bgm'),
        valSE: $('val-se'), valBGM: $('val-bgm'),
        baseSizeGroup: $('base-size-group'),
        feedbackText: $('feedback-text'), btnSendFeedback: $('btn-send-feedback'),
        btnTitleRanking: $('btn-title-ranking'), btnResultHome: $('btn-result-home'),
        titleBest: $('title-best'),
        resTitle: $('result-title'), resSub: $('result-sub'),
        resCount: $('res-count'), resHeight: $('res-height'), resScore: $('res-score'),
        resBest: $('res-best'), resName: $('res-name'),
        rankingList: $('ranking-list'), toast: $('toast'),
    };

    /* ---------- 状態 ---------- */
    let k = 1;                    // 論理→バックバッファ倍率
    let engine;
    let baseBody;
    let animals = [];             // ワールド内の動物ボディ
    let state = 'title';          // title | aim | falling | over | clear
    let current = null;           // スタンバイ／落下中のボディ
    let nextDef = null;
    let aim = { x: W / 2, angle: 0 };
    let count = 0;
    let heightCm = 0;
    let score = 0;
    let stage = 0;                // 背景ステージ (連続値)
    let fallTime = 0;
    let stillTime = 0;
    let acc = 0;
    let lastT = 0;
    let time = 0;
    let dragging = null;          // pointerId
    let rotHold = null;           // { dir, start }
    let keys = {};
    let fallen = null;
    let overAt = 0;
    let effects = [];
    let wobbleCool = 0;
    let wobbling = 0;
    let lastEntryId = null;
    let lastResult = null;
    let lastDefId = null;

    /* ==========================================================
       初期化
       ========================================================== */
    function init() {
        Animals.ensureSprites();
        Sound.setEnabled(Storage.getSound());
        Sound.setSEVolume(Storage.getSEVolume());
        Sound.setBGMVolume(Storage.getBGMVolume());
        refreshSoundBtn();

        BASE.w = Storage.getBaseSize();
        ui.titleBest.textContent = Storage.getBest().toLocaleString();
        drawTitleAnimals();

        // 設定画面の初期値を反映
        if (ui.sliderSE) {
            ui.sliderSE.value = Math.round(Sound.getSEVolume() * 100);
            if (ui.valSE) ui.valSE.textContent = `${ui.sliderSE.value}%`;
        }
        if (ui.sliderBGM) {
            ui.sliderBGM.value = Math.round(Sound.getBGMVolume() * 100);
            if (ui.valBGM) ui.valBGM.textContent = `${ui.sliderBGM.value}%`;
        }
        if (ui.baseSizeGroup) {
            ui.baseSizeGroup.querySelectorAll('.toggle-btn').forEach((btn) => {
                btn.classList.toggle('active', parseInt(btn.dataset.size, 10) === BASE.w);
            });
        }

        engine = Engine.create({ positionIterations: 10, velocityIterations: 8 });
        engine.gravity.y = 0.95;
        Events.on(engine, 'collisionStart', onCollision);

        resize();
        window.addEventListener('resize', resize);
        window.addEventListener('orientationchange', () => setTimeout(resize, 200));
        bindInput();
        resetWorld();
        requestAnimationFrame(loop);
    }

    function resize() {
        const stageEl = $('stage');
        const r = stageEl.getBoundingClientRect();
        const border = 8;
        const availW = Math.max(100, r.width - 16 - border);
        const availH = Math.max(150, r.height - 14 - border);
        const cssW = Math.floor(Math.min(availW, availH * (W / H)));
        const cssH = Math.floor(cssW * (H / W));
        canvas.style.width = cssW + 'px';
        canvas.style.height = cssH + 'px';
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
        k = canvas.width / W;
        BG.build(W, H, k, BASE);
    }

    function resetWorld() {
        Composite.clear(engine.world, false);
        baseBody = Bodies.rectangle(BASE.x, BASE.top + BASE.h / 2, BASE.w, BASE.h, {
            isStatic: true, friction: 1.0, frictionStatic: 1.5, restitution: 0.0, label: 'base',
        });
        Composite.add(engine.world, baseBody);
        animals = [];
        current = null;
        count = 0;
        heightCm = 0;
        score = 0;
        stage = 0;
        fallen = null;
        effects = [];
        acc = 0;
        aim = { x: W / 2, angle: 0 };
        nextDef = pickDef();
        updateHud(false);
    }

    function startGame() {
        Sound.unlock();
        Sound.click();
        resetWorld();
        document.body.classList.remove('in-title');
        hide(ui.title);
        hide(ui.result);
        hide(ui.ranking);
        hide(ui.rules);
        hide(ui.settings);
        state = 'aim';
        spawn();
    }

    function goToTitle() {
        Sound.click();
        state = 'title';
        document.body.classList.add('in-title');
        resetWorld();
        hide(ui.result);
        hide(ui.ranking);
        hide(ui.rules);
        hide(ui.settings);
        show(ui.title);
        ui.titleBest.textContent = Storage.getBest().toLocaleString();
        setLocked(true);
    }

    /* ==========================================================
       動物の生成・落下・設置
       ========================================================== */
    function pickDef() {
        const list = Animals.list;
        let d;
        do {
            d = list[Math.floor(Math.random() * list.length)];
        } while (d.id === lastDefId && list.length > 1);
        lastDefId = d.id;
        return d;
    }

    function spawn() {
        const def = nextDef || pickDef();
        nextDef = pickDef();
        current = Animals.createBody(def);
        aim.angle = 0;
        aim.x = clampX(aim.x);
        state = 'aim';
        setLocked(false);
        Sound.spawn();
        addEffect({ type: 'pop', x: aim.x, y: SPAWN_Y, life: 300 });
    }

    function clampX(x) {
        return Math.max(BASE.x - BASE.w / 2, Math.min(BASE.x + BASE.w / 2, x));
    }

    /** スタンバイ中の見た目の位置 (ふわふわ浮遊込み) */
    function aimY() {
        return SPAWN_Y + Math.sin(time / 380) * 2.5;
    }

    /** デザイン原点 (sx,sy)・角度 a から重心位置を求める */
    function bodyPosFor(body, sx, sy, a) {
        const o = body.plugin.offset;
        const c = Math.cos(a), s = Math.sin(a);
        return { x: sx + o.x * c - o.y * s, y: sy + o.x * s + o.y * c };
    }

    function drop() {
        if (state !== 'aim' || !current) return;
        const pos = bodyPosFor(current, aim.x, aimY(), aim.angle);
        Body.setAngle(current, aim.angle);
        Body.setPosition(current, pos);
        Body.setVelocity(current, { x: 0, y: 0.5 });
        Body.setAngularVelocity(current, 0);
        current.plugin.touched = false;
        Composite.add(engine.world, current);
        animals.push(current);
        state = 'falling';
        fallTime = 0;
        stillTime = 0;
        rotHold = null;
        setLocked(true);
        Sound.drop();
    }

    function onCollision(ev) {
        if (!current || state !== 'falling') return;
        for (const pair of ev.pairs) {
            const a = pair.bodyA.parent, b = pair.bodyB.parent;
            if ((a === current || b === current) && !current.plugin.touched) {
                current.plugin.touched = true;
                const def = current.plugin.def;
                const weight = Math.sqrt(current.mass / 3.5);
                Sound.land(Math.max(0.7, Math.min(1.5, weight)), Math.min(3, current.speed));
                addEffect({ type: 'dust', x: current.position.x, y: current.bounds.max.y, life: 400 });
                void def;
            }
        }
    }

    function settle() {
        count += 1;
        heightCm = towerHeightCm();
        score = count * 100 + Math.round(heightCm * 10);
        updateHud(true);
        Sound.success(count);
        const b = current;
        addEffect({ type: 'stars', x: b.position.x, y: b.bounds.min.y, life: 700 });
        current = null;

        if (towerTopY() <= GOAL_Y) {
            clearGame();
            return;
        }
        spawn();
    }

    function towerTopY(exclude) {
        let top = BASE.top;
        for (const b of animals) {
            if (b === exclude) continue;
            top = Math.min(top, b.bounds.min.y);
        }
        return top;
    }

    /** 高さ(cm) = (台座天面Y − タワー最高点Y) / PX_PER_CM */
    function towerHeightCm(exclude) {
        return Math.max(0, (BASE.top - towerTopY(exclude)) / PX_PER_CM);
    }

    /* ==========================================================
       終了判定
       ========================================================== */
    function checkFall() {
        for (const b of animals) {
            if (b.position.y > FALL_LINE || b.position.x < -40 || b.position.x > W + 40) {
                gameOver(b);
                return true;
            }
        }
        return false;
    }

    function gameOver(body) {
        state = 'over';
        fallen = body;
        overAt = time;
        rotHold = null;
        dragging = null;
        setLocked(true);
        Sound.gameOver();
        if (navigator.vibrate) navigator.vibrate([60, 40, 120]);
        setTimeout(() => showResult(false), 1500);
    }

    function clearGame() {
        state = 'clear';
        overAt = time;
        score += CLEAR_BONUS;
        updateHud(true);
        setLocked(true);
        Sound.clear();
        for (let i = 0; i < 60; i++) {
            addEffect({
                type: 'confetti', life: 2200 + Math.random() * 800,
                x: Math.random() * W, y: -20 - Math.random() * 200,
                vx: (Math.random() - 0.5) * 0.06, vy: 0.08 + Math.random() * 0.08,
                rot: Math.random() * 6, color: ['#ff8fab', '#ffd84a', '#6ab7ff', '#6cc070', '#ff9f43', '#b28dff'][i % 6],
            });
        }
        addEffect({ type: 'banner', x: W / 2, y: 230, life: 99999, text: 'てっぺん とうたつ！' });
        setTimeout(() => showResult(true), 2200);
    }

    /* ==========================================================
       リザルト・ランキング
       ========================================================== */
    function showResult(clear) {
        const best = Storage.getBest();
        const isBest = score > best;
        if (isBest) Storage.setBest(score);
        const name = Storage.getName();
        const entry = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            name, score, count, height: Math.round(heightCm * 10) / 10, clear, date: Date.now(),
            baseSize: BASE.w,
        };
        const rank = score > 0 ? Storage.addRanking(entry) : 0;
        lastEntryId = entry.id;
        lastResult = entry;

        ui.resTitle.textContent = clear ? 'てっぺん とうたつ！' : 'こんかいのキロク！';
        ui.resTitle.classList.toggle('clear', clear);
        ui.resSub.textContent = clear
            ? `てっぺんボーナス +${CLEAR_BONUS}てん！`
            : 'また ちょうせん してね';
        ui.resCount.textContent = count;
        ui.resHeight.textContent = heightCm.toFixed(1);
        ui.resScore.textContent = score.toLocaleString();
        ui.resName.value = name;
        const lines = [];
        if (isBest && score > 0) lines.push('🎉 しんきろく！');
        else lines.push(`さいこう きろく: ${Math.max(best, score).toLocaleString()} てん`);
        if (rank > 0) lines.push(`ランキング ${rank}い`);
        ui.resBest.textContent = lines.join('　');
        ui.resBest.classList.toggle('new', isBest && score > 0);
        ui.titleBest.textContent = Storage.getBest().toLocaleString();
        show(ui.result);
    }

    function renderRanking() {
        const list = Storage.getRanking();
        ui.rankingList.innerHTML = '';
        if (!list.length) {
            const li = document.createElement('li');
            li.className = 'empty';
            li.textContent = 'まだ きろくが ないよ。あそんでみよう！';
            ui.rankingList.appendChild(li);
            return;
        }
        const medals = ['🥇', '🥈', '🥉'];
        list.forEach((e, i) => {
            const li = document.createElement('li');
            if (e.id === lastEntryId) li.classList.add('me');
            const d = new Date(e.date);
            const rank = document.createElement('span');
            rank.className = 'rank';
            rank.textContent = medals[i] || String(i + 1);
            const who = document.createElement('span');
            who.className = 'who';
            const nm = document.createElement('span');
            nm.className = 'nm';
            nm.textContent = (e.name || 'ななしさん') + (e.clear ? ' 👑' : '');
            const meta = document.createElement('span');
            meta.className = 'meta';
            const sizeLabel = e.baseSize === 190 ? 'ちいさめ' : e.baseSize === 270 ? 'おおきめ' : 'ふつう';
            meta.textContent = `🐾${e.count}ひき・📏${Number(e.height).toFixed(1)}cm・だい:${sizeLabel}・${d.getMonth() + 1}/${d.getDate()}`;
            who.append(nm, meta);
            const pts = document.createElement('span');
            pts.className = 'pts';
            pts.textContent = Number(e.score).toLocaleString();
            li.append(rank, who, pts);
            ui.rankingList.appendChild(li);
        });
    }

    /* ==========================================================
       入力
       ========================================================== */
    function toLogicalX(e) {
        const r = canvas.getBoundingClientRect();
        return ((e.clientX - r.left - canvas.clientLeft) / canvas.clientWidth) * W;
    }

    function bindInput() {
        // キャンバス: ドラッグで左右移動、指を離すと落下
        canvas.addEventListener('pointerdown', (e) => {
            if (state !== 'aim') return;
            e.preventDefault();
            Sound.unlock();
            dragging = e.pointerId;
            try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
            aim.x = clampX(toLogicalX(e));
        });
        canvas.addEventListener('pointermove', (e) => {
            if (dragging !== e.pointerId || state !== 'aim') return;
            aim.x = clampX(toLogicalX(e));
        });
        canvas.addEventListener('pointerup', (e) => {
            if (dragging !== e.pointerId) return;
            dragging = null;
            if (state === 'aim') drop();
        });
        canvas.addEventListener('pointercancel', () => { dragging = null; });
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // 回転ボタン: タップで15°、長押しで連続回転
        const bindRot = (btn, dir) => {
            let lastRotTime = 0;
            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                Sound.unlock();
                if (state !== 'aim') return;
                try { btn.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
                btn.classList.add('pressed');
                lastRotTime = performance.now();
                rotate(dir * ROT_STEP);
                rotHold = { dir, start: lastRotTime, id: e.pointerId };
            });
            const end = () => {
                btn.classList.remove('pressed');
                if (rotHold && rotHold.dir === dir) rotHold = null;
            };
            btn.addEventListener('pointerup', end);
            btn.addEventListener('pointercancel', end);
            btn.addEventListener('lostpointercapture', end);
            btn.addEventListener('contextmenu', (e) => e.preventDefault());
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                if (performance.now() - lastRotTime > 250) {
                    Sound.unlock();
                    rotate(dir * ROT_STEP);
                }
            });
        };
        bindRot(ui.btnLeft, -1);
        bindRot(ui.btnRight, 1);

        // UI ボタン
        $('btn-start').addEventListener('click', startGame);
        $('btn-retry').addEventListener('click', startGame);
        ui.btnHome.addEventListener('click', goToTitle);
        ui.btnResultHome.addEventListener('click', goToTitle);

        // あそびかた（ルール）モーダル
        ui.btnRulesOpen.addEventListener('click', () => {
            Sound.click();
            show(ui.rules);
        });
        ui.btnRulesClose.addEventListener('click', () => {
            Sound.click();
            hide(ui.rules);
        });
        ui.btnRulesOk.addEventListener('click', () => {
            Sound.click();
            hide(ui.rules);
        });
        ui.rules.addEventListener('click', (e) => {
            if (e.target === ui.rules) hide(ui.rules);
        });

        // 設定モーダル
        ui.btnSettingsOpen.addEventListener('click', () => {
            Sound.click();
            show(ui.settings);
        });
        ui.btnSettingsClose.addEventListener('click', () => {
            Sound.click();
            hide(ui.settings);
        });
        ui.settings.addEventListener('click', (e) => {
            if (e.target === ui.settings) hide(ui.settings);
        });

        // 音量スライダー
        ui.sliderSE.addEventListener('input', (e) => {
            const v = Number(e.target.value) / 100;
            ui.valSE.textContent = `${e.target.value}%`;
            Sound.setSEVolume(v);
            Storage.setSEVolume(v);
        });
        ui.sliderSE.addEventListener('change', () => {
            Sound.click();
        });

        ui.sliderBGM.addEventListener('input', (e) => {
            const v = Number(e.target.value) / 100;
            ui.valBGM.textContent = `${e.target.value}%`;
            Sound.setBGMVolume(v);
            Storage.setBGMVolume(v);
        });

        // 台座の大きさ変更
        ui.baseSizeGroup.addEventListener('click', (e) => {
            const btn = e.target.closest('.toggle-btn');
            if (!btn) return;
            const newSize = parseInt(btn.dataset.size, 10);
            if (!newSize || newSize === BASE.w) return;
            Sound.click();
            BASE.w = newSize;
            Storage.setBaseSize(newSize);
            ui.baseSizeGroup.querySelectorAll('.toggle-btn').forEach((b) => {
                b.classList.toggle('active', b === btn);
            });
            BG.build(W, H, k, BASE);
            resetWorld();
            toast(`だいざを「${btn.textContent}」に したよ`);
        });

        // ごいけん・ごようぼうフォーム送信 (FormSubmit API によるアプリ内非同期送信)
        let isSendingFeedback = false;
        ui.btnSendFeedback.addEventListener('click', async () => {
            if (isSendingFeedback) return;
            Sound.click();
            const text = ui.feedbackText.value.trim();
            if (!text) {
                toast('ごいけんを にゅうりょく してね');
                ui.feedbackText.focus();
                return;
            }

            isSendingFeedback = true;
            ui.btnSendFeedback.disabled = true;
            const originalHTML = ui.btnSendFeedback.innerHTML;
            ui.btnSendFeedback.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> おくっているよ…';
            toast('おくっているよ… ✉️');

            try {
                const endpoint = 'https://formsubmit.co/ajax/find_info@plyo.blog';
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify({
                        _subject: '【ぐらぐら どうぶつタワー】ごいけん・ごようぼう',
                        _captcha: 'false',
                        _template: 'table',
                        message: text,
                        date: new Date().toLocaleString('ja-JP')
                    })
                });

                if (res.ok) {
                    ui.feedbackText.value = '';
                    toast('おくったよ！ ありがとう！ ✨');
                } else {
                    toast('おくれませんでした。またあとで ためしてね');
                }
            } catch (err) {
                toast('おくれませんでした。またあとで ためしてね');
            } finally {
                isSendingFeedback = false;
                ui.btnSendFeedback.disabled = false;
                ui.btnSendFeedback.innerHTML = originalHTML;
            }
        });

        ui.btnSound.addEventListener('click', () => {
            const on = !Sound.isEnabled();
            Sound.setEnabled(on);
            Storage.setSound(on);
            refreshSoundBtn();
            if (on) Sound.click();
        });

        const openRanking = () => {
            Sound.click();
            renderRanking();
            show(ui.ranking);
        };
        ui.btnRanking.addEventListener('click', openRanking);
        ui.btnTitleRanking.addEventListener('click', openRanking);
        $('btn-result-ranking').addEventListener('click', openRanking);
        $('btn-ranking-close').addEventListener('click', () => { Sound.click(); hide(ui.ranking); });
        ui.ranking.addEventListener('click', (e) => { if (e.target === ui.ranking) hide(ui.ranking); });

        ui.resName.addEventListener('input', () => {
            const name = ui.resName.value.trim().slice(0, 8);
            Storage.setName(name);
            if (lastEntryId) Storage.renameRanking(lastEntryId, name);
            if (lastResult) lastResult.name = name;
        });
        $('btn-share').addEventListener('click', async () => {
            if (!lastResult) return;
            Sound.click();
            try {
                const res = await window.TowerShare.share(canvas, lastResult);
                if (res === 'downloaded') toast('がぞうを ほぞん しました 📷');
                else if (res === 'shared') toast('シェア しました！');
            } catch (err) {
                toast('がぞうを つくれませんでした');
            }
        });

        document.addEventListener('gesturestart', (e) => e.preventDefault());
        document.addEventListener('dblclick', (e) => e.preventDefault());
    }

    function rotate(da) {
        if (state !== 'aim') return;
        aim.angle += da;
        Sound.rotate();
    }

    /* ==========================================================
       メインループ
       ========================================================== */
    function loop(t) {
        const dt = Math.min(50, lastT ? t - lastT : 16);
        lastT = t;
        time += dt;

        handleHeld(dt);

        if (state === 'aim' || state === 'falling') {
            acc += dt;
            let steps = 0;
            while (acc >= STEP && steps < 8) {
                // 転がり過ぎを防ぐため角速度を微小減衰して安定化
                for (const b of animals) {
                    if (Math.abs(b.angularVelocity) > 0.001) {
                        Body.setAngularVelocity(b, b.angularVelocity * 0.985);
                    }
                }
                Engine.update(engine, STEP);
                acc -= STEP;
                steps++;
                if (checkFall()) break;
            }
            if (state === 'falling') updateFalling(dt);
            if (state === 'aim' || state === 'falling') detectWobble(dt);
        }

        // 背景ステージ (積んだ数で 草原 → 木の上 → 雲の上)
        const target = Math.max(0, Math.min(2, (count - 2) / 4));
        stage += (target - stage) * Math.min(1, dt / 900);

        updateEffects(dt);
        render();
        requestAnimationFrame(loop);
    }

    function handleHeld(dt) {
        if (state !== 'aim') return;
        if (rotHold && performance.now() - rotHold.start > HOLD_DELAY) {
            aim.angle += rotHold.dir * ROT_SPEED * (dt / 1000);
            if (Math.random() < 0.12) Sound.rotate();
        }
        const move = 0.22 * dt;
        if (keys.ArrowLeft || keys.KeyA) aim.x = clampX(aim.x - move);
        if (keys.ArrowRight || keys.KeyD) aim.x = clampX(aim.x + move);
    }

    function updateFalling(dt) {
        const b = current;
        if (!b) return;
        fallTime += dt;
        // 全体がほぼ静止しているか (軽快なテンポで判定)
        let still = true;
        for (const o of animals) {
            if (o.speed > 0.22 || Math.abs(o.angularVelocity) > 0.008) { still = false; break; }
        }
        if (b.plugin.touched && fallTime > 250 && still) stillTime += dt;
        else stillTime = 0;

        if (stillTime > 250) { settle(); return; }
        // 小刻みに揺れ続ける場合のフォールバック
        if (b.plugin.touched && fallTime > 2500 && b.speed < 0.6) settle();
    }

    function detectWobble(dt) {
        wobbleCool -= dt;
        let maxV = 0;
        for (const o of animals) {
            if (o === current && state === 'falling') continue;
            maxV = Math.max(maxV, o.speed + Math.abs(o.angularVelocity) * 20);
        }
        if (maxV > 0.45 && animals.length > 1) {
            wobbling = Math.min(1, wobbling + dt / 200);
            if (wobbleCool <= 0) {
                Sound.wobble();
                wobbleCool = 1200;
            }
        } else {
            wobbling = Math.max(0, wobbling - dt / 400);
        }
    }

    /* ==========================================================
       エフェクト
       ========================================================== */
    function addEffect(e) {
        e.age = 0;
        if (e.type === 'stars') {
            e.parts = Array.from({ length: 9 }, (_, i) => {
                const a = (i / 9) * Math.PI * 2 + Math.random() * 0.4;
                return { a, s: 0.05 + Math.random() * 0.05 };
            });
        }
        effects.push(e);
    }

    function updateEffects(dt) {
        for (const e of effects) {
            e.age += dt;
            if (e.type === 'confetti') {
                e.x += e.vx * dt + Math.sin((time + e.rot * 300) / 300) * 0.3;
                e.y += e.vy * dt;
                e.rot += dt * 0.006;
            }
        }
        effects = effects.filter((e) => e.age < e.life);
    }

    function drawStar(x, y, r, color) {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
            const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
            const rr = i % 2 ? r * 0.45 : r;
            ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#5a3d2b';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    function outlined(text, x, y, size, fill, stroke = '#5a3d2b') {
        ctx.font = `900 ${size}px "Zen Maru Gothic", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';
        ctx.lineWidth = size / 4;
        ctx.strokeStyle = stroke;
        ctx.strokeText(text, x, y);
        ctx.fillStyle = fill;
        ctx.fillText(text, x, y);
    }

    function drawEffects() {
        for (const e of effects) {
            const p = e.age / e.life;
            if (e.type === 'stars') {
                e.parts.forEach((s) => {
                    const d = s.s * e.age;
                    ctx.globalAlpha = 1 - p;
                    drawStar(e.x + Math.cos(s.a) * d, e.y + Math.sin(s.a) * d, 5 * (1 - p * 0.5), '#ffd84a');
                });
                ctx.globalAlpha = 1;
            } else if (e.type === 'dust') {
                ctx.globalAlpha = 0.6 * (1 - p);
                ctx.fillStyle = '#fffaf0';
                for (let i = -1; i <= 1; i += 2) {
                    ctx.beginPath();
                    ctx.arc(e.x + i * (10 + p * 22), e.y - p * 6, 4 + p * 5, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.globalAlpha = 1;
            } else if (e.type === 'pop') {
                ctx.globalAlpha = 1 - p;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(e.x, e.y, 20 + p * 30, 0, Math.PI * 2);
                ctx.stroke();
                ctx.globalAlpha = 1;
            } else if (e.type === 'confetti') {
                ctx.save();
                ctx.translate(e.x, e.y);
                ctx.rotate(e.rot);
                ctx.scale(1, Math.cos(e.rot * 1.7));
                ctx.fillStyle = e.color;
                ctx.fillRect(-4, -3, 8, 6);
                ctx.restore();
            } else if (e.type === 'banner') {
                const s = Math.min(1, e.age / 300);
                const bounce = 1 + Math.sin(Math.min(1, e.age / 500) * Math.PI) * 0.15;
                ctx.save();
                ctx.translate(e.x, e.y);
                ctx.scale(s * bounce, s * bounce);
                ctx.rotate(Math.sin(time / 300) * 0.04);
                outlined(e.text, 0, 0, 34, '#ffd84a');
                ctx.restore();
            }
        }
    }

    /* ==========================================================
       描画
       ========================================================== */
    function render() {
        ctx.setTransform(k, 0, 0, k, 0, 0);
        ctx.clearRect(0, 0, W, H);

        let shakeX = 0;
        if (state === 'over' && time - overAt < 400) shakeX = Math.sin(time / 20) * 4 * (1 - (time - overAt) / 400);
        if (wobbling > 0 && state !== 'over') shakeX += Math.sin(time / 35) * wobbling * 0.8;
        ctx.translate(shakeX, 0);

        BG.draw(ctx, W, H, stage);
        drawGoalLine();
        if (state === 'aim') drawGuide();
        drawHeightMarker();

        // ワールド内の動物
        for (const b of animals) {
            const isFallen = b === fallen;
            if (isFallen && Math.floor((time - overAt) / 150) % 2 === 0) {
                ctx.save();
                ctx.globalAlpha = 0.55;
            }
            drawBody(b, b.position.x, b.position.y, b.angle);
            if (isFallen && Math.floor((time - overAt) / 150) % 2 === 0) ctx.restore();
        }

        // スタンバイ中の動物
        if (state === 'aim' && current) {
            const pos = bodyPosFor(current, aim.x, aimY(), aim.angle);
            drawBody(current, pos.x, pos.y, aim.angle);
        }

        drawNextPreview();
        drawEffects();

        if (state === 'over' && fallen) drawOops();
        if (wobbling > 0.3 && (state === 'aim' || state === 'falling')) {
            ctx.globalAlpha = Math.min(1, (wobbling - 0.3) * 2);
            outlined('ぐらぐら…！', W / 2 + Math.sin(time / 50) * 3, 175, 22, '#ff8fab', '#fff');
            ctx.globalAlpha = 1;
        }
        if (state === 'aim' && count === 0 && !dragging) drawHint();
    }

    function drawBody(body, x, y, angle) {
        const o = body.plugin.offset;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.translate(-o.x, -o.y);
        Animals.drawSprite(ctx, body.plugin.def);
        ctx.restore();
    }

    function drawGuide() {
        if (!current) return;
        const x = aim.x;
        const top = aimY() + 30;
        ctx.save();
        ctx.setLineDash([4, 7]);
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'rgba(255,255,255,.85)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, BASE.top);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(x, BASE.top - 1, 12, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawGoalLine() {
        ctx.save();
        ctx.setLineDash([8, 8]);
        ctx.strokeStyle = 'rgba(255,255,255,.75)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(14, GOAL_Y);
        ctx.lineTo(W - 14, GOAL_Y);
        ctx.stroke();
        ctx.setLineDash([]);
        // はた
        const fx = W - 26, fy = GOAL_Y;
        ctx.strokeStyle = '#5a3d2b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(fx, fy);
        ctx.lineTo(fx, fy - 26);
        ctx.stroke();
        ctx.fillStyle = '#ff6b6b';
        ctx.beginPath();
        ctx.moveTo(fx, fy - 26);
        ctx.lineTo(fx - 18 + Math.sin(time / 200) * 2, fy - 20);
        ctx.lineTo(fx, fy - 14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.font = '900 11px "Zen Maru Gothic", sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(255,255,255,.9)';
        ctx.strokeText('てっぺん', fx - 22, fy - 8);
        ctx.fillStyle = '#5a3d2b';
        ctx.fillText('てっぺん', fx - 22, fy - 8);
        ctx.restore();
    }

    function drawHeightMarker() {
        if (!animals.length) return;
        const exclude = state === 'falling' ? current : null;
        const top = towerTopY(exclude);
        if (top >= BASE.top - 1) return;
        const cm = (BASE.top - top) / PX_PER_CM;
        ctx.save();
        ctx.strokeStyle = 'rgba(90,61,43,.45)';
        ctx.setLineDash([3, 5]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(12, top);
        ctx.lineTo(W - 12, top);
        ctx.stroke();
        ctx.setLineDash([]);
        // ものさし
        ctx.fillStyle = 'rgba(255,250,240,.9)';
        ctx.strokeStyle = '#5a3d2b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(8, top - 10, 56, 20, 8) : ctx.rect(8, top - 10, 56, 20);
        ctx.fill();
        ctx.stroke();
        ctx.font = '900 12px "Zen Maru Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#5a3d2b';
        ctx.fillText(`${cm.toFixed(1)}cm`, 36, top + 1);
        ctx.restore();
    }

    function drawNextPreview() {
        if (!nextDef || state === 'title') return;
        const x = 8, y = 8, w = 62, h = 62;
        ctx.save();
        ctx.fillStyle = 'rgba(255,250,240,.85)';
        ctx.strokeStyle = '#5a3d2b';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, y, w, h, 14) : ctx.rect(x, y, w, h);
        ctx.fill();
        ctx.stroke();
        ctx.font = '900 11px "Zen Maru Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#8a6a52';
        ctx.fillText('つぎ', x + w / 2, y + 4);
        const d = nextDef;
        const s = Math.min(40 / d.width, 40 / d.height, 0.8);
        const cx = (d.bounds.minX + d.bounds.maxX) / 2;
        const cy = (d.bounds.minY + d.bounds.maxY) / 2;
        ctx.translate(x + w / 2, y + 38);
        ctx.scale(s, s);
        ctx.translate(-cx, -cy);
        Animals.drawSprite(ctx, d);
        ctx.restore();
    }

    function drawOops() {
        const x = Math.max(50, Math.min(W - 50, fallen.position.x));
        const y = Math.max(60, Math.min(BASE.top - 30, fallen.bounds.min.y - 30));
        const t = Math.min(1, (time - overAt) / 250);
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(t, t);
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#5a3d2b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 36, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-6, 20);
        ctx.lineTo(4, 34);
        ctx.lineTo(8, 19);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.fillRect(-7, 16, 16, 5);
        ctx.font = '900 22px "Zen Maru Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText('あっ！', 0, 1);
        ctx.restore();
    }

    function drawHint() {
        const a = 0.6 + Math.sin(time / 300) * 0.3;
        ctx.save();
        ctx.globalAlpha = a;
        outlined('← ゆびで うごかして はなす →', W / 2, 150, 15, '#5a3d2b', '#fff');
        ctx.restore();
    }

    /* ==========================================================
       UI ヘルパー
       ========================================================== */
    function updateHud(bump) {
        ui.count.textContent = count;
        ui.height.textContent = heightCm.toFixed(1);
        ui.score.textContent = score.toLocaleString();
        if (bump) {
            [ui.count, ui.height, ui.score].forEach((el) => {
                const p = el.parentElement;
                p.classList.remove('bump');
                void p.offsetWidth;
                p.classList.add('bump');
            });
        }
    }

    function setLocked(locked) {
        [ui.btnLeft, ui.btnRight].forEach((b) => b && b.classList.toggle('locked', locked));
    }

    function refreshSoundBtn() {
        const on = Sound.isEnabled();
        ui.btnSound.classList.toggle('off', !on);
        ui.btnSound.innerHTML = on
            ? '<i class="fa-solid fa-volume-high"></i><span>ON</span>'
            : '<i class="fa-solid fa-volume-xmark"></i><span>OFF</span>';
    }

    function show(el) { el.classList.add('show'); }
    function hide(el) { el.classList.remove('show'); }

    let toastTimer = 0;
    function toast(msg) {
        ui.toast.textContent = msg;
        ui.toast.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => ui.toast.classList.remove('show'), 2200);
    }

    function drawTitleAnimals() {
        const c = $('title-animals');
        if (!c) return;
        const g = c.getContext('2d');
        g.clearRect(0, 0, c.width, c.height);

        // 台座の描画 (幅380px, 高さ14px)
        const bx = 300, by = 240, bw = 380, bh = 14;
        g.fillStyle = '#b07443';
        g.fillRect(bx - 60, by + 8, 120, 20); // 柱
        g.fillStyle = '#d9995a';
        g.strokeStyle = '#5a3d2b';
        g.lineWidth = 3;
        g.beginPath();
        if (g.roundRect) g.roundRect(bx - bw / 2, by, bw, bh, 6);
        else g.rect(bx - bw / 2, by, bw, bh);
        g.fill();
        g.stroke();

        // 草・お花
        g.fillStyle = '#7ccb6a';
        for (let i = 0; i < 7; i++) {
            g.beginPath();
            g.arc(140 + i * 52, by + 14, 7, 0, Math.PI * 2);
            g.fill();
        }

        const map = {};
        Animals.list.forEach((d) => { map[d.id] = d; });

        // 動物たちの配置定義 [id, x, y(足元), angle, scale]
        const scene = [
            // 1段目（土台）
            ['platypus', 170, 240, -0.04, 1.25],
            ['elephant', 300, 240, 0, 1.2],
            ['turtle', 435, 240, 0.04, 1.25],
            // 左右のサポーター
            ['giraffe', 105, 242, 0.06, 1.15],
            ['camel', 498, 242, -0.06, 1.15],
            // 2段目
            ['panda', 245, 185, -0.07, 1.2],
            ['lion', 360, 185, 0.06, 1.18],
            // 3段目（てっぺん）
            ['kangaroo', 185, 138, -0.09, 1.1],
            ['penguin', 300, 130, 0.02, 1.25],
            ['shoebill', 420, 135, 0.08, 1.1],
        ];

        scene.forEach(([id, x, y, a, s]) => {
            const d = map[id];
            if (!d) return;
            const cx = (d.bounds.minX + d.bounds.maxX) / 2;
            const cy = d.bounds.maxY;
            g.save();
            g.translate(x, y);
            g.rotate(a);
            g.scale(s, s);
            g.translate(-cx, -cy);
            Animals.drawSprite(g, d);
            g.restore();
        });

        // キラキラ飾り
        g.font = '16px "Zen Maru Gothic", sans-serif';
        g.textAlign = 'center';
        g.fillStyle = '#ff9f43';
        g.fillText('✨', 80, 50);
        g.fillText('⭐', 525, 60);
        g.fillText('✨', 300, 32);
    }

    /* ---------- 起動 ---------- */
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
    // フォント読み込み後にもう一度タイトルを描画
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => drawTitleAnimals());
})();
