/* ==========================================================
   field.js - 見開き絵本探索フィールド生成
   左右ページ (2400x1500) に多彩な自然オブジェクトを敷き詰め、
   ターゲットは指定された数のみ出現させる（重複出現を排除）
   全6章（ジャングル、火山、海、夜の森、雪山氷河、大峡谷砂漠）対応
   ========================================================== */
(function () {
    'use strict';
    const DM = (window.DM = window.DM || {});
    const U = DM.util;

    const FIELD_W = 2400; // 左右見開き全体の幅 (各ページ 1200)
    const FIELD_H = 1500;
    const PAGE_W = 1200;

    /**
     * 見開きページのステージデータを生成
     */
    function generatePage(themeId, difficulty, pageIndex, customSeed) {
        const seed = customSeed !== undefined ? customSeed : U.newSeed();
        const r = U.rng(seed);
        const theme = DM.data.theme(themeId);

        // 1. お題ターゲットの選定
        const availableDinos = theme.dinos.slice();
        const availableItems = theme.items.slice();

        let targetKindCount = 4;
        let totalTargetCount = 4;
        if (difficulty === 'easy') {
            targetKindCount = 4;
            totalTargetCount = 4; // 4種類 × 1匹
        } else if (difficulty === 'normal') {
            targetKindCount = 5;
            totalTargetCount = 6; // 5種類、一部2匹
        } else if (difficulty === 'hard') {
            targetKindCount = 5;
            totalTargetCount = 8; // 5種類、複数体あり
        } else if (difficulty === 'very_hard') {
            // ★ とてもむずかしい: 6〜7種類、計12個の超難関ターゲット！
            targetKindCount = 6;
            totalTargetCount = 12;
        }

        const shuffledDinos = U.shuffle(r, availableDinos);
        const shuffledItems = U.shuffle(r, availableItems);
        const chosenKinds = [];
        chosenKinds.push(shuffledDinos[0], shuffledDinos[1], shuffledDinos[2]);
        if (targetKindCount >= 4) {
            chosenKinds.push(shuffledItems[0]);
        }
        if (targetKindCount >= 5) {
            chosenKinds.push(shuffledDinos[3] || shuffledItems[1]);
        }
        if (targetKindCount >= 6) {
            chosenKinds.push(shuffledDinos[4] || shuffledItems[1]);
        }
        if (targetKindCount >= 7) {
            chosenKinds.push(shuffledItems[2] || shuffledDinos[5] || shuffledItems[1]);
        }

        // 各種類の個数割り当て
        const kindCounts = {};
        chosenKinds.forEach((k) => (kindCounts[k] = 1));
        let remaining = totalTargetCount - chosenKinds.length;
        while (remaining > 0) {
            const pickK = U.pick(r, chosenKinds);
            kindCounts[pickK] = (kindCounts[pickK] || 0) + 1;
            remaining--;
        }

        // 2. ターゲット配置
        const targetObjects = [];
        const decoObjects = [];
        const placedCenters = [];

        const minPlacementDist = difficulty === 'very_hard' ? 90 : 135;
        function isTooClose(x, y, minDist = minPlacementDist) {
            for (const p of placedCenters) {
                if (U.dist(x, y, p.x, p.y) < minDist) return true;
            }
            return false;
        }

        function getRandomPosition(pageSide, habitat) {
            const minX = pageSide === 'L' ? 140 : 1340;
            const maxX = pageSide === 'L' ? 1060 : 2260;
            let minY = 220;
            let maxY = 1360;

            if (habitat === 'sky') {
                minY = 160;
                maxY = 500;
            } else if (habitat === 'air') {
                minY = 220;
                maxY = 1100;
            } else {
                minY = themeId === 'theme_ocean' ? 340 : 420;
                maxY = 1380;
            }
            return {
                x: U.range(r, minX, maxX),
                y: U.range(r, minY, maxY),
            };
        }

        let objIdCounter = 1;

        // ★ ターゲット配置（指定された個数のみ出現！）
        let targetSide = r() > 0.5 ? 'L' : 'R';
        for (const kind of chosenKinds) {
            const count = kindCounts[kind];
            const info = DM.data.kindInfo(kind);
            for (let i = 0; i < count; i++) {
                let pos = null;
                for (let attempt = 0; attempt < 50; attempt++) {
                    const testPos = getRandomPosition(targetSide, info.habitat);
                    if (!isTooClose(testPos.x, testPos.y, minPlacementDist)) {
                        pos = testPos;
                        break;
                    }
                }
                if (!pos) pos = getRandomPosition(targetSide, info.habitat);
                placedCenters.push(pos);

                let scale = 0.95;
                if (difficulty === 'easy') scale = U.range(r, 1.05, 1.25);
                else if (difficulty === 'normal') scale = U.range(r, 0.88, 1.05);
                else if (difficulty === 'hard') scale = U.range(r, 0.74, 0.92);
                else if (difficulty === 'very_hard') scale = U.range(r, 0.48, 0.62); // ★ 極小サイズ！風景に完全にカモフラージュ

                const flip = r() > 0.5;
                const obj = {
                    id: `target_${objIdCounter++}`,
                    kind,
                    isTarget: true,
                    x: pos.x,
                    y: pos.y,
                    scale,
                    flip,
                    found: false,
                };
                targetObjects.push(obj);
                targetSide = targetSide === 'L' ? 'R' : 'L';
            }
        }

        // 3. ★ ダミー恐竜・アイテムの配置（お題に含まれるものは絶対に配置しない！）
        const allThemeEntities = [...theme.dinos, ...theme.items];
        const nonTargetKinds = allThemeEntities.filter((k) => !chosenKinds.includes(k));

        let dummyCount = 0;
        if (nonTargetKinds.length > 0) {
            if (difficulty === 'very_hard') {
                dummyCount = 18; // ★ 18体のダミーが紛れ込む！
            } else if (difficulty === 'hard') {
                dummyCount = Math.min(nonTargetKinds.length * 3, 10);
            } else if (difficulty === 'normal') {
                dummyCount = Math.min(nonTargetKinds.length * 2, 8);
            } else {
                dummyCount = Math.min(nonTargetKinds.length * 2, 4);
            }
        }
        for (let i = 0; i < dummyCount; i++) {
            if (nonTargetKinds.length === 0) break;
            const side = i % 2 === 0 ? 'L' : 'R';
            const kind = U.pick(r, nonTargetKinds);
            const info = DM.data.kindInfo(kind);
            let pos = null;
            for (let attempt = 0; attempt < 30; attempt++) {
                const testPos = getRandomPosition(side, info.habitat);
                if (!isTooClose(testPos.x, testPos.y, difficulty === 'very_hard' ? 75 : 110)) {
                    pos = testPos;
                    break;
                }
            }
            if (pos) {
                placedCenters.push(pos);
                const dummyScale = difficulty === 'very_hard'
                    ? U.range(r, 0.48, 0.72)
                    : U.range(r, 0.7, 0.92);
                decoObjects.push({
                    id: `deco_${objIdCounter++}`,
                    kind,
                    isTarget: false,
                    x: pos.x,
                    y: pos.y,
                    scale: dummyScale,
                    flip: r() > 0.5,
                });
            }
        }

        // 4. ★ 豊富な絵本風環境オブジェクトをぎっしり敷き詰める（ミッケ調・大幅増量）
        const { backElements, frontElements } = generateRichEnvironment(r, themeId, targetObjects, difficulty);

        return {
            seed,
            themeId,
            difficulty,
            pageIndex,
            targetObjects,
            decoObjects,
            backElements,
            frontElements,
            chosenKinds,
            kindCounts,
            totalTargetCount,
        };
    }

    /**
     * テーマに応じた多彩なオブジェクトを大量に生成（奥レイヤーと手前カバーレイヤーに分離）
     */
    function generateRichEnvironment(r, themeId, targetObjects, difficulty) {
        const backElements = [];
        const frontElements = [];

        // カバーオブジェクトのタイプ選定
        function getCoverType(tid) {
            switch (tid) {
                case 'theme_ocean': return 'seaweed_tall';
                case 'theme_volcano': return 'rock_large';
                case 'theme_night': return 'mushroom_cluster';
                case 'theme_ice': return 'snow_mound';
                case 'theme_canyon': return 'canyon_rock';
                default: return 'bush_dense';
            }
        }

        // ターゲットの一部を自然に隠すカバー（手前レイヤー）
        const coverChance = difficulty === 'easy' ? 0.08
            : difficulty === 'normal' ? 0.35
            : difficulty === 'hard' ? 0.65
            : 0.95; // ★ とてもむずかしい: 95%のターゲットを巧妙に隠蔽！

        targetObjects.forEach((t) => {
            if (r() < coverChance) {
                // とてもむずかしいでは 2〜3 個のオブジェクトを手前・斜めに多重配置して体の一部しか見えなくする
                const layers = difficulty === 'very_hard' ? U.pick(r, [2, 3]) : 1;
                for (let l = 0; l < layers; l++) {
                    const ox = t.x + U.range(r, -32, 32);
                    const oy = t.y + U.range(r, 12, 50);
                    const coverScale = difficulty === 'very_hard'
                        ? U.range(r, 0.9, 1.4)
                        : U.range(r, 1.05, 1.35);
                    frontElements.push({
                        type: getCoverType(themeId),
                        x: ox,
                        y: oy,
                        scale: coverScale,
                        themeId,
                        isCover: true,
                    });
                }
            }
        });

        // 画面全体にぎっしり敷き詰めるデコレーション（超高密度ミッケ）
        let totalItems = 130;
        if (difficulty === 'easy') totalItems = 75;
        else if (difficulty === 'normal') totalItems = 120;
        else if (difficulty === 'hard') totalItems = 160;
        else if (difficulty === 'very_hard') totalItems = 380; // ★ 常識を越える380個の極限密度！

        const types = getThemeObjectTypes(themeId);

        for (let i = 0; i < totalItems; i++) {
            const side = i % 2 === 0 ? 'L' : 'R';
            const minX = side === 'L' ? 60 : 1280;
            const maxX = side === 'L' ? 1140 : 2340;
            const type = U.pick(r, types);

            let minY = 280;
            let maxY = 1450;
            if (type.includes('tree') || type.includes('volcano_peak') || type.includes('ice_pillar') || type.includes('canyon_pillar')) {
                minY = 300;
                maxY = 920;
            } else if (type.includes('footprint') || type.includes('pebble') || type.includes('starfish')) {
                minY = 650;
                maxY = 1440;
            }

            const elemScale = difficulty === 'very_hard'
                ? U.range(r, 0.55, 1.35)
                : U.range(r, 0.65, 1.25);

            const elem = {
                type,
                x: U.range(r, minX, maxX),
                y: U.range(r, minY, maxY),
                scale: elemScale,
                flip: r() > 0.5,
                themeId,
                isCover: false,
            };

            // 手前レイヤーへの振り分け確率（very_hard では手前にも多数配置して錯視感を最大化）
            const frontChance = difficulty === 'very_hard' ? 0.38 : 0.22;
            if (elem.y > 950 && r() < frontChance) {
                frontElements.push(elem);
            } else {
                backElements.push(elem);
            }
        }

        backElements.sort((a, b) => a.y - b.y);
        frontElements.sort((a, b) => a.y - b.y);

        return { backElements, frontElements };
    }

    function getThemeObjectTypes(themeId) {
        if (themeId === 'theme_volcano') {
            return [
                'rock_large', 'rock_mound', 'rock_sharp', 'lava_crack',
                'fossil_rock', 'volcano_tree', 'pebble_cluster', 'smoke_puff', 'dino_footprint',
                'lava_pool', 'cinder_cone'
            ];
        } else if (themeId === 'theme_ocean') {
            return [
                'coral_branch', 'coral_round', 'coral_pink', 'seaweed_tall', 'seaweed_curly',
                'sea_shell_deco', 'starfish', 'water_bubble', 'underwater_rock', 'ancient_fern_water'
            ];
        } else if (themeId === 'theme_night') {
            return [
                'mushroom_cluster', 'glowing_flower', 'night_tree', 'night_bush',
                'firefly_swarm', 'ancient_stump', 'star_fragment', 'night_pebble', 'luminescent_moss'
            ];
        } else if (themeId === 'theme_ice') {
            return [
                'ice_spike', 'snow_mound', 'frozen_crystal', 'ice_rock',
                'winter_pine', 'snow_pebble', 'icicle_cluster', 'frost_fern'
            ];
        } else if (themeId === 'theme_canyon') {
            return [
                'giant_cactus', 'canyon_pillar', 'desert_shrub', 'sand_dune',
                'canyon_rock', 'dino_skull_deco', 'sun_baked_stone', 'canyon_arch'
            ];
        } else {
            // jungle
            return [
                'jungle_tree', 'ancient_fern_tree', 'bush_dense', 'bush_flowers',
                'jungle_vine', 'mossy_rock', 'dino_footprint', 'wood_log', 'little_mushroom', 'tropical_fruit'
            ];
        }
    }

    /**
     * 多彩な自然オブジェクトのSVGレンダリング
     */
    function renderEnvSVG(item) {
        const s = item.scale;
        const flip = item.flip ? -1 : 1;
        const ink = DM.art.INK;
        const transform = `transform="translate(${U.f(item.x)} ${U.f(item.y)}) scale(${U.f(s * flip)} ${U.f(s)})"`;

        switch (item.type) {
            // ===== ジャングル系 =====
            case 'jungle_tree':
                return `<g ${transform}>
                    <path d="M-14 80 L-10 -30 L10 -30 L14 80 Z" fill="#7a5230" stroke="${ink}" stroke-width="3" />
                    <circle cx="-35" cy="-50" r="38" fill="#589e3a" stroke="${ink}" stroke-width="3" />
                    <circle cx="35" cy="-50" r="38" fill="#68af47" stroke="${ink}" stroke-width="3" />
                    <circle cx="0" cy="-80" r="46" fill="#78bf55" stroke="${ink}" stroke-width="3" />
                    <circle cx="0" cy="-65" r="28" fill="#90d46a" stroke="none" />
                </g>`;

            case 'ancient_fern_tree':
                return `<g ${transform}>
                    <path d="M-8 80 Q0 0 10 -40 Q15 0 8 80 Z" fill="#5c3f25" stroke="${ink}" stroke-width="2.6" />
                    <path d="M10 -40 Q-50 -70 -70 -50" fill="none" stroke="#488c2c" stroke-width="5" stroke-linecap="round" />
                    <path d="M10 -40 Q50 -80 80 -60" fill="none" stroke="#5da83a" stroke-width="5" stroke-linecap="round" />
                    <path d="M10 -40 Q-20 -100 -10 -115" fill="none" stroke="#6fbf48" stroke-width="5" stroke-linecap="round" />
                    <path d="M10 -40 Q40 -100 55 -110" fill="none" stroke="#6fbf48" stroke-width="5" stroke-linecap="round" />
                </g>`;

            case 'bush_dense':
            case 'bush_flowers':
                return `<g ${transform}>
                    <path d="M-60 20 C-75 -20 -35 -45 -10 -25 C15 -50 55 -40 65 -10 C80 15 55 35 20 32 C-15 35 -45 32 -60 20 Z" fill="#589e3a" stroke="${ink}" stroke-width="3" />
                    <path d="M-25 -5 C-15 -25 15 -25 25 -5" fill="none" stroke="#427a29" stroke-width="2.5" />
                    ${item.type === 'bush_flowers' ? '<circle cx="-20" cy="-10" r="6" fill="#ff708f" stroke="' + ink + '" stroke-width="1.8" /><circle cx="25" cy="-5" r="6" fill="#ffd13b" stroke="' + ink + '" stroke-width="1.8" />' : ''}
                </g>`;

            case 'mossy_rock':
            case 'wood_log':
                return `<g ${transform}>
                    <path d="M-45 15 C-45 -15 45 -15 45 15 C45 25 -45 25 -45 15 Z" fill="#8c735d" stroke="${ink}" stroke-width="3" />
                    <path d="M-30 0 C-10 -15 20 -15 35 0" fill="none" stroke="#589e3a" stroke-width="4" stroke-linecap="round" />
                </g>`;

            case 'jungle_vine':
                return `<g ${transform}>
                    <path d="M-10 -60 Q20 -20 -5 20 Q-30 60 5 90" fill="none" stroke="#498a2f" stroke-width="4" stroke-linecap="round" />
                    <circle cx="10" cy="-25" r="8" fill="#60b03e" stroke="${ink}" stroke-width="1.8" />
                    <circle cx="-16" cy="22" r="7" fill="#60b03e" stroke="${ink}" stroke-width="1.8" />
                </g>`;

            case 'dino_footprint':
                return `<g ${transform} opacity="0.45">
                    <ellipse cx="0" cy="0" rx="20" ry="14" fill="#3d2c1f" />
                    <ellipse cx="-16" cy="-18" rx="8" ry="12" fill="#3d2c1f" transform="rotate(-20 -16 -18)" />
                    <ellipse cx="0" cy="-22" rx="8" ry="14" fill="#3d2c1f" />
                    <ellipse cx="16" cy="-18" rx="8" ry="12" fill="#3d2c1f" transform="rotate(20 16 -18)" />
                </g>`;

            case 'little_mushroom':
            case 'tropical_fruit':
                return `<g ${transform}>
                    <ellipse cx="0" cy="10" rx="14" ry="10" fill="#ff6b6b" stroke="${ink}" stroke-width="2.2" />
                    <circle cx="-4" cy="8" r="2.5" fill="#fff" />
                    <circle cx="4" cy="9" r="2.2" fill="#fff" />
                </g>`;

            // ===== 火山系 =====
            case 'rock_large':
            case 'rock_sharp':
                return `<g ${transform}>
                    <path d="M-65 30 L-45 -35 L0 -55 L40 -30 L65 30 Z" fill="#6e4635" stroke="${ink}" stroke-width="3" stroke-linejoin="round" />
                    <path d="M-20 -20 L10 -5 L25 -30" fill="none" stroke="#4d2f22" stroke-width="2.8" />
                    <path d="M-10 10 L25 18" fill="none" stroke="#ba6a4d" stroke-width="2" />
                </g>`;

            case 'rock_mound':
            case 'pebble_cluster':
                return `<g ${transform}>
                    <ellipse cx="-20" cy="10" rx="28" ry="18" fill="#8c5844" stroke="${ink}" stroke-width="2.6" />
                    <ellipse cx="20" cy="12" rx="22" ry="15" fill="#7a4a37" stroke="${ink}" stroke-width="2.6" />
                    <ellipse cx="0" cy="5" rx="18" ry="12" fill="#a46953" stroke="${ink}" stroke-width="2.2" />
                </g>`;

            case 'lava_crack':
            case 'lava_pool':
                return `<g ${transform}>
                    <path d="M-50 0 Q-20 10 0 0 T50 5" fill="none" stroke="#ff5e28" stroke-width="4.5" stroke-linecap="round" />
                    <path d="M-30 0 Q0 6 30 3" fill="none" stroke="#ffe042" stroke-width="2" stroke-linecap="round" />
                </g>`;

            case 'fossil_rock':
            case 'cinder_cone':
                return `<g ${transform}>
                    <path d="M-40 20 L-30 -25 L25 -30 L45 20 Z" fill="#9e7c65" stroke="${ink}" stroke-width="2.8" />
                    <circle cx="0" cy="-5" r="12" fill="none" stroke="#d6c2ad" stroke-width="2.5" stroke-dasharray="3 3" />
                </g>`;

            // ===== 海系 =====
            case 'seaweed_tall':
            case 'seaweed_curly':
                return `<g ${transform}>
                    <path d="M-12 50 Q-35 0 -8 -50 Q15 -100 -5 -150 Q25 -100 0 -50 Q30 0 8 50 Z" fill="#3aa885" stroke="${ink}" stroke-width="2.8" />
                    <path d="M10 50 Q30 5 12 -45 Q-10 -95 15 -140 Q5 -95 -12 -45 Q-5 5 -8 50 Z" fill="#58cfa8" stroke="${ink}" stroke-width="2.4" />
                </g>`;

            case 'coral_branch':
            case 'coral_round':
            case 'coral_pink':
                return `<g ${transform}>
                    <path d="M-45 35 C-55 -15 -35 -35 -20 -20 C-15 -45 15 -45 20 -20 C35 -35 55 -15 45 35 Z" fill="#e86b72" stroke="${ink}" stroke-width="3" />
                    <circle cx="-16" cy="-8" r="5" fill="#fca8ad" stroke="none" />
                    <circle cx="16" cy="-8" r="5" fill="#fca8ad" stroke="none" />
                    <circle cx="0" cy="5" r="6" fill="#fca8ad" stroke="none" />
                </g>`;

            case 'starfish':
                return `<g ${transform}>
                    <path d="M0 -22 L6 -6 L22 -4 L10 8 L14 24 L0 14 L-14 24 L-10 8 L-22 -4 L-6 -6 Z" fill="#ff9f43" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round" />
                    <circle cx="0" cy="2" r="3" fill="#fff" />
                </g>`;

            case 'water_bubble':
                return `<g ${transform} opacity="0.65">
                    <circle cx="0" cy="0" r="14" fill="#d2f2ff" stroke="${ink}" stroke-width="2" />
                    <ellipse cx="-4" cy="-5" rx="4" ry="2.5" fill="#fff" transform="rotate(-30 -4 -5)" />
                </g>`;

            // ===== 夜の森系 =====
            case 'mushroom_cluster':
            case 'luminescent_moss':
                return `<g ${transform}>
                    <circle cx="0" cy="-30" r="38" fill="#42e0f5" opacity="0.3" stroke="none" />
                    <path d="M-7 40 L-5 -10 L5 -10 L7 40 Z" fill="#e8f8fc" stroke="${ink}" stroke-width="2.6" />
                    <path d="M-36 -10 C-36 -48 36 -48 36 -10 C22 -4 -22 -4 -36 -10 Z" fill="#2cc4dc" stroke="${ink}" stroke-width="2.8" />
                    <circle cx="-14" cy="-24" r="5" fill="#fff" stroke="none" />
                    <circle cx="12" cy="-30" r="6" fill="#fff" stroke="none" />
                    <circle cx="20" cy="-16" r="4" fill="#fff" stroke="none" />
                </g>`;

            case 'glowing_flower':
                return `<g ${transform}>
                    <circle cx="0" cy="-15" r="30" fill="#ffd56b" opacity="0.25" stroke="none" />
                    <path d="M0 30 Q-5 0 0 -15" fill="none" stroke="#48784d" stroke-width="3" />
                    <circle cx="-12" cy="-22" r="9" fill="#ff8fa8" stroke="${ink}" stroke-width="2" />
                    <circle cx="12" cy="-22" r="9" fill="#ff8fa8" stroke="${ink}" stroke-width="2" />
                    <circle cx="0" cy="-30" r="9" fill="#ff8fa8" stroke="${ink}" stroke-width="2" />
                    <circle cx="0" cy="-18" r="7" fill="#fff59d" stroke="${ink}" stroke-width="2" />
                </g>`;

            case 'night_tree':
            case 'night_bush':
                return `<g ${transform}>
                    <path d="M-12 80 L-8 -20 L8 -20 L12 80 Z" fill="#2b263b" stroke="${ink}" stroke-width="3" />
                    <ellipse cx="0" cy="-60" rx="55" ry="45" fill="#2d3754" stroke="${ink}" stroke-width="3" />
                    <ellipse cx="0" cy="-85" rx="42" ry="35" fill="#3b486e" stroke="${ink}" stroke-width="2.8" />
                    <circle cx="-18" cy="-70" r="3" fill="#8be4ff" opacity="0.8" />
                    <circle cx="20" cy="-80" r="3" fill="#8be4ff" opacity="0.8" />
                </g>`;

            // ===== 第5章：雪山・氷河系 =====
            case 'ice_spike':
            case 'icicle_cluster':
                return `<g ${transform}>
                    <!-- 鋭い氷の結晶・ツララ群 -->
                    <polygon points="0,-70 14,20 -14,20" fill="#9de3f5" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round" />
                    <polygon points="-16,-45 -4,22 -28,22" fill="#b9f1fc" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round" />
                    <polygon points="18,-40 28,22 8,22" fill="#75cbe3" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round" />
                    <line x1="0" y1="-65" x2="2" y2="15" stroke="#ffffff" stroke-width="2" />
                </g>`;

            case 'snow_mound':
                return `<g ${transform}>
                    <!-- こんもり積もった雪山・雪だまり -->
                    <path d="M-65 25 C-60 -20 -20 -35 0 -35 C25 -35 60 -15 65 25 Z" fill="#eaf6fc" stroke="${ink}" stroke-width="2.8" />
                    <path d="M-40 0 C-20 -15 15 -15 40 5" fill="none" stroke="#c0e1f2" stroke-width="3" stroke-linecap="round" />
                    <circle cx="-15" cy="-8" r="4" fill="#ffffff" />
                    <circle cx="20" cy="-4" r="5" fill="#ffffff" />
                </g>`;

            case 'frozen_crystal':
                return `<g ${transform}>
                    <!-- きらめくクリスタル氷晶 -->
                    <polygon points="0,-35 18,-10 12,25 -12,25 -18,-10" fill="#74d0ea" stroke="${ink}" stroke-width="2.6" />
                    <polygon points="0,-28 12,-8 8,18 -8,18 -12,-8" fill="#bcf1fc" stroke="none" />
                    <polygon points="0,-35 0,25" stroke="#ffffff" stroke-width="2" />
                </g>`;

            case 'ice_rock':
            case 'snow_pebble':
                return `<g ${transform}>
                    <path d="M-40 20 L-30 -20 L15 -30 L42 5 L35 22 Z" fill="#7b9fae" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round" />
                    <!-- 上部の積雪 -->
                    <path d="M-32 -18 Q-5 -32 16 -28 Q25 -20 38 -5" fill="#eaf6fc" stroke="${ink}" stroke-width="2" />
                </g>`;

            case 'winter_pine':
            case 'frost_fern':
                return `<g ${transform}>
                    <!-- 雪をかぶった針葉樹 -->
                    <path d="M-8 75 L-6 10 L6 10 L8 75 Z" fill="#4a3728" stroke="${ink}" stroke-width="2.5" />
                    <polygon points="0,-80 -40,-25 40,-25" fill="#3b7a70" stroke="${ink}" stroke-width="2.8" stroke-linejoin="round" />
                    <polygon points="0,-110 -32,-60 32,-60" fill="#4e998c" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round" />
                    <!-- 葉先の雪パッチ -->
                    <path d="M-36 -25 Q-20 -38 0 -38 Q20 -38 36 -25 Z" fill="#ffffff" />
                    <path d="M-28 -60 Q-15 -72 0 -72 Q15 -72 28 -60 Z" fill="#ffffff" />
                </g>`;

            // ===== 第6章：大峡谷・砂漠系 =====
            case 'giant_cactus':
                return `<g ${transform}>
                    <!-- 弁慶柱サボテン -->
                    <path d="M-12 70 L-10 -70 Q0 -85 10 -70 L12 70 Z" fill="#4d9b53" stroke="${ink}" stroke-width="2.8" />
                    <!-- 枝（左） -->
                    <path d="M-10 15 L-35 15 Q-45 15 -45 -10 L-45 -35 Q-45 -45 -35 -45 Q-25 -45 -25 -35 L-25 -5 L-10 2" fill="#4d9b53" stroke="${ink}" stroke-width="2.6" />
                    <!-- 枝（右） -->
                    <path d="M10 -5 L32 -5 Q42 -5 42 -25 L42 -45 Q42 -55 32 -55 Q22 -55 22 -45 L22 -20 L10 -15" fill="#58ad5f" stroke="${ink}" stroke-width="2.6" />
                    <!-- サボテンの花 -->
                    <circle cx="0" cy="-80" r="9" fill="#ff5c8a" stroke="${ink}" stroke-width="2" />
                    <circle cx="0" cy="-80" r="4" fill="#ffd13b" />
                    <!-- トゲ線 -->
                    <line x1="-5" y1="-50" x2="-5" y2="50" stroke="#37783d" stroke-width="2" stroke-dasharray="2 6" />
                    <line x1="5" y1="-50" x2="5" y2="50" stroke="#37783d" stroke-width="2" stroke-dasharray="2 6" />
                </g>`;

            case 'canyon_pillar':
            case 'canyon_arch':
                return `<g ${transform}>
                    <!-- 層状の岩柱（メサ） -->
                    <path d="M-35 85 L-28 -65 L28 -65 L35 85 Z" fill="#c67645" stroke="${ink}" stroke-width="2.8" stroke-linejoin="round" />
                    <rect x="-32" y="-72" width="64" height="12" rx="4" fill="#deb887" stroke="${ink}" stroke-width="2.5" />
                    <line x1="-30" y1="-25" x2="30" y2="-25" stroke="#8b4513" stroke-width="3" />
                    <line x1="-32" y1="15" x2="32" y2="15" stroke="#e09060" stroke-width="3.5" />
                    <line x1="-34" y1="50" x2="34" y2="50" stroke="#703510" stroke-width="3" />
                </g>`;

            case 'canyon_rock':
            case 'sun_baked_stone':
                return `<g ${transform}>
                    <!-- 赤褐色の層状岩盤 -->
                    <path d="M-55 25 L-40 -25 L35 -30 L55 25 Z" fill="#b25d36" stroke="${ink}" stroke-width="2.8" stroke-linejoin="round" />
                    <path d="M-45 -5 L45 -8" fill="none" stroke="#e2916b" stroke-width="3" />
                    <path d="M-35 12 L35 10" fill="none" stroke="#7a3619" stroke-width="2.5" />
                </g>`;

            case 'sand_dune':
                return `<g ${transform}>
                    <!-- 黄金色のなだらかな砂丘小山 -->
                    <path d="M-75 30 Q-20 -25 30 -10 Q70 5 75 30 Z" fill="#ebbe6c" stroke="${ink}" stroke-width="2.6" />
                    <path d="M-35 5 Q10 -10 50 15" fill="none" stroke="#d49d44" stroke-width="2.5" stroke-linecap="round" />
                </g>`;

            case 'desert_shrub':
                return `<g ${transform}>
                    <!-- 砂漠のトゲ低木 -->
                    <circle cx="-15" cy="5" r="18" fill="#a0a860" stroke="${ink}" stroke-width="2.2" />
                    <circle cx="15" cy="8" r="16" fill="#8b944b" stroke="${ink}" stroke-width="2.2" />
                    <circle cx="0" cy="-5" r="20" fill="#b4bd6e" stroke="${ink}" stroke-width="2.4" />
                </g>`;

            case 'dino_skull_deco':
                return `<g ${transform}>
                    <!-- 砂に埋もれた古代の骨・化石 -->
                    <ellipse cx="0" cy="5" rx="25" ry="16" fill="#e8ded1" stroke="${ink}" stroke-width="2.4" />
                    <circle cx="-10" cy="2" r="5" fill="#4a3728" />
                    <path d="M12 2 L22 10" stroke="${ink}" stroke-width="2.5" stroke-linecap="round" />
                    <line x1="5" y1="12" x2="18" y2="12" stroke="${ink}" stroke-width="2" />
                </g>`;

            default:
                return `<g ${transform}>
                    <path d="M-35 15 C-40 -15 -10 -25 0 -15 C10 -25 40 -15 35 15 Z" fill="#589e3a" stroke="${ink}" stroke-width="2.8" />
                </g>`;
        }
    }

    /**
     * テーマごとの背景ベース（全6章の空、大地、山脈、自然光）
     */
    function renderBackgroundSVG(themeId) {
        let skyGradient = '';
        let envDeco = '';
        const ink = DM.art.INK;

        if (themeId === 'theme_ocean') {
            skyGradient = `<linearGradient id="oceanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#b8e4f9" />
                <stop offset="25%" stop-color="#6bbfe4" />
                <stop offset="85%" stop-color="#3172a6" />
                <stop offset="100%" stop-color="#23547d" />
            </linearGradient>`;
            envDeco = `
                <path d="M0 1320 Q600 1280 1200 1330 T2400 1310 L2400 1500 L0 1500 Z" fill="#edd6a6" stroke="${ink}" stroke-width="4" />
                <path d="M0 80 Q300 100 600 80 T1200 80 T1800 80 T2400 80" fill="none" stroke="#ffffff" stroke-width="8" opacity=".6" />
                <path d="M0 120 Q300 140 600 120 T1200 120 T1800 120 T2400 120" fill="none" stroke="#ffffff" stroke-width="5" opacity=".4" />
            `;
        } else if (themeId === 'theme_volcano') {
            skyGradient = `<linearGradient id="volcanoSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#fbd38d" />
                <stop offset="60%" stop-color="#f6ad55" />
                <stop offset="100%" stop-color="#dd6b20" />
            </linearGradient>`;
            envDeco = `
                <path d="M150 680 L420 320 L520 320 L780 680 Z" fill="#9c4221" stroke="${ink}" stroke-width="4" />
                <path d="M1400 700 L1700 280 L1820 280 L2120 700 Z" fill="#823117" stroke="${ink}" stroke-width="4" />
                <ellipse cx="470" cy="240" rx="90" ry="50" fill="#e28a64" opacity=".6" />
                <ellipse cx="1760" cy="200" rx="110" ry="60" fill="#d47147" opacity=".6" />
                <path d="M0 640 Q600 680 1200 630 T2400 650 L2400 1500 L0 1500 Z" fill="#b85d38" stroke="${ink}" stroke-width="4" />
                <path d="M0 880 Q600 840 1200 890 T2400 870 L2400 1500 L0 1500 Z" fill="#8c3e21" stroke="${ink}" stroke-width="3" />
            `;
        } else if (themeId === 'theme_night') {
            skyGradient = `<linearGradient id="nightSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#141a38" />
                <stop offset="50%" stop-color="#222b54" />
                <stop offset="100%" stop-color="#354070" />
            </linearGradient>`;
            envDeco = `
                <circle cx="1850" cy="220" r="95" fill="#fffae0" stroke="${ink}" stroke-width="4" />
                <circle cx="1850" cy="220" r="140" fill="#fffae0" opacity=".2" />
                ${renderStars()}
                <path d="M0 620 Q600 580 1200 630 T2400 600 L2400 1500 L0 1500 Z" fill="#2d3748" stroke="${ink}" stroke-width="4" />
                <path d="M0 840 Q600 880 1200 830 T2400 850 L2400 1500 L0 1500 Z" fill="#1a202c" stroke="${ink}" stroke-width="3" />
            `;
        } else if (themeId === 'theme_ice') {
            // 第5章：氷河と雪山（オーロラと凍てつく白銀の世界）
            skyGradient = `<linearGradient id="iceSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#d8f3fc" />
                <stop offset="40%" stop-color="#bce7f7" />
                <stop offset="80%" stop-color="#e8f8fc" />
                <stop offset="100%" stop-color="#ffffff" />
            </linearGradient>`;
            envDeco = `
                <!-- 遠くの雪山連峰 -->
                <polygon points="100,680 380,330 650,680" fill="#cce5f0" stroke="${ink}" stroke-width="3.5" />
                <polygon points="380,330 330,420 380,440 430,420" fill="#ffffff" />
                <polygon points="550,700 850,290 1150,700" fill="#b9dbe8" stroke="${ink}" stroke-width="3.5" />
                <polygon points="850,290 790,390 850,420 910,390" fill="#ffffff" />
                <polygon points="1350,690 1680,310 2000,690" fill="#cce5f0" stroke="${ink}" stroke-width="3.5" />
                <polygon points="1680,310 1620,400 1680,430 1740,400" fill="#ffffff" />
                <!-- なだらかな白銀の丘と氷河 -->
                <path d="M-50 640 Q400 560 850 640 T1800 620 T2450 640 L2450 1500 L-50 1500 Z" fill="#e2f2f8" stroke="${ink}" stroke-width="4" />
                <path d="M0 760 Q600 700 1200 760 T2400 730 L2400 1500 L0 1500 Z" fill="#d0e9f5" stroke="${ink}" stroke-width="4" />
                <!-- 氷河のきらめく川 -->
                <path d="M300 1500 Q650 1150 950 820 L1100 840 Q800 1200 520 1500 Z" fill="#9de3f5" stroke="${ink}" stroke-width="3" />
                <!-- オーロラの光芒 -->
                <path d="M100 160 Q600 60 1200 170 T2300 120" fill="none" stroke="#7efcd6" stroke-width="26" opacity=".35" filter="blur(8px)" />
                <path d="M200 210 Q700 110 1300 220 T2400 170" fill="none" stroke="#a38aff" stroke-width="18" opacity=".25" filter="blur(8px)" />
            `;
        } else if (themeId === 'theme_canyon') {
            // 第6章：大峡谷と黄金砂漠（雄大な層状メサと青空）
            skyGradient = `<linearGradient id="canyonSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#80c8f5" />
                <stop offset="50%" stop-color="#bfe3f7" />
                <stop offset="90%" stop-color="#ffe4b5" />
                <stop offset="100%" stop-color="#fedaa2" />
            </linearGradient>`;
            envDeco = `
                <!-- 遠くのメサ（テーブルマウンテン） -->
                <path d="M80 620 L140 400 L440 400 L500 620 Z" fill="#cc7f56" stroke="${ink}" stroke-width="3.5" />
                <path d="M130 400 L450 400" stroke="#ffd3ad" stroke-width="8" />
                <path d="M600 640 L680 340 L1080 340 L1160 640 Z" fill="#bd6f44" stroke="${ink}" stroke-width="3.5" />
                <path d="M670 340 L1090 340" stroke="#ffd3ad" stroke-width="8" />
                <path d="M1450 630 L1540 380 L1880 380 L1960 630 Z" fill="#cc7f56" stroke="${ink}" stroke-width="3.5" />
                <!-- 黄金の砂漠大地と岩肌 -->
                <path d="M0 650 Q600 590 1200 640 T2400 610 L2400 1500 L0 1500 Z" fill="#e09060" stroke="${ink}" stroke-width="4" />
                <path d="M0 770 Q600 810 1200 760 T2400 780 L2400 1500 L0 1500 Z" fill="#d6834d" stroke="${ink}" stroke-width="4" />
                <path d="M0 920 Q600 880 1200 930 T2400 900 L2400 1500 L0 1500 Z" fill="#c4733e" stroke="${ink}" stroke-width="3.5" />
                <!-- 黄金の砂丘ウェーブ -->
                <path d="M200 1500 Q600 1150 900 880 L1050 900 Q750 1250 450 1500 Z" fill="#f0c27b" stroke="${ink}" stroke-width="3" />
            `;
        } else {
            // 第1章：ジャングル
            skyGradient = `<linearGradient id="jungleSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#bfe3f7" />
                <stop offset="55%" stop-color="#e2f3fc" />
                <stop offset="100%" stop-color="#fff4dc" />
            </linearGradient>`;
            envDeco = `
                <path d="M-50 620 Q350 360 750 620 T1550 620 T2450 580 L2450 1500 L-50 1500 Z" fill="#8bc96f" stroke="${ink}" stroke-width="4" />
                <path d="M200 660 Q700 480 1200 660 T2200 640 L2450 1500 L-50 1500 Z" fill="#68af47" stroke="${ink}" stroke-width="4" />
                <path d="M0 780 Q600 740 1200 790 T2400 770 L2400 1500 L0 1500 Z" fill="#589e3a" stroke="${ink}" stroke-width="4" />
                <path d="M400 1500 Q700 1100 1000 800 L1140 820 Q860 1150 600 1500 Z" fill="#71bce8" stroke="${ink}" stroke-width="3" />
            `;
        }

        const bgFill = themeId === 'theme_ocean' ? 'url(#oceanGrad)'
            : themeId === 'theme_volcano' ? 'url(#volcanoSky)'
            : themeId === 'theme_night' ? 'url(#nightSky)'
            : themeId === 'theme_ice' ? 'url(#iceSky)'
            : themeId === 'theme_canyon' ? 'url(#canyonSky)'
            : 'url(#jungleSky)';

        return `
            <defs>
                ${skyGradient}
                <linearGradient id="gutterShadow" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="rgba(0,0,0,0)" />
                    <stop offset="44%" stop-color="rgba(60,40,20,0.18)" />
                    <stop offset="50%" stop-color="rgba(30,20,10,0.38)" />
                    <stop offset="56%" stop-color="rgba(60,40,20,0.18)" />
                    <stop offset="100%" stop-color="rgba(0,0,0,0)" />
                </linearGradient>
            </defs>
            <rect width="2400" height="1500" fill="${bgFill}" />
            ${envDeco}
        `;
    }

    function renderStars() {
        let stars = '';
        const pts = [
            [200, 140], [350, 80], [520, 210], [700, 110], [950, 180], [1150, 90],
            [1350, 160], [1520, 100], [1700, 220], [2050, 130], [2200, 190], [2320, 90]
        ];
        pts.forEach(([x, y]) => {
            stars += `<circle cx="${x}" cy="${y}" r="3.5" fill="#fffef0" />`;
            stars += `<circle cx="${x}" cy="${y}" r="7" fill="#fffef0" opacity=".3" />`;
        });
        return stars;
    }

    function renderGutterOverlay() {
        return `<rect x="1100" y="0" width="200" height="1500" fill="url(#gutterShadow)" pointer-events="none" />`;
    }

    /**
     * 完全な探索SVGを構築
     * ★動くサークル（found-ring）は廃止済み。静止チェックスタンプのみ
     */
    function buildFieldSVG(pageData) {
        const bg = renderBackgroundSVG(pageData.themeId);

        // ダミー配置（お題以外の恐竜やアイテム）
        const decoSvg = pageData.decoObjects.map((d) => {
            return `<g class="search-item deco" data-obj-id="${d.id}" data-kind="${d.kind}">
                ${DM.art.sprite(d.kind, d.x, d.y, d.scale, d.flip)}
            </g>`;
        }).join('');

        // ターゲット配置（タップ判定用の広めの透明ヒットサークル付き）
        const targetSvg = pageData.targetObjects.map((t) => {
            const sc = t.scale || 1;
            const hitR = Math.max(54, Math.round(85 * sc));
            const badgeOffset = Math.round(36 * sc);
            const badgeScale = Math.max(0.68, 0.9 * sc);
            return `<g class="search-item target-item ${t.found ? 'is-found' : ''}" data-obj-id="${t.id}" data-kind="${t.kind}">
                <circle cx="${U.f(t.x)}" cy="${U.f(t.y)}" r="${hitR}" fill="transparent" stroke="none" />
                ${DM.art.sprite(t.kind, t.x, t.y, t.scale, t.flip)}
                <!-- 発見済みの控えめな静止チェックスタンプ（動くサークルは廃止） -->
                <g class="found-badge" transform="translate(${U.f(t.x + badgeOffset)} ${U.f(t.y - badgeOffset)}) scale(${U.f(badgeScale)})" opacity="${t.found ? 1 : 0}">
                    <circle cx="0" cy="0" r="22" fill="#ffd13b" stroke="${DM.art.INK}" stroke-width="2.6" />
                    <path d="M-8 0 L-2 7 L10 -7" fill="none" stroke="${DM.art.INK}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
                </g>
            </g>`;
        }).join('');

        // 奥レイヤー環境オブジェクト
        const backEnvSvg = (pageData.backElements || []).map(renderEnvSVG).join('');
        // 手前カバーレイヤー環境オブジェクト（ターゲットの一部を隠す）
        const frontEnvSvg = (pageData.frontElements || []).map(renderEnvSVG).join('');

        // のど（折り目）オーバーレイ
        const gutter = renderGutterOverlay();

        return `<svg id="field-svg" viewBox="0 0 2400 1500" width="2400" height="1500" xmlns="http://www.w3.org/2000/svg">
            <g id="field-bg-layer">${bg}</g>
            <g id="field-env-back-layer" pointer-events="none">${backEnvSvg}</g>
            <g id="field-deco-layer">${decoSvg}</g>
            <g id="field-target-layer">${targetSvg}</g>
            <g id="field-env-front-layer" pointer-events="none">${frontEnvSvg}</g>
            <g id="field-gutter-layer" pointer-events="none">${gutter}</g>
        </svg>`;
    }

    /**
     * 自分でステージとお題をカスタマイズした見開きページを生成
     */
    function generateCustomPage(config) {
        const themeId = config.themeId || 'theme_jungle';
        const density = config.density || 'normal';
        const seed = config.seed !== undefined ? config.seed : U.newSeed();
        const r = U.rng(seed);
        const theme = DM.data.theme(themeId);

        // お題ターゲット（ユーザー指定）
        const rawTargets = config.targets && config.targets.length > 0
            ? config.targets
            : [{ kind: theme.dinos[0], count: 1 }];

        const chosenKinds = [];
        const kindCounts = {};
        let totalTargetCount = 0;

        rawTargets.forEach((t) => {
            const cnt = Math.max(1, Math.min(8, t.count || 1));
            chosenKinds.push(t.kind);
            kindCounts[t.kind] = cnt;
            totalTargetCount += cnt;
        });

        const targetObjects = [];
        const decoObjects = [];
        const placedCenters = [];

        const minPlacementDist = density === 'very_hard' ? 85 : 130;
        function isTooClose(x, y, minDist = minPlacementDist) {
            for (const p of placedCenters) {
                if (U.dist(x, y, p.x, p.y) < minDist) return true;
            }
            return false;
        }

        function getRandomPosition(pageSide, habitat) {
            const minX = pageSide === 'L' ? 140 : 1340;
            const maxX = pageSide === 'L' ? 1060 : 2260;
            let minY = 220;
            let maxY = 1360;

            if (habitat === 'sky') {
                minY = 160;
                maxY = 500;
            } else if (habitat === 'air') {
                minY = 220;
                maxY = 1100;
            } else {
                minY = themeId === 'theme_ocean' ? 340 : 420;
                maxY = 1380;
            }
            return {
                x: U.range(r, minX, maxX),
                y: U.range(r, minY, maxY),
            };
        }

        let objIdCounter = 1;
        let targetSide = r() > 0.5 ? 'L' : 'R';

        for (const kind of chosenKinds) {
            const count = kindCounts[kind];
            const info = DM.data.kindInfo(kind) || { habitat: 'ground' };
            for (let i = 0; i < count; i++) {
                let pos = null;
                for (let attempt = 0; attempt < 50; attempt++) {
                    const testPos = getRandomPosition(targetSide, info.habitat);
                    if (!isTooClose(testPos.x, testPos.y, minPlacementDist)) {
                        pos = testPos;
                        break;
                    }
                }
                if (!pos) pos = getRandomPosition(targetSide, info.habitat);
                placedCenters.push(pos);

                let scale = 0.95;
                if (density === 'easy') scale = U.range(r, 1.05, 1.25);
                else if (density === 'normal') scale = U.range(r, 0.88, 1.05);
                else if (density === 'hard') scale = U.range(r, 0.74, 0.92);
                else if (density === 'very_hard') scale = U.range(r, 0.48, 0.62);

                const flip = r() > 0.5;
                targetObjects.push({
                    id: `target_${objIdCounter++}`,
                    kind,
                    isTarget: true,
                    x: pos.x,
                    y: pos.y,
                    scale,
                    flip,
                    found: false,
                });
                targetSide = targetSide === 'L' ? 'R' : 'L';
            }
        }

        // ダミー配置
        const allThemeEntities = [...theme.dinos, ...theme.items];
        let nonTargetKinds = allThemeEntities.filter((k) => !chosenKinds.includes(k));
        if (nonTargetKinds.length === 0) {
            nonTargetKinds = DM.data.dinoOrder.filter((k) => !chosenKinds.includes(k));
        }

        let dummyCount = 0;
        if (nonTargetKinds.length > 0) {
            if (density === 'very_hard') dummyCount = 18;
            else if (density === 'hard') dummyCount = Math.min(nonTargetKinds.length * 3, 10);
            else if (density === 'normal') dummyCount = Math.min(nonTargetKinds.length * 2, 8);
            else dummyCount = Math.min(nonTargetKinds.length * 2, 4);
        }

        for (let i = 0; i < dummyCount; i++) {
            const side = i % 2 === 0 ? 'L' : 'R';
            const kind = U.pick(r, nonTargetKinds);
            const info = DM.data.kindInfo(kind) || { habitat: 'ground' };
            let pos = null;
            for (let attempt = 0; attempt < 30; attempt++) {
                const testPos = getRandomPosition(side, info.habitat);
                if (!isTooClose(testPos.x, testPos.y, density === 'very_hard' ? 75 : 110)) {
                    pos = testPos;
                    break;
                }
            }
            if (pos) {
                placedCenters.push(pos);
                const dummyScale = density === 'very_hard'
                    ? U.range(r, 0.48, 0.72)
                    : U.range(r, 0.7, 0.92);
                decoObjects.push({
                    id: `deco_${objIdCounter++}`,
                    kind,
                    isTarget: false,
                    x: pos.x,
                    y: pos.y,
                    scale: dummyScale,
                    flip: r() > 0.5,
                });
            }
        }

        // 自然環境オブジェクト敷き詰め
        const { backElements, frontElements } = generateRichEnvironment(r, themeId, targetObjects, density);

        return {
            isCustom: true,
            customTitle: config.title || 'じぶんのステージ',
            seed,
            themeId,
            difficulty: density,
            pageIndex: 0,
            targetObjects,
            decoObjects,
            backElements,
            frontElements,
            chosenKinds,
            kindCounts,
            totalTargetCount,
        };
    }

    DM.field = {
        FIELD_W,
        FIELD_H,
        PAGE_W,
        generatePage,
        generateCustomPage,
        buildFieldSVG,
    };
})();
