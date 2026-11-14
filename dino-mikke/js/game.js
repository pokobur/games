/* ==========================================================
   game.js - ゲーム全体の進行・画面遷移・UIイベントハンドリング
   ========================================================== */
(function () {
    'use strict';
    const DM = (window.DM = window.DM || {});
    const U = DM.util;

    // ゲーム状態
    const state = {
        currentTheme: 'theme_jungle',
        currentDifficulty: 'normal',
        currentPageIndex: 0,
        bookPages: [], // [page0Data, page1Data, page2Data, page3Data, page4Data] 全ページの状態を保持
        pageData: null,
        viewport: null,
        remainingTargets: {}, // { [kind]: count }
        foundTotal: 0,
        targetTotal: 0,
        isPageClearing: false,
        activeHintTarget: null,
        isCustomGame: false,
        customPaletteTab: 'theme',
        customConfig: {
            title: 'きょうりゅうを さがせ！',
            themeId: 'theme_jungle',
            density: 'normal',
            targets: [
                { kind: 'trex', count: 1 },
                { kind: 'tricera', count: 1 }
            ],
            seed: null,
        },
    };

    // DOM要素キャッシュ
    let dom = {};

    function cacheDOM() {
        dom = {
            screenTitle: document.getElementById('screen-title'),
            screenSelect: document.getElementById('screen-select'),
            screenGame: document.getElementById('screen-game'),
            screenResult: document.getElementById('screen-result'),
            screenZukan: document.getElementById('screen-zukan'),
            screenSettings: document.getElementById('screen-settings'),
            modalHint: document.getElementById('modal-hint'),
            modalCard: document.getElementById('modal-card'),
            toast: document.getElementById('toast'),

            // タイトル
            btnTitleStart: document.getElementById('btn-title-start'),
            btnTitleSelect: document.getElementById('btn-title-select'),
            btnTitleCustom: document.getElementById('btn-title-custom'),
            btnTitleZukan: document.getElementById('btn-title-zukan'),
            btnTitleSettings: document.getElementById('btn-title-settings'),
            titleDiscoveryCount: document.getElementById('title-discovery-count'),

            // テーマ選択
            themeGrid: document.getElementById('theme-grid'),
            btnSelectBack: document.getElementById('btn-select-back'),

            // 難易度選択画面
            screenDiff: document.getElementById('screen-difficulty'),
            btnDiffBack: document.getElementById('btn-diff-back'),
            diffThemePreview: document.getElementById('diff-theme-preview'),
            diffCardBtns: document.querySelectorAll('.diff-card-btn'),

            // ゲームHUD・バー
            btnHome: document.getElementById('btn-home'),
            btnSound: document.getElementById('btn-sound'),
            btnHint: document.getElementById('btn-hint'),
            pageIndicator: document.getElementById('page-indicator'),
            btnPrevPage: document.getElementById('btn-prev-page'),
            btnNextPage: document.getElementById('btn-next-page'),
            btnStagePrev: document.getElementById('btn-stage-prev'),
            btnStageNext: document.getElementById('btn-stage-next'),
            targetBar: document.getElementById('target-bar'),
            bookStage: document.getElementById('book-stage'),
            bookViewport: document.getElementById('book-viewport'),
            pageTurnEffect: document.getElementById('page-turn-effect'),

            // ズーム補助ボタン
            btnZoomIn: document.getElementById('btn-zoom-in'),
            btnZoomOut: document.getElementById('btn-zoom-out'),
            btnZoomReset: document.getElementById('btn-zoom-reset'),

            // ヒントモーダル
            hintText: document.getElementById('hint-text'),
            hintIcon: document.getElementById('hint-icon'),
            btnHintGuide: document.getElementById('btn-hint-guide'),
            btnHintClose: document.getElementById('btn-hint-close'),

            // リザルト
            resultTitle: document.getElementById('result-title'),
            resultDiffBadge: document.getElementById('result-diff-badge'),
            resultThemeName: document.getElementById('result-theme-name'),
            resultDinoGrid: document.getElementById('result-dino-grid'),
            btnResultRetry: document.getElementById('btn-result-retry'),
            btnResultSelect: document.getElementById('btn-result-select'),
            btnResultZukan: document.getElementById('btn-result-zukan'),

            // 図鑑
            zukanGrid: document.getElementById('zukan-grid'),
            zukanProgress: document.getElementById('zukan-progress'),
            btnZukanClose: document.getElementById('btn-zukan-close'),

            // 図鑑詳細カード
            cardDinoIcon: document.getElementById('card-dino-icon'),
            cardDinoName: document.getElementById('card-dino-name'),
            cardDinoEra: document.getElementById('card-dino-era'),
            cardDinoSize: document.getElementById('card-dino-size'),
            cardDinoFood: document.getElementById('card-dino-food'),
            cardDinoFact: document.getElementById('card-dino-fact'),
            btnCardShare: document.getElementById('btn-card-share'),
            btnCardClose: document.getElementById('btn-card-close'),

            // カスタム作成画面
            screenCustom: document.getElementById('screen-custom'),
            btnCustomBack: document.getElementById('btn-custom-back'),
            customStageTitle: document.getElementById('custom-stage-title'),
            customThemeSelector: document.getElementById('custom-theme-selector'),
            customDensityGroup: document.getElementById('custom-density-group'),
            customChosenTray: document.getElementById('custom-chosen-tray'),
            customTargetTotalBadge: document.getElementById('custom-target-total-badge'),
            tabPaletteTheme: document.getElementById('tab-palette-theme'),
            tabPaletteAll: document.getElementById('tab-palette-all'),
            customPaletteGrid: document.getElementById('custom-palette-grid'),
            savedStagesBox: document.getElementById('saved-stages-box'),
            savedStagesList: document.getElementById('saved-stages-list'),
            btnCustomPlay: document.getElementById('btn-custom-play'),
            btnCustomShare: document.getElementById('btn-custom-share'),
            btnCustomSave: document.getElementById('btn-custom-save'),

            // 設定
            btnSettingsClose: document.getElementById('btn-settings-close'),
            sliderSe: document.getElementById('slider-se'),
            sliderBgm: document.getElementById('slider-bgm'),
            feedbackText: document.getElementById('feedback-text'),
            btnSendFeedback: document.getElementById('btn-send-feedback'),
        };
    }

    function init() {
        cacheDOM();
        bindEvents();

        // 保存された設定・選択のロード
        const last = DM.storage.getLastChoice();
        state.currentTheme = last.theme;
        state.currentDifficulty = last.difficulty;

        const audioSet = DM.storage.getAudioSettings();
        DM.audio.setEnabled(audioSet.enabled);
        DM.audio.setVolume(audioSet.seVolume, audioSet.bgmVolume);
        if (dom.sliderSe) dom.sliderSe.value = Math.round(audioSet.seVolume * 100);
        if (dom.sliderBgm) dom.sliderBgm.value = Math.round(audioSet.bgmVolume * 100);

        refreshSoundBtn();
        refreshTitleStats();

        // 最初の画面表示（URLクエリパラメータ対応: ?custom=..., ?screen=select, ?screen=custom 等）
        const urlParams = new URLSearchParams(window.location.search);
        const reqCustom = urlParams.get('custom');
        if (reqCustom) {
            try {
                const jsonStr = decodeURIComponent(escape(atob(reqCustom)));
                const parsed = JSON.parse(jsonStr);
                startCustomGame(parsed);
                return;
            } catch (err) {
                console.warn('Failed to parse custom param:', err);
            }
        }

        const reqScreen = urlParams.get('screen');
        const reqTheme = urlParams.get('theme') || state.currentTheme;
        const reqDiff = urlParams.get('diff') || state.currentDifficulty;
        const reqPage = parseInt(urlParams.get('page') || '0', 10);

        if (reqScreen === 'game') {
            startGame(reqTheme, reqDiff);
            if (reqPage > 0 && reqPage < DM.data.PAGES_PER_BOOK) {
                loadPage(reqPage);
            }
        } else if (reqScreen === 'select') {
            showScreen('select');
        } else if (reqScreen === 'custom') {
            showScreen('custom');
        } else if (reqScreen === 'zukan') {
            showScreen('zukan');
        } else {
            showScreen('title');
        }
    }

    // ---------- 画面切り替え ----------
    function showScreen(screenName) {
        document.querySelectorAll('.screen').forEach((el) => el.classList.remove('active'));

        if (screenName === 'title') {
            refreshTitleStats();
            dom.screenTitle.classList.add('active');
            DM.audio.setBgmTheme('theme_jungle');
        } else if (screenName === 'select') {
            renderThemeSelect();
            dom.screenSelect.classList.add('active');
        } else if (screenName === 'difficulty') {
            renderDifficultyPreview();
            const targetEl = dom.screenDiff || document.getElementById('screen-difficulty');
            if (targetEl) targetEl.classList.add('active');
            DM.audio.setBgmTheme(state.currentTheme);
        } else if (screenName === 'custom') {
            const targetEl = dom.screenCustom || document.getElementById('screen-custom');
            if (targetEl) targetEl.classList.add('active');
            try {
                initCustomBuilder();
            } catch (err) {
                console.error('Failed to init custom builder:', err);
            }
            if (DM.audio && state.customConfig) {
                DM.audio.setBgmTheme(state.customConfig.themeId);
            }
        } else if (screenName === 'game') {
            dom.screenGame.classList.add('active');
            DM.audio.setBgmTheme(state.currentTheme);
        } else if (screenName === 'result') {
            dom.screenResult.classList.add('active');
        } else if (screenName === 'zukan') {
            renderZukanGrid();
            dom.screenZukan.classList.add('active');
        }
    }

    function toast(msg, dur = 2400) {
        if (!dom.toast) return;
        dom.toast.textContent = msg;
        dom.toast.classList.add('show');
        clearTimeout(dom.toast._timer);
        dom.toast._timer = setTimeout(() => {
            dom.toast.classList.remove('show');
        }, dur);
    }

    function refreshTitleStats() {
        const discovered = DM.storage.getDiscoveredCount();
        const total = DM.storage.getTotalDinos();
        if (dom.titleDiscoveryCount) {
            dom.titleDiscoveryCount.textContent = `${discovered} / ${total}`;
        }
    }

    function refreshSoundBtn() {
        if (!dom.btnSound) return;
        const enabled = DM.audio.isEnabled();
        dom.btnSound.innerHTML = enabled
            ? '<i class="fa-solid fa-volume-high"></i>'
            : '<i class="fa-solid fa-volume-xmark"></i>';
        dom.btnSound.classList.toggle('muted', !enabled);
    }

    // ---------- イベントバインド ----------
    function bindEvents() {
        // タイトル
        dom.btnTitleStart.addEventListener('click', () => {
            DM.audio.click();
            startGame(state.currentTheme, state.currentDifficulty);
        });
        dom.btnTitleSelect.addEventListener('click', () => {
            DM.audio.click();
            showScreen('select');
        });
        const customBtn = dom.btnTitleCustom || document.getElementById('btn-title-custom');
        if (customBtn) {
            customBtn.addEventListener('click', (e) => {
                e.preventDefault();
                DM.audio.click();
                showScreen('custom');
            });
        }
        dom.btnTitleZukan.addEventListener('click', () => {
            DM.audio.click();
            showScreen('zukan');
        });
        dom.btnTitleSettings.addEventListener('click', () => {
            DM.audio.click();
            openModal(dom.screenSettings);
        });

        // テーマ選択画面
        dom.btnSelectBack.addEventListener('click', () => {
            DM.audio.click();
            showScreen('title');
        });

        // 難易度選択画面
        const diffBackBtn = dom.btnDiffBack || document.getElementById('btn-diff-back');
        if (diffBackBtn) {
            diffBackBtn.addEventListener('click', () => {
                DM.audio.click();
                showScreen('select');
            });
        }

        const diffBtns = dom.diffCardBtns && dom.diffCardBtns.length > 0
            ? dom.diffCardBtns
            : document.querySelectorAll('.diff-card-btn');
        diffBtns.forEach((btn) => {
            btn.addEventListener('click', () => {
                DM.audio.click();
                const diff = btn.dataset.diff;
                state.currentDifficulty = diff;
                DM.storage.setLastChoice(state.currentTheme, diff);
                startGame(state.currentTheme, diff);
            });
        });

        // ゲーム画面トップバー
        dom.btnHome.addEventListener('click', () => {
            DM.audio.click();
            if (confirm('タイトルがめんに もどる？（いまの ページは セーブされないよ）')) {
                showScreen('title');
            }
        });
        dom.btnSound.addEventListener('click', () => {
            const next = !DM.audio.isEnabled();
            DM.audio.setEnabled(next);
            DM.storage.setAudioSettings(next, DM.audio.getSeVolume(), DM.audio.getBgmVolume());
            refreshSoundBtn();
            if (next) DM.audio.click();
        });
        dom.btnHint.addEventListener('click', () => {
            DM.audio.hint();
            showHintModal();
        });

        // ページめくり（前へ・次へ）
        if (dom.btnPrevPage) dom.btnPrevPage.addEventListener('click', () => goToPrevPage());
        if (dom.btnNextPage) dom.btnNextPage.addEventListener('click', () => goToNextPage());
        if (dom.btnStagePrev) dom.btnStagePrev.addEventListener('click', () => goToPrevPage());
        if (dom.btnStageNext) dom.btnStageNext.addEventListener('click', () => goToNextPage());

        // ズーム補助
        dom.btnZoomIn.addEventListener('click', () => {
            DM.audio.zoom();
            if (state.viewport) state.viewport.zoomIn();
        });
        dom.btnZoomOut.addEventListener('click', () => {
            DM.audio.zoom();
            if (state.viewport) state.viewport.zoomOut();
        });
        dom.btnZoomReset.addEventListener('click', () => {
            DM.audio.zoom();
            if (state.viewport) state.viewport.reset();
        });

        // ヒントモーダル
        dom.btnHintClose.addEventListener('click', () => {
            DM.audio.click();
            closeModal(dom.modalHint);
        });
        dom.btnHintGuide.addEventListener('click', () => {
            DM.audio.click();
            closeModal(dom.modalHint);
            guideToTarget(state.activeHintTarget);
        });

        // リザルト
        dom.btnResultRetry.addEventListener('click', () => {
            DM.audio.click();
            if (state.isCustomGame) {
                startCustomGame(state.customConfig);
            } else {
                startGame(state.currentTheme, state.currentDifficulty);
            }
        });
        dom.btnResultSelect.addEventListener('click', () => {
            DM.audio.click();
            if (state.isCustomGame) {
                showScreen('custom');
            } else {
                showScreen('select');
            }
        });
        dom.btnResultZukan.addEventListener('click', () => {
            DM.audio.click();
            showScreen('zukan');
        });

        // カスタマイズ画面
        if (dom.btnCustomBack) {
            dom.btnCustomBack.addEventListener('click', () => {
                DM.audio.click();
                showScreen('title');
            });
        }
        if (dom.customDensityGroup) {
            dom.customDensityGroup.querySelectorAll('.density-btn').forEach((btn) => {
                btn.addEventListener('click', () => {
                    DM.audio.click();
                    dom.customDensityGroup.querySelectorAll('.density-btn').forEach((b) => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    state.customConfig.density = btn.dataset.density;
                });
            });
        }
        if (dom.tabPaletteTheme && dom.tabPaletteAll) {
            dom.tabPaletteTheme.addEventListener('click', () => {
                DM.audio.click();
                dom.tabPaletteTheme.classList.add('active');
                dom.tabPaletteAll.classList.remove('active');
                state.customPaletteTab = 'theme';
                renderCustomPalette();
            });
            dom.tabPaletteAll.addEventListener('click', () => {
                DM.audio.click();
                dom.tabPaletteAll.classList.add('active');
                dom.tabPaletteTheme.classList.remove('active');
                state.customPaletteTab = 'all';
                renderCustomPalette();
            });
        }
        if (dom.btnCustomPlay) {
            dom.btnCustomPlay.addEventListener('click', () => {
                DM.audio.click();
                if (!state.customConfig.targets || state.customConfig.targets.length === 0) {
                    toast('さがす お題を 1つ以上 えらんでね！');
                    return;
                }
                if (dom.customStageTitle) {
                    state.customConfig.title = dom.customStageTitle.value.trim() || 'きょうりゅうを さがせ！';
                }
                startCustomGame(state.customConfig);
            });
        }
        if (dom.btnCustomShare) {
            dom.btnCustomShare.addEventListener('click', () => {
                DM.audio.click();
                shareCustomStageUrl();
            });
        }
        if (dom.btnCustomSave) {
            dom.btnCustomSave.addEventListener('click', () => {
                DM.audio.click();
                saveCurrentCustomStage();
            });
        }

        // 図鑑
        dom.btnZukanClose.addEventListener('click', () => {
            DM.audio.click();
            showScreen('title');
        });

        // カードモーダル
        dom.btnCardClose.addEventListener('click', () => {
            DM.audio.click();
            closeModal(dom.modalCard);
        });

        // 設定モーダル
        dom.btnSettingsClose.addEventListener('click', () => {
            DM.audio.click();
            closeModal(dom.screenSettings);
        });

        if (dom.sliderSe && dom.sliderBgm) {
            dom.sliderSe.addEventListener('input', (e) => {
                const val = e.target.value / 100;
                DM.audio.setVolume(val, DM.audio.getBgmVolume());
                DM.storage.setAudioSettings(DM.audio.isEnabled(), val, DM.audio.getBgmVolume());
            });
            dom.sliderBgm.addEventListener('input', (e) => {
                const val = e.target.value / 100;
                DM.audio.setVolume(DM.audio.getSeVolume(), val);
                DM.storage.setAudioSettings(DM.audio.isEnabled(), DM.audio.getSeVolume(), val);
            });
        }

        // FormSubmit によるご意見フォーム送信
        setupFeedbackForm();

        // 画面リサイズ時にビューポートを自動フィット
        window.addEventListener('resize', () => {
            if (state.viewport && dom.screenGame.classList.contains('active')) {
                state.viewport.fit();
            }
        });
    }

    function openModal(modalEl) {
        if (!modalEl) return;
        modalEl.classList.add('active');
    }

    function closeModal(modalEl) {
        if (!modalEl) return;
        modalEl.classList.remove('active');
    }

    // ---------- ゲーム進行ロジック ----------
    function startGame(themeId, difficulty) {
        state.isCustomGame = false;
        state.currentTheme = themeId;
        state.currentDifficulty = difficulty;
        state.currentPageIndex = 0;
        // 5ページ分を初期化（各ページ初回アクセス時に生成・保持）
        state.bookPages = new Array(DM.data.PAGES_PER_BOOK).fill(null);
        showScreen('game');
        loadPage(0);
    }

    function loadPage(pageIndex) {
        pageIndex = U.clamp(pageIndex, 0, DM.data.PAGES_PER_BOOK - 1);
        state.currentPageIndex = pageIndex;
        state.isPageClearing = false;

        // ページ送りボタンとインジケーターの更新
        if (dom.pageIndicator) {
            if (state.isCustomGame) {
                dom.pageIndicator.innerHTML = `🛠️ <b>${state.pageData ? state.pageData.customTitle : 'じぶんステージ'}</b>`;
            } else {
                dom.pageIndicator.innerHTML = `📖 <b>${pageIndex + 1}</b> / ${DM.data.PAGES_PER_BOOK} ページ`;
            }
        }
        if (state.isCustomGame) {
            if (dom.btnPrevPage) dom.btnPrevPage.disabled = true;
            if (dom.btnNextPage) dom.btnNextPage.disabled = true;
            if (dom.btnStagePrev) dom.btnStagePrev.style.display = 'none';
            if (dom.btnStageNext) dom.btnStageNext.style.display = 'none';
        } else {
            if (dom.btnPrevPage) dom.btnPrevPage.disabled = (pageIndex === 0);
            if (dom.btnNextPage) dom.btnNextPage.disabled = (pageIndex === DM.data.PAGES_PER_BOOK - 1);
            if (dom.btnStagePrev) {
                dom.btnStagePrev.style.display = '';
                dom.btnStagePrev.disabled = (pageIndex === 0);
            }
            if (dom.btnStageNext) {
                dom.btnStageNext.style.display = '';
                dom.btnStageNext.disabled = (pageIndex === DM.data.PAGES_PER_BOOK - 1);
            }
        }

        // ページデータ取得または初回生成
        if (!state.bookPages[pageIndex]) {
            state.bookPages[pageIndex] = DM.field.generatePage(state.currentTheme, state.currentDifficulty, pageIndex);
        }
        const pageData = state.bookPages[pageIndex];
        state.pageData = pageData;

        // 残りターゲット数集計（発見済み状態を反映）
        state.remainingTargets = {};
        pageData.chosenKinds.forEach((k) => (state.remainingTargets[k] = 0));
        let foundCount = 0;
        pageData.targetObjects.forEach((t) => {
            if (!t.found) {
                state.remainingTargets[t.kind] = (state.remainingTargets[t.kind] || 0) + 1;
            } else {
                foundCount++;
            }
        });
        state.foundTotal = foundCount;
        state.targetTotal = pageData.totalTargetCount;

        // お題バー描画
        renderTargetBar();

        // フィールドSVG生成＆DOM挿入
        const svgString = DM.field.buildFieldSVG(pageData);
        dom.bookViewport.innerHTML = svgString;

        // ビューポート初期化
        if (state.viewport) state.viewport.destroy();
        state.viewport = new DM.Viewport(dom.bookStage, dom.bookViewport, DM.field.FIELD_W, DM.field.FIELD_H);
        state.viewport.fit();

        // タップイベント登録（ドラッグとクリックを判別）
        const svgEl = document.getElementById('field-svg');
        svgEl.addEventListener('click', handleFieldClick);
    }

    /** ページめくり（前へ） */
    function goToPrevPage() {
        if (state.currentPageIndex > 0) {
            triggerPageTurnAnimation(() => {
                loadPage(state.currentPageIndex - 1);
            });
        }
    }

    /** ページめくり（次へ） */
    function goToNextPage() {
        if (state.currentPageIndex < DM.data.PAGES_PER_BOOK - 1) {
            triggerPageTurnAnimation(() => {
                loadPage(state.currentPageIndex + 1);
            });
        }
    }

    function renderTargetBar() {
        const kinds = state.pageData.chosenKinds;
        let html = '';
        kinds.forEach((k) => {
            const count = state.remainingTargets[k] || 0;
            const info = DM.data.kindInfo(k);
            const isCompleted = count === 0;

            html += `
                <div class="target-chip ${isCompleted ? 'completed' : ''}" data-kind="${k}">
                    <div class="target-chip-icon">${DM.art.icon(k)}</div>
                    <div class="target-chip-info">
                        <span class="target-chip-name">${info.name}</span>
                        <span class="target-chip-count">${isCompleted ? '<i class="fa-solid fa-check"></i>' : `×${count}`}</span>
                    </div>
                </div>
            `;
        });
        dom.targetBar.innerHTML = html;
    }

    function handleFieldClick(e) {
        // ドラッグ移動した後のクリックは無視
        if (state.viewport && state.viewport.hasMovedSignificantly) return;
        if (state.isPageClearing) return;

        // クリックされた要素から探索オブジェクトを探す
        const itemEl = e.target.closest('.search-item');
        if (!itemEl) return;

        const objId = itemEl.dataset.objId;
        const kind = itemEl.dataset.kind;

        // ターゲットオブジェクトか判定
        const targetObj = state.pageData.targetObjects.find((t) => t.id === objId);

        if (targetObj) {
            if (targetObj.found) {
                // すでに発見済み
                DM.audio.rustle();
                return;
            }

            // 発見！
            onTargetFound(targetObj, itemEl);
        } else {
            // ダミーオブジェクトまたは背景要素のタップ（ペナルティなし！「ガサガサ」と優しい探索反応）
            DM.audio.rustle();
            wiggleElement(itemEl);
        }
    }

    function onTargetFound(targetObj, el) {
        targetObj.found = true;
        state.foundTotal++;
        state.remainingTargets[targetObj.kind]--;

        // 音＆視覚エフェクト
        DM.audio.found();
        el.classList.add('is-found');

        // 静止チェックバッジ表示（動くサークルは廃止）
        const badge = el.querySelector('.found-badge');
        if (badge) badge.setAttribute('opacity', '1');

        // 図鑑に記録（恐竜の場合）
        const isNewDino = DM.storage.recordDiscovery(targetObj.kind);
        if (isNewDino) {
            toast(`🎉 あたらしい きょうりゅう【${DM.data.DINOS[targetObj.kind].name}】を はっけん！`);
        }

        // お題バー更新
        renderTargetBar();
        createSparklesAt(el);

        // 全ページクリア判定 または 単一ページクリア通知
        if (checkAllBookClear()) {
            state.isPageClearing = true;
            setTimeout(handleAllBookClear, 600);
        } else if (state.foundTotal >= state.targetTotal) {
            handlePageClearNotice();
        }
    }

    function wiggleElement(el) {
        el.classList.add('wiggle-anim');
        setTimeout(() => el.classList.remove('wiggle-anim'), 350);
    }

    function createSparklesAt(el) {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        for (let i = 0; i < 8; i++) {
            const star = document.createElement('div');
            star.className = 'sparkle-particle';
            star.textContent = U.pick(Math.random, ['✨', '⭐', '🌟', '💖']);
            star.style.left = `${cx}px`;
            star.style.top = `${cy}px`;
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 60;
            star.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
            star.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
            document.body.appendChild(star);
            setTimeout(() => star.remove(), 700);
        }
    }

    /** 全ページのターゲットがすべて発見されたかチェック */
    function checkAllBookClear() {
        if (state.isCustomGame) {
            const p = state.bookPages[0];
            return !!(p && p.targetObjects.every((t) => t.found));
        }
        for (let i = 0; i < DM.data.PAGES_PER_BOOK; i++) {
            const p = state.bookPages[i];
            if (!p) return false;
            if (p.targetObjects.some((t) => !t.found)) return false;
        }
        return true;
    }

    /** 1ページクリア時の通知（自動ではめくらず、マイペースに他のページへ移動できる） */
    function handlePageClearNotice() {
        DM.audio.pageClear();
        toast('このページを クリア！ ✨ つぎのページも さがしてみてね 📖', 2400);
    }

    /** 全ページ読了！大歓喜クリア演出 */
    function handleAllBookClear() {
        DM.audio.bookClear();
        if (!state.isCustomGame) {
            DM.storage.recordClear(state.currentTheme, state.currentDifficulty);
        }
        toast(state.isCustomGame ? 'カスタムステージ クリア！ おめでとう！ 🎊🌟' : 'ぜんぶの ページを クリア！ おめでとう！ 🎊🌟', 3000);
        setTimeout(showResultScreen, 900);
    }

    function triggerPageTurnAnimation(callback) {
        DM.audio.pageFlip();
        dom.pageTurnEffect.classList.add('turning');
        setTimeout(() => {
            if (callback) callback();
            setTimeout(() => {
                dom.pageTurnEffect.classList.remove('turning');
            }, 300);
        }, 300);
    }

    // ---------- ヒント機能 ----------
    function showHintModal() {
        // 未発見のターゲットを1体選ぶ
        const unfound = state.pageData.targetObjects.filter((t) => !t.found);
        if (unfound.length === 0) return;

        const target = unfound[0];
        state.activeHintTarget = target;
        const info = DM.data.kindInfo(target.kind);

        dom.hintIcon.innerHTML = DM.art.icon(target.kind);
        const sideText = target.x < DM.field.PAGE_W ? 'ひだりの ページ' : 'みぎの ページ';
        dom.hintText.innerHTML = `
            <b>${info.name}</b> は <span class="hint-highlight">${sideText}</span> に いるよ！<br>
            <small>🔍 めじるし: ${info.look || 'じっくり さがしてみてね！'}</small>
        `;

        openModal(dom.modalHint);
    }

    function guideToTarget(target) {
        if (!target || !state.viewport) return;
        // カメラをターゲット周辺へ滑らかに移動＆ズーム
        state.viewport.focusOn(target.x, target.y);
        toast(`ここを よーく みてね！ 👀`);
    }

    // ---------- リザルト画面 ----------
    function showResultScreen() {
        const theme = DM.data.theme(state.currentTheme);
        dom.resultThemeName.textContent = state.isCustomGame
            ? (state.pageData && state.pageData.customTitle ? `🛠️ ${state.pageData.customTitle}` : '🛠️ じぶんのステージ')
            : theme.title;

        if (dom.resultTitle) {
            dom.resultTitle.textContent = state.isCustomGame ? 'ステージ クリア！ 🎉' : 'えほん クリア！';
        }

        // 難易度バッジ
        if (dom.resultDiffBadge) {
            if (state.isCustomGame) {
                dom.resultDiffBadge.textContent = '🛠️ じぶんステージ';
                dom.resultDiffBadge.className = 'result-diff-badge diff-custom';
            } else {
                const diffInfo = DM.data.DIFFICULTIES[state.currentDifficulty] || DM.data.DIFFICULTIES.normal;
                const crown = state.currentDifficulty === 'very_hard' ? '👑 ' : '';
                dom.resultDiffBadge.textContent = `${crown}むずかしさ: ${diffInfo.label}`;
                dom.resultDiffBadge.className = `result-diff-badge diff-${state.currentDifficulty}`;
            }
        }

        // 登場した恐竜のカード一覧
        let html = '';
        theme.dinos.forEach((k) => {
            const info = DM.data.DINOS[k];
            html += `
                <div class="result-dino-card" data-kind="${k}">
                    <div class="result-dino-art">${DM.art.icon(k)}</div>
                    <div class="result-dino-name">${info.name}</div>
                </div>
            `;
        });
        dom.resultDinoGrid.innerHTML = html;

        // クリックで詳細カードを開ける
        dom.resultDinoGrid.querySelectorAll('.result-dino-card').forEach((card) => {
            card.addEventListener('click', () => {
                DM.audio.click();
                openDinoDetailModal(card.dataset.kind);
            });
        });

        showScreen('result');
    }

    // ---------- テーマ選択UI ----------
    function renderThemeSelect() {
        let html = '';
        DM.data.THEMES.forEach((t) => {
            const isSelected = t.id === state.currentTheme;
            const clears = DM.storage.getClearCount(t.id);
            html += `
                <div class="theme-card ${isSelected ? 'selected' : ''}" data-theme-id="${t.id}" style="--theme-accent: ${t.color}; --theme-light: ${t.light}">
                    <div class="theme-badge">${t.icon} 第${DM.data.THEMES.indexOf(t) + 1}章</div>
                    <div class="theme-card-art">${DM.art.icon(t.dinos[0])}</div>
                    <h3 class="theme-title">${t.title}</h3>
                    <p class="theme-desc">${t.concept}</p>
                    <div class="theme-meta">
                        <span>クリア: <b>${clears}</b>かい</span>
                        <span class="theme-card-action">えらぶ <i class="fa-solid fa-chevron-right"></i></span>
                    </div>
                </div>
            `;
        });
        dom.themeGrid.innerHTML = html;

        dom.themeGrid.querySelectorAll('.theme-card').forEach((card) => {
            card.addEventListener('click', () => {
                DM.audio.click();
                state.currentTheme = card.dataset.themeId;
                showScreen('difficulty');
            });
        });
    }

    // ---------- 難易度選択プレビュー ----------
    function renderDifficultyPreview() {
        const previewEl = dom.diffThemePreview || document.getElementById('diff-theme-preview');
        if (!previewEl) return;
        const theme = DM.data.theme(state.currentTheme);
        const chapterIdx = DM.data.THEMES.indexOf(theme) + 1;
        previewEl.style.setProperty('--theme-accent', theme.color);
        previewEl.style.backgroundColor = theme.light;

        previewEl.innerHTML = `
            <div class="diff-preview-art">${DM.art.icon(theme.dinos[0])}</div>
            <div class="diff-preview-info">
                <span class="diff-preview-badge" style="background: ${theme.color}">${theme.icon} 第${chapterIdx}章</span>
                <h3 class="diff-preview-title">${theme.title}</h3>
                <p class="diff-preview-concept">${theme.concept}</p>
            </div>
        `;
    }

    // ---------- 恐竜図鑑 ----------
    function renderZukanGrid() {
        const total = DM.storage.getTotalDinos();
        const discovered = DM.storage.getDiscoveredCount();
        dom.zukanProgress.textContent = `${discovered} / ${total} 体 はっけん！`;

        let html = '';
        DM.data.dinoOrder.forEach((kind) => {
            const isDisc = DM.storage.isDiscovered(kind);
            const info = DM.data.DINOS[kind];
            const entry = DM.storage.getEntry(kind);

            if (isDisc) {
                html += `
                    <div class="zukan-card discovered" data-kind="${kind}">
                        <div class="zukan-art">${DM.art.icon(kind)}</div>
                        <div class="zukan-name">${info.name}</div>
                        <div class="zukan-count">みつけたかず: <b>${entry ? entry.count : 1}</b></div>
                    </div>
                `;
            } else {
                html += `
                    <div class="zukan-card unknown" data-kind="${kind}">
                        <div class="zukan-art">${DM.art.icon(kind, { silhouette: true })}</div>
                        <div class="zukan-name">？？？？？</div>
                        <div class="zukan-count">まだ みつけていないよ</div>
                    </div>
                `;
            }
        });
        dom.zukanGrid.innerHTML = html;

        dom.zukanGrid.querySelectorAll('.zukan-card.discovered').forEach((card) => {
            card.addEventListener('click', () => {
                DM.audio.click();
                openDinoDetailModal(card.dataset.kind);
            });
        });
    }

    // ---------- 詳細カードモーダル ----------
    let currentDetailKind = null;
    function openDinoDetailModal(kind) {
        currentDetailKind = kind;
        const info = DM.data.DINOS[kind];
        if (!info) return;

        dom.cardDinoIcon.innerHTML = DM.art.icon(kind);
        dom.cardDinoName.textContent = info.name;
        dom.cardDinoEra.textContent = info.era;
        dom.cardDinoSize.textContent = info.size;
        dom.cardDinoFood.textContent = info.food;
        dom.cardDinoFact.textContent = info.fact;

        // シェア/保存ボタン
        dom.btnCardShare.onclick = async () => {
            DM.audio.click();
            dom.btnCardShare.disabled = true;
            const orig = dom.btnCardShare.innerHTML;
            dom.btnCardShare.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ほぞん中…';
            try {
                await DM.share.shareOrDownloadDino(currentDetailKind);
                toast('カードを ほぞんしたよ！ 🖼️✨');
            } catch (err) {
                toast('ほぞんできませんでした');
            } finally {
                dom.btnCardShare.disabled = false;
                dom.btnCardShare.innerHTML = orig;
            }
        };

        openModal(dom.modalCard);
    }

    // ---------- カスタマイズモード（じぶんステージ） ----------
    function initCustomBuilder() {
        if (!dom.screenCustom) return;

        // タイトル初期化
        if (dom.customStageTitle) {
            dom.customStageTitle.value = state.customConfig.title || 'きょうりゅうを さがせ！';
        }

        // 密度ボタンのアクティブ状態
        if (dom.customDensityGroup) {
            dom.customDensityGroup.querySelectorAll('.density-btn').forEach((btn) => {
                btn.classList.toggle('selected', btn.dataset.density === state.customConfig.density);
            });
        }

        renderCustomThemes();
        renderCustomChosenTray();
        renderCustomPalette();
        renderSavedStages();
    }

    function renderCustomThemes() {
        if (!dom.customThemeSelector) return;
        let html = '';
        DM.data.THEMES.forEach((t) => {
            const isSelected = t.id === state.customConfig.themeId;
            html += `
                <div class="custom-theme-pill ${isSelected ? 'selected' : ''}" data-theme-id="${t.id}">
                    <div class="custom-theme-pill-icon">${t.icon}</div>
                    <div class="custom-theme-pill-name">${t.title}</div>
                </div>
            `;
        });
        dom.customThemeSelector.innerHTML = html;

        dom.customThemeSelector.querySelectorAll('.custom-theme-pill').forEach((pill) => {
            pill.addEventListener('click', () => {
                DM.audio.click();
                dom.customThemeSelector.querySelectorAll('.custom-theme-pill').forEach((p) => p.classList.remove('selected'));
                pill.classList.add('selected');
                state.customConfig.themeId = pill.dataset.themeId;
                DM.audio.setBgmTheme(state.customConfig.themeId);
                renderCustomPalette();
            });
        });
    }

    function renderCustomChosenTray() {
        if (!dom.customChosenTray) return;
        const targets = state.customConfig.targets || [];
        let totalCount = 0;

        if (targets.length === 0) {
            dom.customChosenTray.innerHTML = `<span class="tray-empty-hint">下の生き物やアイテムをタップしてお題にしてね！</span>`;
        } else {
            let html = '';
            targets.forEach((t) => {
                totalCount += t.count;
                const info = DM.data.kindInfo(t.kind) || { name: t.kind };
                html += `
                    <div class="chosen-chip" data-kind="${t.kind}">
                        <div class="chosen-chip-icon">${DM.art.icon(t.kind)}</div>
                        <div class="chosen-chip-name">${info.name}</div>
                        <div class="chosen-chip-controls">
                            <button class="chip-ctrl-btn btn-minus" data-kind="${t.kind}" aria-label="へらす">−</button>
                            <span class="chosen-chip-count">${t.count}</span>
                            <button class="chip-ctrl-btn btn-plus" data-kind="${t.kind}" aria-label="ふやす">＋</button>
                            <button class="chip-delete-btn" data-kind="${t.kind}" aria-label="さくじょ"><i class="fa-solid fa-xmark"></i></button>
                        </div>
                    </div>
                `;
            });
            dom.customChosenTray.innerHTML = html;

            dom.customChosenTray.querySelectorAll('.btn-minus').forEach((btn) => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    DM.audio.click();
                    updateCustomTargetCount(btn.dataset.kind, -1);
                });
            });
            dom.customChosenTray.querySelectorAll('.btn-plus').forEach((btn) => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    DM.audio.click();
                    updateCustomTargetCount(btn.dataset.kind, 1);
                });
            });
            dom.customChosenTray.querySelectorAll('.chip-delete-btn').forEach((btn) => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    DM.audio.click();
                    removeCustomTarget(btn.dataset.kind);
                });
            });
        }

        if (dom.customTargetTotalBadge) {
            dom.customTargetTotalBadge.innerHTML = `合計: <b>${totalCount}</b> 個`;
        }

        renderCustomPalette();
    }

    function renderCustomPalette() {
        if (!dom.customPaletteGrid) return;
        const currentTheme = DM.data.theme(state.customConfig.themeId);
        let kinds = [];

        if (state.customPaletteTab === 'theme') {
            kinds = [...currentTheme.dinos, ...currentTheme.items];
        } else {
            kinds = DM.data.dinoOrder;
        }

        const countsMap = {};
        (state.customConfig.targets || []).forEach((t) => (countsMap[t.kind] = t.count));

        let html = '';
        kinds.forEach((k) => {
            const info = DM.data.kindInfo(k) || { name: k };
            const count = countsMap[k] || 0;
            html += `
                <div class="palette-item ${count > 0 ? 'is-chosen' : ''}" data-kind="${k}">
                    ${count > 0 ? `<div class="palette-item-badge">×${count}</div>` : ''}
                    <div class="palette-item-art">${DM.art.icon(k)}</div>
                    <div class="palette-item-name">${info.name}</div>
                </div>
            `;
        });
        dom.customPaletteGrid.innerHTML = html;

        dom.customPaletteGrid.querySelectorAll('.palette-item').forEach((item) => {
            item.addEventListener('click', () => {
                DM.audio.click();
                addCustomTarget(item.dataset.kind);
            });
        });
    }

    function addCustomTarget(kind) {
        state.customConfig.targets = state.customConfig.targets || [];
        const existing = state.customConfig.targets.find((t) => t.kind === kind);
        if (existing) {
            if (existing.count < 8) {
                existing.count++;
            } else {
                toast('1種類あたり 最大8個までだよ！');
            }
        } else {
            if (state.customConfig.targets.length >= 8) {
                toast('お題は 最大8種類まで えらべるよ！');
                return;
            }
            state.customConfig.targets.push({ kind, count: 1 });
        }
        renderCustomChosenTray();
    }

    function removeCustomTarget(kind) {
        state.customConfig.targets = (state.customConfig.targets || []).filter((t) => t.kind !== kind);
        renderCustomChosenTray();
    }

    function updateCustomTargetCount(kind, delta) {
        const item = (state.customConfig.targets || []).find((t) => t.kind === kind);
        if (!item) return;
        item.count += delta;
        if (item.count <= 0) {
            removeCustomTarget(kind);
        } else if (item.count > 8) {
            item.count = 8;
            renderCustomChosenTray();
        } else {
            renderCustomChosenTray();
        }
    }

    function saveCurrentCustomStage() {
        if (!state.customConfig.targets || state.customConfig.targets.length === 0) {
            toast('さがす お題を 1つ以上 えらんでね！');
            return;
        }
        if (dom.customStageTitle) {
            state.customConfig.title = dom.customStageTitle.value.trim() || 'きょうりゅうを さがせ！';
        }

        const stageToSave = {
            id: state.customConfig.id || 'stage_' + Date.now(),
            title: state.customConfig.title,
            themeId: state.customConfig.themeId,
            density: state.customConfig.density,
            targets: JSON.parse(JSON.stringify(state.customConfig.targets)),
            seed: state.customConfig.seed || U.newSeed(),
        };

        DM.storage.saveCustomStage(stageToSave);
        state.customConfig.id = stageToSave.id;
        renderSavedStages();
        toast('ステージを ほぞんしたよ！ 💾✨');
    }

    function renderSavedStages() {
        if (!dom.savedStagesList) return;
        const stages = DM.storage.getCustomStages();
        if (stages.length === 0) {
            dom.savedStagesList.innerHTML = `<div class="tray-empty-hint">ほぞんしたステージは ここにならぶよ！</div>`;
            return;
        }

        let html = '';
        stages.forEach((st) => {
            const theme = DM.data.theme(st.themeId);
            const total = (st.targets || []).reduce((s, t) => s + t.count, 0);
            html += `
                <div class="saved-stage-item" data-stage-id="${st.id}">
                    <div class="saved-stage-info">
                        <span class="saved-stage-title">${st.title}</span>
                        <span class="saved-stage-desc">${theme.icon} ${theme.title} ・ ${total}個 さがす</span>
                    </div>
                    <div class="saved-stage-actions">
                        <button class="saved-stage-btn btn-load-play" data-stage-id="${st.id}">あそぶ</button>
                        <button class="saved-stage-btn btn-load-edit" data-stage-id="${st.id}">へんしゅう</button>
                        <button class="saved-stage-btn saved-stage-del btn-load-del" data-stage-id="${st.id}"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
            `;
        });
        dom.savedStagesList.innerHTML = html;

        dom.savedStagesList.querySelectorAll('.btn-load-play').forEach((b) => {
            b.addEventListener('click', () => {
                DM.audio.click();
                const st = stages.find((s) => s.id === b.dataset.stageId);
                if (st) startCustomGame(st);
            });
        });
        dom.savedStagesList.querySelectorAll('.btn-load-edit').forEach((b) => {
            b.addEventListener('click', () => {
                DM.audio.click();
                const st = stages.find((s) => s.id === b.dataset.stageId);
                if (st) {
                    state.customConfig = JSON.parse(JSON.stringify(st));
                    initCustomBuilder();
                    toast('ステージを よみこんだよ！ ✏️');
                }
            });
        });
        dom.savedStagesList.querySelectorAll('.btn-load-del').forEach((b) => {
            b.addEventListener('click', () => {
                DM.audio.click();
                if (confirm('このステージを けしても いい？')) {
                    DM.storage.deleteCustomStage(b.dataset.stageId);
                    renderSavedStages();
                    toast('さくじょしました');
                }
            });
        });
    }

    function startCustomGame(config) {
        state.isCustomGame = true;
        state.customConfig = config;
        state.currentTheme = config.themeId || 'theme_jungle';
        state.currentDifficulty = config.density || 'normal';
        state.currentPageIndex = 0;

        // 1ページのみのカスタムブックを生成
        const page = DM.field.generateCustomPage(config);
        state.bookPages = [page];

        showScreen('game');
        loadPage(0);
    }

    function shareCustomStageUrl() {
        if (!state.customConfig.targets || state.customConfig.targets.length === 0) {
            toast('さがす お題を 1つ以上 えらんでね！');
            return;
        }
        if (dom.customStageTitle) {
            state.customConfig.title = dom.customStageTitle.value.trim() || 'きょうりゅうを さがせ！';
        }

        try {
            const cleanConfig = {
                title: state.customConfig.title,
                themeId: state.customConfig.themeId,
                density: state.customConfig.density,
                targets: state.customConfig.targets,
                seed: state.customConfig.seed || U.newSeed(),
            };
            const jsonStr = JSON.stringify(cleanConfig);
            const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
            const url = `${window.location.origin}${window.location.pathname}?custom=${encoded}`;

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).then(() => {
                    toast('ステージの リンクを コピーしたよ！ 💌\n家族や友達にシェアしよう！', 3500);
                }).catch(() => {
                    prompt('このリンクをコピーしてね:', url);
                });
            } else {
                prompt('このリンクをコピーしてね:', url);
            }
        } catch (e) {
            toast('リンクをつくれませんでした');
        }
    }

    // ---------- FormSubmit ご意見フォーム ----------
    function setupFeedbackForm() {
        let isSending = false;
        if (!dom.btnSendFeedback) return;

        dom.btnSendFeedback.addEventListener('click', async () => {
            if (isSending) return;
            DM.audio.click();
            const text = dom.feedbackText.value.trim();
            if (!text) {
                toast('ごいけん・ごようぼうを にゅうりょくしてね');
                dom.feedbackText.focus();
                return;
            }

            isSending = true;
            dom.btnSendFeedback.disabled = true;
            const orig = dom.btnSendFeedback.innerHTML;
            dom.btnSendFeedback.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> おくっているよ…';

            try {
                const endpoint = 'https://formsubmit.co/ajax/find_info@plyo.blog';
                const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                    },
                    body: JSON.stringify({
                        _subject: '【きょうりゅうミッケ！】ごいけん・ごようぼう',
                        _captcha: 'false',
                        _template: 'table',
                        message: text,
                        date: new Date().toLocaleString('ja-JP'),
                    }),
                });

                if (res.ok) {
                    dom.feedbackText.value = '';
                    toast('おくったよ！ ありがとうございます！ 💌✨');
                    closeModal(dom.screenSettings);
                } else {
                    toast('おくれませんでした。またあとで ためしてね');
                }
            } catch (err) {
                toast('おくれませんでした。またあとで ためしてね');
            } finally {
                isSending = false;
                dom.btnSendFeedback.disabled = false;
                dom.btnSendFeedback.innerHTML = orig;
            }
        });
    }

    // 起動
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    DM.game = {
        init,
        startGame,
        startCustomGame,
        showScreen,
        openCreativeMode: () => showScreen('custom'),
    };
})();
