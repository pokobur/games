// race.js - ドキドキ！アニマルレース (接戦・追い抜き演出 & フィニッシュ調整付き)

export class RaceGame {
    constructor(container, players, onFinish, playSound) {
        this.container = container;
        this.players = players;
        this.onFinish = onFinish;
        this.playSound = playSound;
        
        this.racers = [];
        this.finishedCount = 0;
        this.rankings = [];
        this.isRacing = false;
        this.animationFrameId = null;
        this.frameCounter = 0;
        
        // どうぶつと乗り物の選択肢
        this.animals = ['🐶', '🐱', '🐰', '🦊', '🦁', '🐼', '🐹', '🐨', '🐸', '🐧', '🐷', '🐮', '🐯', '🐵'];
        this.vehicles = ['🚗', '🚓', '🚑', '🚒', '🚕', '🛸', '🚀', '🛹', '🏍️', '🚲'];
        
        // プレイヤーごとのアサイン状態
        this.playerSelections = [];
        
        this.init();
    }

    init() {
        // 初期状態として、プレイヤーそれぞれにランダムでキャラクターと乗り物を割り当てる
        this.players.forEach((player, idx) => {
            const animal = this.animals[Math.floor(Math.random() * this.animals.length)];
            const vehicle = this.vehicles[Math.floor(Math.random() * this.vehicles.length)];
            this.playerSelections.push({
                name: player,
                animal: animal,
                vehicle: vehicle
            });
        });
        
        this.showSetupScreen();
    }

