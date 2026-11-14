// amidakuji.js - 進化系！デジタルあみだくじ

export class AmidakujiGame {
    constructor(container, players, onFinish, playSound) {
        this.container = container;
        this.players = players;
        this.onFinish = onFinish;
        this.playSound = playSound;
        
        this.canvas = null;
        this.ctx = null;
        
        this.lines = []; // 横線のリスト: { leftCol: number, rightCol: number, yPct: number }
        this.tracers = []; // アニメーション用トレーサー: { name: string, path: Array, progress: number, color: string }
        
        this.isDrawing = false;
        this.isTracing = false;
        
        this.paddingX = 50;
        this.paddingY = 60; // 上下の余白
        
        this.currentDragStart = null; // { col: number, yPct: number }
        this.dragY = 0;
        
        // プレイヤー色
        this.colors = [
            '#ef4444', '#f97316', '#f59e0b', '#10b981', 
            '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', 
            '#ec4899', '#14b8a6', '#84cc16', '#a855f7'
        ];
        
        this.init();
    }

    init() {
        this.container.innerHTML = `
            <div class="amidakuji-layout">
                <div class="amida-info" id="amida-info">
                    ✍️ たて線のあいだを タップ か ドラッグ して 横線をひいてね！
                </div>
                <div class="amida-canvas-wrapper">
                    <canvas id="amida-canvas"></canvas>
                </div>
                <div class="amida-controls">
                    <button id="btn-amida-clear" class="btn-danger btn-sm">🗑️ クリア</button>
                    <button id="btn-amida-start" class="btn-next btn-lg">🪜 スタート！</button>
                </div>
            </div>
        `;
        
        this.canvas = document.getElementById('amida-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.resizeCanvas();
        window.addEventListener('resize', this.handleResize);
        
        // 初期あみだ線の自動生成（何本かランダムにひいておく）
        this.generateRandomLines();
        
        // イベントハンドラ登録
        this.canvas.addEventListener('mousedown', (e) => this.onStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onEnd(e));
        
        this.canvas.addEventListener('touchstart', (e) => this.onStart(e), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => this.onMove(e), { passive: false });
        this.canvas.addEventListener('touchend', (e) => this.onEnd(e), { passive: false });
        
        document.getElementById('btn-amida-clear').addEventListener('click', () => {
            if (this.isTracing) return;
            this.lines = [];
            this.playSound('buzz');
            this.draw();
        });
        
        document.getElementById('btn-amida-start').addEventListener('click', (e) => {
            this.startTracing(e.target);
        });
        
        this.draw();
    }

    handleResize = () => {
        this.resizeCanvas();
        this.draw();
    };

    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        // Retinaディスプレイなどの高解像度対応
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        // CSSでの表示サイズを指定
        this.canvas.style.width = `${rect.width}px`;
        this.canvas.style.height = `${rect.height}px`;
    }

    generateRandomLines() {
        const numCols = this.players.length;
        if (numCols <= 1) return;
        
        // プレイヤー数に応じた適度な本数の横線を自動生成
        const targetCount = numCols * 2;
        let attempts = 0;
        
        while (this.lines.length < targetCount && attempts < 100) {
            attempts++;
            const col = Math.floor(Math.random() * (numCols - 1));
            const yPct = 0.2 + Math.random() * 0.6; // 上下20%は避ける
            
            // 既存の線と近すぎないかチェック
            const tooClose = this.lines.some(l => 
                (l.leftCol === col && Math.abs(l.yPct - yPct) < 0.08) ||
                (Math.abs(l.leftCol - col) === 1 && Math.abs(l.yPct - yPct) < 0.04)
            );
            
            if (!tooClose) {
                this.lines.push({ leftCol: col, rightCol: col + 1, yPct: yPct });
            }
        }
    }

    // 列数、スペース、位置計算用のヘルパー
    getColX(colIndex) {
        const numCols = this.players.length;
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const drawWidth = width - this.paddingX * 2;
        const spacing = numCols > 1 ? drawWidth / (numCols - 1) : 0;
        return this.paddingX + colIndex * spacing;
    }

