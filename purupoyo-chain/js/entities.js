// ==========================================
// ぷるぽよチェイン: エンティティ・飛翔体・パーティクル (entities.js)
// ==========================================

const Engine = Matter.Engine,
      World = Matter.World,
      Bodies = Matter.Bodies,
      Mouse = Matter.Mouse,
      MouseConstraint = Matter.MouseConstraint;

// Matter.js Physics Engine instance
const engine = Engine.create({
    gravity: { x: 0, y: 3.5, scale: 0.001 }
});
const world = engine.world;

let blocks = [];
let animatingPops = [];
let particles = [];
let projectiles = [];
let floatingTexts = [];

// Boss HP animation helpers (for fighting game style trailing damage chip)
let monsterDisplayHP = 200;
let monsterDamageChipHP = 200;
let monsterDamageChipTimer = 0;

// Custom properties initializer for bubble physics bodies
function initCustomProperties(body, colorName) {
    body.colorName = colorName;
    body.colorInfo = BUBBLE_COLORS[colorName] || BUBBLE_COLORS.red;
    body.blinkTimer = Math.floor(Math.random() * 300);
    body.blinkDuration = 12;
    body.wobbleX = 1.0;
    body.wobbleY = 1.0;
    body.wobbleVelX = 0;
    body.wobbleVelY = 0;
    body.isMatching = false;
    body.matchProgress = 0;
    body.column = 0;
    body.row = 0;
    body.lastWobbleTime = 0;
}

// Block Factory
function createBlock(x, y, colorName = null) {
    if (!colorName) {
        colorName = COLOR_NAMES_BASE[Math.floor(Math.random() * COLOR_NAMES_BASE.length)];
    }

    const b = Matter.Bodies.circle(x, y, blockRadius, {
        restitution: 0.1,
        friction: 0.05,
        frictionAir: 0.04,
        density: 0.002,
        label: 'block',
        collisionFilter: {
            category: 0x0001,
            mask: 0x0001
        }
    });

    initCustomProperties(b, colorName);
    Matter.World.add(world, b);
    blocks.push(b);
    return b;
}

// Find block by column and row
function findBlockAtColumnRow(col, row, excludeBody = null) {
    for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (excludeBody && b.id === excludeBody.id) continue;
        if (b.isMatching) continue;

        if (b.column === col && b.row === row) {
            return b;
        }
    }
    return null;
}

// --- Particle System ---
function spawnParticles(x, y, colorInfo) {
    const isFever = (typeof isFeverMode !== 'undefined' && isFeverMode);
    const count = (isFever ? 24 : 16) + Math.floor(Math.random() * 8);
    const popColors = ['#ff6b6b', '#fcc419', '#51cf66', '#4dabf7', '#be4bdb', '#ff8787', '#ffd43b', '#69db7c', '#74c0fc', '#d0bfff'];

    for (let i = 0; i < count; i++) {
        const color = Math.random() > 0.45 ? colorInfo.main : popColors[Math.floor(Math.random() * popColors.length)];
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * (isFever ? 10 : 8),
            vy: (Math.random() - 0.7) * (isFever ? 12 : 10) - 2.5,
            color: color,
            border: '#ffffff',
            size: Math.random() * (isFever ? 7.5 : 6) + 4,
            life: 1.0,
            decay: Math.random() * 0.024 + 0.014,
            isStar: Math.random() > 0.25,
            angle: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.25
        });
    }
}

// Drag sparkle trail
function spawnSparkleTrail(x, y, colorInfo) {
    if (Math.random() > 0.6) return;
    particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5 - 0.5,
        color: colorInfo ? colorInfo.highlight : '#ffd43b',
        border: '#ffffff',
        size: Math.random() * 3 + 2.5,
        life: 0.7,
        decay: 0.035,
        isStar: true,
        angle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2
    });
}

