// treasure.js - 一発勝負！宝箱選び (高級宝物ボックス & 24個のユニークなデザイン)

export class TreasureGame {
    constructor(container, players, onFinish, playSound) {
        this.container = container;
        this.players = players;
        this.currentPlayerIndex = 0;
        this.onFinish = onFinish;
        this.playSound = playSound;
        
        this.totalBoxes = 24;
        
        // 1〜24の数値をランダムにシャッフルして配置用
        this.ranks = Array.from({ length: this.totalBoxes }, (_, i) => i + 1);
        this.shuffle(this.ranks);
        
        // 24個の完全にユニークな高級宝物ボックスの定義
        // 各ボックスには、外観(icon)、開封後の宝物(reward)、背景色(styleClass)を設定
        this.chestsData = [
            { styleClass: 'chest-gold', icon: '🏺', reward: '🪙', label: 'おうごんのツボ' },
            { styleClass: 'chest-sapphire', icon: '🔮', reward: '🌟', label: 'まほうの水しょう' },
            { styleClass: 'chest-ruby', icon: '🎁', reward: '🧸', label: 'プレゼントばこ' },
            { styleClass: 'chest-emerald', icon: '👛', reward: '💍', label: 'きらきらお財布' },
            { styleClass: 'chest-amethyst', icon: '💍', reward: '💎', label: '指輪ケース' },
            { styleClass: 'chest-obsidian', icon: '💼', reward: '🪙', label: 'アタッシュケース' },
            
            { styleClass: 'chest-gold', icon: '🍯', reward: '🐝', label: 'ハチミツのつぼ' },
            { styleClass: 'chest-sapphire', icon: '🪐', reward: '🛸', label: 'うちゅうのたま' },
            { styleClass: 'chest-ruby', icon: '🌸', reward: '💐', label: 'お花の小箱' },
            { styleClass: 'chest-emerald', icon: '🐚', reward: '🦪', label: '真じゅの貝がら' },
            { styleClass: 'chest-amethyst', icon: '🥚', reward: '🐣', label: 'きんのたまご' },
            { styleClass: 'chest-obsidian', icon: '📜', reward: '🗺️', label: 'ふるい巻物' },
            
            { styleClass: 'chest-gold', icon: '🧭', reward: '🔭', label: 'おうごんの羅針盤' },
            { styleClass: 'chest-sapphire', icon: '🏰', reward: '🔑', label: 'お城の模型' },
            { styleClass: 'chest-ruby', icon: '🎟️', reward: '🎀', label: 'ゴールドチケット' },
            { styleClass: 'chest-emerald', icon: '🍀', reward: '🧲', label: 'よつばの小箱' },
            { styleClass: 'chest-amethyst', icon: '🌈', reward: '🎈', label: 'にじのタマゴ' },
            { styleClass: 'chest-obsidian', icon: '🎨', reward: '🖌️', label: '絵の具セット' },
            
            { styleClass: 'chest-gold', icon: '🔔', reward: '🎵', label: 'ゴールドベル' },
            { styleClass: 'chest-sapphire', icon: '🧸', reward: '🍰', label: 'くまさんボックス' },
            { styleClass: 'chest-ruby', icon: '🏆', reward: '🏅', label: 'トロフィーカップ' },
            { styleClass: 'chest-emerald', icon: '💎', reward: '👑', label: 'ダイヤの結晶' },
            { styleClass: 'chest-amethyst', icon: '💖', reward: '🍫', label: 'ハートのジュエリー' },
            { styleClass: 'chest-obsidian', icon: '🛡️', reward: '⚔️', label: 'ひかりのシールド' }
        ];
        
        // 宝箱のデザイン配列もシャッフルして、配置を毎回バラバラにする
        this.shuffle(this.chestsData);
        
        this.pickedScores = [];
        this.openedCount = 0;
        
        this.init();
    }

