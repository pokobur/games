// ==========================================
// ぷるぽよチェイン: Canvas レンダラー (renderer.js)
// ==========================================

let dpr = window.devicePixelRatio || 1;

// Setup high-DPI crisp Canvas scaling
function setupRetinaCanvas(cvs, context) {
    dpr = window.devicePixelRatio || 1;
    cvs.width = Math.floor(LOGICAL_WIDTH * dpr);
    cvs.height = Math.floor(LOGICAL_HEIGHT * dpr);
    context.resetTransform?.();
    context.scale(dpr, dpr);
}

// Draw Bubble Character
function drawBubble(ctx, x, y, radius, colorInfo, angle, state, isGrabbed, isMatching, matchProgress, blinkTimer, blinkDuration, wobbleX, wobbleY) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    let r = radius;
    if (isMatching) {
        r = radius * (1 - matchProgress);
    } else if (isGrabbed) {
        ctx.scale(1.25, 1.25);
    } else {
        ctx.scale(wobbleX, wobbleY);
    }

    if (r <= 1) {
        ctx.restore();
        return;
    }

    // Drop shadow
    ctx.beginPath();
    if (isGrabbed) {
        ctx.arc(4, 6, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
    } else {
        ctx.arc(2, 3, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
    }
    ctx.fill();

    // Glow outer ring if grabbed
    if (isGrabbed) {
        ctx.beginPath();
        ctx.arc(0, 0, r + 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(252, 196, 25, 0.55)';
        ctx.fill();
    }

    // Main body with glossy radial gradient
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(-r / 3, -r / 3, r / 10, 0, 0, r);
    grad.addColorStop(0, colorInfo.highlight);
    grad.addColorStop(0.5, colorInfo.main);
    grad.addColorStop(1, colorInfo.dark);
    ctx.fillStyle = grad;
    ctx.fill();

    // Outline
    ctx.strokeStyle = colorInfo.outline;
    ctx.lineWidth = isGrabbed ? 3.5 : 2.5;
    ctx.stroke();

    // Highlight glares (top-left glossy reflection)
    ctx.beginPath();
    ctx.ellipse(-r / 2.5, -r / 2.5, r / 4, r / 7, Math.PI / 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.68)';
    ctx.fill();

    // Heart icon overlay for Yellow (Heal / Shield) blocks
    if (colorInfo.name === 'yellow') {
        ctx.save();
        ctx.fillStyle = 'rgba(244, 63, 94, 0.58)';
        const hSize = r * 0.95;
        ctx.translate(0, -r * 0.1);
        drawHeartPath(ctx, 0, 0, hSize);
        ctx.fill();
        ctx.restore();
    }

    // Eye coordinates
    const eyeOffset = r * 0.32;
    const eyeY = -r * 0.12;
    const eyeR = r * 0.13;

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#0f172a';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2.5;

    const isGrayGarbage = (colorInfo.name === 'gray');

    // Danger sweat droplet when near top line
    const isDangerNervous = !isGrayGarbage && (state !== STATE_TITLE) && (state !== STATE_STAGE_CLEAR) && (y >= 80) && (y < startYThreshold + 65);

    if (isDangerNervous && !isMatching && !isGrabbed) {
        ctx.save();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(r * 0.72, -r * 0.45, r * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(r * 0.58, -r * 0.45);
        ctx.lineTo(r * 0.72, -r * 0.75);
        ctx.lineTo(r * 0.86, -r * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    if (isGrayGarbage) {
        // Sad / worried eyes (> <) for gray garbage blocks
        ctx.beginPath();
        ctx.moveTo(-eyeOffset - 3, eyeY - 2);
        ctx.lineTo(-eyeOffset + 3, eyeY + 2);
        ctx.moveTo(-eyeOffset + 3, eyeY - 2);
        ctx.lineTo(-eyeOffset - 3, eyeY + 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(eyeOffset - 3, eyeY - 2);
        ctx.lineTo(eyeOffset + 3, eyeY + 2);
        ctx.moveTo(eyeOffset + 3, eyeY - 2);
        ctx.lineTo(eyeOffset - 3, eyeY + 2);
        ctx.stroke();

        // Droopy mouth
        ctx.beginPath();
        ctx.arc(0, r * 0.28, r * 0.16, Math.PI, 0, false);
        ctx.stroke();
    } else {
        // Natural blinking eyes
        const isBlinking = (blinkTimer < blinkDuration);

        if (isBlinking || isGrabbed) {
            // Happy closed eyes (^ ^) when grabbed or blinking
            ctx.beginPath();
            ctx.arc(-eyeOffset, eyeY, eyeR, Math.PI, 0, false);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(eyeOffset, eyeY, eyeR, Math.PI, 0, false);
            ctx.stroke();
        } else {
            // Normal open eyes with white shine
            ctx.beginPath();
            ctx.arc(-eyeOffset, eyeY, eyeR, 0, Math.PI * 2);
            ctx.arc(eyeOffset, eyeY, eyeR, 0, Math.PI * 2);
            ctx.fill();

            // Pupil gleams
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(-eyeOffset - 1, eyeY - 1, eyeR * 0.4, 0, Math.PI * 2);
            ctx.arc(eyeOffset - 1, eyeY - 1, eyeR * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        // Cute smiling mouth
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        if (isGrabbed) {
            // Open cheerful mouth (:D)
            ctx.arc(0, r * 0.15, r * 0.18, 0, Math.PI, false);
            ctx.fill();
        } else {
            // Gentle smile
            ctx.arc(0, r * 0.12, r * 0.12, 0, Math.PI, false);
            ctx.stroke();
        }

        // Blushing pink cheeks
        ctx.fillStyle = 'rgba(255, 107, 107, 0.45)';
        ctx.beginPath();
        ctx.arc(-r * 0.5, r * 0.1, r * 0.14, 0, Math.PI * 2);
        ctx.arc(r * 0.5, r * 0.1, r * 0.14, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
}

// Draw Board Background and Grid (Rendered BEFORE blocks)
function drawBoardBackground(ctx) {
    const boardLeft = 20;
    const boardWidth = 410;
    const boardHeight = 470;
    const boardBottom = startYThreshold + boardHeight;

    ctx.save();

    // Soft glassmorphic background for puzzle area
    ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
    ctx.beginPath();
    ctx.roundRect(boardLeft, startYThreshold, boardWidth, boardHeight, 18);
    ctx.fill();

    // Symmetrical subtle grid lines
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
    ctx.lineWidth = 1;
    for (let c = 1; c < COLS; c++) {
        const x = boardLeft + c * CELL_WIDTH;
        ctx.beginPath();
        ctx.moveTo(x, startYThreshold + 4);
        ctx.lineTo(x, boardBottom - 4);
        ctx.stroke();
    }

    // Danger Deadline (Upper red warning line)
    const dangerGlow = (inDangerZone && Math.floor(Date.now() / 200) % 2 === 0);
    ctx.strokeStyle = dangerGlow ? '#ef4444' : 'rgba(244, 63, 94, 0.65)';
    ctx.lineWidth = dangerGlow ? 4 : 2.5;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.moveTo(boardLeft, startYThreshold);
    ctx.lineTo(boardLeft + boardWidth, startYThreshold);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
}

// Draw Board Foreground Border & Badges (Rendered AFTER blocks so frame is always clean)
function drawBoardForeground(ctx) {
    const boardLeft = 20;
    const boardWidth = 410;
    const boardHeight = 470;
    const boardRight = boardLeft + boardWidth;

    ctx.save();

    // Outer border with neon glow
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(boardLeft, startYThreshold, boardWidth, boardHeight, 18);
    ctx.stroke();

    // Deadline warning badge
    const dangerGlow = (inDangerZone && Math.floor(Date.now() / 200) % 2 === 0);
    ctx.font = '900 10.5px "M PLUS Rounded 1c"';
    ctx.textAlign = 'right';
    ctx.fillStyle = dangerGlow ? '#ef4444' : '#f43f5e';
    ctx.fillText("⚠️ DEADLINE ⚠️", boardRight - 10, startYThreshold - 6);

    ctx.restore();
}

// Legacy combined wrapper
function drawBoardOutline(ctx) {
    drawBoardBackground(ctx);
    drawBoardForeground(ctx);
}

// Draw Animated Boss Monster
function drawMonster(ctx, x, y, type, time) {
    ctx.save();

    let ox = 0, oy = 0;
    let scaleX = 1.0, scaleY = 1.0;
    let rot = 0;

    // Monster Defeat Drama Animation (Bug #4 fixed!)
    if (gameState === STATE_BOSS_DEFEATED) {
        const t = Math.min(1.0, bossDefeatTimer / 45);
        rot = t * Math.PI * 4; // Rapid dizzy spin
        scaleX = Math.max(0, 1.0 - t * 0.95);
        scaleY = Math.max(0, 1.0 - t * 0.95);
        oy = -30 * Math.sin(t * Math.PI);
    } else if (gameState === STATE_MONSTER_ATTACK) {
        if (monsterAttackTimer < 45) {
            // Charging back
            const t = monsterAttackTimer / 45;
            oy = -15 * t;
            scaleX = 1.0 - 0.1 * t;
            scaleY = 1.0 - 0.1 * t;
            ox = (Math.random() - 0.5) * 4;
        } else if (monsterAttackTimer >= 45 && monsterAttackTimer < 55) {
            // Strike dive
            const t = (monsterAttackTimer - 45) / 10;
            oy = -15 + 45 * t;
            scaleX = 0.9 + 0.3 * t;
            scaleY = 0.9 + 0.3 * t;
        } else {
            // Recover
            const t = Math.min(1.0, (monsterAttackTimer - 55) / 20);
            oy = 30 - 30 * t;
            scaleX = 1.2 - 0.2 * t;
            scaleY = 1.2 - 0.2 * t;
        }
    }

    if (monsterShake > 0) {
        ox += (Math.random() - 0.5) * 8;
        oy += (Math.random() - 0.5) * 8;
    }

    const isWeak = monsterHP < monsterMaxHP * 0.4 || gameState === STATE_BOSS_DEFEATED;

    ctx.translate(x + ox, y + oy);
    ctx.rotate(rot);

    if (isWeak && gameState !== STATE_BOSS_DEFEATED) {
        ctx.rotate(0.06 * Math.sin(time / 150));
    }

    ctx.scale(scaleX, scaleY);
    const flash = monsterFlash > 0;

    // Sweat droplets when weak
    if (isWeak && !flash && gameState !== STATE_BOSS_DEFEATED) {
        ctx.save();
        ctx.fillStyle = '#38bdf8';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(22, -22, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(19.5, -22);
        ctx.lineTo(22, -27);
        ctx.lineTo(24.5, -22);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
    }

    const drawWorriedFace = (c, eyeOffsetX, eyeY, mouthY) => {
        c.save();
        c.strokeStyle = '#0f172a';
        c.lineCap = 'round';
        c.lineWidth = 2.5;

        // Spinning dizzy eyes (@ @) if defeated
        if (gameState === STATE_BOSS_DEFEATED) {
            c.beginPath();
            c.arc(-eyeOffsetX, eyeY, 4, 0, Math.PI * 1.5);
            c.stroke();
            c.beginPath();
            c.arc(eyeOffsetX, eyeY, 4, 0, Math.PI * 1.5);
            c.stroke();
        } else {
            // Left eye ( > )
            c.beginPath();
            c.moveTo(-eyeOffsetX - 3, eyeY - 2);
            c.lineTo(-eyeOffsetX + 3, eyeY + 2);
            c.lineTo(-eyeOffsetX - 3, eyeY + 6);
            c.stroke();

            // Right eye ( < )
            c.beginPath();
            c.moveTo(eyeOffsetX + 3, eyeY - 2);
            c.lineTo(eyeOffsetX - 3, eyeY + 2);
            c.lineTo(eyeOffsetX + 3, eyeY + 6);
            c.stroke();
        }

        // Frowning mouth
        c.beginPath();
        c.arc(0, mouthY + 3, 4, Math.PI, 0, false);
        c.stroke();
        c.restore();
    };

    switch (type) {
        case "slime": {
            const bounce = Math.sin(time / 200) * 5;
            ctx.translate(0, bounce);

            ctx.beginPath();
            ctx.ellipse(0, 5, 30, 24, 0, 0, Math.PI * 2);
            ctx.fillStyle = flash ? '#ef4444' : '#38bdf8';
            ctx.fill();
            ctx.strokeStyle = flash ? '#991b1b' : '#0369a1';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Highlight glare
            ctx.beginPath();
            ctx.ellipse(-8, -6, 7, 3, Math.PI / 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.fill();

            if (isWeak) {
                drawWorriedFace(ctx, 8, 0, 5);
            } else {
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(-8, 0, 3.5, 0, Math.PI * 2);
                ctx.arc(8, 0, 3.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.arc(0, 5, 4, 0, Math.PI, false);
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 2.5;
                ctx.stroke();
            }
            break;
        }
        case "bat": {
            const flap = Math.sin(time / 80) * 12;
            const floatY = Math.sin(time / 150) * 4;
            ctx.translate(0, floatY);

            ctx.fillStyle = flash ? '#ef4444' : '#7e22ce';
            ctx.strokeStyle = flash ? '#991b1b' : '#3b0764';
            ctx.lineWidth = 3;

            // Left wing
            ctx.beginPath();
            ctx.moveTo(-15, 0);
            ctx.lineTo(-42, -10 + flap);
            ctx.lineTo(-30, 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Right wing
            ctx.beginPath();
            ctx.moveTo(15, 0);
            ctx.lineTo(42, -10 + flap);
            ctx.lineTo(30, 10);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Body
            ctx.beginPath();
            ctx.arc(0, 0, 20, 0, Math.PI * 2);
            ctx.fillStyle = flash ? '#ef4444' : '#a855f7';
            ctx.fill();
            ctx.stroke();

            // Ears
            ctx.beginPath();
            ctx.moveTo(-15, -12); ctx.lineTo(-10, -25); ctx.lineTo(-3, -16);
            ctx.moveTo(15, -12); ctx.lineTo(10, -25); ctx.lineTo(3, -16);
            ctx.fillStyle = flash ? '#ef4444' : '#a855f7';
            ctx.fill();
            ctx.stroke();

            if (isWeak) {
                drawWorriedFace(ctx, 6, -2, 6);
            } else {
                ctx.fillStyle = '#ef4444';
                ctx.beginPath();
                ctx.arc(-6, -2, 2.5, 0, Math.PI * 2);
                ctx.arc(6, -2, 2.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.strokeStyle = flash ? '#991b1b' : '#3b0764';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(-6, 6); ctx.lineTo(-4, 10); ctx.lineTo(-2, 6);
                ctx.moveTo(2, 6); ctx.lineTo(4, 10); ctx.lineTo(6, 6);
                ctx.stroke();
            }
            break;
        }
        case "ghost": {
            const floatX = Math.cos(time / 250) * 6;
            const floatY = Math.sin(time / 250) * 6;
            ctx.translate(floatX, floatY);

            ctx.fillStyle = flash ? '#ef4444' : '#ffffff';
            ctx.strokeStyle = flash ? '#991b1b' : '#94a3b8';
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.moveTo(-20, -10);
            ctx.bezierCurveTo(-20, -35, 20, -35, 20, -10);
            ctx.lineTo(20, 20);
            const wave = Math.sin(time / 100) * 3;
            ctx.quadraticCurveTo(10, 15 + wave, 0, 20);
            ctx.quadraticCurveTo(-10, 15 + wave, -20, 20);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Arms
            ctx.beginPath();
            ctx.ellipse(-18, 2, 8, 4, -Math.PI / 6, 0, Math.PI * 2);
            ctx.ellipse(18, 2, 8, 4, Math.PI / 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            if (isWeak) {
                drawWorriedFace(ctx, 6, -8, -2);
            } else {
                ctx.fillStyle = '#1e293b';
                ctx.beginPath();
                ctx.arc(-6, -8, 2.5, 0, Math.PI * 2);
                ctx.arc(6, -8, 2.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
                ctx.beginPath();
                ctx.arc(-11, -4, 3, 0, Math.PI * 2);
                ctx.arc(11, -4, 3, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.arc(0, -2, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = '#1e293b';
                ctx.fill();
            }
            break;
        }
        case "goblin": {
            const jiggle = Math.sin(time / 120) * 4;
            ctx.translate(jiggle, 0);

            ctx.fillStyle = flash ? '#ef4444' : '#22c55e';
            ctx.strokeStyle = flash ? '#991b1b' : '#14532d';
            ctx.lineWidth = 3;

            // Ears
            ctx.beginPath();
            ctx.moveTo(-15, -10); ctx.lineTo(-38, -18); ctx.lineTo(-18, 2);
            ctx.moveTo(15, -10); ctx.lineTo(38, -18); ctx.lineTo(18, 2);
            ctx.fill();
            ctx.stroke();

            // Head
            ctx.beginPath();
            ctx.arc(0, 0, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Horn
            ctx.beginPath();
            ctx.moveTo(-5, -20); ctx.lineTo(0, -32); ctx.lineTo(5, -20);
            ctx.fill();
            ctx.stroke();

            if (isWeak) {
                drawWorriedFace(ctx, 7, -2, 9);
                ctx.beginPath();
                ctx.moveTo(0, -2); ctx.lineTo(-4, 4); ctx.lineTo(4, 4);
                ctx.closePath();
                ctx.fillStyle = flash ? '#ef4444' : '#16a34a';
                ctx.fill();
                ctx.stroke();
            } else {
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(-10, -6); ctx.lineTo(-4, -4);
                ctx.moveTo(10, -6); ctx.lineTo(4, -4);
                ctx.stroke();

                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(-7, -2, 2.5, 0, Math.PI * 2);
                ctx.arc(7, -2, 2.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(0, -2); ctx.lineTo(-4, 4); ctx.lineTo(4, 4);
                ctx.closePath();
                ctx.fillStyle = flash ? '#ef4444' : '#16a34a';
                ctx.fill();
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(-8, 9);
                ctx.quadraticCurveTo(0, 14, 8, 9);
                ctx.strokeStyle = '#0f172a';
                ctx.stroke();
            }
            break;
        }
        case "king_slime": {
            const bounce = Math.sin(time / 350) * 6;
            ctx.translate(0, bounce);

            ctx.beginPath();
            ctx.ellipse(0, 8, 38, 30, 0, 0, Math.PI * 2);
            const grad = ctx.createRadialGradient(-10, -5, 5, 0, 5, 38);
            grad.addColorStop(0, flash ? '#fca5a5' : '#fef08a');
            grad.addColorStop(0.5, flash ? '#ef4444' : '#eab308');
            grad.addColorStop(1, flash ? '#991b1b' : '#a16207');
            ctx.fillStyle = grad;
            ctx.strokeStyle = flash ? '#7f1d1d' : '#713f12';
            ctx.lineWidth = 3.5;
            ctx.fill();
            ctx.stroke();

            // Crown
            ctx.fillStyle = '#fbbf24';
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-18, -20);
            ctx.lineTo(-24, -36);
            ctx.lineTo(-8, -28);
            ctx.lineTo(0, -42);
            ctx.lineTo(8, -28);
            ctx.lineTo(24, -36);
            ctx.lineTo(18, -20);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Gem
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(0, -32, 3, 0, Math.PI * 2);
            ctx.fill();

            if (isWeak) {
                drawWorriedFace(ctx, 10, 4, 11);
            } else {
                ctx.fillStyle = '#0f172a';
                ctx.beginPath();
                ctx.arc(-10, 4, 3.5, 0, Math.PI * 2);
                ctx.arc(10, 4, 3.5, 0, Math.PI * 2);
                ctx.fill();

                ctx.beginPath();
                ctx.arc(0, 11, 6, 0, Math.PI, false);
                ctx.strokeStyle = '#0f172a';
                ctx.lineWidth = 2.5;
                ctx.stroke();
            }
            break;
        }
    }
    ctx.restore();
}

// Draw Battle Arena Top HUD
function drawBattleArena(ctx) {
    if (gameState === STATE_TITLE) return;

    const time = Date.now();

    // Mode-specific HUD
    if (gameMode === MODE_ENDLESS) {
        // Endless Mode Header Banner
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '900 16px "M PLUS Rounded 1c"';
        ctx.fillStyle = '#9333ea';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeText(`✨ エンドレスモード (連鎖スコアアタック) ✨`, 225, 84);
        ctx.fillText(`✨ エンドレスモード (連鎖スコアアタック) ✨`, 225, 84);

        // Stats summary badge in place of monster HP
        ctx.fillStyle = 'rgba(243, 232, 255, 0.85)';
        ctx.beginPath();
        ctx.roundRect(115, 96, 220, 24, 12);
        ctx.fill();
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = '900 11px "M PLUS Rounded 1c"';
        ctx.fillStyle = '#6b21a8';
        ctx.fillText(`消したブロック数: ${totalBlocksPopped} 個`, 225, 112);
        ctx.restore();
        return;
    }

    // --- STAGE BATTLE MODE ---
    // 1. Stage and Boss Name
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '900 16px "M PLUS Rounded 1c"';
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;

    const monsterName = currentMonster ? currentMonster.name : "";
    ctx.strokeText(`STAGE ${stage}: ${monsterName}`, 225, 84);
    ctx.fillText(`STAGE ${stage}: ${monsterName}`, 225, 84);

    // 2. Multi-layer Monster HP Bar with trailing damage chip animation
    const barX = 125;
    const barY = 96;
    const barW = 200;
    const barH = 14;

    // Background track
    ctx.fillStyle = 'rgba(226, 232, 240, 0.9)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 7);
    ctx.fill();

    // Smooth damage chip calculation
    if (monsterDamageChipHP > monsterHP) {
        monsterDamageChipHP = Math.max(monsterHP, monsterDamageChipHP - 1.2);
    } else {
        monsterDamageChipHP = monsterHP;
    }

    const chipRatio = Math.max(0, monsterDamageChipHP / monsterMaxHP);
    const hpRatio = Math.max(0, monsterHP / monsterMaxHP);

    // Trailing Damage Chip (Yellow)
    if (chipRatio > hpRatio) {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * chipRatio, barH, 7);
        ctx.fill();
    }

    // Main HP Bar Fill
    let barColor = '#22c55e';
    if (hpRatio < 0.3) barColor = '#ef4444';
    else if (hpRatio < 0.6) barColor = '#eab308';

    if (hpRatio > 0) {
        ctx.fillStyle = barColor;
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW * hpRatio, barH, 7);
        ctx.fill();
    }

    // HP Text
    ctx.font = '900 9.5px "M PLUS Rounded 1c"';
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'center';
    ctx.fillText(`HP: ${monsterHP} / ${monsterMaxHP}`, 225, barY + 10.5);

    // 3. Draw Monster Character
    if (currentMonster && (monsterHP > 0 || gameState === STATE_BOSS_DEFEATED)) {
        drawMonster(ctx, 225, 146, currentMonster.type, time);
    }

    // 3.5. Enemy Turn Countdown Badge (Puzzle & Dragons style: "あと 2", "⚠️ あと 1")
    if (currentMonster && monsterHP > 0 && gameState !== STATE_BOSS_DEFEATED) {
        ctx.save();
        const badgeX = 345;
        const badgeY = 142;
        const turnsLeft = (typeof enemyTurnCounter !== 'undefined') ? enemyTurnCounter : 2;
        const isUrgent = (turnsLeft <= 1);
        const pulse = isUrgent ? Math.sin(time / 100) * 1.5 : 0;

        ctx.fillStyle = isUrgent ? '#ef4444' : '#0284c7';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.shadowColor = isUrgent ? 'rgba(239, 68, 68, 0.6)' : 'rgba(2, 132, 199, 0.4)';
        ctx.shadowBlur = isUrgent ? 8 : 4;

        ctx.beginPath();
        ctx.roundRect(badgeX - 42 - pulse, badgeY - 14 - pulse, 84 + pulse * 2, 28 + pulse * 2, 14);
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.font = '900 12.5px "M PLUS Rounded 1c"';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        const turnText = isUrgent ? "⚠️ あと 1" : `あと ${turnsLeft}`;
        ctx.fillText(turnText, badgeX, badgeY + 4.5);
        ctx.restore();
    }

    // 4. Pending Garbage Icons & Precise Count Text (Puyo Puyo style)
    if (pendingGarbageCount > 0) {
        ctx.save();
        ctx.textAlign = 'left';
        ctx.font = '900 13px "M PLUS Rounded 1c"';
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;

        const label = "おじゃま予告:";
        ctx.strokeText(label, 115, 198);
        ctx.fillText(label, 115, 198);

        const iconCount = Math.min(6, Math.ceil(pendingGarbageCount));
        for (let i = 0; i < iconCount; i++) {
            ctx.beginPath();
            ctx.arc(205 + i * 16, 194, 6.5, 0, Math.PI * 2);
            ctx.fillStyle = '#cbd5e1';
            ctx.strokeStyle = '#64748b';
            ctx.lineWidth = 1.8;
            ctx.fill();
            ctx.stroke();
        }

        ctx.font = '900 11px "M PLUS Rounded 1c"';
        const countText = `(計 ${Math.ceil(pendingGarbageCount)}個)`;
        ctx.strokeText(countText, 205 + iconCount * 16 + 5, 198);
        ctx.fillText(countText, 205 + iconCount * 16 + 5, 198);

        ctx.restore();
    }

    ctx.restore();
}

// Drag Timer HUD
function drawTimerUI(ctx) {
    if (gameState !== STATE_DRAGGING) return;

    const elapsed = Date.now() - dragStartTime;
    const remaining = Math.max(0, dragDurationLimit - elapsed);
    const progress = remaining / dragDurationLimit;

    ctx.save();

    // 1. Background Track for Timer Bar
    const barX = 20;
    const barY = startYThreshold - 13;
    const barW = 410;
    const barH = 7;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, 3.5);
    ctx.fill();

    // 2. Dynamic Gradient Progress Fill
    const fillWidth = barW * progress;
    if (fillWidth > 0) {
        const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
        if (progress > 0.5) {
            grad.addColorStop(0, '#10b981');
            grad.addColorStop(1, '#06b6d4');
        } else if (progress > 0.25) {
            grad.addColorStop(0, '#f59e0b');
            grad.addColorStop(1, '#f97316');
        } else {
            grad.addColorStop(0, '#ef4444');
            grad.addColorStop(1, '#f43f5e');
        }
        ctx.fillStyle = grad;
        ctx.shadowColor = progress < 0.25 ? '#ef4444' : '#06b6d4';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(barX, barY, fillWidth, barH, 3.5);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // 3. Pulsing Countdown Text
    const secondsLeft = (remaining / 1000).toFixed(1);
    const isUrgent = progress < 0.35;
    let shakeX = 0, shakeY = 0;
    if (isUrgent) {
        shakeX = (Math.random() - 0.5) * 4;
        shakeY = (Math.random() - 0.5) * 4;
    }

    ctx.textAlign = 'center';
    ctx.font = '900 34px "M PLUS Rounded 1c"';
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = isUrgent ? '#ef4444' : '#0284c7';

    const textX = 225 + shakeX;
    const textY = startYThreshold - 48 + shakeY;
    ctx.strokeText(secondsLeft, textX, textY);
    ctx.fillText(secondsLeft, textX, textY);

    ctx.restore();
}

// Combo Callout Banner
function drawComboBanner(ctx) {
    if (comboBannerScale <= 0) return;

    comboBannerScale -= 0.04;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '900 48px "M PLUS Rounded 1c"';

    const currentBannerScale = 1.0 + comboBannerScale * 0.8;
    ctx.translate(225, 270);
    ctx.scale(currentBannerScale, currentBannerScale);

    let subText = "";
    if (currentCombo >= 7) subText = "✨ウルトラ伝説！✨";
    else if (currentCombo >= 5) subText = "💖すごすぎる！！💖";
    else if (currentCombo >= 3) subText = "🔥いいね！！🔥";

    const hue = (Date.now() / 3.5) % 360;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 12;
    ctx.strokeText(comboBannerText, 0, -10);

    const grad = ctx.createLinearGradient(-150, 0, 150, 0);
    grad.addColorStop(0, `hsl(${hue}, 100%, 55%)`);
    grad.addColorStop(0.5, `hsl(${(hue + 120) % 360}, 100%, 60%)`);
    grad.addColorStop(1, `hsl(${(hue + 240) % 360}, 100%, 55%)`);
    ctx.fillStyle = grad;
    ctx.fillText(comboBannerText, 0, -10);

    if (subText) {
        ctx.font = '900 24px "M PLUS Rounded 1c"';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 6;
        ctx.strokeText(subText, 0, 30);
        ctx.fillStyle = '#ffeb3b';
        ctx.fillText(subText, 0, 30);
    }

    ctx.restore();
}

// Title Screen
function drawTitleScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    ctx.textAlign = 'center';
    ctx.font = '900 36px "M PLUS Rounded 1c"';
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeText("ぷるぽよチェイン", 225, 210);
    ctx.fillText("ぷるぽよチェイン", 225, 210);

    ctx.font = '800 15px "M PLUS Rounded 1c"';
    ctx.fillStyle = '#64748b';
    ctx.fillText("〜 物理連鎖パズルバトル 〜", 225, 245);

    // Slime Mascot on Title
    drawMonster(ctx, 225, 335, 'slime', Date.now());

    // Game Mode Toggle Hint
    ctx.font = '900 13px "M PLUS Rounded 1c"';
    ctx.fillStyle = '#a855f7';
    ctx.fillText(gameMode === MODE_STAGE ? "モード: 👑 ステージバトル" : "モード: ♾️ エンドレス (スコアアタック)", 225, 405);

    // Play Button with breathing scale animation
    const scale = 1.0 + Math.sin(Date.now() / 250) * 0.04;
    ctx.translate(225, 465);
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.roundRect(-100, -28, 200, 56, 28);
    const btnGrad = ctx.createLinearGradient(-100, 0, 100, 0);
    btnGrad.addColorStop(0, '#0ea5e9');
    btnGrad.addColorStop(1, '#3b82f6');
    ctx.fillStyle = btnGrad;
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = '900 20px "M PLUS Rounded 1c"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("ゲームスタート", 0, 7);

    ctx.restore();
}

// Game Over Screen
function drawGameOverScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    ctx.textAlign = 'center';
    ctx.font = '900 38px "M PLUS Rounded 1c"';
    ctx.fillStyle = '#f43f5e';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeText("GAME OVER", 225, 240);
    ctx.fillText("GAME OVER", 225, 240);

    ctx.font = '900 22px "M PLUS Rounded 1c"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`SCORE: ${score}`, 225, 290);

    ctx.font = '800 15px "M PLUS Rounded 1c"';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`到達: STAGE ${stage}`, 225, 325);

    // Retry Button
    const scale = 1.0 + Math.sin(Date.now() / 250) * 0.04;
    ctx.translate(225, 430);
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.roundRect(-110, -26, 220, 52, 26);
    ctx.fillStyle = '#0ea5e9';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.font = '900 19px "M PLUS Rounded 1c"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("もういちど遊ぶ", 0, 7);

    ctx.restore();
}

// Victory Screen
function drawVictoryScreen(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);

    ctx.textAlign = 'center';
    ctx.font = '900 42px "M PLUS Rounded 1c"';
    ctx.fillStyle = '#ffd43b';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeText("✨ VICTORY! ✨", 225, 200);
    ctx.fillText("✨ VICTORY! ✨", 225, 200);

    ctx.font = '900 20px "M PLUS Rounded 1c"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("全ステージ制覇！おめでとう！", 225, 245);

    ctx.font = '900 28px "M PLUS Rounded 1c"';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`SCORE: ${score}`, 225, 295);

    // EX Stage Button
    ctx.save();
    ctx.translate(225, 385);
    ctx.beginPath();
    ctx.roundRect(-120, -25, 240, 50, 25);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = '900 17px "M PLUS Rounded 1c"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("EXステージに挑戦！", 0, 6);
    ctx.restore();

    // Restart Button
    ctx.save();
    ctx.translate(225, 465);
    ctx.beginPath();
    ctx.roundRect(-120, -25, 240, 50, 25);
    ctx.fillStyle = '#0ea5e9';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = '900 17px "M PLUS Rounded 1c"';
    ctx.fillStyle = '#ffffff';
    ctx.fillText("最初からあそぶ", 0, 6);
    ctx.restore();

    ctx.restore();
}
