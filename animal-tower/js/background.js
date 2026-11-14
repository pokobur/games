/* ==========================================================
   background.js - 絵本風の背景3段階 (草原 → 木の上 → 雲の上) と台座
   すべてオフスクリーンキャンバスに事前描画してクロスフェードする
   ========================================================== */
(function () {
    'use strict';

    const C = window.Crayon;
    const P = C.P;
    const BIG = { bounds: 800 };

    function makeLayer(W, H, k, painter, seed) {
        const c = document.createElement('canvas');
        c.width = Math.round(W * k);
        c.height = Math.round(H * k);
        const g = c.getContext('2d');
        g.scale(k, k);
        painter(g, W, H, C.rng(seed));
        return c;
    }

    function sky(g, W, H, top, bottom) {
        const grd = g.createLinearGradient(0, 0, 0, H);
        grd.addColorStop(0, top);
        grd.addColorStop(1, bottom);
        g.fillStyle = grd;
        g.fillRect(0, 0, W, H);
        // 紙の質感
        g.save();
        g.globalAlpha = 0.5;
        g.fillStyle = g.createPattern(C.grain(), 'repeat');
        g.fillRect(0, 0, W, H);
        g.restore();
        // クレヨンの空ストローク
        g.save();
        g.lineCap = 'round';
        for (let i = 0; i < 70; i++) {
            const y = Math.random() * H * 0.8;
            const x = Math.random() * W;
            g.strokeStyle = 'rgba(255,255,255,.18)';
            g.lineWidth = 3 + Math.random() * 4;
            g.beginPath();
            g.moveTo(x, y);
            g.lineTo(x + 30 + Math.random() * 50, y - 6 - Math.random() * 6);
            g.stroke();
        }
        g.restore();
    }

    function cloud(g, x, y, s, r, color = '#ffffff') {
        const pts = [];
        const n = 9;
        for (let i = 0; i < n; i++) {
            const a = (i / n) * Math.PI * 2;
            const rr = (i % 2 ? 0.75 : 1) * s;
            pts.push([x + Math.cos(a) * rr * 1.7, y + Math.sin(a) * rr * 0.8]);
        }
        C.shape(g, P.smooth(pts), color, { rand: r, bounds: 800, lineColor: '#9fb6cc', lineWidth: 2 });
    }

    function flower(g, x, y, r, color) {
        for (let i = 0; i < 5; i++) {
            const a = (i / 5) * Math.PI * 2;
            C.fill(g, P.circle(x + Math.cos(a) * 3.2, y + Math.sin(a) * 3.2, 2.6), color, { hatch: false });
        }
        C.fill(g, P.circle(x, y, 2), '#ffd84a', { hatch: false });
    }

    /* --- 1. 草原 --- */
    function meadow(g, W, H, r) {
        sky(g, W, H, '#a9dcff', '#eaf8ff');
        // おひさま
        g.save();
        g.strokeStyle = '#ffc93c';
        g.lineCap = 'round';
        g.lineWidth = 4;
        for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            g.beginPath();
            g.moveTo(60 + Math.cos(a) * 34, 70 + Math.sin(a) * 34);
            g.lineTo(60 + Math.cos(a) * 46, 70 + Math.sin(a) * 46);
            g.stroke();
        }
        g.restore();
        C.shape(g, P.circle(60, 70, 27), '#ffd84a', { rand: r, lineColor: '#e8a93a', bounds: 800 });
        C.dot(g, 52, 67, 2.2);
        C.dot(g, 68, 67, 2.2);
        C.stroke(g, P.curve(54, 76, 60, 81, 66, 76), '#a8632a', 2, { rand: r });
        cloud(g, 300, 80, 22, r);
        cloud(g, 200, 170, 15, r);
        cloud(g, 350, 230, 12, r);
        // おか
        C.shape(g, P.smooth([[-40, 470], [60, 410], [170, 440], [260, 400], [380, 430], [460, 420], [460, 640], [-40, 640]]), '#a9df8f', Object.assign({ rand: r, lineColor: '#6fa95c' }, BIG));
        C.shape(g, P.smooth([[-40, 520], [90, 480], [200, 505], [320, 470], [460, 500], [460, 640], [-40, 640]]), '#7ccb6a', Object.assign({ rand: r, lineColor: '#4f9a45' }, BIG));
        // 木
        C.shape(g, P.rrc(355, 430, 10, 40, 3), '#a86b3c', { rand: r, bounds: 800 });
        C.shape(g, P.smooth([[360, 380], [385, 395], [385, 420], [360, 430], [335, 420], [335, 395]]), '#5fb35a', { rand: r, bounds: 800 });
        C.shape(g, P.rrc(40, 455, 8, 30, 3), '#a86b3c', { rand: r, bounds: 800 });
        C.shape(g, P.smooth([[44, 420], [62, 432], [62, 452], [44, 460], [26, 452], [26, 432]]), '#6cc070', { rand: r, bounds: 800 });
        // おはな
        const colors = ['#ff8fab', '#ffffff', '#b28dff', '#ffb347'];
        for (let i = 0; i < 26; i++) {
            const x = r() * W;
            const y = 520 + r() * 75;
            if (Math.abs(x - 200) < 120 && y < 560) continue;
            flower(g, x, y, r, colors[i % colors.length]);
        }
        // 草
        g.save();
        g.strokeStyle = '#3f8a3a';
        g.lineWidth = 1.6;
        g.lineCap = 'round';
        for (let i = 0; i < 60; i++) {
            const x = r() * W, y = 500 + r() * 100;
            g.beginPath();
            g.moveTo(x, y);
            g.lineTo(x - 2, y - 6);
            g.moveTo(x, y);
            g.lineTo(x + 2, y - 7);
            g.stroke();
        }
        g.restore();
    }

    /* --- 2. 木の上 --- */
    function treetop(g, W, H, r) {
        sky(g, W, H, '#86c8ff', '#d8f1ff');
        cloud(g, 90, 90, 18, r);
        cloud(g, 320, 150, 14, r);
        // 鳥
        g.save();
        g.strokeStyle = '#5a3d2b';
        g.lineWidth = 2;
        g.lineCap = 'round';
        [[250, 70], [275, 85], [150, 210]].forEach(([x, y]) => {
            g.beginPath();
            g.moveTo(x - 7, y);
            g.quadraticCurveTo(x - 3, y - 5, x, y);
            g.quadraticCurveTo(x + 3, y - 5, x + 7, y);
            g.stroke();
        });
        g.restore();
        // 左右の幹と枝
        C.shape(g, P.poly([[-20, 640], [-20, 120], [22, 140], [30, 640]]), '#9c6235', Object.assign({ rand: r }, BIG));
        C.shape(g, P.poly([[20, 300], [90, 270], [95, 282], [24, 320]]), '#9c6235', Object.assign({ rand: r }, BIG));
        C.shape(g, P.poly([[420, 640], [420, 200], [380, 215], [372, 640]]), '#9c6235', Object.assign({ rand: r }, BIG));
        C.shape(g, P.poly([[380, 380], [310, 350], [306, 362], [378, 400]]), '#9c6235', Object.assign({ rand: r }, BIG));
        // 葉っぱのかたまり
        const leaf = (x, y, s, col) => {
            const pts = [];
            for (let i = 0; i < 10; i++) {
                const a = (i / 10) * Math.PI * 2;
                const rr = s * (i % 2 ? 0.8 : 1);
                pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8]);
            }
            C.shape(g, P.smooth(pts), col, Object.assign({ rand: r, lineColor: '#3a7a35' }, BIG));
        };
        leaf(10, 110, 50, '#5fb35a');
        leaf(85, 265, 28, '#6cc070');
        leaf(400, 190, 48, '#5fb35a');
        leaf(305, 345, 26, '#6cc070');
        // 足元の葉っぱの海
        for (let i = 0; i < 9; i++) leaf(i * 52 - 10, 560 + (i % 2) * 14, 44, i % 2 ? '#4fa04c' : '#5fb35a');
        for (let i = 0; i < 7; i++) {
            C.fill(g, P.circle(30 + i * 58 + r() * 10, 540 + r() * 40, 4), '#ff6b6b', { hatch: false });
        }
    }

    /* --- 3. 雲の上 --- */
    function sky3(g, W, H, r) {
        sky(g, W, H, '#7f8fe3', '#ffd2e6');
        // ほし
        for (let i = 0; i < 40; i++) {
            const x = r() * W, y = r() * 330, s = 1 + r() * 2.2;
            g.save();
            g.fillStyle = `rgba(255,250,210,${0.5 + r() * 0.5})`;
            g.translate(x, y);
            g.rotate(r());
            g.beginPath();
            for (let j = 0; j < 10; j++) {
                const a = (j / 10) * Math.PI * 2;
                const rr = j % 2 ? s * 0.45 : s * 1.6;
                g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
            }
            g.closePath();
            g.fill();
            g.restore();
        }
        // おつきさま
        C.shape(g, P.circle(330, 80, 26), '#fff1a8', { rand: r, lineColor: '#e8c860', bounds: 800 });
        C.fill(g, P.circle(342, 72, 22), '#8d98e2', { hatch: false });
        // にじ
        const bands = ['#ff8f8f', '#ffc56b', '#fff17a', '#9be38f', '#8fc8ff', '#c39bff'];
        g.save();
        g.globalAlpha = 0.55;
        g.lineCap = 'round';
        bands.forEach((col, i) => {
            g.strokeStyle = col;
            g.lineWidth = 9;
            g.beginPath();
            g.arc(120, 520, 230 - i * 9, Math.PI * 1.08, Math.PI * 1.55);
            g.stroke();
        });
        g.restore();
        // 雲の海
        for (let i = 0; i < 8; i++) cloud(g, i * 60 - 10, 545 + (i % 2) * 18, 26, r, i % 2 ? '#fff6fb' : '#ffffff');
        for (let i = 0; i < 7; i++) cloud(g, i * 66 + 20, 590, 26, r, '#ffffff');
        cloud(g, 70, 300, 13, r, '#fff0f7');
        cloud(g, 300, 260, 16, r, '#fff0f7');
    }

    /* --- 台座 --- */
    function pedestal(g, W, H, r, base) {
        const left = base.x - base.w / 2;
        // 柱
        C.shape(g, P.poly([[base.x - 44, base.top + 10], [base.x + 44, base.top + 10], [base.x + 52, H + 10], [base.x - 52, H + 10]]), '#b07443', Object.assign({ rand: r }, BIG));
        g.save();
        g.strokeStyle = 'rgba(90,61,43,.35)';
        g.lineWidth = 1.5;
        [-24, 0, 24].forEach((dx) => {
            g.beginPath();
            g.moveTo(base.x + dx, base.top + 20);
            g.lineTo(base.x + dx * 1.1, H);
            g.stroke();
        });
        g.restore();
        // 天板
        C.shape(g, P.rrc(base.x, base.top + base.h / 2, base.w, base.h, 5), '#d9995a', Object.assign({ rand: r, lineWidth: 2.6 }, BIG));
        C.fill(g, P.rrc(base.x, base.top + 3, base.w - 8, 3, 1.5), '#f2c08a', { hatch: false });
        g.save();
        g.strokeStyle = 'rgba(122,74,38,.45)';
        g.lineWidth = 1.2;
        for (let i = 0; i < 5; i++) {
            const x = left + 20 + r() * (base.w - 60);
            const y = base.top + 8 + r() * 6;
            g.beginPath();
            g.moveTo(x, y);
            g.quadraticCurveTo(x + 12, y - 2, x + 24 + r() * 10, y);
            g.stroke();
        }
        g.restore();
    }

    const Background = {
        layers: [],
        pedestal: null,
        build(W, H, k, base) {
            this.layers = [
                makeLayer(W, H, k, meadow, 11),
                makeLayer(W, H, k, treetop, 22),
                makeLayer(W, H, k, sky3, 33),
            ];
            this.pedestal = makeLayer(W, H, k, (g, w, h, r) => pedestal(g, w, h, r, base), 44);
        },
        /** stage: 0(草原) 〜 1(木の上) 〜 2(雲の上) の連続値 */
        draw(ctx, W, H, stage) {
            if (!this.layers.length) return;
            ctx.drawImage(this.layers[0], 0, 0, W, H);
            const a1 = Math.max(0, Math.min(1, stage));
            const a2 = Math.max(0, Math.min(1, stage - 1));
            if (a1 > 0) {
                ctx.globalAlpha = a1;
                ctx.drawImage(this.layers[1], 0, 0, W, H);
            }
            if (a2 > 0) {
                ctx.globalAlpha = a2;
                ctx.drawImage(this.layers[2], 0, 0, W, H);
            }
            ctx.globalAlpha = 1;
            ctx.drawImage(this.pedestal, 0, 0, W, H);
        },
    };

    window.TowerBackground = Background;
})();
