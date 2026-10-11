import { DiceCount, DiceType, GameMode, ThemeId } from '../types/index.ts';
import { DICE_TYPE_LIST, getThemeList } from '../data/themes.ts';
import { ShakeDetector } from '../utils/ShakeDetector.ts';
import { triggerHaptic } from '../utils/helpers.ts';

/**
 * ControlPanel — 設定パネルコンポーネント
 * サイコロ個数切替、テーマ切替、多面体切替、ゲームモード切替、サイコロずかんボタンを含む。
 */
export class ControlPanel {
  private el: HTMLElement;
  private _diceCount: DiceCount;
  private _themeId: ThemeId;
  private _diceType: DiceType = 'd6';
  private _gameMode: GameMode = 'normal';

  private countButtons: HTMLButtonElement[] = [];
  private themeButtons: HTMLButtonElement[] = [];
  private polyButtons: HTMLButtonElement[] = [];
  private gameButtons: HTMLButtonElement[] = [];
  private bookBtn!: HTMLButtonElement;
  private sensorBtn: HTMLButtonElement | null = null;

  private polyRow!: HTMLElement;
  private themeRow!: HTMLElement;

  /** 個数変更コールバック */
  public onDiceCountChange: ((count: DiceCount) => void) | null = null;
  /** テーマ変更コールバック */
  public onThemeChange: ((themeId: ThemeId) => void) | null = null;
  /** 多面体変更コールバック */
  public onDiceTypeChange: ((diceType: DiceType) => void) | null = null;
  /** ゲームモード変更コールバック */
  public onGameModeChange: ((mode: GameMode) => void) | null = null;
  /** サイコロずかん開くコールバック */
  public onOpenBook: (() => void) | null = null;
  /** シェイク検出コールバック */
  public onShake: (() => void) | null = null;

  private shakeDetector: ShakeDetector | null = null;

  constructor(container: HTMLElement, diceCount: DiceCount, themeId: ThemeId, diceType: DiceType = 'd6') {
    this._diceCount = diceCount;
    this._themeId = themeId;
    this._diceType = diceType;

    this.el = document.createElement('div');
    this.el.className = 'control-panel';

    // 上部ユーティリティ行（ずかんボタン ＆ センサー）
    const utilityRow = document.createElement('div');
    utilityRow.className = 'control-row control-utility-row';

    this.bookBtn = document.createElement('button');
    this.bookBtn.className = 'book-open-btn';
    this.bookBtn.innerHTML = '<span>📖</span> <span>サイコロずかん（なかみ）</span>';
    this.bookBtn.addEventListener('click', () => {
      triggerHaptic('tap');
      this.onOpenBook?.();
    });
    utilityRow.appendChild(this.bookBtn);

    if (ShakeDetector.isAvailable()) {
      utilityRow.appendChild(this.createSensorButton());
    }
    this.el.appendChild(utilityRow);

    // サイコロ個数
    const countRow = this.createRow('こすう', this.createCountButtons());
    this.el.appendChild(countRow);

    // 多面体切替 (すうじテーマ時のみ表示)
    this.polyRow = this.createRow('めんの数', this.createPolyButtons());
    this.el.appendChild(this.polyRow);
    this.updatePolyRowVisibility();

    // テーマ切替
    this.themeRow = this.createRow('テーマ', this.createThemeButtons());
    this.el.appendChild(this.themeRow);

    // ゲームモード切替
    const gameRow = this.createRow('ゲーム', this.createGameButtons());
    this.el.appendChild(gameRow);

    container.appendChild(this.el);
  }

  /** ロール中にボタンを無効化する */
  setDisabled(disabled: boolean): void {
    for (const btn of this.countButtons) btn.disabled = disabled;
    for (const btn of this.themeButtons) btn.disabled = disabled;
    for (const btn of this.polyButtons) btn.disabled = disabled;
    for (const btn of this.gameButtons) btn.disabled = disabled;
    this.bookBtn.disabled = disabled;
  }

  /** 外部からのテーマ設定更新 */
  setTheme(themeId: ThemeId): void {
    this._themeId = themeId;
    this.updateThemeActive();
    this.updatePolyRowVisibility();
  }

  /** 外部からの多面体設定更新 */
  setDiceType(diceType: DiceType): void {
    this._diceType = diceType;
    this.updatePolyActive();
  }

  /** 個数ボタンを生成する */
  private createCountButtons(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'control-options';

    const counts: DiceCount[] = [1, 2, 3];
    for (const count of counts) {
      const btn = document.createElement('button');
      btn.className = `control-btn${count === this._diceCount ? ' active' : ''}`;
      btn.textContent = `${count}こ`;
      btn.id = `dice-count-${count}`;
      btn.addEventListener('click', () => {
        triggerHaptic('tap');
        this._diceCount = count;
        this.updateCountActive();
        this.onDiceCountChange?.(count);
      });
      wrap.appendChild(btn);
      this.countButtons.push(btn);
    }

    return wrap;
  }

