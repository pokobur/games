/* ==========================================================
   share.js - 恐竜図鑑カードの画像生成 & Web Share / 保存
   ========================================================== */
(function () {
    'use strict';
    const DM = (window.DM = window.DM || {});

    /**
     * 恐竜カード画像を Canvas 上に手描きカード風に描画して Blob を取得
     */
    async function createDinoCardBlob(kind) {
        const info = DM.data.DINOS[kind];
        if (!info) return null;

        const canvas = document.createElement('canvas');
        const W = 600;
        const H = 760;
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');

        // 背景（温かみのあるクリーム色のカード）
        ctx.fillStyle = '#fffdf7';
        ctx.fillRect(0, 0, W, H);

        // クレヨン風の二重枠
        ctx.strokeStyle = '#e6c894';
        ctx.lineWidth = 14;
        ctx.strokeRect(14, 14, W - 28, H - 28);

        ctx.strokeStyle = '#5a3d2b';
        ctx.lineWidth = 4;
        ctx.strokeRect(26, 26, W - 52, H - 52);

        // ヘッダー飾り（リボン風）
        ctx.fillStyle = '#fce4c8';
        ctx.fillRect(40, 42, W - 80, 52);
        ctx.strokeStyle = '#d69f64';
        ctx.lineWidth = 3;
        ctx.strokeRect(40, 42, W - 80, 52);

        // タイトル
        ctx.fillStyle = '#5a3d2b';
        ctx.font = 'bold 28px "Zen Maru Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`🌟 きょうりゅうずかん 🌟`, W / 2, 78);

        // 恐竜イラスト描画（SVGをImageとしてロード）
        const svgStr = DM.art.standalone(kind, 360, 288);
        const img = new Image();
        const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        await new Promise((resolve) => {
            img.onload = () => {
                // イラスト台座
                ctx.fillStyle = '#f7f0df';
                ctx.beginPath();
                ctx.ellipse(W / 2, 280, 190, 110, 0, 0, Math.PI * 2);
                ctx.fill();

                ctx.drawImage(img, (W - 360) / 2, 120, 360, 288);
                URL.revokeObjectURL(url);
                resolve();
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                resolve();
            };
            img.src = url;
        });

        // 恐竜名
        ctx.fillStyle = '#2c1e14';
        ctx.font = '900 38px "Zen Maru Gothic", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(info.name, W / 2, 450);

        // 恐竜の特徴情報テーブル風
        const boxX = 54;
        const boxY = 480;
        const boxW = W - 108;
        const boxH = 200;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeStyle = '#deb887';
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.textAlign = 'left';
        ctx.font = 'bold 20px "Zen Maru Gothic", sans-serif';
        ctx.fillStyle = '#8b5a2b';
        ctx.fillText(`⌛ じだい:`, boxX + 20, boxY + 38);
        ctx.fillStyle = '#333333';
        ctx.fillText(info.era, boxX + 130, boxY + 38);

        ctx.fillStyle = '#8b5a2b';
        ctx.fillText(`📏 おおきさ:`, boxX + 20, boxY + 76);
        ctx.fillStyle = '#333333';
        ctx.fillText(info.size, boxX + 150, boxY + 76);

        ctx.fillStyle = '#8b5a2b';
        ctx.fillText(`🍖 たべもの:`, boxX + 20, boxY + 114);
        ctx.fillStyle = '#333333';
        ctx.fillText(info.food, boxX + 150, boxY + 114);

        // 説明テキスト（折り返し）
        ctx.fillStyle = '#4a3b32';
        ctx.font = '500 17px "Zen Maru Gothic", sans-serif';
        wrapText(ctx, `💡 ${info.fact}`, boxX + 20, boxY + 152, boxW - 40, 24);

        // フッター署名
        ctx.textAlign = 'center';
        ctx.font = 'bold 16px "Zen Maru Gothic", sans-serif';
        ctx.fillStyle = '#a68261';
        ctx.fillText('きょうりゅうミッケ！ - plyo. GAMES', W / 2, 715);

        return new Promise((resolve) => {
            canvas.toBlob((blob) => resolve(blob), 'image/png');
        });
    }

    function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split('');
        let line = '';
        for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n];
            const metrics = ctx.measureText(testLine);
            if (metrics.width > maxWidth && n > 0) {
                ctx.fillText(line, x, y);
                line = words[n];
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        ctx.fillText(line, x, y);
    }

    /**
     * Web Share API または ダウンロード保存
     */
    async function shareOrDownloadDino(kind) {
        const info = DM.data.DINOS[kind];
        if (!info) return;

        const blob = await createDinoCardBlob(kind);
        if (!blob) return;

        const fileName = `dino_${kind}.png`;
        const file = new File([blob], fileName, { type: 'image/png' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
                await navigator.share({
                    title: `【きょうりゅうミッケ！】${info.name} を はっけん！`,
                    text: `『きょうりゅうミッケ！』で ${info.name} を みつけたよ！🦕✨`,
                    files: [file],
                });
                return;
            } catch (err) {
                if (err.name !== 'AbortError') {
                    downloadBlob(blob, fileName);
                }
                return;
            }
        }

        // フォールバック: 直接ダウンロード
        downloadBlob(blob, fileName);
    }

    function downloadBlob(blob, fileName) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    DM.share = {
        createDinoCardBlob,
        shareOrDownloadDino,
    };
})();
