// balloon.js - ハラハラ！風船ポップ

export class BalloonGame {
    constructor(container, players, onFinish, playSound) {
        this.container = container;
        this.players = players; // 全メンバー
        this.remainingPlayers = [...players]; // まだ順位が決まっていないメンバー
        this.onFinish = onFinish;
        this.playSound = playSound;
        
        this.rankings = []; // 決まった順位のリスト（先頭から1位, 2位...）
        this.currentRank = 1;
        
        this.turnIndex = 0; // remainingPlayers のインデックス
        this.tapCount = 0;
        this.popThreshold = 0;
        this.scale = 1.0;
        
        // カラフルな風船の色
        this.balloonColors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#22d3ee', '#fb7185'];
        this.currentColor = this.balloonColors[0];
        
        this.isAnimating = false;
        
        this.init();
    }

    init() {
        this.resetBalloon();
        
        this.container.innerHTML = `
            <div class="balloon-layout">
                <div class="balloon-turn-indicator" id="balloon-turn-indicator">
                    🎈 <strong>${this.escapeHtml(this.getActivePlayerName())}</strong> さんの番！
                </div>
                <div class="balloon-play-area">
                    <div class="balloon-svg-container" id="balloon-trigger" style="transform: scale(${this.scale});">
                        <svg class="balloon-svg" viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
                            <!-- 風船本体 -->
                            <ellipse cx="50" cy="50" rx="40" ry="46" fill="${this.currentColor}" />
                            <!-- 光のハイライト -->
                            <ellipse cx="32" cy="30" rx="8" ry="12" fill="rgba(255,255,255,0.4)" transform="rotate(-15 32 30)" />
                            <!-- 結び目 -->
                            <polygon points="46,96 54,96 50,90" fill="${this.currentColor}" />
                            <ellipse cx="50" cy="97" rx="6" ry="3" fill="${this.currentColor}" />
                            <!-- ひも -->
                            <path d="M50,98 C50,110 45,115 52,128" fill="none" stroke="#64748b" stroke-width="2" />
                        </svg>
                    </div>
                    <div id="balloon-pop-effect" class="balloon-pop-effect" style="display:none;">💥</div>
                </div>
                <div class="balloon-status-list" id="balloon-status-list">
                    <!-- 残りメンバーの簡易表示 -->
                </div>
            </div>
        `;
        
        document.getElementById('balloon-trigger').addEventListener('click', () => {
            this.handleBalloonTap();
        });
        
        this.renderStatusList();
    }

    getActivePlayerName() {
        return this.remainingPlayers[this.turnIndex];
    }

    resetBalloon() {
        this.tapCount = 0;
        // ポップする閾値をランダムに設定 (5回〜15回)
        this.popThreshold = 4 + Math.floor(Math.random() * 12);
        this.scale = 1.0;
        
        // 色をランダムに変更
        this.currentColor = this.balloonColors[Math.floor(Math.random() * this.balloonColors.length)];
        
        // DOMがある場合は更新
        const trigger = document.getElementById('balloon-trigger');
        if (trigger) {
            trigger.classList.remove('near-pop', 'wobble-active');
            trigger.style.setProperty('--scale', '1.0');
            trigger.style.transform = `scale(${this.scale})`;
            const svg = trigger.querySelector('.balloon-svg');
            if (svg) {
                const body = svg.querySelector('ellipse');
                const knot = svg.querySelector('polygon');
                const knotEllipse = svg.querySelectorAll('ellipse')[1];
                if (body) body.setAttribute('fill', this.currentColor);
                if (knot) knot.setAttribute('fill', this.currentColor);
                if (knotEllipse) knotEllipse.setAttribute('fill', this.currentColor);
            }
        }
    }

    renderStatusList() {
        const container = document.getElementById('balloon-status-list');
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

    handleBalloonTap() {
        if (this.isAnimating) return;
        
        this.tapCount++;
        this.scale += 0.09; // タップごとに風船を大きくする
        
        const trigger = document.getElementById('balloon-trigger');
        if (trigger) {
            trigger.style.setProperty('--scale', this.scale);
            trigger.style.transform = `scale(${this.scale})`;
            
            // ワブルアニメーション（叩いた時のブレ）
            trigger.classList.remove('wobble-active');
            void trigger.offsetWidth; // リフロー
            trigger.classList.add('wobble-active');
            
            // 割れる3回前になると恐怖でぶるぶる震えだす
            if (this.popThreshold - this.tapCount <= 3) {
                trigger.classList.add('near-pop');
            } else {
                trigger.classList.remove('near-pop');
            }
        }
        
        const activePlayer = this.getActivePlayerName();
        
        // 破裂判定
        if (this.tapCount >= this.popThreshold) {
            this.popBalloon(activePlayer);
        } else {
            this.playSound('squeak');
            
            // ターンを交代
            this.turnIndex = (this.turnIndex + 1) % this.remainingPlayers.length;
            
            const indicator = document.getElementById('balloon-turn-indicator');
            if (indicator) {
                indicator.innerHTML = `🎈 <strong>${this.escapeHtml(this.getActivePlayerName())}</strong> さんの番！`;
            }
            this.renderStatusList();
        }
    }

    popBalloon(player) {
        this.isAnimating = true;
        this.playSound('explosion');
        
        const trigger = document.getElementById('balloon-trigger');
        const popEffect = document.getElementById('balloon-pop-effect');
        const indicator = document.getElementById('balloon-turn-indicator');
        
        if (trigger) trigger.style.display = 'none';
        if (popEffect) {
            popEffect.style.display = 'block';
            // クラス再適用によるリセット
            popEffect.classList.remove('balloon-pop-effect');
            void popEffect.offsetWidth; // リフロートリガー
            popEffect.classList.add('balloon-pop-effect');
        }
        
        if (indicator) {
            indicator.innerHTML = `💥 <strong>${this.escapeHtml(player)}</strong> さんがわった！ <span style="color:#ef4444;">${this.currentRank}位</span>！`;
        }
        
        // 順位登録
        this.rankings.push(player);
        
        // 該当プレイヤーをリストから除去
        const removedIndex = this.remainingPlayers.indexOf(player);
        this.remainingPlayers.splice(removedIndex, 1);
        this.currentRank++;
        
        // 次のターン開始位置の調整
        if (this.remainingPlayers.length > 0) {
            this.turnIndex = this.turnIndex % this.remainingPlayers.length;
        }
        
        setTimeout(() => {
            if (this.remainingPlayers.length > 1) {
                // まだ複数人残っている場合はリセットして継続
                if (trigger) trigger.style.display = 'flex';
                if (popEffect) popEffect.style.display = 'none';
                
                this.resetBalloon();
                this.isAnimating = false;
                
                if (indicator) {
                    indicator.innerHTML = `🎈 <strong>${this.escapeHtml(this.getActivePlayerName())}</strong> さんの番！`;
                }
                this.renderStatusList();
            } else {
                // 残り1人になったら自動的にその人が最下位
                const lastPlayer = this.remainingPlayers[0];
                this.rankings.push(lastPlayer);
                
                if (indicator) {
                    indicator.innerHTML = `🎉 全員の順番が決まったよ！`;
                }
                
                setTimeout(() => {
                    this.onFinish(this.rankings);
                }, 1500);
            }
        }, 2000);
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
