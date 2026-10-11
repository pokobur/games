// ==========================================
// ぷるぽよチェイン: ゲームロジック & メインループ (game.js)
// ==========================================

// Walls setup
const wallThickness = 60;
const leftWall = Bodies.rectangle(10, 350, wallThickness, 700, { isStatic: true, label: 'wall' });
const rightWall = Bodies.rectangle(440, 350, wallThickness, 700, { isStatic: true, label: 'wall' });
const bottomWall = Bodies.rectangle(225, 690, 450, wallThickness, { isStatic: true, label: 'wall' });
World.add(world, [leftWall, rightWall, bottomWall]);

// Canvas & Context Setup
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
setupRetinaCanvas(canvas, ctx);

// Setup Matter.js Mouse Constraint
const mouse = Mouse.create(canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: {
        stiffness: 0.15,
        damping: 0.1,
        render: { visible: false }
    }
});
World.add(world, mouseConstraint);

// High-precision pointer scale compensation for mobile / responsive scaling (Bug #1 Fix!)
function updatePointerScale() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
        Mouse.setScale(mouse, {
            x: LOGICAL_WIDTH / rect.width,
            y: LOGICAL_HEIGHT / rect.height
        });
        Mouse.setOffset(mouse, { x: 0, y: 0 });
    }
}
window.addEventListener('resize', () => {
    setupRetinaCanvas(canvas, ctx);
    updatePointerScale();
});
window.addEventListener('scroll', updatePointerScale);
updatePointerScale();

// Game State Variables
let gameState = STATE_TITLE;
let gameMode = MODE_STAGE; // MODE_STAGE or MODE_ENDLESS
let stage = 1;
let score = 0;
let highScore = parseInt(localStorage.getItem('puyopoyo_highscore') || '0');
let blocksPoppedThisStage = 0;
let totalBlocksPopped = 0;

// Battle Arena Variables
let monsterHP = 200;
let monsterMaxHP = 200;
let currentMonster = null;
let enemyTurnCounter = 2; // Puzzle & Dragons style turn-based countdown
let monsterShake = 0;
let monsterFlash = 0;
let playerShake = 0;
let playerFlash = 0;
let monsterAttackTimer = 0;
let bossDefeatTimer = 0;

// Garbage & Clash System
let pendingGarbageCount = 0;

// Dragging Variables
let draggedBody = null;
let dragStartTime = 0;
let lastTickSecond = 0;
let draggedCol = 0;
let draggedRow = 0;
let hasMovedThisTurn = false;
let hasActuallySwapped = false;

// Combo & Fever
let currentCombo = 0;
let comboBannerScale = 0;
let comboBannerText = '';
let isFeverMode = false;
let feverTimer = 0;

// Danger Zone
let inDangerZone = false;
let dangerTimer = 0;

// Settle Safety Timers
let settleFrameCounter = 0;
let waitSettleSafetyTimer = 0;

// Special Burst Power Gauge
let burstGauge = 0;

// Sound & BGM instances
const synth = new SoundSynth();
const bgm = new BGMSequencer(synth);

// Initialize High Score Display
document.getElementById('txt-highscore').innerText = highScore;

// Stage Monster Setup
function getMonsterForStage(stg) {
    const loop = Math.floor((stg - 1) / MONSTERS.length);
    const index = (stg - 1) % MONSTERS.length;
    const base = MONSTERS[index];
    const hpMultiplier = Math.pow(2.2, loop);
    return {
        name: loop > 0 ? `${base.name} Lv.${loop + 1}` : base.name,
        maxHP: Math.round(base.maxHP * hpMultiplier),
        type: base.type,
        turnInterval: base.turnInterval || 2
    };
}

function initializeMonsterForStage(stg) {
    currentMonster = getMonsterForStage(stg);
    monsterMaxHP = currentMonster.maxHP;
    monsterHP = monsterMaxHP;
    monsterDisplayHP = monsterMaxHP;
    monsterDamageChipHP = monsterMaxHP;
    enemyTurnCounter = currentMonster.turnInterval || 2;
    pendingGarbageCount = 0;
}

function getGarbageCountForStage() {
    let baseGarbage = 3;
    if (stage === 2) baseGarbage = 5;
    else if (stage === 3) baseGarbage = 7;
    else if (stage === 4) baseGarbage = 10;
    else if (stage === 5) baseGarbage = 14;
    else if (stage >= 6) baseGarbage = 14 + (stage - 5) * 3;
    return baseGarbage;
}

// Grid-based Orthogonal BFS Match Checker (4+ connected blocks)
function findGridMatches() {
    const grid = Array(COLS).fill(null).map(() => Array(ROWS).fill(null));
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (!b.isMatching && b.column >= 0 && b.column < COLS && b.row >= 0 && b.row < ROWS) {
            grid[b.column][b.row] = b;
        }
    }

    const visited = Array(COLS).fill(null).map(() => Array(ROWS).fill(false));
    const matchedGroups = [];

    for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS; r++) {
            const b = grid[c][r];
            if (!b || visited[c][r] || b.colorName === 'gray') continue;

            const targetColor = b.colorName;
            const group = [];
            const queue = [{ c, r }];
            visited[c][r] = true;

            while (queue.length > 0) {
                const curr = queue.shift();
                const currBlock = grid[curr.c][curr.r];
                group.push(currBlock);

                const neighbors = [
                    { c: curr.c - 1, r: curr.r },
                    { c: curr.c + 1, r: curr.r },
                    { c: curr.c, r: curr.r - 1 },
                    { c: curr.c, r: curr.r + 1 }
                ];

                for (let i = 0; i < neighbors.length; i++) {
                    const nc = neighbors[i].c;
                    const nr = neighbors[i].r;
                    if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) {
                        const nb = grid[nc][nr];
                        if (!visited[nc][nr] && nb && nb.colorName === targetColor && !nb.isMatching) {
                            visited[nc][nr] = true;
                            queue.push({ c: nc, r: nr });
                        }
                    }
                }
            }

            if (group.length >= 4) {
                matchedGroups.push(group);
            }
        }
    }

    return matchedGroups;
}

