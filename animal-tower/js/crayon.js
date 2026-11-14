/* ==========================================================
   crayon.js - クレヨン・絵本調の手描き表現ヘルパー
   ========================================================== */
(function () {
    'use strict';

    /** 再現性のある疑似乱数 (mulberry32) */
    function rng(seed) {
        let a = seed >>> 0;
        return function () {
            a |= 0;
            a = (a + 0x6d2b79f5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    let grainCanvas = null;
    function grain() {
        if (grainCanvas) return grainCanvas;
        const c = document.createElement('canvas');
        c.width = c.height = 96;
        const g = c.getContext('2d');
        const r = rng(7);
        for (let i = 0; i < 900; i++) {
            const light = r() < 0.6;
            g.fillStyle = light ? `rgba(255,255,255,${0.15 + r() * 0.35})` : `rgba(60,30,10,${0.05 + r() * 0.12})`;
            const s = 0.5 + r() * 1.6;
            g.fillRect(r() * 96, r() * 96, s, s * (0.5 + r()));
        }
        grainCanvas = c;
        return c;
    }

    /* ---------- パス生成 ---------- */
    const P = {
        ellipse(x, y, rx, ry, rot = 0) {
            return (ctx) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); };
        },
        circle(x, y, r) { return P.ellipse(x, y, r, r); },
        roundRect(x, y, w, h, r) {
            return (ctx) => {
                const rr = Math.min(r, w / 2, h / 2);
                ctx.beginPath();
                ctx.moveTo(x + rr, y);
                ctx.arcTo(x + w, y, x + w, y + h, rr);
                ctx.arcTo(x + w, y + h, x, y + h, rr);
                ctx.arcTo(x, y + h, x, y, rr);
                ctx.arcTo(x, y, x + w, y, rr);
                ctx.closePath();
            };
        },
        /** 中心指定の角丸長方形 */
        rrc(cx, cy, w, h, r) { return P.roundRect(cx - w / 2, cy - h / 2, w, h, r); },
        poly(pts) {
            return (ctx) => {
                ctx.beginPath();
                pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
                ctx.closePath();
            };
        },
        /** 点列を通るなめらかな閉曲線 */
        smooth(pts) {
            return (ctx) => {
                const n = pts.length;
                ctx.beginPath();
                const m0 = mid(pts[n - 1], pts[0]);
                ctx.moveTo(m0[0], m0[1]);
                for (let i = 0; i < n; i++) {
                    const p = pts[i];
                    const m = mid(p, pts[(i + 1) % n]);
                    ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
                }
                ctx.closePath();
            };
        },
        /** 開いた線 */
        line(pts) {
            return (ctx) => {
                ctx.beginPath();
                pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
            };
        },
        curve(x1, y1, cx, cy, x2, y2) {
            return (ctx) => { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(cx, cy, x2, y2); };
        },
    };

    function mid(a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }

    function shade(hex, amt) {
        const n = parseInt(hex.slice(1), 16);
        let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
        const f = amt < 0 ? 0 : 255;
        const t = Math.abs(amt);
        r = Math.round(r + (f - r) * t);
        g = Math.round(g + (f - g) * t);
        b = Math.round(b + (f - b) * t);
        return `rgb(${r},${g},${b})`;
    }

    /**
     * クレヨンで塗る: ベタ塗り + 斜めストロークの塗りムラ + 紙の粒
     */
    function fill(ctx, path, color, opts = {}) {
        const r = opts.rand || Math.random;
        const hatch = opts.hatch !== false;
        ctx.save();
        path(ctx);
        ctx.fillStyle = color;
        ctx.fill();
        if (hatch && color[0] === '#') {
            ctx.clip();
            const b = opts.bounds || 90;
            ctx.lineCap = 'round';
            const ang = opts.angle != null ? opts.angle : -0.6;
            ctx.rotate(ang);
            for (let y = -b; y < b; y += 2.6) {
                ctx.strokeStyle = r() < 0.5 ? shade(color, -0.12) : shade(color, 0.22);
                ctx.globalAlpha = 0.25 + r() * 0.3;
                ctx.lineWidth = 0.8 + r() * 1.2;
                ctx.beginPath();
                ctx.moveTo(-b, y + r() * 1.5);
                ctx.lineTo(b, y + r() * 1.5);
                ctx.stroke();
            }
            ctx.globalAlpha = 0.9;
            ctx.rotate(-ang);
            const pat = ctx.createPattern(grain(), 'repeat');
            ctx.fillStyle = pat;
            ctx.fillRect(-b, -b, b * 2, b * 2);
        }
        ctx.restore();
    }

    /** クレヨンの輪郭線: ずらして2〜3回なぞる */
    function stroke(ctx, path, color = '#5a3d2b', width = 2.2, opts = {}) {
        const r = opts.rand || Math.random;
        const passes = opts.passes || 2;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = color;
        for (let i = 0; i < passes; i++) {
            ctx.save();
            ctx.translate((r() - 0.5) * 0.9, (r() - 0.5) * 0.9);
            ctx.globalAlpha = i === 0 ? 0.95 : 0.45;
            ctx.lineWidth = width * (i === 0 ? 1 : 0.7);
            path(ctx);
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }

    /** 塗り + 輪郭 */
    function shape(ctx, path, color, opts = {}) {
        fill(ctx, path, color, opts);
        if (opts.line !== false) stroke(ctx, path, opts.lineColor || '#5a3d2b', opts.lineWidth || 2.2, opts);
    }

    /** 点 (目など) */
    function dot(ctx, x, y, r, color = '#3a2618') {
        ctx.save();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,.9)';
        ctx.beginPath();
        ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /** ほっぺ */
    function cheek(ctx, x, y, r = 3) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,120,140,.45)';
        ctx.beginPath();
        ctx.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    window.Crayon = { rng, grain, P, fill, stroke, shape, dot, cheek, shade };
})();
