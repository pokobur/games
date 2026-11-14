/* ==========================================================
   share.js - 結果画像の生成 & Web Share API (フォールバック: ダウンロード)
   ========================================================== */
(function () {
    'use strict';

    const FONT = '"Zen Maru Gothic", "Hiragino Maru Gothic ProN", sans-serif';
    const IW = 720;
    const IH = 1080;

    function roundRect(g, x, y, w, h, r) {
        g.beginPath();
        g.moveTo(x + r, y);
        g.arcTo(x + w, y, x + w, y + h, r);
        g.arcTo(x + w, y + h, x, y + h, r);
        g.arcTo(x, y + h, x, y, r);
        g.arcTo(x, y, x + w, y, r);
        g.closePath();
    }

    function outlinedText(g, text, x, y, fill, stroke, width) {
        g.lineJoin = 'round';
        g.strokeStyle = stroke;
        g.lineWidth = width;
        g.strokeText(text, x, y);
        g.fillStyle = fill;
        g.fillText(text, x, y);
    }

    async function makeImage(gameCanvas, result) {
        try {
            await Promise.all([
                document.fonts.load(`900 40px "Zen Maru Gothic"`),
                document.fonts.load(`700 20px "Zen Maru Gothic"`),
            ]);
        } catch (e) { /* フォント読み込み失敗時は代替フォント */ }

        const c = document.createElement('canvas');
        c.width = IW;
        c.height = IH;
        const g = c.getContext('2d');

        // 背景
        g.fillStyle = '#fff4dc';
        g.fillRect(0, 0, IW, IH);
        g.globalAlpha = 0.6;
        g.fillStyle = g.createPattern(window.Crayon.grain(), 'repeat');
        g.fillRect(0, 0, IW, IH);
        g.globalAlpha = 1;
        // 水玉
        const r = window.Crayon.rng(5);
        for (let i = 0; i < 22; i++) {
            g.fillStyle = ['rgba(255,159,67,.18)', 'rgba(106,183,255,.18)', 'rgba(108,192,112,.18)'][i % 3];
            g.beginPath();
            g.arc(r() * IW, r() * IH, 8 + r() * 26, 0, Math.PI * 2);
            g.fill();
        }

        // タイトル
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.font = `900 30px ${FONT}`;
        outlinedText(g, 'ぐらぐら', IW / 2, 42, '#ff9f43', '#5a3d2b', 6);
        g.font = `900 50px ${FONT}`;
        outlinedText(g, 'どうぶつタワー', IW / 2, 88, '#6cc070', '#5a3d2b', 8);

        // ゲーム画面スナップショット
        const sw = 440, sh = 660, sx = (IW - sw) / 2, sy = 128;
        g.save();
        g.fillStyle = 'rgba(90,61,43,.25)';
        roundRect(g, sx, sy + 8, sw, sh, 26);
        g.fill();
        roundRect(g, sx, sy, sw, sh, 26);
        g.clip();
        g.drawImage(gameCanvas, sx, sy, sw, sh);
        g.restore();
        g.lineWidth = 6;
        g.strokeStyle = '#5a3d2b';
        roundRect(g, sx, sy, sw, sh, 26);
        g.stroke();

        // バッジ
        if (result.clear) {
            g.save();
            g.translate(sx + sw - 20, sy + 30);
            g.rotate(0.2);
            g.fillStyle = '#ff9f43';
            g.strokeStyle = '#5a3d2b';
            g.lineWidth = 5;
            roundRect(g, -80, -26, 160, 52, 26);
            g.fill();
            g.stroke();
            g.font = `900 26px ${FONT}`;
            g.fillStyle = '#fff';
            g.fillText('てっぺん！', 0, 2);
            g.restore();
        }

        // スコアボックス
        const by = 820;
        g.fillStyle = '#fffaf0';
        g.strokeStyle = '#5a3d2b';
        g.lineWidth = 6;
        roundRect(g, 60, by, IW - 120, 170, 30);
        g.fill();
        g.stroke();

        g.font = `900 34px ${FONT}`;
        g.fillStyle = '#5a3d2b';
        g.fillText(`🐾 ${result.count} ひき`, IW / 2 - 140, by + 50);
        g.fillText(`📏 ${result.height.toFixed(1)} cm`, IW / 2 + 140, by + 50);
        g.font = `900 64px ${FONT}`;
        outlinedText(g, `⭐ ${result.score.toLocaleString()} てん`, IW / 2, by + 118, '#e07b17', '#fff', 8);

        // フッター
        g.font = `700 22px ${FONT}`;
        g.fillStyle = '#8a6a52';
        const d = new Date(result.date);
        const ds = `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
        const who = result.name ? `${result.name} ・ ` : '';
        g.fillText(`${who}${ds}  ・  game.plyo.blog`, IW / 2, IH - 40);

        return new Promise((resolve) => c.toBlob((b) => resolve(b), 'image/png'));
    }

    function download(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
    }

    /**
     * @returns {Promise<'shared'|'downloaded'|'cancelled'>}
     */
    async function share(gameCanvas, result) {
        const blob = await makeImage(gameCanvas, result);
        if (!blob) throw new Error('image generation failed');
        const filename = `animal-tower-${result.score}.png`;
        const text = `ぐらぐら どうぶつタワーで ${result.count}ひき つんで ${result.height.toFixed(1)}cm！ ⭐${result.score}てん`;
        try {
            const file = new File([blob], filename, { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title: 'ぐらぐら どうぶつタワー', text });
                return 'shared';
            }
        } catch (e) {
            if (e && e.name === 'AbortError') return 'cancelled';
        }
        download(blob, filename);
        return 'downloaded';
    }

    window.TowerShare = { share, makeImage };
})();