// Global Match Checker (returns true if any 4+ group exists)
function checkForAnyMatch() {
    return findGridMatches().length > 0;
}

// Find Gray Garbage Blocks adjacent to popped groups (Puyo Puyo Rule)
function findAdjacentGrayBlocks(matchedGroups) {
    const grid = Array(COLS).fill(null).map(() => Array(ROWS).fill(null));
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (!b.isMatching && b.column >= 0 && b.column < COLS && b.row >= 0 && b.row < ROWS) {
            grid[b.column][b.row] = b;
        }
    }

    const grayToPop = new Set();
    matchedGroups.forEach(group => {
        group.forEach(b => {
            const neighbors = [
                { c: b.column - 1, r: b.row },
                { c: b.column + 1, r: b.row },
                { c: b.column, r: b.row - 1 },
                { c: b.column, r: b.row + 1 }
            ];
            neighbors.forEach(n => {
                if (n.c >= 0 && n.c < COLS && n.r >= 0 && n.r < ROWS) {
                    const nb = grid[n.c][n.r];
                    if (nb && nb.colorName === 'gray' && !nb.isMatching) {
                        grayToPop.add(nb);
                    }
                }
            });
        });
    });
    return Array.from(grayToPop);
}

// Pre-fill board with initial blocks (Guaranteed 0-Match stationary board like Puzzle & Dragons)
function dropInitialBlocks() {
    blocks.forEach(b => World.remove(world, b));
    blocks = [];
    animatingPops = [];
    particles = [];
    projectiles = [];
    floatingTexts = [];

    initializeMonsterForStage(stage);

    const grid = [];
    for (let c = 0; c < COLS; c++) {
        grid[c] = [];
        for (let r = 0; r < ROWS; r++) {
            grid[c][r] = null;
        }
    }

    // Function to check if placing color at (c, r) forms a 4-connected group
    function formsFourGroup(col, row, colorName) {
        grid[col][row] = colorName;
        const visited = Array(COLS).fill(null).map(() => Array(ROWS).fill(false));
        const queue = [{ c: col, r: row }];
        visited[col][row] = true;
        let count = 0;

        while (queue.length > 0) {
            const curr = queue.shift();
            count++;
            if (count >= 4) {
                grid[col][row] = null;
                return true;
            }

            const neighbors = [
                { c: curr.c - 1, r: curr.r },
                { c: curr.c + 1, r: curr.r },
                { c: curr.c, r: curr.r - 1 },
                { c: curr.c, r: curr.r + 1 }
            ];

            for (let i = 0; i < neighbors.length; i++) {
                const nc = neighbors[i].c;
                const nr = neighbors[i].r;
                if (nc >= 0 && nc < COLS && nr >= 0 && nr < ROWS) {
                    if (!visited[nc][nr] && grid[nc][nr] === colorName) {
                        visited[nc][nr] = true;
                        queue.push({ c: nc, r: nr });
                    }
                }
            }
        }
        grid[col][row] = null;
        return false;
    }

    // Fill grid cell by cell avoiding 4-matches
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const availableColors = [...COLOR_NAMES_BASE].sort(() => Math.random() - 0.5);
            let chosenColor = availableColors[0];
            for (let i = 0; i < availableColors.length; i++) {
                if (!formsFourGroup(c, r, availableColors[i])) {
                    chosenColor = availableColors[i];
                    break;
                }
            }
            grid[c][r] = chosenColor;
        }
    }

    // Create physics bodies at exact resting grid coordinates
    for (let col = 0; col < COLS; col++) {
        for (let row = 0; row < ROWS; row++) {
            const x = 20 + col * CELL_WIDTH + CELL_WIDTH / 2;
            const y = startYThreshold + row * CELL_HEIGHT + CELL_HEIGHT / 2;
            const b = createBlock(x, y, grid[col][row]);
            b.column = col;
            b.row = row;
            Matter.Body.setVelocity(b, { x: 0, y: 0 });
            Matter.Sleeping.set(b, true);
        }
    }

    // Double check with match finder to guarantee 100% zero matches at start
    let safety = 0;
    while (findGridMatches().length > 0 && safety < 50) {
        safety++;
        const matches = findGridMatches();
        matches.forEach(group => {
            const blockToChange = group[Math.floor(Math.random() * group.length)];
            const otherColors = COLOR_NAMES_BASE.filter(c => c !== blockToChange.colorName);
            const newColor = otherColors[Math.floor(Math.random() * otherColors.length)];
            blockToChange.colorName = newColor;
            blockToChange.colorInfo = BUBBLE_COLORS[newColor];
        });
    }
}

