/* ==========================================================
   animals.js - どうぶつ10種の 物理形状 + クレヨン調グラフィック
   座標はすべて「デザイン座標」(原点=キャラの見た目中心, y下向き, px)
   ========================================================== */
(function () {
    'use strict';

    const C = window.Crayon;
    const P = C.P;
    const INK = '#5a3d2b';

    /** 楕円を凸多角形の点列に */
    function ellipsePts(cx, cy, rx, ry, n = 12) {
        const pts = [];
        for (let i = 0; i < n; i++) {
            const t = (i / n) * Math.PI * 2;
            pts.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]);
        }
        return pts;
    }

    /** 回転付きで描くヘルパー */
    function rotated(ctx, x, y, a, fn) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a);
        fn();
        ctx.restore();
    }

    function eye(ctx, x, y, r = 2.2) { C.dot(ctx, x, y, r); }

    function smile(ctx, x, y, w = 3, rand) {
        C.stroke(ctx, P.curve(x - w, y, x, y + w * 0.8, x + w, y), INK, 1.6, { rand });
    }

    // カメの甲羅（平たいドーム）
    const turtleDome = (() => {
        const pts = [];
        const n = 10;
        for (let i = 0; i <= n; i++) {
            const t = Math.PI - (i / n) * Math.PI;
            const s = Math.sin(t);
            pts.push([Math.round(Math.cos(t) * 24 * 10) / 10, Math.round((4 - 14 * Math.pow(s, 0.55)) * 10) / 10]);
        }
        return pts;
    })();

    const ANIMALS = [
        /* 1. ゾウ ------------------------------------------------ */
        {
            id: 'elephant', name: 'ゾウ', emoji: '🐘',
            density: 0.003, friction: 1.0, frictionStatic: 1.5, restitution: 0.01,
            parts: [
                { t: 'rect', x: 6, y: 0, w: 48, h: 28 },
                { t: 'rect', x: -10, y: 16, w: 12, h: 12 },
                { t: 'rect', x: 22, y: 16, w: 12, h: 12 },
                { t: 'circle', x: -18, y: -6, r: 14 },
                { t: 'rect', x: -29, y: 8, w: 7, h: 18 },
            ],
            draw(ctx, r) {
                const col = '#a9b8cc';
                const dark = '#93a3b9';
                C.stroke(ctx, P.curve(29, -4, 36, 0, 35, 8), INK, 2, { rand: r });
                C.shape(ctx, P.rrc(22, 16, 12, 12, 3), dark, { rand: r });
                C.shape(ctx, P.rrc(-10, 16, 12, 12, 3), dark, { rand: r });
                C.shape(ctx, P.rrc(6, 0, 48, 28, 12), col, { rand: r });
                C.shape(ctx, P.rrc(-29, 8, 7, 19, 3.5), col, { rand: r });
                C.shape(ctx, P.circle(-18, -6, 14), col, { rand: r });
                C.shape(ctx, P.ellipse(-4, -4, 9, 12, 0.15), dark, { rand: r });
                C.fill(ctx, P.ellipse(-4, -4, 5, 8, 0.15), '#f2bcc4', { rand: r });
                // つめ
                [[-14, 21], [-6, 21], [18, 21], [26, 21]].forEach(([x, y]) =>
                    C.fill(ctx, P.ellipse(x, y, 2, 1.3), '#fffaf0', { hatch: false }));
                eye(ctx, -23, -9);
                C.cheek(ctx, -25, -1, 3);
            },
        },
        /* 2. キリン ------------------------------------------------ */
        {
            id: 'giraffe', name: 'キリン', emoji: '🦒',
            density: 0.0016, friction: 0.98, frictionStatic: 1.4, restitution: 0.02,
            parts: [
                { t: 'rect', x: 6, y: 10, w: 34, h: 18 },
                { t: 'rect', x: -6, y: 26, w: 8, h: 16 },
                { t: 'rect', x: 18, y: 26, w: 8, h: 16 },
                { t: 'rect', x: -6, y: -14, w: 9, h: 36, d: 0.002 },
                { t: 'rect', x: -11, y: -34, w: 20, h: 11, d: 0.0035 },
            ],
            draw(ctx, r) {
                const col = '#f7c948';
                const spot = '#d98a3a';
                C.stroke(ctx, P.curve(22, 5, 28, 8, 27, 16), INK, 1.8, { rand: r });
                C.fill(ctx, P.ellipse(27, 17, 2.5, 3.5), '#7a4a26', { hatch: false });
                C.shape(ctx, P.rrc(18, 26, 6, 16, 3), col, { rand: r });
                C.shape(ctx, P.rrc(-6, 26, 6, 16, 3), col, { rand: r });
                C.fill(ctx, P.rrc(18, 32.5, 6, 3, 1), '#7a4a26', { hatch: false });
                C.fill(ctx, P.rrc(-6, 32.5, 6, 3, 1), '#7a4a26', { hatch: false });
                C.shape(ctx, P.rrc(6, 10, 34, 18, 8), col, { rand: r });
                C.shape(ctx, P.rrc(-6, -13, 9, 38, 4.5), col, { rand: r });
                // たてがみ
                C.stroke(ctx, P.line([[-1, -30], [-0.5, -20], [-1, -10], [-0.5, 0]]), '#b5652a', 2.4, { rand: r });
                // もよう
                [[0, 8, 4, 3], [12, 13, 4, 3], [18, 6, 3, 2.5], [-6, -20, 2.5, 3], [-6, -6, 2.5, 3], [5, 15, 2.5, 2]].forEach(([x, y, a, b]) =>
                    C.fill(ctx, P.ellipse(x, y, a, b, 0.4), spot, { rand: r }));
                // つの
                C.stroke(ctx, P.line([[-7, -39], [-8, -45]]), INK, 2, { rand: r });
                C.stroke(ctx, P.line([[-2, -39], [-1, -45]]), INK, 2, { rand: r });
                C.fill(ctx, P.circle(-8, -45.5, 2), '#b5652a', { hatch: false });
                C.fill(ctx, P.circle(-1, -45.5, 2), '#b5652a', { hatch: false });
                C.shape(ctx, P.ellipse(1, -37, 4, 2, -0.4), col, { rand: r });
                C.shape(ctx, P.rrc(-11, -34, 20, 11, 5.5), col, { rand: r });
                C.fill(ctx, P.ellipse(-17, -32.5, 4.5, 4), '#fbe3a0', { rand: r });
                C.fill(ctx, P.circle(-19, -33, 0.9), INK, { hatch: false });
                eye(ctx, -9, -36, 1.9);
                C.cheek(ctx, -10, -31, 2.5);
            },
        },
        /* 3. ペンギン ------------------------------------------------ */
        {
            id: 'penguin', name: 'ペンギン', emoji: '🐧',
            density: 0.0014, friction: 0.95, frictionStatic: 1.4, restitution: 0.02,
            parts: [
                { t: 'poly', pts: [[-12, -14], [12, -14], [20, 8], [17, 18], [-17, 18], [-20, 8]] },
                { t: 'circle', x: 0, y: -16, r: 13 },
                { t: 'rect', x: 0, y: 17, w: 34, h: 4, d: 0.003 },
            ],
            draw(ctx, r) {
                const col = '#3f4f72';
                C.shape(ctx, P.ellipse(-8, 16.5, 6, 2.6), '#ffa630', { rand: r });
                C.shape(ctx, P.ellipse(8, 16.5, 6, 2.6), '#ffa630', { rand: r });
                C.shape(ctx, P.ellipse(-19, 1, 4, 10, 0.35), col, { rand: r });
                C.shape(ctx, P.ellipse(19, 1, 4, 10, -0.35), col, { rand: r });
                C.shape(ctx, P.smooth([[0, -30], [11, -27], [14, -12], [20, 6], [17, 17], [0, 18.5], [-17, 17], [-20, 6], [-14, -12], [-11, -27]]), col, { rand: r });
                C.fill(ctx, P.ellipse(0, 5, 12, 12.5), '#fffaf0', { rand: r });
                C.fill(ctx, P.ellipse(-5, -16, 5.5, 5), '#fffaf0', { rand: r });
                C.fill(ctx, P.ellipse(5, -16, 5.5, 5), '#fffaf0', { rand: r });
                eye(ctx, -5, -16.5, 2);
                eye(ctx, 5, -16.5, 2);
                C.shape(ctx, P.poly([[-3.5, -12], [3.5, -12], [0, -7.5]]), '#ffa630', { rand: r, lineWidth: 1.4 });
                C.cheek(ctx, -9, -11, 2.5);
                C.cheek(ctx, 9, -11, 2.5);
            },
        },
        /* 4. カメ ------------------------------------------------ */
        {
            id: 'turtle', name: 'カメ', emoji: '🐢',
            density: 0.0022, friction: 1.0, frictionStatic: 1.5, restitution: 0.01,
            parts: [
                { t: 'poly', pts: turtleDome },
                { t: 'rect', x: 0, y: 9, w: 52, h: 10, d: 0.0042 },
                { t: 'circle', x: 30, y: 4, r: 7, d: 0.0015 },
            ],
            draw(ctx, r) {
                const skin = '#bfdc7f';
                C.shape(ctx, P.poly([[-24, 6], [-31, 9], [-24, 11]]), skin, { rand: r, lineWidth: 1.6 });
                C.shape(ctx, P.rrc(-15, 10.5, 10, 7, 3), skin, { rand: r });
                C.shape(ctx, P.rrc(15, 10.5, 10, 7, 3), skin, { rand: r });
                C.shape(ctx, P.ellipse(30, 4, 8, 7), skin, { rand: r });
                C.shape(ctx, P.smooth(turtleDome.concat([[24, 6], [-24, 6]])), '#79c46a', { rand: r });
                C.shape(ctx, P.rrc(0, 7, 52, 6, 3), '#4f9a45', { rand: r });
                // こうらのもよう
                C.stroke(ctx, P.poly([[-6, -6], [6, -6], [9, 0], [6, 4], [-6, 4], [-9, 0]]), '#3c7c35', 1.8, { rand: r });
                C.stroke(ctx, P.line([[-9, 0], [-19, 0]]), '#3c7c35', 1.6, { rand: r });
                C.stroke(ctx, P.line([[9, 0], [19, 0]]), '#3c7c35', 1.6, { rand: r });
                C.stroke(ctx, P.line([[-6, -6], [-10, -10]]), '#3c7c35', 1.6, { rand: r });
                C.stroke(ctx, P.line([[6, -6], [10, -10]]), '#3c7c35', 1.6, { rand: r });
                eye(ctx, 32, 2, 1.8);
                smile(ctx, 31, 6, 2.2, r);
                C.cheek(ctx, 27, 6, 2);
            },
        },
        /* 5. ライオン ------------------------------------------------ */
        {
            id: 'lion', name: 'ライオン', emoji: '🦁',
            density: 0.0018, friction: 0.98, frictionStatic: 1.4, restitution: 0.02,
            parts: [
                { t: 'rect', x: 12, y: 8, w: 32, h: 18 },
                { t: 'rect', x: 2, y: 21, w: 8, h: 10 },
                { t: 'rect', x: 24, y: 21, w: 8, h: 10 },
                { t: 'circle', x: -10, y: -6, r: 17 },
                ...[150, 195, 240, 285, 330].map((deg) => ({
                    t: 'circle', r: 6,
                    x: Math.round((-10 + Math.cos(deg * Math.PI / 180) * 17) * 10) / 10,
                    y: Math.round((-6 + Math.sin(deg * Math.PI / 180) * 17) * 10) / 10,
                })),
            ],
            draw(ctx, r) {
                const col = '#f6c453';
                const mane = '#e3892f';
                C.stroke(ctx, P.curve(27, 4, 35, 2, 34, -6), INK, 2, { rand: r });
                C.shape(ctx, P.circle(34, -8, 3.5), mane, { rand: r, lineWidth: 1.6 });
                C.shape(ctx, P.rrc(24, 21, 8, 10, 3), col, { rand: r });
                C.shape(ctx, P.rrc(12, 8, 32, 18, 8), col, { rand: r });
                C.shape(ctx, P.rrc(2, 21, 8, 10, 3), col, { rand: r });
                // たてがみ (ギザギザ)
                const pts = [];
                for (let i = 0; i < 18; i++) {
                    const a = (i / 18) * Math.PI * 2;
                    const rad = i % 2 ? 17.5 : 23;
                    pts.push([-10 + Math.cos(a) * rad, -6 + Math.sin(a) * rad]);
                }
                C.shape(ctx, P.smooth(pts), mane, { rand: r });
                C.shape(ctx, P.circle(-19, -15, 4), col, { rand: r, lineWidth: 1.6 });
                C.shape(ctx, P.circle(-1, -15, 4), col, { rand: r, lineWidth: 1.6 });
                C.shape(ctx, P.circle(-10, -5, 11.5), col, { rand: r });
                eye(ctx, -14, -8, 2);
                eye(ctx, -6, -8, 2);
                C.fill(ctx, P.poly([[-12.5, -4], [-7.5, -4], [-10, -1.5]]), '#7a4a26', { hatch: false });
                smile(ctx, -12, 0, 2, r);
                smile(ctx, -8, 0, 2, r);
                C.cheek(ctx, -17, -2, 2.5);
                C.cheek(ctx, -3, -2, 2.5);
            },
        },
        /* 6. ハシビロコウ ------------------------------------------------ */
        {
            id: 'shoebill', name: 'ハシビロコウ', emoji: '🐦',
            density: 0.0016, friction: 0.98, frictionStatic: 1.4, restitution: 0.02,
            parts: [
                { t: 'poly', pts: ellipsePts(6, -2, 13, 18, 12) },
                { t: 'circle', x: 2, y: -24, r: 10 },
                { t: 'poly', pts: [[-6, -30], [-30, -25], [-34, -19], [-6, -17]], d: 0.003 },
                { t: 'rect', x: 2, y: 24, w: 4, h: 16 },
                { t: 'rect', x: 10, y: 24, w: 4, h: 16 },
                { t: 'rect', x: 6, y: 32, w: 22, h: 4, d: 0.002 },
            ],
            draw(ctx, r) {
                const col = '#93a7b5';
                const legc = '#626e78';
                C.shape(ctx, P.rrc(2, 24, 4, 17, 2), legc, { rand: r, lineWidth: 1.6 });
                C.shape(ctx, P.rrc(10, 24, 4, 17, 2), legc, { rand: r, lineWidth: 1.6 });
                C.shape(ctx, P.rrc(6, 32, 23, 4, 2), legc, { rand: r, lineWidth: 1.6 });
                C.shape(ctx, P.ellipse(6, -2, 13, 18), col, { rand: r });
                C.shape(ctx, P.ellipse(11, 0, 8, 14, 0.15), '#7a8f9e', { rand: r });
                C.shape(ctx, P.poly([[10, -32], [16, -36], [14, -28]]), col, { rand: r, lineWidth: 1.6 });
                C.shape(ctx, P.circle(2, -24, 10), col, { rand: r });
                C.shape(ctx, P.smooth([[-6, -31], [-20, -28], [-31, -26], [-35, -21], [-33, -18], [-20, -17], [-6, -16]]), '#e6d6a2', { rand: r });
                C.stroke(ctx, P.curve(-7, -23, -20, -21, -32, -22), '#a8946a', 1.4, { rand: r });
                C.fill(ctx, P.circle(-1, -26, 3), '#fff6d8', { hatch: false });
                C.fill(ctx, P.circle(-1, -26, 1.4), '#3a2618', { hatch: false });
                C.stroke(ctx, P.line([[-5, -30], [3, -29]]), INK, 1.8, { rand: r });
            },
        },
        /* 7. カモノハシ ------------------------------------------------ */
        {
            id: 'platypus', name: 'カモノハシ', emoji: '🦫',
            density: 0.0014, friction: 0.98, frictionStatic: 1.4, restitution: 0.02,
            parts: [
                { t: 'poly', pts: ellipsePts(0, 0, 17, 11, 12) },
                { t: 'rect', x: -23, y: 1, w: 16, h: 8 },
                { t: 'rect', x: 24, y: 3, w: 16, h: 9 },
                { t: 'rect', x: -8, y: 12, w: 8, h: 4 },
                { t: 'rect', x: 8, y: 12, w: 8, h: 4 },
            ],
            draw(ctx, r) {
                const col = '#a8754b';
                const bill = '#5d6577';
                C.shape(ctx, P.rrc(-8, 12, 9, 4, 2), bill, { rand: r, lineWidth: 1.6 });
                C.shape(ctx, P.rrc(8, 12, 9, 4, 2), bill, { rand: r, lineWidth: 1.6 });
                C.shape(ctx, P.rrc(24, 3, 18, 9, 4.5), '#8a5a35', { rand: r });
                C.stroke(ctx, P.line([[19, 1], [31, 1]]), '#6b4325', 1.2, { rand: r });
                C.stroke(ctx, P.line([[19, 5], [31, 5]]), '#6b4325', 1.2, { rand: r });
                C.shape(ctx, P.ellipse(0, 0, 17, 11), col, { rand: r });
                C.fill(ctx, P.ellipse(2, 5, 10, 4.5), '#d6a77a', { rand: r });
                C.shape(ctx, P.rrc(-23, 1, 18, 8, 4), bill, { rand: r });
                C.fill(ctx, P.circle(-28, -0.5, 0.9), '#2c2f38', { hatch: false });
                C.fill(ctx, P.circle(-25, -0.5, 0.9), '#2c2f38', { hatch: false });
                eye(ctx, -9, -4, 2);
                C.cheek(ctx, -6, 1, 2.5);
            },
        },
        /* 8. ラクダ ------------------------------------------------ */
        {
            id: 'camel', name: 'ラクダ', emoji: '🐫',
            density: 0.0022, friction: 1.0, frictionStatic: 1.5, restitution: 0.01,
            parts: [
                { t: 'rect', x: 0, y: 4, w: 44, h: 18 },
                { t: 'circle', x: -9, y: -5, r: 9 },
                { t: 'circle', x: 10, y: -5, r: 9 },
                { t: 'rect', x: -25, y: -6, w: 8, h: 22, a: 0.35 },
                { t: 'rect', x: -33, y: -17, w: 15, h: 8 },
                { t: 'rect', x: -15, y: 21, w: 7, h: 16 },
                { t: 'rect', x: 15, y: 21, w: 7, h: 16 },
            ],
            draw(ctx, r) {
                const col = '#dba664';
                C.stroke(ctx, P.curve(21, 0, 26, 6, 24, 12), INK, 1.8, { rand: r });
                C.shape(ctx, P.rrc(15, 21, 7, 17, 3), col, { rand: r });
                C.shape(ctx, P.rrc(-15, 21, 7, 17, 3), col, { rand: r });
                C.shape(ctx, P.circle(-9, -5, 9), col, { rand: r });
                C.shape(ctx, P.circle(10, -5, 9), col, { rand: r });
                rotated(ctx, -25, -6, 0.35, () => C.shape(ctx, P.rrc(0, 0, 8, 23, 4), col, { rand: r }));
                C.shape(ctx, P.rrc(0, 4, 44, 18, 8), col, { rand: r });
                C.fill(ctx, P.rrc(-9, -1, 14, 6, 3), col, { hatch: false });
                C.fill(ctx, P.rrc(10, -1, 14, 6, 3), col, { hatch: false });
                C.shape(ctx, P.ellipse(-25, -21, 2.5, 3.5, -0.3), col, { rand: r, lineWidth: 1.6 });
                C.shape(ctx, P.rrc(-33, -17, 16, 9, 4.5), col, { rand: r });
                C.fill(ctx, P.circle(-39, -16.5, 0.9), INK, { hatch: false });
                eye(ctx, -30, -19, 1.8);
                C.stroke(ctx, P.line([[-33, -21], [-28, -21.5]]), INK, 1.2, { rand: r });
                C.cheek(ctx, -32, -14, 2.2);
            },
        },
        /* 9. パンダ ------------------------------------------------ */
        {
            id: 'panda', name: 'パンダ', emoji: '🐼',
            density: 0.0018, friction: 0.98, frictionStatic: 1.4, restitution: 0.02,
            parts: [
                { t: 'poly', pts: [[-14, -20], [14, -20], [23, -11], [23, 13], [17, 20], [-17, 20], [-23, 13], [-23, -11]] },
                { t: 'circle', x: -15, y: -19, r: 6, d: 0.001 },
                { t: 'circle', x: 15, y: -19, r: 6, d: 0.001 },
                { t: 'rect', x: 0, y: 19, w: 32, h: 4, d: 0.002 },
            ],
            draw(ctx, r) {
                const black = '#3d3d48';
                const white = '#fffaf0';
                C.shape(ctx, P.circle(-15, -19, 6.5), black, { rand: r });
                C.shape(ctx, P.circle(15, -19, 6.5), black, { rand: r });
                C.shape(ctx, P.smooth([[-16, -21], [16, -21], [23, -15], [24, 13], [19, 20.5], [-19, 20.5], [-24, 13], [-23, -15]]), white, { rand: r });
                C.shape(ctx, P.ellipse(-20, 7, 5, 8, 0.3), black, { rand: r });
                C.shape(ctx, P.ellipse(20, 7, 5, 8, -0.3), black, { rand: r });
                C.shape(ctx, P.ellipse(-11, 16, 7, 4.5), black, { rand: r });
                C.shape(ctx, P.ellipse(11, 16, 7, 4.5), black, { rand: r });
                C.fill(ctx, P.ellipse(-8, -6, 5, 6, 0.5), black, { rand: r });
                C.fill(ctx, P.ellipse(8, -6, 5, 6, -0.5), black, { rand: r });
                C.fill(ctx, P.circle(-7.5, -6.5, 1.8), '#fff', { hatch: false });
                C.fill(ctx, P.circle(7.5, -6.5, 1.8), '#fff', { hatch: false });
                C.fill(ctx, P.ellipse(0, 0, 2.5, 1.8), black, { hatch: false });
                smile(ctx, -2, 2.5, 2, r);
                smile(ctx, 2, 2.5, 2, r);
                C.cheek(ctx, -13, 2, 3);
                C.cheek(ctx, 13, 2, 3);
            },
        },
        /* 10. カンガルー ------------------------------------------------ */
        {
            id: 'kangaroo', name: 'カンガルー', emoji: '🦘',
            density: 0.0016, friction: 0.98, frictionStatic: 1.4, restitution: 0.02,
            parts: [
                { t: 'poly', pts: ellipsePts(-4, -2, 11, 17, 12) },
                { t: 'circle', x: -8, y: -24, r: 9 },
                { t: 'rect', x: -6, y: 19, w: 22, h: 6 },
                { t: 'poly', pts: [[4, 4], [10, 0], [34, 17], [32, 22], [26, 22]], d: 0.0026 },
            ],
            draw(ctx, r) {
                const col = '#cc8b4c';
                C.shape(ctx, P.smooth([[3, 5], [10, -1], [22, 8], [35, 18], [32, 22.5], [24, 21], [12, 14]]), col, { rand: r });
                C.shape(ctx, P.rrc(-6, 19.5, 23, 6, 3), col, { rand: r });
                C.shape(ctx, P.ellipse(-4, -2, 11, 17), col, { rand: r });
                C.fill(ctx, P.ellipse(-7, 4, 6, 9), '#f1cb97', { rand: r });
                C.stroke(ctx, P.curve(-12, 6, -7, 9, -2, 6), '#a8693a', 1.4, { rand: r });
                C.shape(ctx, P.ellipse(-13, -6, 2.5, 5, 0.6), col, { rand: r, lineWidth: 1.6 });
                C.shape(ctx, P.ellipse(-5, -36, 2.8, 6.5, 0.15), col, { rand: r, lineWidth: 1.8 });
                C.shape(ctx, P.ellipse(0, -35, 2.8, 6.5, 0.45), col, { rand: r, lineWidth: 1.8 });
                C.shape(ctx, P.smooth([[-8, -33], [-1, -29], [-1, -18], [-10, -15], [-19, -20], [-18, -26]]), col, { rand: r });
                C.fill(ctx, P.circle(-18, -22.5, 1.2), INK, { hatch: false });
                eye(ctx, -10, -26, 1.9);
                C.cheek(ctx, -11, -20, 2.3);
            },
        },
    ];

    /* ---------- 物理ボディ & スプライト生成 ---------- */
    const SPRITE_SCALE = 3;
    const SPRITE_PAD = 14;

    function partBounds(def) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const add = (x, y) => {
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        };
        def.parts.forEach((p) => {
            if (p.t === 'circle') { add(p.x - p.r, p.y - p.r); add(p.x + p.r, p.y + p.r); }
            else if (p.t === 'rect') {
                const c = Math.cos(p.a || 0), s = Math.sin(p.a || 0);
                [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
                    const lx = sx * p.w / 2, ly = sy * p.h / 2;
                    add(p.x + lx * c - ly * s, p.y + lx * s + ly * c);
                });
            } else p.pts.forEach(([x, y]) => add(x, y));
        });
        return { minX, minY, maxX, maxY };
    }

    function buildSprite(def, index) {
        const b = def.bounds;
        const w = b.maxX - b.minX + SPRITE_PAD * 2;
        const h = b.maxY - b.minY + SPRITE_PAD * 2;
        const c = document.createElement('canvas');
        c.width = Math.ceil(w * SPRITE_SCALE);
        c.height = Math.ceil(h * SPRITE_SCALE);
        const g = c.getContext('2d');
        g.scale(SPRITE_SCALE, SPRITE_SCALE);
        g.translate(SPRITE_PAD - b.minX, SPRITE_PAD - b.minY);
        def.draw(g, C.rng(1000 + index * 77));
        return { canvas: c, ox: b.minX - SPRITE_PAD, oy: b.minY - SPRITE_PAD, w, h };
    }

    ANIMALS.forEach((def, i) => {
        def.index = i;
        def.bounds = partBounds(def);
        def.width = def.bounds.maxX - def.bounds.minX;
        def.height = def.bounds.maxY - def.bounds.minY;
    });

    let spritesReady = false;
    function ensureSprites() {
        if (spritesReady) return;
        ANIMALS.forEach((def, i) => { def.sprite = buildSprite(def, i); });
        spritesReady = true;
    }

    /** Matter.js 複合ボディを生成 (デザイン座標の原点 = (0,0)) */
    function createBody(def) {
        const { Bodies, Body, Vertices } = Matter;
        const parts = def.parts.map((p) => {
            const opt = { density: p.d || def.density };
            if (p.t === 'rect') return Bodies.rectangle(p.x, p.y, p.w, p.h, Object.assign(opt, { angle: p.a || 0 }));
            if (p.t === 'circle') return Bodies.circle(p.x, p.y, p.r, opt, 16);
            const verts = Vertices.clockwiseSort(p.pts.map(([x, y]) => ({ x, y })));
            const centre = Vertices.centre(verts);
            return Body.create(Object.assign(opt, { position: centre, vertices: verts }));
        });
        const body = Body.create({
            parts,
            friction: def.friction,
            frictionStatic: def.frictionStatic,
            restitution: def.restitution,
            frictionAir: 0.032,
            slop: 0.04,
            label: def.id,
        });
        // 転がり過ぎを防ぐため慣性モーメントを3.5倍にして踏ん張りやすくする
        Body.setInertia(body, body.inertia * 3.5);
        body.plugin = body.plugin || {};
        body.plugin.def = def;
        body.plugin.offset = { x: body.position.x, y: body.position.y };
        return body;
    }

    /** スプライトを描画 (ctx は既にデザイン座標系) */
    function drawSprite(ctx, def) {
        ensureSprites();
        const s = def.sprite;
        ctx.drawImage(s.canvas, s.ox, s.oy, s.w, s.h);
    }

    window.Animals = { list: ANIMALS, createBody, drawSprite, ensureSprites };
})();
