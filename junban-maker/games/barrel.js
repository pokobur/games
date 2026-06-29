// barrel.js - タルききいっぱつ！ (黒ひげ危機一髪風ゲーム)

export class BarrelGame {
    constructor(container, players, onFinish, playSound) {
        this.container = container;
        this.players = players;
        this.remainingPlayers = [...players];
        this.onFinish = onFinish;
        this.playSound = playSound;
        
        this.rankings = [];
        this.currentRank = 1;
        this.turnIndex = 0;
        
        // タルのスロット数（10個）
        this.numSlots = 10;
        
        // どうぶつキャラクターのリスト
        this.animals = ['🐰', '🐼', '🐱', '🦊', '🐶', '🐯', '🦁', '🐻', '🐹', '🐨', '🐸', '🐧'];
        this.activeAnimal = this.animals[0];
        
        // スロットの配置（タルの2D位置と回転角度）
        // タルコンテナは 200px × 260px で、タル本体は 200px × 200px (下部に配置)
        this.slotsConfig = [
            // 上段 (Y = 110px〜125px 付近)
            { left: '30px', top: '115px', rotate: '-55deg' },
            { left: '65px', top: '100px', rotate: '-25deg' },
            { left: '100px', top: '95px', rotate: '0deg' },
            { left: '135px', top: '100px', rotate: '25deg' },
            { left: '170px', top: '115px', rotate: '55deg' },
            
            // 下段 (Y = 140px〜155px 付近)
            { left: '35px', top: '155px', rotate: '-55deg' },
            { left: '70px', top: '142px', rotate: '-25deg' },
            { left: '100px', top: '137px', rotate: '0deg' },
            { left: '130px', top: '142px', rotate: '25deg' },
            { left: '165px', top: '155px', rotate: '55deg' }
        ];
        
        this.triggerSlotIndex = -1;
        this.insertedSlots = new Set();
        this.isAnimating = false;
        
        this.init();
    }

    init() {
        this.resetBarrel();
        
        this.container.innerHTML = `
            <div class="barrel-layout">
                <div class="barrel-turn-indicator" id="barrel-turn-indicator">
                    🛢️ <strong>${this.escapeHtml(this.getActivePlayerName())}</strong> さんの番！
                </div>
                <div class="barrel-play-area">
                    <div class="barrel-container">
                        <!-- 中に隠れているどうぶつ -->
                        <div class="barrel-character" id="barrel-character">${this.activeAnimal}</div>
                        
                        <!-- 木製の樽 (SVG) -->
                        <svg class="barrel-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                            <!-- 影 -->
                            <ellipse cx="50" cy="93" rx="35" ry="6" fill="rgba(0,0,0,0.18)"/>
                            <!-- 樽の胴体 (木目) -->
                            <path d="M25,10 C13,45 13,65 25,90 L75,90 C87,65 87,45 75,10 Z" fill="#8d5b2e" stroke="#4a3017" stroke-width="2.5"/>
                            <!-- 縦の板ライン -->
                            <path d="M37,10 C27,45 27,65 37,90" fill="none" stroke="#5c3c1a" stroke-width="1.5"/>
                            <path d="M50,10 C50,45 50,65 50,90" fill="none" stroke="#5c3c1a" stroke-width="1.5"/>
                            <path d="M63,10 C73,45 73,65 63,90" fill="none" stroke="#5c3c1a" stroke-width="1.5"/>
                            <!-- 金属のフープ -->
                            <path d="M19,30 C35,35 65,35 81,30" fill="none" stroke="#94a3b8" stroke-width="4.5" stroke-linecap="round"/>
                            <path d="M21,70 C35,75 65,75 79,70" fill="none" stroke="#94a3b8" stroke-width="4.5" stroke-linecap="round"/>
                            <!-- 樽の上の縁 -->
                            <ellipse cx="50" cy="10" rx="25" ry="5" fill="#4a3017"/>
                            <ellipse cx="50" cy="10" rx="21" ry="3.5" fill="#2b1a0c"/>
                        </svg>
                        
                        <!-- スロットの穴(JSで配置) -->
                        <div id="barrel-slots-container" style="position:absolute; top:0; left:0; width:100%; height:100%; z-index:10;">
                        </div>
                    </div>
                </div>
                <div class="barrel-status-list" id="barrel-status-list">
                    <!-- 残りメンバーのチップリスト -->
                </div>
            </div>
        `;
        
        this.renderSlots();
        this.renderStatusList();
    }

    getActivePlayerName() {
        return this.remainingPlayers[this.turnIndex];
    }

    resetBarrel() {
        this.insertedSlots.clear();
        // アタリ（飛び出る穴）をランダムに設定 (0〜9)
        this.triggerSlotIndex = Math.floor(Math.random() * this.numSlots);
        // どうぶつキャラをランダムに変更
        this.activeAnimal = this.animals[Math.floor(Math.random() * this.animals.length)];
        
        const characterEl = document.getElementById('barrel-character');
        if (characterEl) {
            characterEl.textContent = this.activeAnimal;
            characterEl.className = 'barrel-character';
            characterEl.style.display = 'block';
        }
        
        const slotsContainer = document.getElementById('barrel-slots-container');
        if (slotsContainer) {
            this.renderSlots();
        }
    }