// Chain Match Resolver (Puyo Puyo / Pad compliant)
function checkAndExecuteMatches() {
    const matchedGroups = findGridMatches();

    if (matchedGroups.length > 0) {
        let popCount = 0;
        const poppedColumns = [];

        currentCombo++;
        synth.playPop(currentCombo - 1);

        comboBannerText = `${currentCombo}連鎖！`;
        comboBannerScale = 2.0;

        // Fever mode trigger on 5+ chain
        if (currentCombo >= 5 && !isFeverMode) {
            isFeverMode = true;
            feverTimer = feverDurationFrames;
            comboBannerText = "FEVER MODE!!";
            addFloatingText("フィーバータイム！", 225, 330, '#ffd43b', true);
        }

        const mult = isFeverMode ? 2 : 1;

        matchedGroups.forEach(group => {
            let sumX = 0, sumY = 0;
            const primaryColor = group[0].colorName;

            group.forEach(b => {
                b.isMatching = true;
                b.matchProgress = 0;
                sumX += b.position.x;
                sumY += b.position.y;

                World.remove(world, b);
                animatingPops.push(b);
                popCount++;
                poppedColumns.push(b.column);

                spawnParticles(b.position.x, b.position.y, b.colorInfo);
            });

            // Projectiles towards boss (Stage Mode) or score burst (Endless Mode)
            const centerX = sumX / group.length;
            const centerY = sumY / group.length;
            const power = group.length * currentCombo * 10 * mult;

            if (gameMode === MODE_STAGE) {
                const projType = (primaryColor === 'yellow') ? 'heal' : 'attack';
                spawnProjectile(centerX, centerY, 225, 146, projType, power, group[0].colorInfo);
            } else {
                // Endless Mode: sparkling floating score star
                addFloatingText(`+${power * 5}pts`, centerX, centerY - 20, group[0].colorInfo.highlight, group.length >= 5);
            }
        });

        // Adjacent gray garbage block popping (Puyo Puyo rule)
        const grayBlocksToPop = findAdjacentGrayBlocks(matchedGroups);
        grayBlocksToPop.forEach(gb => {
            gb.isMatching = true;
            gb.matchProgress = 0;
            World.remove(world, gb);
            animatingPops.push(gb);
            popCount++;
            poppedColumns.push(gb.column);
            spawnParticles(gb.position.x, gb.position.y, gb.colorInfo);
        });

        if (grayBlocksToPop.length > 0) {
            blocks = blocks.filter(b => !grayBlocksToPop.includes(b));
            addFloatingText("おじゃま相殺消去!", 225, 360, '#cbd5e1');
        }

        // Score award
        const points = currentCombo * popCount * 10 * mult;
        addScore(points);

        blocksPoppedThisStage += popCount;
        totalBlocksPopped += popCount;

        // Charge Puyo Burst Gauge
        addBurstCharge(popCount * 2.5 * mult);

        gameState = STATE_MATCHING;
        setTimeout(() => {
            refillBlocks(poppedColumns);
        }, 50);
    } else {
        if (currentCombo > 0) {
            addFloatingText(`${currentCombo}連鎖達成！`, 225, 400, '#ffffff', true);
        }
        currentCombo = 0;

        if (gameState === STATE_STAGE_CLEAR || gameState === STATE_VICTORY || gameState === STATE_BOSS_DEFEATED) {
            return;
        }

        gameState = STATE_WAIT_EFFECTS;
    }
}

// Add Score helper
function addScore(points) {
    score += points;
    document.getElementById('txt-score').innerText = score;

    if (score > highScore) {
        highScore = score;
        localStorage.setItem('puyopoyo_highscore', highScore);
        document.getElementById('txt-highscore').innerText = highScore;
    }
}

// Puyo Burst Charge and Trigger
function addBurstCharge(amount) {
    burstGauge = Math.min(BURST_MAX, burstGauge + amount);
    updateBurstUI();
}

function updateBurstUI() {
    const fillEl = document.getElementById('burst-fill');
    const btnEl = document.getElementById('btn-burst');
    if (fillEl) fillEl.style.width = `${burstGauge}%`;
    if (btnEl) {
        if (burstGauge >= BURST_MAX) {
            btnEl.classList.add('ready');
        } else {
            btnEl.classList.remove('ready');
        }
    }
}

function activatePuyoBurst() {
    if (burstGauge < BURST_MAX) return;
    burstGauge = 0;
    updateBurstUI();

    synth.playBurst();
    addFloatingText("✨ ぷるぽよバースト！ ✨", 225, 340, '#ffd43b', true);

    // 1. Clear all garbage blocks
    let grayCleared = 0;
    const poppedCols = [];
    blocks.forEach(b => {
        if (b.colorName === 'gray' && !b.isMatching) {
            b.isMatching = true;
            b.matchProgress = 0;
            World.remove(world, b);
            animatingPops.push(b);
            grayCleared++;
            poppedCols.push(b.column);
            spawnParticles(b.position.x, b.position.y, b.colorInfo);
        }
    });

    if (grayCleared > 0) {
        blocks = blocks.filter(b => b.colorName !== 'gray');
        addScore(grayCleared * 50);
        addFloatingText(`おじゃま全消去！ +${grayCleared * 50}`, 225, 270, '#38bdf8', true);
    }

    // 2. Trigger instant Fever Mode
    isFeverMode = true;
    feverTimer = feverDurationFrames;

    // 3. Shake screen and spawn rainbow stars
    playerShake = 15;
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: 20 + Math.random() * 410,
            y: startYThreshold + Math.random() * 470,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            color: ['#ff6b6b', '#fcc419', '#51cf66', '#4dabf7', '#be4bdb'][Math.floor(Math.random() * 5)],
            border: '#ffffff',
            size: Math.random() * 8 + 4,
            life: 1.2,
            decay: 0.02,
            isStar: true,
            angle: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.3
        });
    }

    if (poppedCols.length > 0) {
        refillBlocks(poppedCols);
    }
}

// Replenish columns strictly under gravity
function refillBlocks(poppedColumns) {
    const colCounts = {};
    poppedColumns.forEach(col => {
        colCounts[col] = (colCounts[col] || 0) + 1;
    });

    for (let col = 0; col < COLS; col++) {
        const colBlocks = blocks.filter(b => b.column === col && !b.isMatching);
        colBlocks.sort((a, b) => b.position.y - a.position.y);

        for (let i = 0; i < colBlocks.length; i++) {
            colBlocks[i].row = (ROWS - 1) - i;
            Matter.Sleeping.set(colBlocks[i], false);
        }

        const count = colCounts[col] || 0;
        if (count > 0) {
            const x = 20 + col * CELL_WIDTH + CELL_WIDTH / 2;
            const highestRemainingRow = ROWS - colBlocks.length;

            for (let i = 0; i < count; i++) {
                const logicalRow = highestRemainingRow - count + i;
                // Spawn stacked above startYThreshold to drop under gravity
                const y = startYThreshold - (count - i) * CELL_HEIGHT - CELL_HEIGHT / 2;

                const b = createBlock(x, y);
                b.column = col;
                b.row = logicalRow;
            }
        }
    }

    synth.playDrop();

    if (gameState !== STATE_STAGE_CLEAR && gameState !== STATE_VICTORY && gameState !== STATE_GAME_OVER && gameState !== STATE_BOSS_DEFEATED) {
        gameState = STATE_WAIT_SETTLE;
        settleFrameCounter = 0;
        waitSettleSafetyTimer = 0;
    }
}

