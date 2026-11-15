/* ==========================================================
   util.js - 乱数・パス生成などの共通ユーティリティ
   ========================================================== */
(function () {
    'use strict';
    const DM = (window.DM = window.DM || {});

    /** シード付き乱数 (mulberry32) */
    function rng(seed) {
        let a = seed >>> 0;
        return function () {
            a = (a + 0x6d2b79f5) | 0;
            let t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    const f = (n) => Math.round(n * 10) / 10;

    /** Catmull-Rom で点列をなめらかに結ぶ（閉じたパス） */
    function smoothClosed(p) {
        const n = p.length;
        let d = `M${f(p[0][0])} ${f(p[0][1])}`;
        for (let i = 0; i < n; i++) {
            const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
            d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ` +
                `${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
        }
        return d + 'Z';
    }

    /** Catmull-Rom で点列をなめらかに結ぶ（開いたパス） */
    function smoothOpen(p) {
        const n = p.length;
        let d = `M${f(p[0][0])} ${f(p[0][1])}`;
        for (let i = 0; i < n - 1; i++) {
            const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(n - 1, i + 2)];
            d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ` +
                `${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
        }
        return d;
    }

    /** 手描き風のゆらぎを持つ楕円ブロブ */
    function blob(r, cx, cy, rx, ry, n, j) {
        n = n || 9;
        j = j === undefined ? 0.16 : j;
        const pts = [];
        const off = r() * Math.PI * 2;
        for (let i = 0; i < n; i++) {
            const a = off + (i / n) * Math.PI * 2;
            const k = 1 + (r() * 2 - 1) * j;
            pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
        }
        return smoothClosed(pts);
    }

    /** 下が平らなブロブ（岩・茂み用） */
    function mound(r, cx, cy, rx, ry, n, j) {
        n = n || 8;
        j = j === undefined ? 0.14 : j;
        const pts = [[cx + rx, cy]];
        for (let i = 1; i < n; i++) {
            const a = (i / n) * Math.PI;
            const k = 1 + (r() * 2 - 1) * j;
            pts.push([cx + Math.cos(a) * rx * k, cy - Math.sin(a) * ry * k]);
        }
        pts.push([cx - rx, cy]);
        let d = smoothOpen(pts);
        return d + 'Z';
    }

    function hexToRgb(hex) {
        const h = hex.replace('#', '');
        const v = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
        return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
    }

    /** 色を明るく(amt>0)/暗く(amt<0) */
    function shade(hex, amt) {
        const [r, g, b] = hexToRgb(hex);
        const t = amt < 0 ? 0 : 255;
        const p = Math.abs(amt);
        const c = (x) => Math.round(x + (t - x) * p).toString(16).padStart(2, '0');
        return '#' + c(r) + c(g) + c(b);
    }

    DM.util = {
        rng,
        f,
        smoothClosed,
        smoothOpen,
        blob,
        mound,
        shade,
        range: (r, a, b) => a + r() * (b - a),
        int: (r, a, b) => Math.floor(a + r() * (b - a + 1)),
        pick: (r, arr) => arr[Math.floor(r() * arr.length)],
        chance: (r, p) => r() < p,
        shuffle(r, arr) {
            const a = arr.slice();
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(r() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        },
        clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
        dist: (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by),
        esc(s) {
            return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        },
        newSeed: () => (Math.random() * 4294967296) >>> 0,
    };
})();