    renderSlots() {
        const container = document.getElementById('barrel-slots-container');
        if (!container) return;
        container.innerHTML = '';
        
        this.slotsConfig.forEach((cfg, idx) => {
            const slot = document.createElement('div');
            slot.className = 'barrel-slot';
            slot.style.left = cfg.left;
            slot.style.top = cfg.top;
            slot.style.transform = `translate(-50%, -50%) rotate(${cfg.rotate})`;
            slot.setAttribute('data-index', idx);
            
            // カラフルなオモチャの剣をスロット内に配置（最初は非表示）
            // 剣の色はスロットごとにランダム（CSSフィルターによる色相変化）
            const hue = Math.floor(Math.random() * 360);
            slot.innerHTML = `
                <span class="sword-emoji" style="filter: hue-rotate(${hue}deg) drop-shadow(0 2px 4px rgba(0,0,0,0.15));">🗡️</span>
            `;
            
            container.appendChild(slot);
            
            slot.addEventListener('click', () => {
                this.insertSword(slot, idx);
            });
        });
    }

    renderStatusList() {
        const container = document.getElementById('barrel-status-list');
        if (!container) return;
        container.innerHTML = '';
        
        this.remainingPlayers.forEach((p, idx) => {
            const chip = document.createElement('div');
            chip.className = 'player-chip';
            if (idx === this.turnIndex) {
                chip.style.borderColor = 'var(--accent-primary)';
                chip.style.backgroundColor = '#fff5f5';
                chip.style.transform = 'scale(1.05)';
            } else {
                chip.style.opacity = '0.7';
            }
            chip.textContent = p;
            container.appendChild(chip);
        });
    }

    insertSword(slotEl, index) {
        if (this.isAnimating || slotEl.classList.contains('inserted')) return;
        
        // 剣が刺さった状態にする
        slotEl.classList.add('inserted');
        this.insertedSlots.add(index);
        
        // 刺さる音（ザシュッ）を再生
        this.playSound('sword');
        
        const activePlayer = this.getActivePlayerName();
        
        // トリガー穴を踏んだか判定
        if (index === this.triggerSlotIndex) {
            // 刺さった感覚の直後に飛び出させる
            setTimeout(() => {
                this.popOutAnimal(activePlayer);
            }, 180);
        } else {
            // ターンを次に交代
            this.turnIndex = (this.turnIndex + 1) % this.remainingPlayers.length;
            
            const indicator = document.getElementById('barrel-turn-indicator');
            if (indicator) {
                indicator.innerHTML = `🛢️ <strong>${this.escapeHtml(this.getActivePlayerName())}</strong> さんの番！`;
            }
            this.renderStatusList();
            
            // すべての穴が埋まっても飛び出なかった場合（万が一のための安全策）
            if (this.insertedSlots.size >= this.numSlots) {
                this.resetBarrel();
            }
        }
    }

    popOutAnimal(player) {
        this.isAnimating = true;
        this.playSound('explosion');
        
        const characterEl = document.getElementById('barrel-character');
        const indicator = document.getElementById('barrel-turn-indicator');
        
        if (characterEl) {
            characterEl.classList.add('pop-out');
        }
        
        if (indicator) {
            indicator.innerHTML = `💥 <strong>${this.escapeHtml(player)}</strong> さんが飛ばした！ <span style="color:#ef4444;">${this.currentRank}位</span>！`;
        }
        
        // 順位確定
        this.rankings.push(player);
        
        // リストから除去
        const removedIndex = this.remainingPlayers.indexOf(player);
        this.remainingPlayers.splice(removedIndex, 1);
        this.currentRank++;
        
        // 次のターンインデックスの調整
        if (this.remainingPlayers.length > 0) {
            this.turnIndex = this.turnIndex % this.remainingPlayers.length;
        }
        
        setTimeout(() => {
            if (this.remainingPlayers.length > 1) {
                // まだ2人以上残っている場合は、タルをリセットして継続
                this.resetBarrel();
                this.isAnimating = false;
                
                if (indicator) {
                    indicator.innerHTML = `🛢️ <strong>${this.escapeHtml(this.getActivePlayerName())}</strong> さんの番！`;
                }
                this.renderStatusList();
            } else {
                // 最後の一人は自動的に最下位
                const lastPlayer = this.remainingPlayers[0];
                this.rankings.push(lastPlayer);
                
                if (indicator) {
                    indicator.innerHTML = `🎉 全員の順番が決まったよ！`;
                }
                
                setTimeout(() => {
                    this.onFinish(this.rankings);
                }, 1500);
            }
        }, 2800);
    }

    destroy() {
        // クリーンアップ
    }

    escapeHtml(str) {
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    }
}