// Boss Defeat Drama Sequence (Bug #4 Solved!)
function triggerBossDefeat() {
    gameState = STATE_BOSS_DEFEATED;
    bossDefeatTimer = 0;
    synth.playBossDefeat();
    spawnBossDefeatBurst(225, 146);

    setTimeout(() => {
        if (stage === 5) {
            gameState = STATE_VICTORY;
            synth.playVictoryFanfare();
            addFloatingText("GAME CLEAR!!", 225, 300, '#ffd43b', true);
        } else {
            triggerStageClear();
        }
    }, 900);
}

// Stage Clear Sequence
function triggerStageClear() {
    synth.playVictoryFanfare();
    gameState = STATE_STAGE_CLEAR;
    addFloatingText("STAGE CLEAR!!", 225, 300, '#10b981', true);

    const bonus = stage * 1000;
    addScore(bonus);
    addFloatingText(`ボーナス +${bonus}pts!`, 225, 360, '#f59e0b', true);

    setTimeout(() => {
        stage++;
        blocksPoppedThisStage = 0;
        document.getElementById('txt-stage').innerText = stage;
        dropInitialBlocks();

        gameState = STATE_IDLE;
        settleFrameCounter = 0;
        waitSettleSafetyTimer = 0;
    }, 1800);
}

// Trigger Monster Attack Phase
function triggerMonsterAttack() {
    if (gameMode === MODE_ENDLESS) {
        gameState = STATE_IDLE;
        return;
    }
    gameState = STATE_MONSTER_ATTACK;
    monsterAttackTimer = 0;
}

// --- Drag Event Listeners with Precision Lock ---
Matter.Events.on(mouseConstraint, 'startdrag', function(event) {
    if (gameState !== STATE_IDLE && gameState !== STATE_TITLE) {
        mouseConstraint.body = null;
        return;
    }

    const body = event.body;
    if (body && body.label === 'block' && body.colorName !== 'gray') {
        draggedBody = body;
        draggedBody.isSensor = true;
        dragStartTime = Date.now();
        lastTickSecond = 0;
        hasActuallySwapped = false;

        draggedCol = body.column;
        draggedRow = body.row;

        if (gameState === STATE_IDLE) {
            gameState = STATE_DRAGGING;
            synth.playGrab();
        }
    } else {
        mouseConstraint.body = null;
    }
});

Matter.Events.on(mouseConstraint, 'enddrag', function() {
    if (gameState === STATE_DRAGGING && draggedBody) {
        draggedBody.isSensor = false;
        Matter.Body.setVelocity(draggedBody, { x: 0, y: 0 });

        if (!hasActuallySwapped) {
            // Player merely tapped/clicked without swapping: cancel turn cleanly without penalty!
            gameState = STATE_IDLE;
            draggedBody = null;
            hasMovedThisTurn = false;
            return;
        }

        // Snap all non-matching blocks cleanly into integer grid coordinates
        blocks.forEach(b => {
            if (!b.isMatching) {
                const targetX = 20 + b.column * CELL_WIDTH + CELL_WIDTH / 2;
                const targetY = startYThreshold + b.row * CELL_HEIGHT + CELL_HEIGHT / 2;
                Matter.Body.setPosition(b, { x: targetX, y: targetY });
                Matter.Body.setVelocity(b, { x: 0, y: 0 });
            }
        });

        gameState = STATE_WAIT_SETTLE;
        draggedBody = null;
        hasMovedThisTurn = true;
        synth.playSettle();
    }
});

// Collision Wobble Trigger
Matter.Events.on(engine, 'collisionStart', function(event) {
    const now = Date.now();
    event.pairs.forEach(pair => {
        const bA = pair.bodyA;
        const bB = pair.bodyB;
        if (bA.label === 'block' && (now - bA.lastWobbleTime > 400)) {
            bA.wobbleVelX = -0.03;
            bA.wobbleVelY = 0.03;
            bA.lastWobbleTime = now;
        }
        if (bB.label === 'block' && (now - bB.lastWobbleTime > 400)) {
            bB.wobbleVelX = -0.03;
            bB.wobbleVelY = 0.03;
            bB.lastWobbleTime = now;
        }
    });
});

