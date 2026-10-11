// ==========================================
// ぷるぽよチェイン: ゲーム定数 & 設定 (constants.js)
// ==========================================

const LOGICAL_WIDTH = 450;
const LOGICAL_HEIGHT = 700;

// Grid layout parameters
const COLS = 6;
const ROWS = 7;
const startYThreshold = 210; // Upper deadline boundary
const CELL_WIDTH = 410 / COLS;   // ~68.33px
const CELL_HEIGHT = 470 / ROWS;  // ~67.14px
const blockRadius = 33.5;        // Diameter ~67px: perfectly matches logical grid height

// Extended Vibrant Color Palette
const BUBBLE_COLORS = {
    red: { 
        name: 'red',
        main: '#ff6b6b', 
        highlight: '#ffa8a8', 
        dark: '#fa5252', 
        outline: '#c92a2a', 
        glow: 'rgba(255, 107, 107, 0.55)' 
    },
    blue: { 
        name: 'blue',
        main: '#4dabf7', 
        highlight: '#a5d8ff', 
        dark: '#339af0', 
        outline: '#1c7ed6', 
        glow: 'rgba(77, 171, 247, 0.55)' 
    },
    green: { 
        name: 'green',
        main: '#51cf66', 
        highlight: '#b2f2bb', 
        dark: '#40c057', 
        outline: '#2b8a3e', 
        glow: 'rgba(81, 207, 102, 0.55)' 
    },
    yellow: { 
        name: 'yellow',
        main: '#fcc419', 
        highlight: '#ffec99', 
        dark: '#fab005', 
        outline: '#f59f00', 
        glow: 'rgba(252, 196, 25, 0.55)' 
    },
    purple: { 
        name: 'purple',
        main: '#be4bdb', 
        highlight: '#eebefa', 
        dark: '#ae3ec9', 
        outline: '#862e9c', 
        glow: 'rgba(190, 75, 219, 0.55)' 
    },
    gray: { 
        name: 'gray',
        main: '#94a3b8', 
        highlight: '#e2e8f0', 
        dark: '#64748b', 
        outline: '#475569', 
        glow: 'rgba(148, 163, 184, 0.45)' 
    }
};

const COLOR_NAMES_BASE = ['red', 'blue', 'green', 'yellow'];

// State Machine Constants
const STATE_TITLE = 'title';
const STATE_IDLE = 'idle';
const STATE_DRAGGING = 'dragging';
const STATE_WAIT_SETTLE = 'wait_settle';
const STATE_MATCHING = 'matching';
const STATE_REFILL = 'refill';
const STATE_STAGE_CLEAR = 'stage_clear';
const STATE_GAME_OVER = 'game_over';
const STATE_MONSTER_ATTACK = 'monster_attack';
const STATE_VICTORY = 'victory';
const STATE_WAIT_EFFECTS = 'wait_effects';
const STATE_PAUSED = 'paused';
const STATE_BOSS_DEFEATED = 'boss_defeated';

// Game Modes
const MODE_STAGE = 'stage';
const MODE_ENDLESS = 'endless';

// Monsters Catalogue
const MONSTERS = [
    { name: "ぷるスライム", maxHP: 200, type: "slime", expReward: 100 },
    { name: "バタコウモリ", maxHP: 420, type: "bat", expReward: 250 },
    { name: "モグおばけ", maxHP: 850, type: "ghost", expReward: 500 },
    { name: "カンゴブリン", maxHP: 1600, type: "goblin", expReward: 1000 },
    { name: "ぽよキング", maxHP: 3200, type: "king_slime", expReward: 2500 }
];

// Gameplay limits & timing
const dragDurationLimit = 8000;    // 8 seconds
const dangerLimitFrames = 180;     // 3 seconds in danger line
const feverDurationFrames = 720;   // 12 seconds
const BURST_MAX = 100;             // Burst gauge 100%
