import { DiceCount, GameMode, ThemeId } from '../types/index.ts';
import { getThemeList } from '../data/themes.ts';
import { ShakeDetector } from '../utils/ShakeDetector.ts';

/**
 * ControlPanel — 設定パネルコンポーネント
 * サイコロ個数切替、テーマ切替、ゲームモード切替、センサー有効化ボタンを含む。
 */
export class ControlPanel {
  private el: HTMLElement;
  private _diceCount: DiceCount;
  private _themeId: ThemeId;
  private _gameMode: GameMode = 'normal';
  private sensorBtn: HTMLButtonElement | null = null;
  private countButtons: HTMLButtonElement[] = [];
  private themeButtons: HTMLButtonElement[] = [];
  private gameButtons: HTMLButtonElement[] = [];
  private themeRow!: HTMLElement;

  /** 個数変更コールバック */
  public onDiceCountChange: ((count: DiceCount) => void) | null = null;
  /** テーマ変更コールバック */
  public onThemeChange: ((themeId: ThemeId) => void) | null = null;
  /** ゲームモード変更コールバック */
  public onGameModeChange: ((mode: GameMode) => void) | null = null;
  /** シェイク検出コールバック */
  public onShake: (() => void) | null = null;

  private shakeDetector: ShakeDetector | null = null;

  constructor(container: HTMLElement, diceCount: DiceCount, themeId: ThemeId) {
    this._diceCount = diceCount;
    this._themeId = themeId;

    this.el = document.createElement('div');
    this.el.className = 'control-panel';

    // サイコロ個数
    const countRow = this.createRow('こすう', this.createCountButtons());
    this.el.appendChild(countRow);

    // テーマ切替
    this.themeRow = this.createRow('テーマ', this.createThemeButtons());
    this.el.appendChild(this.themeRow);

    // ゲームモード切替
    const gameRow = this.createRow('ゲーム', this.createGameButtons());
    this.el.appendChild(gameRow);

    // センサー有効化ボタン (対応デバイスのみ)
    if (ShakeDetector.isAvailable()) {
      const sensorRow = this.createRow('', this.createSensorButton());
      this.el.appendChild(sensorRow);
    }

    container.appendChild(this.el);
  }

  /** ロール中にボタンを無効化する */
  setDisabled(disabled: boolean): void {
    for (const btn of this.countButtons) {
      btn.disabled = disabled;
    }
    for (const btn of this.themeButtons) {
      btn.disabled = disabled;
    }
    for (const btn of this.gameButtons) {
      btn.disabled = disabled;
    }
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
        this._diceCount = count;
        this.updateCountActive();
        this.onDiceCountChange?.(count);
      });
      wrap.appendChild(btn);
      this.countButtons.push(btn);
    }

    return wrap;
  }

  /** テーマボタンを生成する */
  private createThemeButtons(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'control-options';

    const themeList = getThemeList();
    for (const theme of themeList) {
      const btn = document.createElement('button');
      btn.className = `control-btn${theme.id === this._themeId ? ' active' : ''}`;
      btn.textContent = `${theme.emoji} ${theme.name}`;
      btn.id = `theme-${theme.id}`;
      btn.addEventListener('click', () => {
        if (this._gameMode === 'target') return; // もくひょう中はすうじ固定
        this._themeId = theme.id;
        this.updateThemeActive();
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
    const wrap = document.createElement('div');
    wrap.className = 'control-options';

    this.sensorBtn = document.createElement('button');
    this.sensorBtn.className = 'sensor-btn';
    this.sensorBtn.textContent = '📱 ふって ころがす';
    this.sensorBtn.id = 'sensor-enable';

    this.sensorBtn.addEventListener('click', async () => {
      const granted = await ShakeDetector.requestPermission();
      if (granted) {
        this.enableShake();
        this.sensorBtn!.textContent = '📱 シェイク ON ✓';
        this.sensorBtn!.classList.add('granted');
        this.sensorBtn!.disabled = true;
      }
    });

    wrap.appendChild(this.sensorBtn);
    return wrap;
  }

  /** シェイク検出を有効にする */
  private enableShake(): void {
    this.shakeDetector = new ShakeDetector();
    this.shakeDetector.start(() => {
      this.onShake?.();
    });
  }

  /** ゲームモードに応じた制約を適用する */
  private applyGameModeRestrictions(): void {
    if (this._gameMode === 'target') {
      // もくひょうモード: テーマをすうじに固定
      this._themeId = 'number';
      this.updateThemeActive();
      this.onThemeChange?.('number');
      for (const btn of this.themeButtons) {
        btn.style.opacity = '0.4';
        btn.style.pointerEvents = 'none';
      }
    } else {
      // ふつうモード: テーマ選択を戻す
      for (const btn of this.themeButtons) {
        btn.style.opacity = '';
        btn.style.pointerEvents = '';
      }
    }
  }

  /** 個数ボタンのアクティブ状態を更新する */
  private updateCountActive(): void {
    const counts: DiceCount[] = [1, 2, 3];
    this.countButtons.forEach((btn, i) => {
      btn.classList.toggle('active', counts[i] === this._diceCount);
    });
  }

  /** テーマボタンのアクティブ状態を更新する */
  private updateThemeActive(): void {
    const themeList = getThemeList();
    this.themeButtons.forEach((btn, i) => {
      btn.classList.toggle('active', themeList[i].id === this._themeId);
    });
  }

  /** ゲームモードボタンのアクティブ状態を更新する */
  private updateGameActive(): void {
    const modes: GameMode[] = ['normal', 'target'];
    this.gameButtons.forEach((btn, i) => {
      btn.classList.toggle('active', modes[i] === this._gameMode);
    });
  }

  /** 行を作成するヘルパー */
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