// ==========================================
// Main Game Loop
// ==========================================
function gameLoop() {
    if (gameState !== STATE_PAUSED) {
        // Shake & flash ticks
        if (monsterShake > 0) monsterShake--;
        if (monsterFlash > 0) monsterFlash--;
        if (playerFlash > 0) playerFlash--;
        if (playerShake > 0) playerShake--;
        if (bossDefeatTimer < 45) bossDefeatTimer++;

        // Double-step physics for snappy gravity
        Engine.update(engine, 16.67);
        Engine.update(engine, 16.67);

        // Dragged block cardinal grid path swap resolver
        if (gameState === STATE_DRAGGING && draggedBody) {
            updatePointerScale();
            let mCol = Math.floor((mouse.position.x - 20) / CELL_WIDTH);
            let mRow = Math.floor((mouse.position.y - startYThreshold) / CELL_HEIGHT);
            mCol = Math.max(0, Math.min(COLS - 1, mCol));
            mRow = Math.max(0, Math.min(ROWS - 1, mRow));

            // Spawn glowing drag sparkle trail
            spawnSparkleTrail(draggedBody.position.x, draggedBody.position.y, draggedBody.colorInfo);

            while (mCol !== draggedCol || mRow !== draggedRow) {
                const prevCol = draggedCol;
                const prevRow = draggedRow;

                let nextCol = draggedCol;
                let nextRow = draggedRow;
                if (mCol !== draggedCol) {
                    nextCol += Math.sign(mCol - draggedCol);
                } else {
                    nextRow += Math.sign(mRow - draggedRow);
                }

                const B = findBlockAtColumnRow(nextCol, nextRow, draggedBody);
                if (B && B.colorName === 'gray') {
                    // Gray blocks cannot be moved or passed through (pure obstacle)
                    break;
                }

                draggedCol = nextCol;
                draggedRow = nextRow;
                hasActuallySwapped = true;

                if (B) {
                    B.column = prevCol;
                    B.row = prevRow;
                    Matter.Body.setVelocity(B, { x: 0, y: 0 });
                    B.wobbleVelX = -0.05;
                    B.wobbleVelY = 0.05;
                    synth.playTick(false);
                }
            }
            draggedBody.column = draggedCol;
            draggedBody.row = draggedRow;

            // Strict board boundary clamp for dragged body
            const minX = 20 + blockRadius + 4;
            const maxX = 430 - blockRadius - 4;
            const minY = startYThreshold + blockRadius + 4;
            const maxY = 680 - blockRadius - 4;
            Matter.Body.setPosition(draggedBody, {
                x: Math.max(minX, Math.min(maxX, draggedBody.position.x)),
                y: Math.max(minY, Math.min(maxY, draggedBody.position.y))
            });
        }

        // Wobble spring physics & target position interpolation
        const springK = 0.12;
        const damping = 0.82;

        blocks.forEach(b => {
            const forceX = -springK * (b.wobbleX - 1.0);
            b.wobbleVelX = (b.wobbleVelX + forceX) * damping;
            b.wobbleX += b.wobbleVelX;

            const forceY = -springK * (b.wobbleY - 1.0);
            b.wobbleVelY = (b.wobbleVelY + forceY) * damping;
            b.wobbleY += b.wobbleVelY;

            b.blinkTimer = (b.blinkTimer + 1) % 300;

            if (b !== draggedBody && !b.isMatching) {
                if (gameState === STATE_DRAGGING) {
                    const targetX = 20 + b.column * CELL_WIDTH + CELL_WIDTH / 2;
                    const targetY = startYThreshold + b.row * CELL_HEIGHT + CELL_HEIGHT / 2;
                    Matter.Body.setPosition(b, { x: targetX, y: targetY });
                    Matter.Body.setVelocity(b, { x: 0, y: 0 });
                } else {
                    const targetX = 20 + b.column * CELL_WIDTH + CELL_WIDTH / 2;
                    const targetY = startYThreshold + b.row * CELL_HEIGHT + CELL_HEIGHT / 2;
                    // Snap & sleep only when near destination (avoids premature air-lock bug)
                    if (b.position.y >= targetY - 3.0 || (b.position.y >= targetY - 15.0 && b.speed < 0.25)) {
                        Matter.Body.setPosition(b, { x: targetX, y: targetY });
                        Matter.Body.setVelocity(b, { x: 0, y: 0 });
                        Matter.Sleeping.set(b, true);
                    } else {
                        Matter.Body.setPosition(b, { x: targetX, y: b.position.y });
                        Matter.Body.setVelocity(b, { x: 0, y: b.velocity.y });
                    }
                }
            }
        });
    }

    // ==========================================
    // Render Frame
    // ==========================================
    ctx.clearRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    ctx.save();
    // Screen Shake on Damage
    if (playerShake > 0) {
        const dx = (Math.random() - 0.5) * playerShake * 2.0;
        const dy = (Math.random() - 0.5) * playerShake * 2.0;
        ctx.translate(dx, dy);
    }

    // 1. Board Background & subtle grid
    drawBoardBackground(ctx);

    // 2. Strict Board Interior Clipping (Prevents falling blocks from spilling into boss area or outside borders!)
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(20, startYThreshold, 410, 470, 18);
    ctx.clip();

    // Connecting bridges for identical adjacent blocks
    for (let i = 0; i < blocks.length; i++) {
        for (let j = i + 1; j < blocks.length; j++) {
            const b1 = blocks[i];
            const b2 = blocks[j];
            if (b1.colorName === b2.colorName && b1.colorName !== 'gray' && !b1.isMatching && !b2.isMatching) {
                const isAdjacent = (Math.abs(b1.column - b2.column) + Math.abs(b1.row - b2.row) === 1);
                if (isAdjacent) {
                    const dx = b1.position.x - b2.position.x;
                    const dy = b1.position.y - b2.position.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist <= 82) {
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(b1.position.x, b1.position.y);
                    ctx.lineTo(b2.position.x, b2.position.y);
                    ctx.strokeStyle = b1.colorInfo.outline;
                    ctx.lineWidth = 14;
                    ctx.lineCap = 'round';
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(b1.position.x, b1.position.y);
                    ctx.lineTo(b2.position.x, b2.position.y);
                    ctx.strokeStyle = b1.colorInfo.main;
                    ctx.lineWidth = 9;
                    ctx.stroke();
                    ctx.restore();
                    }
                }
            }
        }
    }

    // Draw Idle Blocks
    blocks.forEach(b => {
        if (b !== draggedBody && !b.isMatching) {
            drawBubble(ctx, b.position.x, b.position.y, blockRadius, b.colorInfo, b.angle,
                       gameState, false, false, 0, b.blinkTimer, b.blinkDuration, b.wobbleX, b.wobbleY);
        }
    });

    // Draw Popping Animation
    for (let i = animatingPops.length - 1; i >= 0; i--) {
        const b = animatingPops[i];
        b.matchProgress += 0.08;
        drawBubble(ctx, b.position.x, b.position.y, blockRadius, b.colorInfo, b.angle,
                   gameState, false, true, b.matchProgress, b.blinkTimer, b.blinkDuration, 1.0, 1.0);
        if (b.matchProgress >= 1.0) {
            animatingPops.splice(i, 1);
        }
    }

    ctx.restore(); // End Board Interior Clipping

    // 3. Draw Dragged Block on top (clamped within board bounds)
    if (draggedBody) {
        drawBubble(ctx, draggedBody.position.x, draggedBody.position.y, blockRadius, draggedBody.colorInfo,
                   draggedBody.angle, gameState, true, false, 0, draggedBody.blinkTimer, draggedBody.blinkDuration,
                   draggedBody.wobbleX, draggedBody.wobbleY);
    }

    // 4. Board Foreground Frame & Badges (Rendered over block edges so frame line is always 100% crisp!)
    drawBoardForeground(ctx);

    // Draw Particles & Projectiles
    updateAndDrawParticles(ctx);
    updateAndDrawProjectiles(ctx);
    updateAndDrawFloatingTexts(ctx);

    // Drag Ticking Audio
    if (gameState === STATE_DRAGGING) {
        const elapsed = Date.now() - dragStartTime;
        const currentSec = Math.floor(elapsed / (elapsed > 3000 ? 250 : 1000));
        if (currentSec !== lastTickSecond) {
            lastTickSecond = currentSec;
            synth.playTick(elapsed > 3000);
        }

        if (elapsed >= dragDurationLimit) {
            if (draggedBody) {
                draggedBody.isSensor = false;
                Matter.Body.setVelocity(draggedBody, { x: 0, y: 0 });
            }
            gameState = STATE_WAIT_SETTLE;
            draggedBody = null;
            mouseConstraint.body = null;
            synth.playTimeUp();
            hasMovedThisTurn = true;
        }
    }

    // Drag Timer UI
    drawTimerUI(ctx);

    // Battle Arena Top HUD
    drawBattleArena(ctx);

    // Fever Mode Banner
    if (isFeverMode) {
        feverTimer--;
        if (feverTimer <= 0) {
            isFeverMode = false;
            addFloatingText("フィーバーおわり！", 225, 330, '#ffffff', true);
        }

        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '900 16px "M PLUS Rounded 1c"';
        ctx.fillStyle = `hsl(${Date.now() / 4 % 360}, 100%, 50%)`;
        ctx.fillText(`🔥 フィーバー中！スコア2倍！ (${Math.ceil(feverTimer / 60)}s)`, 225, 175);
        ctx.restore();
    }

    // Combo Callout Banner
    drawComboBanner(ctx);

    // Settling Wait Check
    if (gameState === STATE_WAIT_SETTLE) {
        let allSettled = true;
        waitSettleSafetyTimer++;

        if (waitSettleSafetyTimer < 6) {
            allSettled = false;
        } else {
            for (let i = 0; i < blocks.length; i++) {
                const b = blocks[i];
                if (b.velocity.y > 0.35 || Math.abs(b.velocity.x) > 0.35) {
                    allSettled = false;
                    break;
                }
            }
        }

        if (allSettled || waitSettleSafetyTimer >= 180) {
            settleFrameCounter++;
            if (settleFrameCounter >= 2) {
                checkAndExecuteMatches();
                settleFrameCounter = 0;
                waitSettleSafetyTimer = 0;
            }
        }
    }

    // Wait Effects Phase (Turn Resolution)
    if (gameState === STATE_WAIT_EFFECTS) {
        if (projectiles.length === 0 && animatingPops.length === 0) {
            if (hasMovedThisTurn) {
                hasMovedThisTurn = false;

                if (gameMode === MODE_STAGE) {
                    if (monsterHP <= 0) {
                        // Boss is defeated, let defeat animation proceed
                        return;
                    }

                    // Turn Countdown Decrement (Puzzle & Dragons style)
                    enemyTurnCounter--;

                    if (enemyTurnCounter <= 0) {
                        // Enemy Turn has arrived: unleash attack!
                        pendingGarbageCount = getGarbageCountForStage();
                        triggerMonsterAttack();
                    } else {
                        // Calm turn: enemy does not attack!
                        addFloatingText(`敵の行動まで あと ${enemyTurnCounter} ターン！`, 225, 270, '#38bdf8', true);
                        if (enemyTurnCounter === 1) {
                            pendingGarbageCount = getGarbageCountForStage();
                        } else {
                            pendingGarbageCount = 0;
                        }
                        gameState = STATE_IDLE;
                    }
                } else {
                    // Endless Mode
                    gameState = STATE_IDLE;
                }
            } else {
                gameState = STATE_IDLE;
            }
        }
    }

    // Monster Attack Phase (Stage Mode)
    if (gameState === STATE_MONSTER_ATTACK) {
        monsterAttackTimer++;

        if (monsterAttackTimer < 55) {
            ctx.save();
            ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
            ctx.fillRect(0, 204, 450, 28);

            ctx.textAlign = 'center';
            ctx.font = '900 14px "M PLUS Rounded 1c"';
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#7f1d1d';
            ctx.lineWidth = 4;
            ctx.strokeText("⚠️ 敵のこうげきが 来るぞ！ ⚠️", 225, 223);
            ctx.fillText("⚠️ 敵のこうげきが 来るぞ！ ⚠️", 225, 223);
            ctx.restore();

            if (monsterAttackTimer % 10 === 1) {
                synth.playTick(true);
            }
        }

        if (monsterAttackTimer === 55) {
            const count = Math.ceil(pendingGarbageCount);
            if (count > 0) {
                const dropCounts = Array(COLS).fill(0);
                const columnsToAssign = [];
                for (let c = 0; c < COLS; c++) columnsToAssign.push(c);
                columnsToAssign.sort(() => Math.random() - 0.5);

                for (let i = 0; i < count; i++) {
                    const col = columnsToAssign[i % COLS];
                    dropCounts[col]++;
                }

                for (let col = 0; col < COLS; col++) {
                    const numToDrop = dropCounts[col];
                    if (numToDrop > 0) {
                        const colBlocks = blocks.filter(b => b.column === col && !b.isMatching);
                        colBlocks.sort((a, b) => b.position.y - a.position.y);

                        for (let i = 0; i < colBlocks.length; i++) {
                            colBlocks[i].row = (ROWS - 1) - i;
                            Matter.Sleeping.set(colBlocks[i], false);
                        }

                        const x = 20 + col * CELL_WIDTH + CELL_WIDTH / 2;
                        const highestRemainingRow = ROWS - colBlocks.length;

                        for (let i = 0; i < numToDrop; i++) {
                            const logicalRow = highestRemainingRow - numToDrop + i;
                            // Stack above startYThreshold to drop down naturally
                            const y = startYThreshold - (numToDrop - i) * CELL_HEIGHT - CELL_HEIGHT / 2;
                            const b = createBlock(x, y, 'gray');
                            b.column = col;
                            b.row = logicalRow;
                        }
                    }
                }

                synth.playDrop();
                addFloatingText(`おじゃまブロック+${count}！`, 225, 260, '#f43f5e', true);
                playerShake = 16;
                playerFlash = 12;
            } else {
                addFloatingText("こうげきをふせいだ！", 225, 260, '#38bdf8', true);
            }
        }

        if (monsterAttackTimer >= 80) {
            pendingGarbageCount = 0;
            enemyTurnCounter = currentMonster ? (currentMonster.turnInterval || 2) : 2;
            gameState = STATE_WAIT_SETTLE;
            settleFrameCounter = 0;
            waitSettleSafetyTimer = 0;
        }
    }

    // Danger Deadline Check (Restricted to idle / dragging states only)
    if (gameState === STATE_IDLE || gameState === STATE_DRAGGING) {
        let blockOverflowing = false;
        for (let i = 0; i < blocks.length; i++) {
            const b = blocks[i];
            if (b.position.y >= 80 && b.position.y < startYThreshold && b.speed < 0.6) {
                blockOverflowing = true;
                break;
            }
        }

        if (blockOverflowing) {
            inDangerZone = true;
            dangerTimer++;

            ctx.save();
            ctx.fillStyle = `rgba(239, 68, 68, ${0.12 + 0.1 * Math.sin(Date.now() / 100)})`;
            ctx.fillRect(20, startYThreshold, 410, 470);

            ctx.textAlign = 'center';
            ctx.font = '900 18px "M PLUS Rounded 1c"';
            ctx.fillStyle = '#ef4444';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            const remainingSec = Math.max(0, ((dangerLimitFrames - dangerTimer) / 60)).toFixed(1);
            ctx.strokeText(`⚠️ 危険！ブロックを消して脱出しろ！(${remainingSec}s) ⚠️`, 225, startYThreshold + 40);
            ctx.fillText(`⚠️ 危険！ブロックを消して脱出しろ！(${remainingSec}s) ⚠️`, 225, startYThreshold + 40);
            ctx.restore();

            if (dangerTimer % 15 === 1) {
                synth.playTick(true);
            }

            if (dangerTimer >= dangerLimitFrames) {
                gameState = STATE_GAME_OVER;
                bgm.stop();
                synth.playGameOverTone();
                addFloatingText("GAME OVER...", 225, 340, '#f43f5e', true);
            }
        } else {
            inDangerZone = false;
            dangerTimer = 0;
        }
    } else {
        inDangerZone = false;
        dangerTimer = 0;
    }

    // Title Screen
    if (gameState === STATE_TITLE) {
        drawTitleScreen(ctx);
    }

    // Game Over
    if (gameState === STATE_GAME_OVER) {
        drawGameOverScreen(ctx);
    }

    // Victory Screen
    if (gameState === STATE_VICTORY) {
        drawVictoryScreen(ctx);
    }

    // Screen Flash on Player Damage
    if (playerFlash > 0 && gameState === STATE_MONSTER_ATTACK) {
        ctx.save();
        ctx.fillStyle = `rgba(239, 68, 68, ${0.45 * (playerFlash / 12)})`;
        ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
        ctx.restore();
    }

    ctx.restore();
    requestAnimationFrame(gameLoop);
}