    getCanvasCoords(e) {
        const rect = this.canvas.getBoundingClientRect();
        let clientX, clientY;
        if (e.touches && e.touches.length > 0) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            clientX = e.changedTouches[0].clientX;
            clientY = e.changedTouches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    onStart(e) {
        if (this.isTracing) return;
        e.preventDefault();
        
        const coords = this.getCanvasCoords(e);
        const yPct = coords.y / (this.canvas.height / (window.devicePixelRatio || 1));
        
        // 横線をひけるのは上下余白の中間のみ
        if (yPct < 0.15 || yPct > 0.85) return;
        
        // 最も近い縦線のインデックスを見つける
        const numCols = this.players.length;
        let closestCol = -1;
        let minDistance = Infinity;
        
        for (let i = 0; i < numCols; i++) {
            const colX = this.getColX(i);
            const dist = Math.abs(coords.x - colX);
            if (dist < minDistance) {
                minDistance = dist;
                closestCol = i;
            }
        }
        
        // 縦線から一定以内の距離であればドラッグ開始
        const spacing = numCols > 1 ? (this.canvas.width / (window.devicePixelRatio || 1) - this.paddingX * 2) / (numCols - 1) : 100;
        if (minDistance < spacing * 0.6) {
            this.isDrawing = true;
            this.currentDragStart = { col: closestCol, yPct: yPct };
            this.dragY = coords.y;
        }
    }

    onMove(e) {
        if (!this.isDrawing || this.isTracing) return;
        e.preventDefault();
        
        const coords = this.getCanvasCoords(e);
        this.dragY = coords.y;
        
        // ドラッグ中の再描画
        this.draw();
        
        // ガイド用のプレビュー線の描画
        const ctx = this.ctx;
        const startX = this.getColX(this.currentDragStart.col);
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
        ctx.lineWidth = 4;
        ctx.setLineDash([4, 4]);
        ctx.moveTo(startX, coords.y);
        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    onEnd(e) {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        
        const coords = this.getCanvasCoords(e);
        const yPct = coords.y / (this.canvas.height / (window.devicePixelRatio || 1));
        
        // 終了した最も近い縦線を見つける
        const numCols = this.players.length;
        let closestCol = -1;
        let minDistance = Infinity;
        
        for (let i = 0; i < numCols; i++) {
            const colX = this.getColX(i);
            const dist = Math.abs(coords.x - colX);
            if (dist < minDistance) {
                minDistance = dist;
                closestCol = i;
            }
        }
        
        const startCol = this.currentDragStart.col;
        
        // 隣接する列への接続であるか判定
        if (closestCol !== -1 && Math.abs(startCol - closestCol) === 1) {
            const leftCol = Math.min(startCol, closestCol);
            const rightCol = Math.max(startCol, closestCol);
            
            // 同一位置に線が近接しすぎていないか確認
            const tooClose = this.lines.some(l => 
                l.leftCol === leftCol && Math.abs(l.yPct - yPct) < 0.05
            );
            
            // 最大本数の制限 (全体の密度)
            if (!tooClose && this.lines.length < 60) {
                this.lines.push({ leftCol: leftCol, rightCol: rightCol, yPct: yPct });
                this.playSound('click');
            }
        } else {
            // タップだけでも線をひけるようにする救済措置
            // 開始と終了がほぼ同じ場所で、列間の中央付近であれば横線を作成
            const spacing = numCols > 1 ? (this.canvas.width / (window.devicePixelRatio || 1) - this.paddingX * 2) / (numCols - 1) : 100;
            const startX = this.getColX(startCol);
            const relativeX = coords.x - startX;
            
            if (Math.abs(relativeX) > 15 && Math.abs(relativeX) < spacing * 0.8) {
                const direction = relativeX > 0 ? 1 : -1;
                const targetCol = startCol + direction;
                
                if (targetCol >= 0 && targetCol < numCols) {
                    const leftCol = Math.min(startCol, targetCol);
                    const rightCol = Math.max(startCol, targetCol);
                    
                    const tooClose = this.lines.some(l => 
                        l.leftCol === leftCol && Math.abs(l.yPct - yPct) < 0.05
                    );
                    
                    if (!tooClose) {
                        this.lines.push({ leftCol: leftCol, rightCol: rightCol, yPct: yPct });
                        this.playSound('click');
                    }
                }
            }
        }
        
        this.currentDragStart = null;
        this.draw();
    }

    draw() {
        if (!this.ctx) return;
        
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        
        this.ctx.clearRect(0, 0, width, height);
        
        // 縦線と名前・順位の描画
        const numCols = this.players.length;
        const startY = this.paddingY;
        const endY = height - this.paddingY;
        
        this.ctx.font = "bold 14px 'M PLUS Rounded 1c'";
        
        for (let i = 0; i < numCols; i++) {
            const x = this.getColX(i);
            
            // 縦線
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.strokeStyle = '#cbd5e1';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
            
            // 上部のプレイヤー名
            this.ctx.save();
            this.ctx.translate(x, startY - 15);
            this.ctx.rotate(-Math.PI / 12); // 少し斜めにして重なり防止
            this.ctx.textAlign = 'center';
            this.ctx.fillStyle = '#475569';
            this.ctx.fillText(this.players[i], 0, 0);
            this.ctx.restore();
            
            // 下部の順位 (1位, 2位, ...)
            this.ctx.beginPath();
            this.ctx.arc(x, endY + 20, 16, 0, Math.PI * 2);
            this.ctx.fillStyle = '#38bdf8';
            this.ctx.fill();
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = "bold 12px 'M PLUS Rounded 1c'";
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`${i + 1}`, x, endY + 20);
        }
        
        // 横線の描画
        this.lines.forEach(line => {
            const xLeft = this.getColX(line.leftCol);
            const xRight = this.getColX(line.rightCol);
            const y = line.yPct * height;
            
            this.ctx.beginPath();
            this.ctx.moveTo(xLeft, y);
            this.ctx.lineTo(xRight, y);
            this.ctx.strokeStyle = '#94a3b8';
            this.ctx.lineWidth = 4;
            this.ctx.stroke();
        });
        
        // トレーサーのリアルタイム描画
        if (this.isTracing) {
            this.tracers.forEach(t => {
                const pos = this.getTracerPosition(t);
                
                // 光る輪郭
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 14, 0, Math.PI * 2);
                this.ctx.fillStyle = t.color;
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = t.color;
                this.ctx.fill();
                this.ctx.shadowBlur = 0; // シャドウをリセット
                
                // 縁取り
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2.5;
                this.ctx.stroke();
                
                // 簡易テキスト表示
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = "bold 10px sans-serif";
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(t.name.slice(0, 1), pos.x, pos.y);
            });
        }
    }

