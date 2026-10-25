/* ==========================================================
   storage.js - localStorage による永続化
   (ランキング[毎週日曜日自動リセット]・ベストスコア・サウンド/音量・台座サイズ・なまえ)
   ========================================================== */
(function () {
    'use strict';

    const KEY = {
        ranking: 'animalTower.ranking.v2',
        week: 'animalTower.rankingWeek.v2',
        best: 'animalTower.best.v1',
        sound: 'animalTower.sound.v1',
        name: 'animalTower.name.v1',
        seVol: 'animalTower.seVol.v1',
        bgmVol: 'animalTower.bgmVol.v1',
        baseSize: 'animalTower.baseSize.v1',
    };
    const MAX_RANK = 10;

    /**
     * 直近の日曜日 00:00:00 (週の起点) の日付文字列 (YYYY-MM-DD) を返す
     */
    function getCurrentWeekKey() {
        const now = new Date();
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const day = d.getDay(); // 0 = 日曜日
        d.setDate(d.getDate() - day);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dt = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dt}`;
    }

    function read(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw == null ? fallback : JSON.parse(raw);
        } catch (e) {
            return fallback;
        }
    }

    function write(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) { /* プライベートモード等では無視 */ }
    }

    /** 毎週日曜日にランキングデータをデータベース(localStorage)から自動削除する */
    function checkWeeklyReset() {
        const curWeek = getCurrentWeekKey();
        const savedWeek = read(KEY.week, null);
        if (savedWeek !== curWeek) {
            write(KEY.ranking, []);
            write(KEY.week, curWeek);
            return true;
        }
        return false;
    }

    const Storage = {
        getWeekKey() {
            return getCurrentWeekKey();
        },

        getRanking() {
            checkWeeklyReset();
            const list = read(KEY.ranking, []);
            return Array.isArray(list) ? list : [];
        },

        /** エントリーを追加し、ランクイン順位(1始まり)を返す。圏外なら 0 */
        addRanking(entry) {
            checkWeeklyReset();
            const list = this.getRanking();
            list.push(entry);
            list.sort((a, b) => b.score - a.score || b.count - a.count || a.date - b.date);
            const trimmed = list.slice(0, MAX_RANK);
            write(KEY.ranking, trimmed);
            const idx = trimmed.findIndex((e) => e.id === entry.id);
            return idx + 1;
        },

        renameRanking(id, name) {
            checkWeeklyReset();
            const list = this.getRanking();
            const e = list.find((x) => x.id === id);
            if (e) {
                e.name = name;
                write(KEY.ranking, list);
            }
        },

        getBest() {
            return Number(read(KEY.best, 0)) || 0;
        },

        setBest(v) {
            write(KEY.best, v);
        },

        getSound() {
            return read(KEY.sound, true) !== false;
        },

        setSound(on) {
            write(KEY.sound, !!on);
        },

        getName() {
            return String(read(KEY.name, '') || '');
        },

        setName(name) {
            write(KEY.name, name);
        },

        getSEVolume() {
            const v = read(KEY.seVol, 0.7);
            return typeof v === 'number' ? Math.max(0, Math.min(1, v)) : 0.7;
        },

        setSEVolume(v) {
            write(KEY.seVol, Math.max(0, Math.min(1, Number(v) || 0)));
        },

        getBGMVolume() {
            const v = read(KEY.bgmVol, 0.4);
            return typeof v === 'number' ? Math.max(0, Math.min(1, v)) : 0.4;
        },

        setBGMVolume(v) {
            write(KEY.bgmVol, Math.max(0, Math.min(1, Number(v) || 0)));
        },

        /** 台座の幅: 190 (ちいさめ), 230 (ふつう), 270 (おおきめ) */
        getBaseSize() {
            const s = Number(read(KEY.baseSize, 230));
            return [190, 230, 270].includes(s) ? s : 230;
        },

        setBaseSize(s) {
            write(KEY.baseSize, Number(s) || 230);
        },
    };

    window.TowerStorage = Storage;
})();
