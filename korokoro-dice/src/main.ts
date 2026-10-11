import './styles/main.css';
import { AppState, DiceCount, DiceState, DiceType, GameMode, ThemeId } from './types/index.ts';
import { SplashScreen } from './components/SplashScreen.ts';
import { Scoreboard } from './components/Scoreboard.ts';
import { DiceContainer } from './components/DiceContainer.ts';
import { ControlPanel } from './components/ControlPanel.ts';
import { RollButton } from './components/RollButton.ts';
import { RollHistory } from './components/RollHistory.ts';
import { TargetGame } from './components/TargetGame.ts';
import { CelebrationOverlay } from './components/CelebrationOverlay.ts';
import { DiceBookModal } from './components/DiceBookModal.ts';
import { isZorome, isMaxValue, calculateSum, triggerHaptic } from './utils/helpers.ts';
import { DICE_TYPES, getFace } from './data/themes.ts';

/**
 * コロコロサイコロ — メインアプリケーション
 * 全コンポーネントの生成・イベント接続・状態管理を担当する。
 */
class App {
  private appEl: HTMLElement;

  private scoreboard!: Scoreboard;
  private diceContainer!: DiceContainer;
  private controlPanel!: ControlPanel;
  private rollButton!: RollButton;
  private rollHistory!: RollHistory;
  private targetGame!: TargetGame;
  private celebration: CelebrationOverlay;
  private diceBookModal!: DiceBookModal;

  private state: AppState = {
    diceCount: 2,
    currentTheme: 'number',
    diceType: 'd6',
    gameMode: 'normal',
    dice: [],
    isAnyRolling: false,
    isStarted: false,
  };

  constructor() {
    this.appEl = document.getElementById('app')!;
    this.celebration = new CelebrationOverlay();

    this.showSplash();
  }

  /** スプラッシュ画面を表示する */
  private showSplash(): void {
    new SplashScreen(this.appEl, () => {
      this.state.isStarted = true;
      triggerHaptic('success');
      this.buildMainUI();
    });
  }

  /** メインUIを構築する */
  private buildMainUI(): void {
    const main = document.createElement('div');
    main.className = 'main-app';
    this.appEl.appendChild(main);

    // スコアボード
    this.scoreboard = new Scoreboard(main);

    // もくひょうゲーム
    this.targetGame = new TargetGame(main);
    this.targetGame.setDiceConfig(this.state.diceCount, this.currentSides);

    // ロール履歴
    this.rollHistory = new RollHistory(main);

    // サイコロエリア
    this.diceContainer = new DiceContainer(
      main,
      this.state.currentTheme,
      this.state.diceCount,
      this.state.diceType
    );

    // コントロールパネル
    this.controlPanel = new ControlPanel(
      main,
      this.state.diceCount,
      this.state.currentTheme,
      this.state.diceType
    );

    // ロールボタン
    this.rollButton = new RollButton(main);

    // サイコロずかん（なかみ一覧）モーダル
    this.diceBookModal = new DiceBookModal(this.state.currentTheme, this.state.diceType);

    // イベント接続
    this.connectEvents();
  }

  /** 現在のサイコロの面数 */
  private get currentSides(): number {
    if (this.state.currentTheme !== 'number') return 6;
    return DICE_TYPES[this.state.diceType]?.sides || 6;
  }

