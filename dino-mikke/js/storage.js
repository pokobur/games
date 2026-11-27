/* ==========================================================
   storage.js - localStorage 永続化（図鑑、クリア記録、設定）
   ========================================================== */
(function () {
    'use strict';
    const DM = (window.DM = window.DM || {});

    const KEY = 'dino_mikke_data_v1';

    const defaultState = {
        soundEnabled: true,
        seVolume: 0.7,
        bgmVolume: 0.35,
        lastTheme: 'theme_jungle',
        lastDifficulty: 'normal',
        clears: {}, // { "theme_jungle_normal": { count: 1, lastAt: "2026-..." } }
        collection: {}, // { "trex": { discovered: true, firstAt: "...", count: 3 } }
        customStages: [], // [ { id, title, themeId, density, targets, seed, createdAt } ]
    };

    let state = null;

    function load() {
        if (state) return state;
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) {
                state = Object.assign({}, defaultState, JSON.parse(raw));
                state.collection = state.collection || {};
                state.clears = state.clears || {};
                state.customStages = state.customStages || [];
            } else {
                state = Object.assign({}, defaultState);
            }
        } catch (e) {
            console.warn('Failed to load localStorage:', e);
            state = Object.assign({}, defaultState);
        }
        return state;
    }

    function save() {
        try {
            localStorage.setItem(KEY, JSON.stringify(state));
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    }

    const Storage = {
        get: load,

        // 設定
        getAudioSettings() {
            const s = load();
            return {
                enabled: s.soundEnabled !== false,
                seVolume: s.seVolume !== undefined ? s.seVolume : 0.7,
                bgmVolume: s.bgmVolume !== undefined ? s.bgmVolume : 0.35,
            };
        },

        setAudioSettings(enabled, seVolume, bgmVolume) {
            const s = load();
            s.soundEnabled = !!enabled;
            s.seVolume = seVolume;
            s.bgmVolume = bgmVolume;
            save();
        },

        getLastChoice() {
            const s = load();
            return {
                theme: s.lastTheme || 'theme_jungle',
                difficulty: s.lastDifficulty || 'normal',
            };
        },

        setLastChoice(theme, difficulty) {
            const s = load();
            s.lastTheme = theme;
            s.lastDifficulty = difficulty;
            save();
        },

        // 恐竜発見の記録
        recordDiscovery(kind) {
            // アイテムではなく恐竜の場合のみ図鑑に記録
            if (!DM.data.isDino(kind)) return false;
            const s = load();
            const now = new Date().toISOString();
            const entry = s.collection[kind] || { discovered: false, count: 0, firstAt: now };
            const isNew = !entry.discovered;
            entry.discovered = true;
            entry.count = (entry.count || 0) + 1;
            entry.lastAt = now;
            s.collection[kind] = entry;
            save();
            return isNew;
        },

        isDiscovered(kind) {
            const s = load();
            return !!(s.collection[kind] && s.collection[kind].discovered);
        },

        getDiscoveredCount() {
            const s = load();
            return Object.values(s.collection).filter((v) => v && v.discovered).length;
        },

        getTotalDinos() {
            return DM.data.dinoOrder.length;
        },

        getEntry(kind) {
            const s = load();
            return s.collection[kind] || null;
        },

        // 絵本読了の記録
        recordClear(themeId, difficulty) {
            const s = load();
            const key = `${themeId}_${difficulty}`;
            const entry = s.clears[key] || { count: 0 };
            entry.count += 1;
            entry.lastAt = new Date().toISOString();
            s.clears[key] = entry;
            save();
        },

        getClearCount(themeId, difficulty) {
            const s = load();
            if (!themeId) {
                return Object.values(s.clears).reduce((sum, c) => sum + (c.count || 0), 0);
            }
            const key = `${themeId}_${difficulty}`;
            return (s.clears[key] && s.clears[key].count) || 0;
        },

        // カスタムステージ保存・管理
        getCustomStages() {
            const s = load();
            return s.customStages || [];
        },

        saveCustomStage(stage) {
            const s = load();
            s.customStages = s.customStages || [];
            if (!stage.id) {
                stage.id = 'stage_' + Date.now();
            }
            stage.updatedAt = new Date().toISOString();
            const idx = s.customStages.findIndex((item) => item.id === stage.id);
            if (idx >= 0) {
                s.customStages[idx] = stage;
            } else {
                s.customStages.unshift(stage);
            }
            // 最大15個まで保持
            if (s.customStages.length > 15) {
                s.customStages = s.customStages.slice(0, 15);
            }
            save();
            return stage;
        },

        deleteCustomStage(stageId) {
            const s = load();
            s.customStages = (s.customStages || []).filter((item) => item.id !== stageId);
            save();
        },

        resetAll() {
            state = Object.assign({}, defaultState);
            save();
        },
    };

    DM.storage = Storage;
})();