  /** 多面体ボタンを生成する (D4〜D20) */
  private createPolyButtons(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'control-options poly-options';

    for (const dt of DICE_TYPE_LIST) {
      const btn = document.createElement('button');
      btn.className = `control-btn poly-btn${dt.type === this._diceType ? ' active' : ''}`;
      btn.innerHTML = `<strong>${dt.badge}</strong><small>${dt.name}</small>`;
      btn.title = dt.description;
      btn.addEventListener('click', () => {
        triggerHaptic('tap');
        this._diceType = dt.type;
        this.updatePolyActive();
        this.onDiceTypeChange?.(dt.type);
      });
      wrap.appendChild(btn);
      this.polyButtons.push(btn);
    }

    return wrap;
  }

  /** テーマボタンを生成する */
  private createThemeButtons(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'control-options theme-options';

    const themeList = getThemeList();
    for (const theme of themeList) {
      const btn = document.createElement('button');
      btn.className = `control-btn${theme.id === this._themeId ? ' active' : ''}`;
      btn.textContent = `${theme.emoji} ${theme.name}`;
      btn.id = `theme-${theme.id}`;
      btn.addEventListener('click', () => {
        if (this._gameMode === 'target') return;
        triggerHaptic('tap');
        this._themeId = theme.id;
        this.updateThemeActive();
        this.updatePolyRowVisibility();
        this.onThemeChange?.(theme.id);
      });
      wrap.appendChild(btn);
      this.themeButtons.push(btn);
    }

    return wrap;
  }

  /** ゲームモードボタンを生成する */
  private createGameButtons(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'control-options';

    const modes: { id: GameMode; label: string }[] = [
      { id: 'normal', label: 'ふつう' },
      { id: 'target', label: '🎯 もくひょう' },
    ];

    for (const mode of modes) {
      const btn = document.createElement('button');
      btn.className = `control-btn${mode.id === this._gameMode ? ' active' : ''}`;
      btn.textContent = mode.label;
      btn.id = `game-${mode.id}`;
      btn.addEventListener('click', () => {
        triggerHaptic('tap');
        this._gameMode = mode.id;
        this.updateGameActive();
        this.applyGameModeRestrictions();
        this.onGameModeChange?.(mode.id);
      });
      wrap.appendChild(btn);
      this.gameButtons.push(btn);
    }

    return wrap;
  }

  /** センサー有効化ボタンを生成する */
  private createSensorButton(): HTMLElement {
    this.sensorBtn = document.createElement('button');
    this.sensorBtn.className = 'sensor-btn';
    this.sensorBtn.textContent = '📱 ふってころがす';
    this.sensorBtn.id = 'sensor-enable';

    this.sensorBtn.addEventListener('click', async () => {
      triggerHaptic('tap');
      const granted = await ShakeDetector.requestPermission();
      if (granted) {
        this.enableShake();
        this.sensorBtn!.textContent = '📱 シェイク ON ✓';
        this.sensorBtn!.classList.add('granted');
        this.sensorBtn!.disabled = true;
      }
    });

    return this.sensorBtn;
  }

  /** シェイク検出を有効にする */
  private enableShake(): void {
    this.shakeDetector = new ShakeDetector();
    this.shakeDetector.start(() => {
      this.onShake?.();
    });
  }

  /** 多面体セレクターの表示/非表示 */
  private updatePolyRowVisibility(): void {
    if (this._themeId === 'number') {
      this.polyRow.style.display = 'flex';
    } else {
      this.polyRow.style.display = 'none';
    }
  }

  /** ゲームモード制限の適用 */
  private applyGameModeRestrictions(): void {
    if (this._gameMode === 'target') {
      this._themeId = 'number';
      this.updateThemeActive();
      this.updatePolyRowVisibility();
      this.onThemeChange?.('number');
      for (const btn of this.themeButtons) {
        btn.style.opacity = '0.4';
        btn.style.pointerEvents = 'none';
      }
    } else {
      for (const btn of this.themeButtons) {
        btn.style.opacity = '';
        btn.style.pointerEvents = '';
      }
    }
  }

  private updateCountActive(): void {
    const counts: DiceCount[] = [1, 2, 3];
    this.countButtons.forEach((btn, i) => {
      btn.classList.toggle('active', counts[i] === this._diceCount);
    });
  }

  private updatePolyActive(): void {
    this.polyButtons.forEach((btn, i) => {
      btn.classList.toggle('active', DICE_TYPE_LIST[i].type === this._diceType);
    });
  }

  private updateThemeActive(): void {
    const themeList = getThemeList();
    this.themeButtons.forEach((btn, i) => {
      btn.classList.toggle('active', themeList[i].id === this._themeId);
    });
  }

  private updateGameActive(): void {
    const modes: GameMode[] = ['normal', 'target'];
    this.gameButtons.forEach((btn, i) => {
      btn.classList.toggle('active', modes[i] === this._gameMode);
    });
  }

  private createRow(label: string, content: HTMLElement): HTMLElement {
    const row = document.createElement('div');
    row.className = 'control-row';

    if (label) {
      const labelEl = document.createElement('div');
      labelEl.className = 'control-label';
      labelEl.textContent = label;
      row.appendChild(labelEl);
    }

    row.appendChild(content);
    return row;
  }

  destroy(): void {
    this.shakeDetector?.stop();
    this.el.remove();
  }
}
