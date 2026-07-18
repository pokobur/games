import './styles/main.css';
import { AppState, DiceCount, DiceState, GameMode, ThemeId } from './types/index.ts';
import { SplashScreen } from './components/SplashScreen.ts';
import { Scoreboard } from './components/Scoreboard.ts';
import { DiceContainer } from './components/DiceContainer.ts';
import { ControlPanel } from './components/ControlPanel.ts';
import { RollButton } from './components/RollButton.ts';
import { RollHistory } from './components/RollHistory.ts';
import { TargetGame } from './components/TargetGame.ts';
import { CelebrationOverlay } from './components/CelebrationOverlay.ts';
import { isZorome, isMaxValue, calculateSum } from './utils/helpers.ts';
import { getFace } from './data/themes.ts';

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

  private state: AppState = {
    diceCount: 2,
    currentTheme: 'number',
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
      this.buildMainUI();
    });
  }

  /** メインUIを構築する */
  private buildMainUI(): void {
    const main = document.createElement('div');
    main.className = 'main-app';
    this.appEl.appendChild(main);

    // スコアボード (ふつうモード)
    this.scoreboard = new Scoreboard(main);

    // もくひょうゲーム (もくひょうモード、初期非表示)
    this.targetGame = new TargetGame(main);

    // ロール履歴
    this.rollHistory = new RollHistory(main);

    // サイコロエリア
    this.diceContainer = new DiceContainer(
      main,
      this.state.currentTheme,
      this.state.diceCount
    );

    // コントロールパネル
    this.controlPanel = new ControlPanel(
      main,
      this.state.diceCount,
      this.state.currentTheme
    );

    // ロールボタン
    this.rollButton = new RollButton(main);

    // イベント接続
    this.connectEvents();
  }

  /** イベントハンドラを接続する */
  private connectEvents(): void {
    // ロールボタン押下
    this.rollButton.onClick = () => {
      this.handleRollAll();
    };

    // 全サイコロ完了
    this.diceContainer.onAllComplete = (dice: DiceState[]) => {
      this.handleAllComplete(dice);
    };

    // 個数変更
    this.controlPanel.onDiceCountChange = (count: DiceCount) => {
      this.state.diceCount = count;
      this.diceContainer.setDiceCount(count);
      this.scoreboard.reset();
    };

    // テーマ変更
    this.controlPanel.onThemeChange = (themeId: ThemeId) => {
      this.state.currentTheme = themeId;
      this.diceContainer.setTheme(themeId);
      this.scoreboard.reset();
    };

    // ゲームモード変更
    this.controlPanel.onGameModeChange = (mode: GameMode) => {
      this.state.gameMode = mode;
      this.handleGameModeChange(mode);
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

    // もくひょうゲーム完了時はロール不可
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

    // スコアボード更新
    this.scoreboard.update(dice, this.state.currentTheme);

    // ロール履歴に追加
    this.rollHistory.addEntry(
      dice.map((d) => d.value),
      this.state.currentTheme,
      sum
    );

    // もくひょうゲームに加算
    if (this.state.gameMode === 'target') {
      this.targetGame.addRoll(sum);
    }

    // ぞろ目・最大値チェック（ふつうモードのみ）
    if (this.state.gameMode === 'normal' && dice.length >= 2) {
      if (isMaxValue(dice)) {
        setTimeout(() => {
          this.celebration.celebrateMax(dice.length);
        }, 600);
      } else if (isZorome(dice)) {
        setTimeout(() => {
          const faceDisplay = getFace(this.state.currentTheme, dice[0].value).display;
          this.celebration.celebrateZorome(faceDisplay);
        }, 600);
      }
    }
  }

  /** ゲームモード切替時の処理 */
  private handleGameModeChange(mode: GameMode): void {
    if (mode === 'target') {
      this.scoreboard.reset();
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