// ==========================================
// User Input & Interactive Handlers
// ==========================================
function handleCanvasPointer(clientX, clientY) {
    synth.unlock();
    const rect = canvas.getBoundingClientRect();
    const mouseX = ((clientX - rect.left) / rect.width) * LOGICAL_WIDTH;
    const mouseY = ((clientY - rect.top) / rect.height) * LOGICAL_HEIGHT;

    if (gameState === STATE_TITLE) {
        // Start Button (center at Y = 465, radius width 100, height 28)
        if (mouseX >= 125 && mouseX <= 325 && mouseY >= 435 && mouseY <= 495) {
            startGame();
        }
    } else if (gameState === STATE_GAME_OVER) {
        // Retry Button (center at Y = 430, radius width 110, height 26)
        if (mouseX >= 115 && mouseX <= 335 && mouseY >= 400 && mouseY <= 460) {
            startGame();
        }
    } else if (gameState === STATE_VICTORY) {
        // EX Stage Button
        if (mouseX >= 105 && mouseX <= 345 && mouseY >= 360 && mouseY <= 410) {
            stage++;
            blocksPoppedThisStage = 0;
            document.getElementById('txt-stage').innerText = stage;
            dropInitialBlocks();
            gameState = STATE_IDLE;
            settleFrameCounter = 0;
            waitSettleSafetyTimer = 0;
            synth.playGrab();
            bgm.start();
        }
        // Restart Button
        if (mouseX >= 105 && mouseX <= 345 && mouseY >= 440 && mouseY <= 490) {
            startGame();
        }
    }
}