    init() {
        this.container.innerHTML = `
            <div class="treasure-layout">
                <div class="treasure-status" id="treasure-status">
                    👉 <strong>${this.escapeHtml(this.players[0])}</strong> さんのばんだよ！<br>
                    すきな お宝ボックス をえらんでね！
                </div>
                <div class="treasure-grid" id="treasure-grid">
                    <!-- 宝箱がここに追加されます -->
                </div>
            </div>
        `;
        
        const grid = document.getElementById('treasure-grid');
        
        for (let i = 0; i < this.totalBoxes; i++) {
            const rank = this.ranks[i];
            const chest = this.chestsData[i];
            
            const box = document.createElement('button');
            box.className = `treasure-box-card ${chest.styleClass}`;
            box.setAttribute('data-index', i);
            box.setAttribute('data-rank', rank);
            box.setAttribute('data-reward', chest.reward);
            box.setAttribute('title', chest.label);
            
            // 鍵マーク（🔒）のバッジを追加して、ロックされている感を強調
            box.innerHTML = `
                <span class="treasure-lock-badge">🔒</span>
                <span class="treasure-chest-emoji">${chest.icon}</span>
                <span class="treasure-box-number">${rank}</span>
            `;
            grid.appendChild(box);
            
            box.addEventListener('click', () => {
                this.openBox(box, rank, chest.reward);
            });
        }
    }

    openBox(boxEl, rank, rewardEmoji) {
        // すでに開いている、または無効化されている場合は何もしない
        if (boxEl.classList.contains('opened') || boxEl.classList.contains('disabled')) return;
        
        // 操作を一時的に全体無効化して連打を防ぐ
        const allBoxes = this.container.querySelectorAll('.treasure-box-card');
        allBoxes.forEach(b => b.classList.add('disabled'));
        
        // 開く演出
        boxEl.classList.add('opened');
        boxEl.classList.remove('disabled'); // 自身は開いた状態
        
        // アイコンを中身の宝物（ reward ）に変更
        const emojiEl = boxEl.querySelector('.treasure-chest-emoji');
        if (emojiEl) {
            emojiEl.textContent = rewardEmoji;
            emojiEl.animate([
                { transform: 'scale(0.3)', opacity: 0.5 },
                { transform: 'scale(1.2)', opacity: 1, offset: 0.8 },
                { transform: 'scale(1)', opacity: 0.15 } // 背景に薄く残す
            ], { duration: 400, fill: 'forwards' });
        }
        
        this.playSound('click');
        
        // 少し遅らせて正解音とスコア記録
        setTimeout(() => {
            this.playSound('ding');
            
            // プレイヤーの引いた数値を記録
            const activePlayer = this.players[this.currentPlayerIndex];
            this.pickedScores.push({ name: activePlayer, score: rank });
            this.openedCount++;
            
            // 次のプレイヤーへ
            this.currentPlayerIndex++;
            
            const statusEl = document.getElementById('treasure-status');
            
            setTimeout(() => {
                if (this.openedCount < this.players.length) {
                    // 次のプレイヤーの番
                    const nextPlayer = this.players[this.currentPlayerIndex];
                    if (statusEl) {
                        statusEl.innerHTML = `👉 <strong>${this.escapeHtml(nextPlayer)}</strong> さんのばんだよ！<br>すきな お宝ボックス をえらんでね！`;
                    }
                    // ロック解除
                    allBoxes.forEach(b => {
                        if (!b.classList.contains('opened')) {
                            b.classList.remove('disabled');
                        }
                    });
                } else {
                    // 全員引き終わったら、引いた数値の小さい順にソート
                    this.pickedScores.sort((a, b) => a.score - b.score);
                    
                    const rankings = this.pickedScores.map(item => item.name);
                    
                    if (statusEl) {
                        statusEl.innerHTML = `🎉 ぜんいん 引き終わったよ！`;
                    }
                    setTimeout(() => {
                        this.onFinish(rankings);
                    }, 1500);
                }
            }, 1000);
            
        }, 300);
    }

    shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
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