// Boss Defeat Massive Burst
function spawnBossDefeatBurst(cx, cy) {
    const rainbow = ['#f43f5e', '#eab308', '#10b981', '#06b6d4', '#a855f7', '#ec4899', '#ffffff'];
    for (let i = 0; i < 65; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 12 + 4;
        particles.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 3,
            color: rainbow[Math.floor(Math.random() * rainbow.length)],
            border: '#ffffff',
            size: Math.random() * 8 + 5,
            life: 1.2,
            decay: Math.random() * 0.018 + 0.01,
            isStar: Math.random() > 0.2,
            angle: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.4
        });
    }
}

function updateAndDrawParticles(ctx) {
    const isFever = (typeof isFeverMode !== 'undefined' && isFeverMode);

    // Rising golden stars during Fever Mode
    if (isFever && Math.random() < 0.18) {
        const px = 20 + Math.random() * 410;
        const py = startYThreshold + 470;
        const colors = ['#ffd43b', '#fcc419', '#ff922b', '#ff6b6b', '#be4bdb', '#ff8787'];
        particles.push({
            x: px,
            y: py,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 4.5 - 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            border: '#ffffff',
            size: Math.random() * 4 + 4,
            life: 1.0,
            decay: Math.random() * 0.015 + 0.008,
            isStar: true,
            angle: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.2
        });
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (isFever && p.vy < 0) {
            p.vy += 0.04; // Gentle decelerate for rising stars
        } else {
            p.vy += 0.22; // Gravity
        }

        p.life -= p.decay;
        if (p.angle !== undefined) p.angle += p.rotSpeed;

        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.strokeStyle = p.border;
        ctx.lineWidth = 2;
        ctx.translate(p.x, p.y);
        if (p.angle !== undefined) ctx.rotate(p.angle);

        if (p.isStar) {
            drawStar(ctx, 0, 0, 5, p.size, p.size / 2);
        } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }
}

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx, y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius;
        y = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += step;

        x = cx + Math.cos(rot) * innerRadius;
        y = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
}

// --- Projectiles System ---
function spawnProjectile(startX, startY, targetX, targetY, type, power, colorInfo) {
    projectiles.push({
        x: startX,
        y: startY,
        startX: startX,
        startY: startY,
        targetX: targetX,
        targetY: targetY,
        type: type,
        power: power,
        colorInfo: colorInfo,
        progress: 0,
        speed: 0.065
    });
}