function startGame() {
    synth.unlock();
    score = 0;
    stage = 1;
    blocksPoppedThisStage = 0;
    totalBlocksPopped = 0;
    burstGauge = 0;
    updateBurstUI();

    document.getElementById('txt-score').innerText = score;
    document.getElementById('txt-stage').innerText = stage;

    dropInitialBlocks();
    gameState = STATE_IDLE;
    settleFrameCounter = 0;
    waitSettleSafetyTimer = 0;

    synth.playGrab();
    bgm.start();
}

// Canvas Touch / Click Handlers
canvas.addEventListener('click', function(e) {
    handleCanvasPointer(e.clientX, e.clientY);
});
canvas.addEventListener('touchstart', function(e) {
    synth.unlock();
    if (e.touches.length > 0) {
        const touch = e.touches[0];
        handleCanvasPointer(touch.clientX, touch.clientY);
        if (gameState === STATE_TITLE || gameState === STATE_GAME_OVER || gameState === STATE_VICTORY) {
            e.preventDefault();
        }
    }
}, { passive: false });

// Global touch unlock for iOS / Android Web Audio
window.addEventListener('touchstart', () => synth.unlock(), { once: true });
window.addEventListener('mousedown', () => synth.unlock(), { once: true });

// UI Buttons: Burst Button
const burstBtn = document.getElementById('btn-burst');
if (burstBtn) {
    burstBtn.addEventListener('click', activatePuyoBurst);
}