    showSetupScreen() {
        this.container.innerHTML = `
            <div class="race-setup-layout">
                <div class="race-setup-title">
                    🐾 どうぶつ と のりもの を えらぼう！
                </div>
                <div class="race-setup-list" id="race-setup-list">
                    <!-- プレイヤーごとのカスタマイズ行 -->
                </div>
                <div class="race-control-panel">
                    <button id="btn-race-setup-ready" class="btn-next btn-lg">🚦 レースにすすむ！</button>
                </div>
            </div>
        `;
        
        const listContainer = document.getElementById('race-setup-list');
        
        this.playerSelections.forEach((sel, idx) => {
            const row = document.createElement('div');
            row.className = 'player-setup-row';
            row.innerHTML = `
                <span class="setup-player-name">${this.escapeHtml(sel.name)}</span>
                <div class="setup-controls">
                    <button class="btn-setup-choice btn-animal-choice" data-index="${idx}" title="どうぶつをかえる">
                        ${sel.animal}
                    </button>
                    <button class="btn-setup-choice btn-vehicle-choice" data-index="${idx}" title="のりものをかえる">
                        ${sel.vehicle}
                    </button>
                    <div class="setup-preview" id="setup-preview-${idx}">
                        <div class="setup-preview-inner">
                            <span style="font-size: 2.2rem; position: absolute; bottom: 0; left: 0;">${sel.vehicle}</span>
                            <span style="font-size: 1.4rem; position: absolute; top: -5px; left: 10px;">${sel.animal}</span>
                        </div>
                    </div>
                </div>
            `;
            listContainer.appendChild(row);
        });
        
        // カスタマイズボタンのイベントリスナー
        listContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-setup-choice');
            if (!btn) return;
            
            const idx = parseInt(btn.getAttribute('data-index'), 10);
            
            if (btn.classList.contains('btn-animal-choice')) {
                this.openAnimalPicker(idx, btn);
            } else if (btn.classList.contains('btn-vehicle-choice')) {
                this.openVehiclePicker(idx, btn);
            }
        });
        
        document.getElementById('btn-race-setup-ready').addEventListener('click', () => {
            this.playSound('click');
            this.showTrackScreen();
        });
    }

    openAnimalPicker(playerIdx, btnEl) {
        const current = this.playerSelections[playerIdx].animal;
        this.openEmojiPicker('🐾 どうぶつをえらぼう', this.animals, current, (selected) => {
            this.playerSelections[playerIdx].animal = selected;
            btnEl.textContent = selected;
            this.updatePreview(playerIdx);
        });
    }

    openVehiclePicker(playerIdx, btnEl) {
        const current = this.playerSelections[playerIdx].vehicle;
        this.openEmojiPicker('🏎️ のりものをえらぼう', this.vehicles, current, (selected) => {
            this.playerSelections[playerIdx].vehicle = selected;
            btnEl.textContent = selected;
            this.updatePreview(playerIdx);
        });
    }

    openEmojiPicker(title, options, selectedValue, onSelect) {
        this.playSound('click');
        const overlay = document.createElement('div');
        overlay.className = 'picker-overlay';
        overlay.innerHTML = `
            <div class="picker-content">
                <div class="picker-title">${title}</div>
                <div class="picker-grid">
                    ${options.map(opt => `
                        <button class="picker-item ${opt === selectedValue ? 'active' : ''}">${opt}</button>
                    `).join('')}
                </div>
                <button class="btn-secondary btn-sm picker-close-btn" style="width:100%;">とじる</button>
            </div>
        `;
        
        this.container.appendChild(overlay);
        
        overlay.addEventListener('click', (e) => {
            const item = e.target.closest('.picker-item');
            if (item) {
                const val = item.textContent.trim();
                this.playSound('click');
                onSelect(val);
                overlay.remove();
                return;
            }
            
            if (e.target.closest('.picker-close-btn') || e.target === overlay) {
                this.playSound('click');
                overlay.remove();
            }
        });
    }

    updatePreview(playerIdx) {
        const sel = this.playerSelections[playerIdx];
        const previewEl = document.getElementById(`setup-preview-${playerIdx}`);
        if (previewEl) {
            previewEl.innerHTML = `
                <div class="setup-preview-inner">
                    <span style="font-size: 2.2rem; position: absolute; bottom: 0; left: 0;">${sel.vehicle}</span>
                    <span style="font-size: 1.4rem; position: absolute; top: -5px; left: 10px;">${sel.animal}</span>
                </div>
            `;
        }
    }

    showTrackScreen() {
        this.container.innerHTML = `
            <div class="race-layout">
                <div class="race-track-area" id="race-track-area">
                    <div class="race-finish-line"></div>
                    <!-- レーンがここに追加されます -->
                </div>
                <div class="race-control-panel">
                    <button id="btn-race-start" class="btn-next btn-lg">🚦 スタート！</button>
                </div>
            </div>
        `;
        
        const trackArea = document.getElementById('race-track-area');
        this.racers = [];
        
        // 選択されたキャラと乗り物でレーンを構築
        this.playerSelections.forEach((sel, idx) => {
            const lane = document.createElement('div');
            lane.className = 'race-lane';
            
            lane.innerHTML = `
                <span class="race-lane-name">${this.escapeHtml(sel.name)}</span>
                <div class="race-racer" id="racer-${idx}">
                    <div style="position: relative; width: 44px; height: 44px;">
                        <span style="font-size: 2.2rem; position: absolute; bottom: 0; left: 0;">${sel.vehicle}</span>
                        <span style="font-size: 1.4rem; position: absolute; top: -5px; left: 10px;">${sel.animal}</span>
                        <!-- 頑張りやアクシデントのエフェクト吹き出し -->
                        <div id="racer-bubble-${idx}" style="position: absolute; top: -26px; right: -12px; font-size: 1.3rem; opacity: 0; transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.25); pointer-events: none; z-index: 10; font-family: sans-serif;">🔥</div>
                    </div>
                </div>
            `;
            trackArea.appendChild(lane);
            
            this.racers.push({
                index: idx,
                name: sel.name,
                x: 80, // 初期位置 (px)
                speed: 0,
                finished: false,
                element: document.getElementById(`racer-${idx}`),
                laneElement: lane,
                prevRank: idx,
                sprintModifier: undefined,
                effectTimeout: null
            });
        });
        
        document.getElementById('btn-race-start').addEventListener('click', (e) => {
            this.startRace(e.target);
        });
    }

    startRace(btnStart) {
        if (this.isRacing) return;
        this.isRacing = true;
        btnStart.style.display = 'none';
        
        this.playSound('drumroll');
        
        let count = 3;
        const countdownOverlay = document.createElement('div');
        countdownOverlay.style.position = 'absolute';
        countdownOverlay.style.top = '0';
        countdownOverlay.style.left = '0';
        countdownOverlay.style.width = '100%';
        countdownOverlay.style.height = '100%';
        countdownOverlay.style.display = 'flex';
        countdownOverlay.style.alignItems = 'center';
        countdownOverlay.style.justifyContent = 'center';
        countdownOverlay.style.fontSize = '6rem';
        countdownOverlay.style.fontWeight = '900';
        countdownOverlay.style.color = '#ffea00';
        countdownOverlay.style.textShadow = '0 8px 16px rgba(0,0,0,0.3)';
        countdownOverlay.style.zIndex = '100';
        countdownOverlay.style.pointerEvents = 'none';
        countdownOverlay.style.fontFamily = 'var(--font-family)';
        
        this.container.querySelector('.race-layout').appendChild(countdownOverlay);
        
        const nextCount = () => {
            if (count > 0) {
                countdownOverlay.textContent = count;
                this.playSound('click');
                countdownOverlay.animate([
                    { transform: 'scale(0.3)', opacity: 0 },
                    { transform: 'scale(1.2)', opacity: 1, offset: 0.8 },
                    { transform: 'scale(1)', opacity: 1 }
                ], { duration: 800, fill: 'forwards' });
                
                count--;
                setTimeout(nextCount, 900);
            } else {
                countdownOverlay.textContent = 'ゴー！🏁';
                this.playSound('explosion');
                countdownOverlay.animate([
                    { transform: 'scale(1)', opacity: 1 },
                    { transform: 'scale(1.8)', opacity: 0 }
                ], { duration: 600, fill: 'forwards' });
                
                setTimeout(() => {
                    countdownOverlay.remove();
                    this.tick();
                }, 400);
            }
        };
        
        nextCount();
    }

    showEffect(idx, emoji, type) {
        const bubble = document.getElementById(`racer-bubble-${idx}`);
        if (!bubble) return;
        
        bubble.textContent = emoji;
        bubble.style.opacity = '1';
        bubble.style.transform = 'scale(1.3) translateY(-6px)';
        
        const racerElement = document.getElementById(`racer-${idx}`);
        
        if (type === 'accident' && racerElement) {
            racerElement.classList.remove('racer-spin');
            void racerElement.offsetWidth; // リフロー
            racerElement.classList.add('racer-spin');
        }
        
        if (this.racers[idx].effectTimeout) {
            clearTimeout(this.racers[idx].effectTimeout);
        }
        
        this.racers[idx].effectTimeout = setTimeout(() => {
            if (bubble) {
                bubble.style.opacity = '0';
                bubble.style.transform = 'scale(1) translateY(0)';
            }
        }, 850);
    }

    tick() {
        if (!this.isRacing) return;
        
        const trackArea = document.getElementById('race-track-area');
        if (!trackArea) return; // 安全対策
        
        const trackWidth = trackArea.getBoundingClientRect().width;
        // ゴールラインのX座標（finish-lineの右端位置に合わせる）
        const finishX = trackWidth - 110; 
        
        this.frameCounter++;
        
        // アクティブなレーサーの最大X座標（現在トップの位置）
        const activeRacers = this.racers.filter(r => !r.finished);
        let leadX = 80;
        if (activeRacers.length > 0) {
            leadX = Math.max(...activeRacers.map(r => r.x));
        }
        
        // 15フレームに一度、リアルタイム順位変動をチェックして「追い抜き」を検出
        if (this.frameCounter % 15 === 0 && activeRacers.length > 1) {
            const sortedByPos = [...this.racers].sort((a, b) => b.x - a.x);
            sortedByPos.forEach((r, currentRank) => {
                if (r.prevRank !== undefined && currentRank < r.prevRank && !r.finished && r.x > 120) {
                    // 順位が上がった ＝ 追い抜いた！（ロケット🚀からわかりやすい炎🔥に変更）
                    this.showEffect(r.index, '🔥', 'overtake');
                }
                r.prevRank = currentRank;
            });
        }
        
        let allFinished = true;
        
        this.racers.forEach(r => {
            if (r.finished) return;
            
            allFinished = false;
            
            // 最後の一人が残った場合、高速でゴールさせてゲームを早く終わらせる
            const isLastRacer = (activeRacers.length === 1 && this.racers.length > 1);
            
            // 毎フレームの速度変動
            let accel = (Math.random() - 0.5) * 0.95; 
            
            // ゴール手前100pxまではゴムバンド効果（接戦・追い上げ）を適用
            const isNearFinish = r.x > finishX - 90;
            
            if (isLastRacer) {
                // 最後の一人は強制スパート（超高速移動）
                accel = 0.8;
                if (r.sprintModifier === undefined) r.sprintModifier = 2.5;
                if (this.frameCounter % 10 === 0) {
                    this.showEffect(r.index, '💦', 'sprint'); // 焦っているエフェクト
                }
            } else if (!isNearFinish) {
                const distFromLead = leadX - r.x;
                if (distFromLead > 35) {
                    accel += 0.12 * Math.random(); // 追い上げ
                } else if (distFromLead < 15) {
                    accel -= 0.08 * Math.random(); // トップは少しブレーキ
                }
                
                // 道中のランダムな頑張り・アクシデント吹き出し表示
                if (r.speed < 0.4 && Math.random() < 0.006) {
                    this.showEffect(r.index, '💦', 'accident'); // 焦る・アクシデント
                } else if (r.speed > 1.5 && Math.random() < 0.006) {
                    this.showEffect(r.index, '🔥', 'sprint'); // 頑張る
                }
            } else {
                // 【順位を分かりやすくゴールさせるための微調整】
                // ゴール手前90pxの最終ストライキに入ったら、各自に固有のランダムな「ラストスパート力」を固定アサイン
                // これにより、全員が真横一線に同時にゴールするのを防ぎ、1人ずつ順を追って明確にゴールインさせます。
                if (r.sprintModifier === undefined) {
                    // スパート力に差をつける（-0.5〜+0.5の調整値）
                    r.sprintModifier = (Math.random() - 0.4) * 0.7; 
                    
                    // ラストスパートをかける時のエフェクト
                    if (r.sprintModifier > 0.1) {
                        this.showEffect(r.index, '✨', 'sprint'); // キラキラ頑張り
                    } else if (r.sprintModifier < -0.1) {
                        this.showEffect(r.index, '🌀', 'accident'); // ヘロヘロ疲れ
                    }
                }
            }
            
            r.speed += accel;
            
            // 最終スパートの補正を適用
            if (r.sprintModifier !== undefined) {
                r.speed += r.sprintModifier;
            }
            
            // 速度上限を抑えめにして視認性を確保 (最後の一人の場合は超高速化)
            const maxSpeedCap = isLastRacer ? 8.0 : 1.7;
            r.speed = Math.max(0.2, Math.min(r.speed, maxSpeedCap));
            
            // 位置の更新
            r.x += r.speed;
            
            // 描画更新
            r.element.style.left = `${r.x}px`;
            
            // ゴール判定
            if (r.x >= finishX) {
                r.finished = true;
                this.finishedCount++;
                this.rankings.push(r.name);
                r.element.classList.add('finished');
                this.playSound('ding');
                
                // レーンに順位バブルを表示
                const rankBubble = document.createElement('div');
                rankBubble.className = 'race-rank-bubble';
                rankBubble.innerHTML = `${this.finishedCount}<span style="font-size:0.5em;">位</span>`;
                
                if (this.finishedCount === 1) rankBubble.style.background = '#d97706';
                else if (this.finishedCount === 2) rankBubble.style.background = '#475569';
                else if (this.finishedCount === 3) rankBubble.style.background = '#b45309';
                else rankBubble.style.background = '#38bdf8';
                
                r.laneElement.appendChild(rankBubble);
            }
        });
        
        if (allFinished) {
            this.isRacing = false;
            setTimeout(() => {
                this.onFinish(this.rankings);
            }, 1800);
        } else {
            this.animationFrameId = requestAnimationFrame(() => this.tick());
        }
    }

    destroy() {
        this.isRacing = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        // タイマーのクリア
        this.racers.forEach(r => {
            if (r.effectTimeout) {
                clearTimeout(r.effectTimeout);
            }
        });
    }

    escapeHtml(str) {
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    }
}