function updateAndDrawProjectiles(ctx) {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        p.progress += p.speed;

        // Rainbow spark trail
        if (Math.random() > 0.12) {
            const curX = p.startX + (p.targetX - p.startX) * p.progress;
            const curY = p.startY + (p.targetY - p.startY) * p.progress;
            const hue = (Date.now() / 2) % 360;
            particles.push({
                x: curX + (Math.random() - 0.5) * 6,
                y: curY + (Math.random() - 0.5) * 6,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                color: p.type === 'heal' ? '#a7f3d0' : `hsl(${hue}, 100%, 65%)`,
                border: '#ffffff',
                size: Math.random() * 4 + 3.5,
                life: 0.8,
                decay: 0.05,
                isStar: true,
                angle: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.3
            });
        }

        if (p.progress >= 1) {
            // Target Impact Logic
            const isYellow = (p.type === 'heal');
            const negateEfficiency = isYellow ? 0.35 : 0.15;
            let clashPower = p.power * negateEfficiency;

            if (pendingGarbageCount > 0) {
                const negated = Math.min(pendingGarbageCount, clashPower);
                pendingGarbageCount -= negated;
                clashPower -= negated;

                addFloatingText(`相殺 -${negated.toFixed(1)}`, p.targetX, p.targetY + 22, '#cbd5e1');

                for (let k = 0; k < 6; k++) {
                    particles.push({
                        x: p.targetX,
                        y: p.targetY + 20,
                        vx: (Math.random() - 0.5) * 4,
                        vy: (Math.random() - 0.5) * 4 - 1,
                        color: '#94a3b8',
                        border: '#ffffff',
                        size: Math.random() * 4 + 3,
                        life: 1.0,
                        decay: 0.06,
                        isStar: true,
                        angle: Math.random() * Math.PI * 2,
                        rotSpeed: (Math.random() - 0.5) * 0.4
                    });
                }
            }

            // Remaining power deals monster damage in Stage Mode
            if (clashPower > 0 && gameMode === MODE_STAGE) {
                const damageMult = isYellow ? 1.0 : 3.0;
                const dmg = Math.floor(clashPower * damageMult);

                if (monsterHP > 0) {
                    monsterHP -= dmg;
                    if (monsterHP <= 0) {
                        monsterHP = 0;
                        triggerBossDefeat();
                    }
                    monsterShake = 14;
                    monsterFlash = 12;

                    if (isYellow) {
                        synth.playHeal();
                        addFloatingText(`-${dmg}`, p.targetX, p.targetY - 10, '#eab308');
                        for (let k = 0; k < 10; k++) {
                            particles.push({
                                x: p.targetX,
                                y: p.targetY,
                                vx: (Math.random() - 0.5) * 6,
                                vy: (Math.random() - 0.6) * 6 - 1,
                                color: Math.random() > 0.3 ? '#ffd43b' : '#ffffff',
                                border: '#ffffff',
                                size: Math.random() * 5 + 4,
                                life: 1.0,
                                decay: 0.05,
                                isStar: true,
                                angle: Math.random() * Math.PI * 2,
                                rotSpeed: (Math.random() - 0.5) * 0.4
                            });
                        }
                    } else {
                        synth.playHit();
                        addFloatingText(`-${dmg}`, p.targetX, p.targetY - 10, '#f43f5e');
                        for (let k = 0; k < 12; k++) {
                            particles.push({
                                x: p.targetX,
                                y: p.targetY,
                                vx: (Math.random() - 0.5) * 8,
                                vy: (Math.random() - 0.55) * 9 - 1,
                                color: Math.random() > 0.4 ? '#f59f00' : '#ffc9c9',
                                border: '#ffffff',
                                size: Math.random() * 5 + 4,
                                life: 1.0,
                                decay: 0.05,
                                isStar: true,
                                angle: Math.random() * Math.PI * 2,
                                rotSpeed: (Math.random() - 0.5) * 0.4
                            });
                        }
                    }
                }
            }

            projectiles.splice(i, 1);
            continue;
        }

        const curX = p.startX + (p.targetX - p.startX) * p.progress;
        const curY = p.startY + (p.targetY - p.startY) * p.progress;

        ctx.save();
        ctx.beginPath();
        if (p.type === 'heal') {
            ctx.fillStyle = '#22c55e';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            drawStar(ctx, curX, curY, 5, 8, 4);
        } else {
            ctx.arc(curX, curY, 7.5, 0, Math.PI * 2);
            ctx.fillStyle = p.colorInfo ? p.colorInfo.main : '#ef4444';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
        }
        ctx.restore();
    }
}

// --- Floating Text System ---
function addFloatingText(text, x, y, color, isBig = false) {
    floatingTexts.push({
        text: text,
        x: x,
        y: y,
        color: color,
        life: 1.0,
        decay: isBig ? 0.015 : 0.02,
        vy: isBig ? -1.0 : -1.8,
        isBig: isBig
    });
}

function updateAndDrawFloatingTexts(ctx) {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const t = floatingTexts[i];
        t.y += t.vy;
        t.life -= t.decay;

        if (t.life <= 0) {
            floatingTexts.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, t.life);
        ctx.textAlign = 'center';

        if (t.isBig) {
            ctx.font = '900 32px "M PLUS Rounded 1c"';
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 8;
            ctx.strokeText(t.text, t.x, t.y);
            ctx.fillStyle = '#ffffff';
            ctx.fillText(t.text, t.x, t.y);
        } else {
            ctx.font = '900 22px "M PLUS Rounded 1c"';
            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 6;
            ctx.strokeText(t.text, t.x, t.y);
            ctx.fillStyle = t.color;
            ctx.fillText(t.text, t.x, t.y);
        }

        ctx.restore();
    }
}

function drawHeartPath(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y - size / 4);
    ctx.bezierCurveTo(x - size / 2, y - size / 2, x - size, y + size / 3, x, y + size / 1.2);
    ctx.bezierCurveTo(x + size, y + size / 3, x + size / 2, y - size / 2, x, y - size / 4);
    ctx.closePath();
    ctx.fill();
}