    startTracing(btnStart) {
        if (this.isTracing) return;
        this.isTracing = true;
        btnStart.style.display = 'none';
        
        const clearBtn = document.getElementById('btn-amida-clear');
        if (clearBtn) {
            clearBtn.classList.add('disabled');
            clearBtn.setAttribute('disabled', 'true');
        }
        
        const infoEl = document.getElementById('amida-info');
        if (infoEl) infoEl.textContent = '🪜 あみだくじ スタート！どこにつくかな？';
        
        this.playSound('drumroll');
        
        // 各プレイヤーのパスを生成
        const numCols = this.players.length;
        const height = this.canvas.height / (window.devicePixelRatio || 1);
        
        this.tracers = this.players.map((name, idx) => {
            const path = this.calculatePath(idx, height);
            return {
                name: name,
                path: path,
                progress: 0, // 現在のセグメントインデックスと進行度の管理
                segmentIdx: 0,
                segmentProgress: 0, // セグメント内比率 0〜1
                color: this.colors[idx % this.colors.length],
                totalLength: this.calculatePathLength(path),
                currentDist: 0
            };
        });
        
        this.animateTracers();
    }

    calculatePath(startCol, height) {
        const path = [];
        let currentCol = startCol;
        let currentY = this.paddingY;
        const endY = height - this.paddingY;
        
        path.push({ x: this.getColX(currentCol), y: currentY });
        
        while (currentY < endY) {
            // 現在の列に接続している横線を探す (現在地より下にあるもの)
            const touchingLines = this.lines.filter(l => 
                (l.leftCol === currentCol || l.rightCol === currentCol) && 
                (l.yPct * height > currentY + 0.1) && 
                (l.yPct * height < endY)
            );
            
            if (touchingLines.length === 0) {
                // 残りの縦線をおわりまで引く
                path.push({ x: this.getColX(currentCol), y: endY });
                currentY = endY;
            } else {
                // 最も近い（一番上の）横線を選択
                touchingLines.sort((a, b) => a.yPct - b.yPct);
                const nextLine = touchingLines[0];
                const lineY = nextLine.yPct * height;
                
                // 横線との交差点まで下がる
                path.push({ x: this.getColX(currentCol), y: lineY });
                
                // 隣の列へ移動
                const targetCol = nextLine.leftCol === currentCol ? nextLine.rightCol : nextLine.leftCol;
                path.push({ x: this.getColX(targetCol), y: lineY });
                
                currentCol = targetCol;
                currentY = lineY;
            }
        }
        
        return path;
    }