  /** イベントハンドラを接続する */
  private connectEvents(): void {
    // ロールボタン押下
    this.rollButton.onClick = () => {
      this.handleRollAll();
    };

    // サイコロ回転開始 (個別タップ時も含むインターロック)
    this.diceContainer.onRollStart = () => {
      this.state.isAnyRolling = true;
      this.rollButton.setRolling(true);
      this.controlPanel.setDisabled(true);
      this.scoreboard.showRolling();
    };

    // 全サイコロ回転完了
    this.diceContainer.onAllComplete = (dice: DiceState[]) => {
      this.handleAllComplete(dice);
    };

    // 個数変更
    this.controlPanel.onDiceCountChange = (count: DiceCount) => {
      this.state.diceCount = count;
      this.diceContainer.setDiceCount(count);
      this.targetGame.setDiceConfig(count, this.currentSides);
      this.scoreboard.reset();
    };

    // テーマ変更
    this.controlPanel.onThemeChange = (themeId: ThemeId) => {
      this.state.currentTheme = themeId;
      if (themeId !== 'number') {
        this.state.diceType = 'd6';
      }
      this.diceContainer.setTheme(themeId);
      this.targetGame.setDiceConfig(this.state.diceCount, this.currentSides);
      this.scoreboard.reset();
    };

    // 多面体サイコロ変更
    this.controlPanel.onDiceTypeChange = (diceType: DiceType) => {
      this.state.diceType = diceType;
      this.diceContainer.setDiceType(diceType);
      this.targetGame.setDiceConfig(this.state.diceCount, this.currentSides);
      this.scoreboard.reset();
    };

    // ゲームモード変更
    this.controlPanel.onGameModeChange = (mode: GameMode) => {
      this.state.gameMode = mode;
      this.handleGameModeChange(mode);
    };

    // サイコロずかんを開く
    this.controlPanel.onOpenBook = () => {
      this.diceBookModal.show(this.state.currentTheme, this.state.diceType);
    };

    // サイコロずかんで選択された時
    this.diceBookModal.onSelectDice = (themeId: ThemeId, diceType: DiceType) => {
      this.state.currentTheme = themeId;
      this.state.diceType = diceType;

      this.controlPanel.setTheme(themeId);
      this.controlPanel.setDiceType(diceType);
      this.diceContainer.setTheme(themeId);
      this.diceContainer.setDiceType(diceType);
      this.targetGame.setDiceConfig(this.state.diceCount, this.currentSides);
      this.scoreboard.reset();
    };

    // シェイクでロール
    this.controlPanel.onShake = () => {
      this.handleRollAll();
    };

    // もくひょうゲーム: ぴったり達成
    this.targetGame.onExactHit = () => {
      this.celebration.celebrateZorome('🎯');
    };

    // もくひょうゲーム: リセット
    this.targetGame.onReset = () => {
      this.scoreboard.reset();
    };
  }

  /** 一括ロールを実行する */
  private handleRollAll(): void {
    if (this.diceContainer.isAnyRolling) return;
    if (this.state.gameMode === 'target' && this.targetGame.isComplete) return;

    this.state.isAnyRolling = true;
    this.rollButton.setRolling(true);
    this.controlPanel.setDisabled(true);
    this.scoreboard.showRolling();

    this.diceContainer.rollAll();
  }

  /** 全サイコロ完了時の処理 */
  private handleAllComplete(dice: DiceState[]): void {
    this.state.isAnyRolling = false;
    this.state.dice = dice;
    this.rollButton.setRolling(false);
    this.controlPanel.setDisabled(false);

    const sum = calculateSum(dice);
    const sides = this.currentSides;

    // スコアボード更新
    this.scoreboard.update(dice, this.state.currentTheme);

    // ロール履歴に追加
    this.rollHistory.addEntry(
      dice.map((d) => d.value),
      this.state.currentTheme,
      sum,
      this.state.diceType
    );

    // もくひょうゲームに加算
    if (this.state.gameMode === 'target') {
      this.targetGame.addRoll(sum);
    }

    // ぞろ目・最大値チェック（ふつうモードのみ）
    if (this.state.gameMode === 'normal' && dice.length >= 2) {
      if (isMaxValue(dice, sides)) {
        setTimeout(() => {
          this.celebration.celebrateMax(dice.length, sides);
        }, 500);
      } else if (isZorome(dice)) {
        setTimeout(() => {
          const faceDisplay = getFace(this.state.currentTheme, dice[0].value, this.state.diceType).display;
          this.celebration.celebrateZorome(faceDisplay);
        }, 500);
      }
    }
  }

  /** ゲームモード切替時の処理 */
  private handleGameModeChange(mode: GameMode): void {
    if (mode === 'target') {
      this.scoreboard.reset();
      this.targetGame.setDiceConfig(this.state.diceCount, this.currentSides);
      this.targetGame.reset();
      this.targetGame.show();
      this.rollHistory.clear();
    } else {
      this.targetGame.hide();
      this.scoreboard.reset();
      this.rollHistory.clear();
    }
  }
}

// アプリ起動
new App();