// Mode Badge Toggle
const modeBadge = document.getElementById('mode-badge');
if (modeBadge) {
    modeBadge.addEventListener('click', () => {
        gameMode = (gameMode === MODE_STAGE) ? MODE_ENDLESS : MODE_STAGE;
        modeBadge.innerText = (gameMode === MODE_STAGE) ? "👑 ステージバトル" : "♾️ エンドレス";
        synth.playTick(true);
        if (gameState !== STATE_TITLE) {
            startGame();
        }
    });
}

// Help Modal Controls
const helpBtn = document.getElementById('btn-help');
const helpModal = document.getElementById('modal-help');
const helpCloseBtn = document.getElementById('modal-help-close');

if (helpBtn && helpModal && helpCloseBtn) {
    helpBtn.addEventListener('click', () => {
        synth.unlock();
        synth.playGrab();
        helpModal.classList.remove('hidden');
    });
    helpCloseBtn.addEventListener('click', () => {
        synth.playTick(true);
        helpModal.classList.add('hidden');
    });
    helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
            synth.playTick(true);
            helpModal.classList.add('hidden');
        }
    });
}

// Pause & Settings Modal Controls
const pauseBtn = document.getElementById('btn-pause');
const pauseModal = document.getElementById('modal-pause');
const pauseResumeBtn = document.getElementById('pause-resume');
const pauseRestartBtn = document.getElementById('pause-restart');
const pauseModeBtn = document.getElementById('pause-mode');

if (pauseBtn && pauseModal) {
    pauseBtn.addEventListener('click', () => {
        if (gameState === STATE_TITLE || gameState === STATE_GAME_OVER || gameState === STATE_VICTORY) return;
        synth.unlock();
        synth.playGrab();
        gameState = STATE_PAUSED;
        bgm.stop();
        pauseModal.classList.remove('hidden');
    });

    if (pauseResumeBtn) {
        pauseResumeBtn.addEventListener('click', () => {
            synth.playGrab();
            pauseModal.classList.add('hidden');
            gameState = STATE_IDLE;
            bgm.start();
        });
    }

    if (pauseRestartBtn) {
        pauseRestartBtn.addEventListener('click', () => {
            pauseModal.classList.add('hidden');
            startGame();
        });
    }

    if (pauseModeBtn) {
        pauseModeBtn.addEventListener('click', () => {
            gameMode = (gameMode === MODE_STAGE) ? MODE_ENDLESS : MODE_STAGE;
            if (modeBadge) {
                modeBadge.innerText = (gameMode === MODE_STAGE) ? "👑 ステージバトル" : "♾️ エンドレス";
            }
            pauseModeBtn.innerText = (gameMode === MODE_STAGE) ? "モード切替: 👑 ステージバトル" : "モード切替: ♾️ エンドレス";
            synth.playTick(true);
            pauseModal.classList.add('hidden');
            startGame();
        });
    }
}

// Restart Quick Button
const restartBtn = document.getElementById('btn-restart');
if (restartBtn) {
    restartBtn.addEventListener('click', () => {
        synth.unlock();
        if (confirm("ゲームを最初からやり直しますか？")) {
            startGame();
        }
    });
}

// Sound Mute Toggle Button
const soundBtn = document.getElementById('btn-sound');
if (soundBtn) {
    soundBtn.addEventListener('click', () => {
        synth.unlock();
        synth.muted = !synth.muted;
        if (synth.muted) {
            soundBtn.innerText = '🔇';
            soundBtn.style.borderColor = '#f43f5e';
            bgm.stop();
        } else {
            soundBtn.innerText = '🔊';
            soundBtn.style.borderColor = '#e2e8f0';
            synth.playGrab();
            if (gameState !== STATE_TITLE && gameState !== STATE_GAME_OVER && gameState !== STATE_VICTORY && gameState !== STATE_PAUSED) {
                bgm.start();
            }
        }
    });
}

// Pre-drop background ambient bubbles inside board
for (let i = 0; i < 12; i++) {
    const x = Math.random() * 330 + 60;
    const y = Math.random() * 300 + 240;
    createBlock(x, y);
}

// Launch animation frame loop
requestAnimationFrame(gameLoop);