    calculatePathLength(path) {
        let len = 0;
        for (let i = 0; i < path.length - 1; i++) {
            const dx = path[i+1].x - path[i].x;
            const dy = path[i+1].y - path[i].y;
            len += Math.sqrt(dx*dx + dy*dy);
        }
        return len;
    }

    getTracerPosition(t) {
        if (t.segmentIdx >= t.path.length - 1) {
            return t.path[t.path.length - 1];
        }
        
        const p1 = t.path[t.segmentIdx];
        const p2 = t.path[t.segmentIdx + 1];
        
        return {
            x: p1.x + (p2.x - p1.x) * t.segmentProgress,
            y: p1.y + (p2.y - p1.y) * t.segmentProgress
        };
    }

    animateTracers() {
        if (!this.isTracing) return;
        
        const speed = 4; // 移動スピード (px / frame)
        let allFinished = true;
        
        this.tracers.forEach(t => {
            if (t.segmentIdx >= t.path.length - 1) return; // 終点
            
            allFinished = false;
            
            const p1 = t.path[t.segmentIdx];
            const p2 = t.path[t.segmentIdx + 1];
            
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const segLength = Math.sqrt(dx*dx + dy*dy);
            
            // 現セグメント内の進行距離を増やす
            t.currentDist += speed;
            t.segmentProgress = t.currentDist / segLength;
            
            if (t.segmentProgress >= 1) {
                // 次のセグメントへ
                t.segmentIdx++;
                t.currentDist = 0;
                t.segmentProgress = 0;
                
                // 分岐点で可愛いカチカチ音
                if (t.segmentIdx < t.path.length - 1) {
                    this.playSound('click');
                } else {
                    this.playSound('ding');
                }
            }
        });
        
        this.draw();
        
        if (allFinished) {
            this.isTracing = false;
            this.determineStandings();
        } else {
            requestAnimationFrame(() => this.animateTracers());
        }
    }

    determineStandings() {
        // 各トレーサーの最終X座標（または列インデックス）を算出し、順位を決定
        const numCols = this.players.length;
        const width = this.canvas.width / (window.devicePixelRatio || 1);
        const drawWidth = width - this.paddingX * 2;
        const spacing = numCols > 1 ? drawWidth / (numCols - 1) : 0;
        
        // ゴールした列ごとに結果を保持する配列 (インデックスが列Index = 順位-1)
        const finalResults = new Array(numCols);
        
        this.tracers.forEach(t => {
            const finalPos = t.path[t.path.length - 1];
            // X座標からどの列に着地したかを特定
            const landedCol = Math.round((finalPos.x - this.paddingX) / spacing);
            // landedCol 番目の縦線が i位 (landedCol + 1 位) になる
            finalResults[landedCol] = t.name;
        });
        
        this.playSound('explosion');
        
        setTimeout(() => {
            this.onFinish(finalResults);
        }, 1500);
    }

    destroy() {
        this.isTracing = false;
        this.isDrawing = false;
        window.removeEventListener('resize', this.handleResize);
    }
}
