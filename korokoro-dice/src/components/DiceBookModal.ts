import { DiceType, ThemeId } from '../types/index.ts';
import { DICE_TYPE_LIST, DICE_TYPES, getAllFacesForTheme, getTheme, getThemeList } from '../data/themes.ts';
import { triggerHaptic } from '../utils/helpers.ts';

/**
 * DiceBookModal — サイコロずかん（なかみ一覧）モーダル
 * どんなサイコロがあるか、サイコロの面（出目・名前・絵文字）を一覧で確認できる。
 */
export class DiceBookModal {
  private overlay: HTMLElement;
  private modalEl: HTMLElement;
  private listContainer: HTMLElement;
  private polySelectorRow: HTMLElement;

  private selectedThemeId: ThemeId;
  private selectedDiceType: DiceType;

  /** 「このサイコロであそぶ」選択コールバック */
  public onSelectDice: ((themeId: ThemeId, diceType: DiceType) => void) | null = null;

  constructor(initialThemeId: ThemeId = 'number', initialDiceType: DiceType = 'd6') {
    this.selectedThemeId = initialThemeId;
    this.selectedDiceType = initialDiceType;

    // オーバーレイ
    this.overlay = document.createElement('div');
    this.overlay.className = 'dice-book-overlay';
    this.overlay.style.display = 'none';

    // モーダル本体
    this.modalEl = document.createElement('div');
    this.modalEl.className = 'dice-book-modal';

    // ヘッダー
    const header = document.createElement('div');
    header.className = 'dice-book-header';

    const titleWrap = document.createElement('div');
    titleWrap.className = 'dice-book-title-wrap';

    const title = document.createElement('h2');
    title.className = 'dice-book-title';
    title.innerHTML = '📖 サイコロずかん';

    const subtitle = document.createElement('p');
    subtitle.className = 'dice-book-subtitle';
    subtitle.textContent = 'サイコロの なかみを みてみよう！';

    titleWrap.appendChild(title);
    titleWrap.appendChild(subtitle);
    header.appendChild(titleWrap);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'dice-book-close-btn';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', () => this.hide());
    header.appendChild(closeBtn);

    this.modalEl.appendChild(header);

    // テーマ選択タブ
    const themeTabs = document.createElement('div');
    themeTabs.className = 'dice-book-theme-tabs';
    const themes = getThemeList();

    for (const t of themes) {
      const tabBtn = document.createElement('button');
      tabBtn.className = `dice-book-theme-tab${t.id === this.selectedThemeId ? ' active' : ''}`;
      tabBtn.innerHTML = `<span>${t.emoji}</span> <span>${t.name}</span>`;
      tabBtn.addEventListener('click', () => {
        triggerHaptic('tap');
        this.selectedThemeId = t.id;
        this.updateThemeTabs();
        this.renderContent();
      });
      themeTabs.appendChild(tabBtn);
    }
    this.modalEl.appendChild(themeTabs);

    // 多面体セレクター（すうじテーマ時のみ表示）
    this.polySelectorRow = document.createElement('div');
    this.polySelectorRow.className = 'dice-book-poly-row';
    for (const dt of DICE_TYPE_LIST) {
      const polyBtn = document.createElement('button');
      polyBtn.className = `dice-book-poly-btn${dt.type === this.selectedDiceType ? ' active' : ''}`;
      polyBtn.innerHTML = `<strong>${dt.badge}</strong> <span>${dt.name}</span>`;
      polyBtn.addEventListener('click', () => {
        triggerHaptic('tap');
        this.selectedDiceType = dt.type;
        this.updatePolyButtons();
        this.renderContent();
      });
      this.polySelectorRow.appendChild(polyBtn);
    }
    this.modalEl.appendChild(this.polySelectorRow);

    // 面の一覧コンテナ
    this.listContainer = document.createElement('div');
    this.listContainer.className = 'dice-book-list';
    this.modalEl.appendChild(this.listContainer);

    // フッター (あそぶボタン & とじるボタン)
    const footer = document.createElement('div');
    footer.className = 'dice-book-footer';

    const useBtn = document.createElement('button');
    useBtn.className = 'dice-book-use-btn';
    useBtn.textContent = '🎲 このサイコロで あそぶ！';
    useBtn.addEventListener('click', () => {
      triggerHaptic('success');
      this.onSelectDice?.(this.selectedThemeId, this.selectedDiceType);
      this.hide();
    });

    footer.appendChild(useBtn);
    this.modalEl.appendChild(footer);

    this.overlay.appendChild(this.modalEl);
    document.body.appendChild(this.overlay);

    // オーバーレイ背景タップで閉じる
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.hide();
      }
    });

    this.renderContent();
  }

  /** モーダルを開く */
  show(currentThemeId?: ThemeId, currentDiceType?: DiceType): void {
    if (currentThemeId) this.selectedThemeId = currentThemeId;
    if (currentDiceType) this.selectedDiceType = currentDiceType;

    this.updateThemeTabs();
    this.updatePolyButtons();
    this.renderContent();

    this.overlay.style.display = 'flex';
    this.modalEl.classList.remove('modal-exit');
    this.modalEl.classList.add('modal-enter');
  }

  /** モーダルを閉じる */
  hide(): void {
    this.modalEl.classList.remove('modal-enter');
    this.modalEl.classList.add('modal-exit');
    setTimeout(() => {
      this.overlay.style.display = 'none';
    }, 250);
  }

  /** テーマタブのアクティブ更新 */
  private updateThemeTabs(): void {
    const tabs = this.modalEl.querySelectorAll('.dice-book-theme-tab');
    const themes = getThemeList();
    tabs.forEach((tab, i) => {
      tab.classList.toggle('active', themes[i].id === this.selectedThemeId);
    });
  }

  /** 多面体ボタンのアクティブ更新 */
  private updatePolyButtons(): void {
    const btns = this.polySelectorRow.querySelectorAll('.dice-book-poly-btn');
    btns.forEach((btn, i) => {
      btn.classList.toggle('active', DICE_TYPE_LIST[i].type === this.selectedDiceType);
    });
  }

  /** 面一覧の描画 */
  private renderContent(): void {
    const isNumber = this.selectedThemeId === 'number';
    this.polySelectorRow.style.display = isNumber ? 'flex' : 'none';

    this.listContainer.innerHTML = '';

    const currentTheme = getTheme(this.selectedThemeId);
    const faces = getAllFacesForTheme(this.selectedThemeId, this.selectedDiceType);

    // サイコロの概要バナー
    const summaryBanner = document.createElement('div');
    summaryBanner.className = 'dice-book-summary-banner';
    if (isNumber) {
      const dt = DICE_TYPES[this.selectedDiceType];
      summaryBanner.innerHTML = `
        <span class="banner-badge">${dt.badge}</span>
        <div class="banner-text">
          <div class="banner-name">${dt.name}（${dt.label}）サイコロ</div>
          <div class="banner-desc">${dt.description} ・ ぜんぶで ${faces.length}めん</div>
        </div>
      `;
    } else {
      summaryBanner.innerHTML = `
        <span class="banner-badge">${currentTheme.emoji}</span>
        <div class="banner-text">
          <div class="banner-name">${currentTheme.name} サイコロ</div>
          <div class="banner-desc">かわいい なかまたちが ${faces.length}しゅるい いるよ！</div>
        </div>
      `;
    }
    this.listContainer.appendChild(summaryBanner);

    // 面カードグリッド
    const grid = document.createElement('div');
    grid.className = 'dice-book-grid';

    faces.forEach((face, idx) => {
      const card = document.createElement('div');
      card.className = 'dice-book-card';

      const icon = document.createElement('div');
      icon.className = 'dice-book-card-icon';
      icon.textContent = face.display;
      if (isNumber) icon.classList.add('is-number');

      const info = document.createElement('div');
      info.className = 'dice-book-card-info';

      const label = document.createElement('div');
      label.className = 'dice-book-card-label';
      label.textContent = `${idx + 1}ばん：${face.label}`;

      const desc = document.createElement('div');
      desc.className = 'dice-book-card-desc';
      desc.textContent = face.desc || '';

      info.appendChild(label);
      info.appendChild(desc);

      card.appendChild(icon);
      card.appendChild(info);
      grid.appendChild(card);
    });

    this.listContainer.appendChild(grid);
  }

  destroy(): void {
    this.overlay.remove();
  }
}
