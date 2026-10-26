// roulette.js - ねらえ！わくわくルーレット

export class RouletteGame {
    constructor(container, players, onFinish, playSound) {
        this.container = container;
        this.players = players; // 全体プレイヤー
        this.remainingPlayers = [...players]; // ルーレットに残っているプレイヤー
        this.onFinish = onFinish;
        this.playSound = playSound;
        
        this.rankings = [];
        this.currentRank = 1;
        
        this.angle = 0;
        this.angularVelocity = 0;
        this.isSpinning = false;
        this.isStopping = false;
        
        this.canvas = null;
        this.ctx = null;
        this.animationFrameId = null;
        
        // パステル調のセクターカラー
        this.colors = [
            '#ffadad', '#ffd6a5', '#fdffb6', '#caffbf', 
            '#9bf6ff', '#a0c4ff', '#bdb2ff', '#ffc6ff'
        ];
        
        this.lastSectorIndex = -1;
        
        this.init();
    }

    init() {
        this.container.innerHTML = `
            <div class="roulette-layout">
                <div class="roulette-info" id="roulette-info">
                    今のじゅんい: <span style="color:#ef4444; font-size:1.6rem;">${this.currentRank}位</span> をきめるよ！
                </div>
                <div class="roulette-container">
                    <div class="roulette-pointer" id="roulette-pointer"></div>
                    <canvas id="roulette-canvas" width="600" height="600"></canvas>
                    <div class="roulette-center-pin"></div>
                </div>
                <div class="race-control-panel">
                    <button id="btn-roulette-spin" class="btn-next btn-lg">🎯 まわす！</button>
                </div>
            </div>
        `;
        
        this.canvas = document.getElementById('roulette-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        const btnSpin = document.getElementById('btn-roulette-spin');
        btnSpin.addEventListener('click', () => {
            this.handleSpinButtonClick(btnSpin);
        });
        
        this.drawWheel();
        
        // アニメーションループ開始
        this.tick();
    }

    drawWheel() {
        const numSlices = this.remainingPlayers.length;
        if (numSlices === 0) return;
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = width / 2 - 20;
        
        this.ctx.clearRect(0, 0, width, height);
        
        const sliceAngle = (2 * Math.PI) / numSlices;
        
        for (let i = 0; i < numSlices; i++) {
            const startAngle = this.angle + i * sliceAngle;
            const endAngle = startAngle + sliceAngle;
            
            // セクターの描画
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.closePath();
            
            this.ctx.fillStyle = this.colors[i % this.colors.length];
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
            
            // テキストの描画
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(startAngle + sliceAngle / 2);
            
            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'middle';
            
            // プレイヤー数に応じてフォントサイズを調整
            let fontSize = 28;
            if (numSlices > 20) fontSize = 14;
            else if (numSlices > 10) fontSize = 20;
            
            this.ctx.font = `900 ${fontSize}px 'M PLUS Rounded 1c'`;
            this.ctx.fillStyle = '#2b2b2b';
            
            // テキストが縦に潰れないよう調整
            this.ctx.fillText(this.remainingPlayers[i], radius - 30, 0);
            this.ctx.restore();
        }
    }

    handleSpinButtonClick(btn) {
        if (this.isSpinning) {
            // 回転中なら「ストップ」処理
            if (!this.isStopping) {
                this.isStopping = true;
                btn.textContent = 'まってね...⏳';
                btn.classList.add('disabled');
                btn.setAttribute('disabled', 'true');
                this.playSound('click');
            }
        } else {
            // 停止中なら「スタート」処理
            this.isSpinning = true;
            this.isStopping = false;
            this.angularVelocity = 0.35 + Math.random() * 0.1; // ランダムな初期速度
            
            btn.textContent = '🛑 ストップ！';
            btn.classList.remove('btn-next');
            btn.classList.add('btn-danger');
            
            document.getElementById('roulette-pointer').classList.add('wiggling');
            
            // 最低1秒間はストップを押せない、または1.5秒後に自動ストップをかけるためのタイマー
            // ここでは1秒後に自動でストップ可能にする（もしくは自動減速）
            setTimeout(() => {
                // 自動停止またはストップボタン有効化
                // 今回は子供が自分で押せるストップボタンを継続しつつ、もし押さなければ5秒後に自動停止
                this.autoStopTimer = setTimeout(() => {
                    if (this.isSpinning && !this.isStopping) {
                        btn.click();
                    }
                }, 4000);
            }, 1000);
        }
    }

    tick() {
        const pointer = document.getElementById('roulette-pointer');
        
        if (this.isSpinning) {
            this.angle += this.angularVelocity;
            
            // 針のカチカチ音 (Crossing Tick Sound)
            const numSlices = this.remainingPlayers.length;
            const sliceAngle = (2 * Math.PI) / numSlices;
            // 針の位置 (頂点 = -Math.PI / 2)
            const relativeAngle = (-Math.PI / 2 - this.angle) % (2 * Math.PI);
            const normalizedAngle = relativeAngle < 0 ? relativeAngle + 2 * Math.PI : relativeAngle;
            const currentSectorIndex = Math.floor(normalizedAngle / sliceAngle) % numSlices;
            
            if (currentSectorIndex !== this.lastSectorIndex) {
                this.playSound('click');
                this.lastSectorIndex = currentSectorIndex;
            }
            
            if (this.isStopping) {
                this.angularVelocity *= 0.975; // 減速
                
                if (this.angularVelocity < 0.002) {
                    // 完全停止
                    this.isSpinning = false;
                    this.isStopping = false;
                    this.angularVelocity = 0;
                    if (pointer) pointer.classList.remove('wiggling');
                    
                    // 結果確定
                    this.determineWinner(currentSectorIndex);
                }
            }
        }
        
        if (this.canvas) {
            this.drawWheel();
            this.animationFrameId = requestAnimationFrame(() => this.tick());
        }
    }

    determineWinner(index) {
        const winner = this.remainingPlayers[index];
        this.rankings.push(winner);
        
        this.playSound('explosion');
        
        const infoEl = document.getElementById('roulette-info');
        infoEl.innerHTML = `🎉 <strong style="color:#e11d48; font-size:1.5rem;">${this.currentRank}位</strong> は <strong>${this.escapeHtml(winner)}さん</strong> に決定！`;
        
        // 選択されたプレイヤーを除去
        this.remainingPlayers.splice(index, 1);
        this.currentRank++;
        
        const btnSpin = document.getElementById('btn-roulette-spin');
        
        if (this.remainingPlayers.length > 1) {
            // まだプレイヤーが残っている場合
            setTimeout(() => {
                if (!infoEl) return;
                infoEl.innerHTML = `今のじゅんい: <span style="color:#ef4444; font-size:1.6rem;">${this.currentRank}位</span> をきめるよ！`;
                
                btnSpin.textContent = '🎯 まわす！';
                btnSpin.classList.remove('btn-danger', 'disabled');
                btnSpin.classList.add('btn-next');
                btnSpin.removeAttribute('disabled');
                
                this.drawWheel();
            }, 2500);
        } else {
            // 残り1人になったら、その人が最後の順位
            const lastPlayer = this.remainingPlayers[0];
            this.rankings.push(lastPlayer);
            
            setTimeout(() => {
                if (!infoEl) return;
                infoEl.innerHTML = `🎉 全員の順番が決まったよ！`;
                setTimeout(() => {
                    this.onFinish(this.rankings);
                }, 1500);
            }, 2500);
        }
    }

    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
        if (this.autoStopTimer) {
            clearTimeout(this.autoStopTimer);
        }
        this.canvas = null;
        this.ctx = null;
    }

    escapeHtml(str) {
        return str.replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')
                  .replace(/"/g, '&quot;')
                  .replace(/'/g, '&#039;');
    }
}
