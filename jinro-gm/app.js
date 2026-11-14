'use strict';

/**
 * 1台で遊べる人狼GM（ゲームマスター）アプリ
 * Vanilla JavaScript (ES6+) / No external dependencies
 */

const STORAGE_KEY_PLAYERS = 'jinro_gm_saved_players_v2';
const STORAGE_KEY_SETTINGS = 'jinro_gm_saved_settings_v1';
const STORAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 保存データの有効期限（7日間）

/**
 * 標準6役職の定義
 */
const ROLES = {
  VILLAGER: {
    id: 'VILLAGER',
    name: '村人',
    icon: '🧑‍🌾',
    team: 'VILLAGERS',
    teamLabel: '村人陣営',
    divineResult: '人間',
    mediumResult: '人間',
    description: '特殊能力を持たない一般の村人です。昼の議論と投票で人狼を見つけ出し、すべて追放すれば勝利となります。'
  },
  WEREWOLF: {
    id: 'WEREWOLF',
    name: '人狼',
    icon: '🐺',
    team: 'WEREWOLVES',
    teamLabel: '人狼陣営',
    divineResult: '人狼',
    mediumResult: '人狼',
    description: '村人に紛れ込んだ人狼です。仲間の人狼を知ることができ、毎晩1名の人間を襲撃します。生存している人間の数を人狼の数以下まで減らせば勝利となります。'
  },
  SEER: {
    id: 'SEER',
    name: '占い師',
    icon: '🔮',
    team: 'VILLAGERS',
    teamLabel: '村人陣営',
    divineResult: '人間',
    mediumResult: '人間',
    description: '毎晩、生存している自分以外のプレイヤー1名を占い、その人物が「人狼」か「人間（人狼ではない）」かをその場で知ることができます。'
  },
  KNIGHT: {
    id: 'KNIGHT',
    name: '騎士（狩人）',
    icon: '🛡️',
    team: 'VILLAGERS',
    teamLabel: '村人陣営',
    divineResult: '人間',
    mediumResult: '人間',
    description: '毎晩、自分以外の生存者1名を人狼の襲撃から護衛します。ただし前夜に護衛した同じ人物を2晩連続で護衛すること（連続護衛）はできません。'
  },
  MEDIUM: {
    id: 'MEDIUM',
    name: '霊媒師',
    icon: '🕯️',
    team: 'VILLAGERS',
    teamLabel: '村人陣営',
    divineResult: '人間',
    mediumResult: '人間',
    description: '毎晩、直前の昼フェーズの投票によって処刑されたプレイヤーが「人狼」だったか「人間」だったかを知ることができます。'
  },
  MADMAN: {
    id: 'MADMAN',
    name: '狂人',
    icon: '🃏',
    team: 'WEREWOLVES',
    teamLabel: '人狼陣営',
    divineResult: '人間',
    mediumResult: '人間',
    description: '人狼陣営に味方する人間です。特殊能力はなく、誰が人狼かも分かりませんが、人狼陣営が勝利すれば共に勝利となります。占い・霊媒・勝敗カウント上は「人間」として扱われます。'
  }
};

const ROLE_ORDER = ['VILLAGER', 'WEREWOLF', 'SEER', 'KNIGHT', 'MEDIUM', 'MADMAN'];

/**
 * 参加人数（4〜15人）に応じたおすすめ役職構成プリセット
 */
const RECOMMENDED_PRESETS = {
  4:  { VILLAGER: 2, WEREWOLF: 1, SEER: 1, KNIGHT: 0, MEDIUM: 0, MADMAN: 0 },
  5:  { VILLAGER: 2, WEREWOLF: 1, SEER: 1, KNIGHT: 1, MEDIUM: 0, MADMAN: 0 },
  6:  { VILLAGER: 2, WEREWOLF: 1, SEER: 1, KNIGHT: 1, MEDIUM: 0, MADMAN: 1 },
  7:  { VILLAGER: 2, WEREWOLF: 2, SEER: 1, KNIGHT: 1, MEDIUM: 1, MADMAN: 0 },
  8:  { VILLAGER: 2, WEREWOLF: 2, SEER: 1, KNIGHT: 1, MEDIUM: 1, MADMAN: 1 },
  9:  { VILLAGER: 3, WEREWOLF: 2, SEER: 1, KNIGHT: 1, MEDIUM: 1, MADMAN: 1 },
  10: { VILLAGER: 4, WEREWOLF: 2, SEER: 1, KNIGHT: 1, MEDIUM: 1, MADMAN: 1 },
  11: { VILLAGER: 4, WEREWOLF: 3, SEER: 1, KNIGHT: 1, MEDIUM: 1, MADMAN: 1 },
  12: { VILLAGER: 5, WEREWOLF: 3, SEER: 1, KNIGHT: 1, MEDIUM: 1, MADMAN: 1 },
  13: { VILLAGER: 6, WEREWOLF: 3, SEER: 1, KNIGHT: 1, MEDIUM: 1, MADMAN: 1 },
  14: { VILLAGER: 7, WEREWOLF: 3, SEER: 1, KNIGHT: 1, MEDIUM: 1, MADMAN: 1 },
  15: { VILLAGER: 7, WEREWOLF: 4, SEER: 1, KNIGHT: 1, MEDIUM: 1, MADMAN: 1 }
};

/**
 * メインゲーム状態オブジェクト（要件定義書 5. データ構造設計準拠）
 */
const gameState = {
  phase: 'TITLE', // 'TITLE' | 'SETUP' | 'ROLE_CHECK' | 'DAY_DISCUSSION' | 'VOTE' | 'EXECUTION_RESULT' | 'NIGHT' | 'MORNING_RESULT' | 'GAME_OVER'
  day: 1,
  discussionSeconds: 180,
  players: [
    // { id: 'p1', name: 'たろう', role: 'WEREWOLF', isAlive: true, deathReason: null, deathDay: null }
  ],
  turnIndex: 0, // 現在スマホを操作しているプレイヤーのインデックス (gameState.players 内のインデックス)
  voteState: {
    isRunoff: false, // 決選投票中かどうか
    candidates: [],  // 投票対象となるプレイヤーID配列
    votes: {}        // { voterId: targetId }
  },
  nightActions: {
    attackTargetId: null,      // 今晩の人狼の襲撃対象（複数人狼時は上書き）
    guardTargetId: null,       // 今晩の騎士の護衛対象
    lastGuardedPlayerId: null, // 昨晩の騎士の護衛対象（連続護衛禁止判定用）
    lastExecutedPlayerId: null // 直前の昼に処刑されたプレイヤーID（霊媒師判定用）
  },
  winner: null // 'VILLAGERS' | 'WEREWOLVES'
};

/**
 * 補助UI・進行管理用ステート
 */
const uiState = {
  setupNames: [],
  setupError: '',
  roleConfig: {
    VILLAGER: 2,
    WEREWOLF: 1,
    SEER: 1,
    KNIGHT: 0,
    MEDIUM: 0,
    MADMAN: 0
  },
  // 個人操作フェーズ内のサブステップ:
  // 'INTERSTITIAL' (スマホ受け渡し画面) | 'ACTION' (本人確認・選択画面) | 'RESULT' (占い結果・行動完了確認画面) | 'TALLY' (開票集計画面)
  subStep: 'INTERSTITIAL',
  selectedTargetId: null,
  seerResultText: '',
  executionWasRandom: false,
  morningVictimId: null, // 朝フェーズで発表された犠牲者ID（護衛成功時は null）
  timerRemaining: 180,
  timerIntervalId: null,
  timerPaused: false,
  transitionGuardUntil: 0 // 連打による誤タップ防止用タイムスタンプ
};

/* =========================================================
 * ユーティリティ ＆ 永続化処理
 * ========================================================= */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getPlayerById(id) {
  return gameState.players.find((p) => p.id === id) || null;
}

function setTransitionGuard(ms = 320) {
  uiState.transitionGuardUntil = Date.now() + ms;
}

function isTransitionGuarded() {
  return Date.now() < uiState.transitionGuardUntil;
}

function cleanupExpiredStorage() {
  try {
    const now = Date.now();
    const activeKeys = new Set([STORAGE_KEY_PLAYERS, STORAGE_KEY_SETTINGS]);

    // 不要・旧バージョンの jinro_gm_ キーを削除
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('jinro_gm_') && !activeKeys.has(k)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));

    // 有効期限（7日間）を超過した保存データを自動削除
    activeKeys.forEach((key) => {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        const updatedAt = parsed && typeof parsed.updatedAt === 'number' ? parsed.updatedAt : null;
        if (!updatedAt || now - updatedAt > STORAGE_TTL_MS) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        localStorage.removeItem(key);
      }
    });
  } catch (e) {
    // Ignore storage errors
  }
}

function saveSetupToStorage() {
  try {
    const now = Date.now();
    if (uiState.setupNames.length > 0) {
      localStorage.setItem(
        STORAGE_KEY_PLAYERS,
        JSON.stringify({
          names: uiState.setupNames,
          updatedAt: now
        })
      );
    } else {
      localStorage.removeItem(STORAGE_KEY_PLAYERS);
    }

    localStorage.setItem(
      STORAGE_KEY_SETTINGS,
      JSON.stringify({
        discussionSeconds: gameState.discussionSeconds,
        roleConfig: uiState.roleConfig,
        updatedAt: now
      })
    );
  } catch (e) {
    // Private browsing or quota exceeded
  }
}

function resetPlayerHistoryStorage() {
  uiState.setupNames = [];
  uiState.setupError = '';
  try {
    localStorage.removeItem(STORAGE_KEY_PLAYERS);
  } catch (e) {
    // Ignore storage errors
  }
}

function loadSetupFromStorage() {
  try {
    cleanupExpiredStorage();

    const rawPlayers = localStorage.getItem(STORAGE_KEY_PLAYERS);
    if (rawPlayers) {
      const parsed = JSON.parse(rawPlayers);
      const list = Array.isArray(parsed) ? parsed : parsed && Array.isArray(parsed.names) ? parsed.names : null;
      if (list && list.length <= 15) {
        const cleaned = list
          .map((n) => String(n).trim())
          .filter((n) => n.length > 0);
        uiState.setupNames = Array.from(new Set(cleaned));
      }
    }

    const rawSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (rawSettings) {
      const parsedSettings = JSON.parse(rawSettings);
      if (
        parsedSettings &&
        typeof parsedSettings.discussionSeconds === 'number' &&
        parsedSettings.discussionSeconds >= 60
      ) {
        gameState.discussionSeconds = parsedSettings.discussionSeconds;
      }
      if (parsedSettings && parsedSettings.roleConfig) {
        ROLE_ORDER.forEach((roleKey) => {
          const val = Number(parsedSettings.roleConfig[roleKey]);
          if (Number.isInteger(val) && val >= 0 && val <= 15) {
            uiState.roleConfig[roleKey] = val;
          }
        });
      }
    }
  } catch (e) {
    // Ignore storage read errors
  }
}

function applyRecommendedRoles(playerCount) {
  const count = Math.min(15, Math.max(4, playerCount));
  const preset = RECOMMENDED_PRESETS[count];
  if (preset) {
    ROLE_ORDER.forEach((key) => {
      uiState.roleConfig[key] = preset[key];
    });
    saveSetupToStorage();
  }
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* =========================================================
 * 勝敗判定ロジック（要件定義書 3.2 準拠）
 * ========================================================= */

/**
 * 勝敗判定を行い、勝者が確定した場合は 'VILLAGERS' または 'WEREWOLVES' を返す。
 * 未決着の場合は null を返す。
 */
function evaluateWinCondition() {
  const alivePlayers = gameState.players.filter((p) => p.isAlive);
  const aliveWerewolves = alivePlayers.filter((p) => p.role === 'WEREWOLF').length;
  // 狂人は勝敗カウント上「人間」として扱う（村人陣営＋狂人の合計）
  const aliveHumans = alivePlayers.filter((p) => p.role !== 'WEREWOLF').length;

  // 1. 村人陣営の勝利：生存している「人狼」が 0人 になった瞬間
  if (aliveWerewolves === 0) {
    return 'VILLAGERS';
  }
  // 2. 人狼陣営の勝利：生存している「人狼の人数」 >= 「人間の人数」になった瞬間
  if (aliveWerewolves >= aliveHumans) {
    return 'WEREWOLVES';
  }
  return null;
}

/* =========================================================
 * モーダル制御（確認ダイアログ ＆ 内訳モーダル）
 * ========================================================= */

let modalConfirmCallback = null;

function openConfirmModal({ title = '確認', message = '', okText = '確定する', isDanger = false, onConfirm }) {
  const overlay = document.getElementById('confirm-modal');
  const titleEl = document.getElementById('confirm-modal-title');
  const msgEl = document.getElementById('confirm-modal-message');
  const okBtn = document.getElementById('btn-modal-ok');

  titleEl.textContent = title;
  msgEl.textContent = message;
  okBtn.textContent = okText;
  okBtn.className = isDanger ? 'btn btn-danger' : 'btn btn-primary';
  modalConfirmCallback = onConfirm;

  overlay.classList.remove('hidden');
}

function closeConfirmModal() {
  const overlay = document.getElementById('confirm-modal');
  overlay.classList.add('hidden');
  modalConfirmCallback = null;
}

function openInfoModal() {
  const overlay = document.getElementById('info-modal');
  const titleEl = document.getElementById('info-modal-title');
  const body = document.getElementById('info-modal-body');

  titleEl.textContent = '📋 村の状況・役職内訳';

  const aliveCount = gameState.players.filter((p) => p.isAlive).length;
  const roleSummaryItems = ROLE_ORDER.filter((r) => uiState.roleConfig[r] > 0)
    .map((r) => {
      const def = ROLES[r];
      return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-subtle);">
        <span>${def.icon} ${escapeHtml(def.name)} <small style="color:var(--text-secondary);">(${def.teamLabel})</small></span>
        <strong>${uiState.roleConfig[r]}名</strong>
      </div>`;
    })
    .join('');

  const playerStatusItems = gameState.players
    .map((p) => {
      let statusLabel = '生存';
      if (!p.isAlive) {
        statusLabel = p.deathReason === 'EXECUTION' ? `${p.deathDay}日目 処刑` : `${p.deathDay}日目 襲撃`;
      }
      return `<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border-subtle);">
        <span>${escapeHtml(p.name)}</span>
        <span class="badge ${p.isAlive ? 'badge-alive' : 'badge-dead'}">${statusLabel}</span>
      </div>`;
    })
    .join('');

  body.innerHTML = `
    <div style="margin-bottom:14px;">
      <div style="font-weight:800;margin-bottom:6px;color:var(--text-secondary);font-size:0.8rem;">現在の生存状況（生存 ${aliveCount}名 / 全 ${gameState.players.length}名）</div>
      ${playerStatusItems}
    </div>
    <div>
      <div style="font-weight:800;margin-bottom:6px;color:var(--text-secondary);font-size:0.8rem;">開始時の役職配分（※生存内訳は非公開）</div>
      ${roleSummaryItems}
    </div>
  `;

  overlay.classList.remove('hidden');
}

function openRulesModal() {
  const overlay = document.getElementById('info-modal');
  const titleEl = document.getElementById('info-modal-title');
  const body = document.getElementById('info-modal-body');

  titleEl.textContent = '📖 ルール・役職ガイド';

  const roleCardsHtml = ROLE_ORDER.map((r) => {
    const def = ROLES[r];
    const isWolfTeam = def.team === 'WEREWOLVES';
    return `
      <div style="padding:10px;margin-bottom:8px;border-radius:8px;background:var(--bg-surface-elevated);border:1px solid var(--border-subtle);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <strong style="font-size:0.92rem;">${def.icon} ${escapeHtml(def.name)}</strong>
          <span class="badge ${isWolfTeam ? 'badge-werewolf' : 'badge-villager'}">${def.teamLabel}</span>
        </div>
        <div style="font-size:0.75rem;color:var(--text-secondary);margin-bottom:4px;">
          占い結果：<strong>${def.divineResult}</strong> ／ 霊媒結果：<strong>${def.mediumResult}</strong>
        </div>
        <div style="font-size:0.8rem;color:var(--text-primary);line-height:1.45;">
          ${escapeHtml(def.description)}
        </div>
      </div>
    `;
  }).join('');

  body.innerHTML = `
    <div style="margin-bottom:14px;">
      <div style="font-weight:800;margin-bottom:6px;color:#a5b4fc;font-size:0.85rem;">📱 端末1台回し（パス＆プレイ）の遊び方</div>
      <p style="font-size:0.8rem;color:var(--text-secondary);line-height:1.55;">
        端末1台を参加者全員で順番に手渡ししながら進行します。<br>
        役職確認・投票・夜アクションの前には必ず<strong>「〇〇さんに端末を渡してください」</strong>という待機画面が表示され、夜は生存者全員に順番に端末が回るため、誰がどの役職か周囲にバレずに遊べます。
      </p>
    </div>

    <div style="margin-bottom:14px;">
      <div style="font-weight:800;margin-bottom:6px;color:#fcd34d;font-size:0.85rem;">🏆 勝利条件</div>
      <div style="font-size:0.8rem;color:var(--text-primary);line-height:1.55;background:var(--bg-surface-elevated);padding:10px;border-radius:8px;border:1px solid var(--border-subtle);">
        <div style="margin-bottom:6px;">
          <span class="badge badge-villager">村人陣営の勝利</span><br>
          生存している<strong>「人狼」が 0人</strong> になった瞬間
        </div>
        <div>
          <span class="badge badge-werewolf">人狼陣営の勝利</span><br>
          生存している<strong>「人狼の数」≧「人間の数（村人陣営＋狂人）」</strong>になった瞬間
        </div>
      </div>
    </div>

    <div>
      <div style="font-weight:800;margin-bottom:6px;color:#6ee7b7;font-size:0.85rem;">🎭 登場する6役職</div>
      ${roleCardsHtml}
    </div>
  `;

  overlay.classList.remove('hidden');
}

function closeInfoModal() {
  document.getElementById('info-modal').classList.add('hidden');
}

/* =========================================================
 * ゲーム進行・フェーズ遷移ロジック
 * ========================================================= */

function stopDiscussionTimer() {
  if (uiState.timerIntervalId !== null) {
    clearInterval(uiState.timerIntervalId);
    uiState.timerIntervalId = null;
  }
}

function playAlertBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    // Ignore audio context restriction
  }
}

/**
 * セットアップのバリデーション判定
 */
function validateSetup() {
  const playerCount = uiState.setupNames.length;
  const totalRoles = ROLE_ORDER.reduce((sum, key) => sum + uiState.roleConfig[key], 0);
  const werewolfCount = uiState.roleConfig.WEREWOLF;
  const humanCount = totalRoles - werewolfCount; // 村人陣営＋狂人

  if (playerCount < 4) {
    return { valid: false, message: `プレイヤーは最低4名必要です（現在 ${playerCount}名）` };
  }
  if (playerCount > 15) {
    return { valid: false, message: `プレイヤーは最大15名までです（現在 ${playerCount}名）` };
  }
  if (totalRoles !== playerCount) {
    const diff = totalRoles - playerCount;
    const diffText = diff > 0 ? `${diff}名多いです` : `${Math.abs(diff)}名足りません`;
    return {
      valid: false,
      message: `役職の合計（${totalRoles}名）を参加者数（${playerCount}名）に合わせてください（${diffText}）`
    };
  }
  if (werewolfCount < 1) {
    return { valid: false, message: '人狼を最低1名以上に設定してください' };
  }
  if (humanCount <= werewolfCount) {
    return {
      valid: false,
      message: `人間（村人陣営＋狂人：${humanCount}名）は人狼（${werewolfCount}名）より多い必要があります`
    };
  }
  return {
    valid: true,
    message: `準備完了！ 参加者 ${playerCount}名（人間 ${humanCount}名 / 人狼 ${werewolfCount}名）`
  };
}

/**
 * ゲーム開始処理（Phase 0 -> Phase 1: ROLE_CHECK）
 */
function startNewGame() {
  const check = validateSetup();
  if (!check.valid) return;

  stopDiscussionTimer();
  saveSetupToStorage();

  // 役職プールを作成してシャッフル
  const rolePool = [];
  ROLE_ORDER.forEach((roleKey) => {
    const count = uiState.roleConfig[roleKey];
    for (let i = 0; i < count; i++) {
      rolePool.push(roleKey);
    }
  });
  const shuffledRoles = shuffleArray(rolePool);

  // プレイヤー配列を初期化
  gameState.players = uiState.setupNames.map((name, idx) => ({
    id: `p${idx + 1}`,
    name,
    role: shuffledRoles[idx],
    isAlive: true,
    deathReason: null,
    deathDay: null
  }));

  gameState.day = 1;
  gameState.phase = 'ROLE_CHECK';
  gameState.turnIndex = 0;
  gameState.voteState = {
    isRunoff: false,
    candidates: [],
    votes: {}
  };
  gameState.nightActions = {
    attackTargetId: null,
    guardTargetId: null,
    lastGuardedPlayerId: null,
    lastExecutedPlayerId: null
  };
  gameState.winner = null;

  uiState.subStep = 'INTERSTITIAL';
  uiState.selectedTargetId = null;
  uiState.executionWasRandom = false;
  uiState.morningVictimId = null;
  setTransitionGuard();
  render();
}

/**
 * Phase 2: 昼フェーズ（議論）開始
 */
function startDayDiscussionPhase() {
  stopDiscussionTimer();
  gameState.phase = 'DAY_DISCUSSION';
  uiState.timerRemaining = gameState.discussionSeconds;
  uiState.timerPaused = false;

  uiState.timerIntervalId = setInterval(() => {
    if (uiState.timerPaused) return;
    if (uiState.timerRemaining > 0) {
      uiState.timerRemaining -= 1;
      updateTimerDigitsOnly();
      if (uiState.timerRemaining <= 0) {
        stopDiscussionTimer();
        playAlertBeep();
        // タイマーが0になったら投票フェーズへ自動遷移
        startVotePhase(false);
      }
    }
  }, 1000);

  setTransitionGuard();
  render();
}

function updateTimerDigitsOnly() {
  const el = document.getElementById('discussion-timer-digits');
  if (!el) return;
  el.textContent = formatTimeMMSS(uiState.timerRemaining);
  el.className = 'timer-digits';
  if (uiState.timerRemaining <= 15) {
    el.classList.add('urgent');
  } else if (uiState.timerRemaining <= 45) {
    el.classList.add('warning');
  }
}

function formatTimeMMSS(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

/**
 * 投票権を持つ生存プレイヤー配列を取得
 * 通常投票：全生存者
 * 決選投票：同票候補者以外の生存者（全員が同票候補者の場合は生存者全員）
 */
function getEligibleVoterIndices() {
  const aliveIndices = [];
  gameState.players.forEach((p, idx) => {
    if (p.isAlive) aliveIndices.push(idx);
  });

  if (!gameState.voteState.isRunoff) {
    return aliveIndices;
  }

  const nonCandidateAliveIndices = aliveIndices.filter(
    (idx) => !gameState.voteState.candidates.includes(gameState.players[idx].id)
  );
  return nonCandidateAliveIndices.length > 0 ? nonCandidateAliveIndices : aliveIndices;
}

/**
 * Phase 3: 投票フェーズ開始
 * @param {boolean} isRunoff 決選投票かどうか
 * @param {string[]} runoffCandidateIds 決選投票時の候補者ID配列
 */
function startVotePhase(isRunoff = false, runoffCandidateIds = []) {
  stopDiscussionTimer();
  gameState.phase = 'VOTE';
  gameState.voteState.isRunoff = isRunoff;
  gameState.voteState.votes = {};

  if (isRunoff) {
    gameState.voteState.candidates = [...runoffCandidateIds];
  } else {
    gameState.voteState.candidates = gameState.players.filter((p) => p.isAlive).map((p) => p.id);
  }

  const voterIndices = getEligibleVoterIndices();
  gameState.turnIndex = voterIndices[0];
  uiState.subStep = 'INTERSTITIAL';
  uiState.selectedTargetId = null;
  setTransitionGuard();
  render();
}

/**
 * 投票集計を計算する
 */
function computeVoteTally() {
  const counts = {};
  const votersByTarget = {};

  gameState.voteState.candidates.forEach((cid) => {
    counts[cid] = 0;
    votersByTarget[cid] = [];
  });

  Object.entries(gameState.voteState.votes).forEach(([voterId, targetId]) => {
    if (typeof counts[targetId] !== 'number') {
      counts[targetId] = 0;
      votersByTarget[targetId] = [];
    }
    counts[targetId] += 1;
    const voter = getPlayerById(voterId);
    if (voter) votersByTarget[targetId].push(voter.name);
  });

  let maxVotes = 0;
  Object.values(counts).forEach((c) => {
    if (c > maxVotes) maxVotes = c;
  });

  const topCandidateIds = Object.keys(counts).filter((cid) => counts[cid] === maxVotes);

  return {
    counts,
    votersByTarget,
    maxVotes,
    topCandidateIds
  };
}

/**
 * Phase 4: 処刑結果発表 ＆ 勝敗判定①
 */
function executePlayerAndJudge(executedPlayerId, wasRandom = false) {
  gameState.phase = 'EXECUTION_RESULT';
  uiState.executionWasRandom = wasRandom;

  const target = getPlayerById(executedPlayerId);
  if (target) {
    target.isAlive = false;
    target.deathReason = 'EXECUTION';
    target.deathDay = gameState.day;
  }

  // 霊媒師用に直前の処刑者IDを記録
  gameState.nightActions.lastExecutedPlayerId = executedPlayerId;

  // 勝敗判定①を実行
  gameState.winner = evaluateWinCondition();
  setTransitionGuard();
  render();
}

/**
 * Phase 5: 夜フェーズ開始
 */
function startNightPhase() {
  gameState.phase = 'NIGHT';
  gameState.nightActions.attackTargetId = null;
  gameState.nightActions.guardTargetId = null;

  // 生存している最初のプレイヤーのインデックスを探す
  const firstAliveIdx = gameState.players.findIndex((p) => p.isAlive);
  gameState.turnIndex = firstAliveIdx;
  uiState.subStep = 'INTERSTITIAL';
  uiState.selectedTargetId = null;
  uiState.seerResultText = '';
  setTransitionGuard();
  render();
}

/**
 * 次の生存プレイヤーのインデックスを返す（いなければ -1）
 */
function findNextAlivePlayerIndex(currentIndex) {
  for (let i = currentIndex + 1; i < gameState.players.length; i++) {
    if (gameState.players[i].isAlive) return i;
  }
  return -1;
}

/**
 * Phase 6: 朝フェーズ（襲撃結果解決 ＆ 勝敗判定②）
 */
function resolveNightAndStartMorning() {
  gameState.phase = 'MORNING_RESULT';

  const attackId = gameState.nightActions.attackTargetId;
  const guardId = gameState.nightActions.guardTargetId;

  // 襲撃対象と護衛対象が一致した場合（または襲撃対象なし）：護衛成功で犠牲者なし
  if (!attackId || (guardId && attackId === guardId)) {
    uiState.morningVictimId = null;
  } else {
    const victim = getPlayerById(attackId);
    if (victim) {
      victim.isAlive = false;
      victim.deathReason = 'ATTACK';
      victim.deathDay = gameState.day;
      uiState.morningVictimId = victim.id;
    } else {
      uiState.morningVictimId = null;
    }
  }

  // 騎士の連続護衛禁止判定用に lastGuardedPlayerId を更新（護衛なしなら null）
  gameState.nightActions.lastGuardedPlayerId = guardId || null;
  gameState.nightActions.attackTargetId = null;
  gameState.nightActions.guardTargetId = null;

  // 勝敗判定②を実行
  gameState.winner = evaluateWinCondition();
  setTransitionGuard();
  render();
}

/**
 * Phase 7: ゲーム終了・リザルト画面へ遷移
 */
function goToGameOverPhase() {
  stopDiscussionTimer();
  gameState.phase = 'GAME_OVER';
  setTransitionGuard();
  render();
}

/**
 * タイトル画面へ戻る
 */
function returnToTitlePhase() {
  stopDiscussionTimer();
  gameState.phase = 'TITLE';
  gameState.winner = null;
  uiState.setupError = '';
  setTransitionGuard();
  render();
}

/**
 * セットアップ画面（Phase 0: SETUP）へ遷移
 */
function returnToSetupPhase() {
  stopDiscussionTimer();
  gameState.phase = 'SETUP';
  gameState.winner = null;
  uiState.setupError = '';
  setTransitionGuard();
  render();
}

/* =========================================================
 * 画面レンダリング処理
 * ========================================================= */

function updateHeaderStatus() {
  const headerEl = document.getElementById('app-header');
  const setupActionsEl = document.getElementById('header-setup-actions');
  const statusContainer = document.getElementById('header-status');
  const dayBadge = document.getElementById('header-day-badge');

  if (gameState.phase === 'TITLE') {
    headerEl.classList.add('hidden');
    return;
  }

  headerEl.classList.remove('hidden');

  if (gameState.phase === 'SETUP') {
    setupActionsEl.classList.remove('hidden');
    statusContainer.classList.add('hidden');
    return;
  }

  setupActionsEl.classList.add('hidden');
  statusContainer.classList.remove('hidden');

  const phaseLabels = {
    ROLE_CHECK: '初日・役職確認',
    DAY_DISCUSSION: `${gameState.day}日目・昼`,
    VOTE: `${gameState.day}日目・投票`,
    EXECUTION_RESULT: `${gameState.day}日目・処刑結果`,
    NIGHT: `${gameState.day}日目・夜`,
    MORNING_RESULT: `${gameState.day + 1}日目の朝`,
    GAME_OVER: 'ゲーム終了'
  };

  dayBadge.textContent = phaseLabels[gameState.phase] || `${gameState.day}日目`;
}

function render() {
  updateHeaderStatus();
  const main = document.getElementById('app-main');

  switch (gameState.phase) {
    case 'TITLE':
      renderTitleScreen(main);
      break;
    case 'SETUP':
      renderSetupScreen(main);
      break;
    case 'ROLE_CHECK':
      renderRoleCheckScreen(main);
      break;
    case 'DAY_DISCUSSION':
      renderDayDiscussionScreen(main);
      break;
    case 'VOTE':
      renderVoteScreen(main);
      break;
    case 'EXECUTION_RESULT':
      renderExecutionResultScreen(main);
      break;
    case 'NIGHT':
      renderNightScreen(main);
      break;
    case 'MORNING_RESULT':
      renderMorningResultScreen(main);
      break;
    case 'GAME_OVER':
      renderGameOverScreen(main);
      break;
    default:
      renderTitleScreen(main);
  }
}

/* ---------------------------------------------------------
 * タイトル画面（TITLE）
 * --------------------------------------------------------- */
function renderTitleScreen(container) {
  container.innerHTML = `
    <section class="title-screen">
      <div>
        <span class="title-top-badge">🌙 LOCAL PASS &amp; PLAY WEREWOLF</span>
      </div>

      <div>
        <div class="title-moon-stage">
          <div class="title-moon-glow"></div>
          <div class="title-moon">
            <span class="title-wolf-icon" aria-hidden="true">🐺</span>
          </div>
        </div>

        <p class="title-logo-sub">端末1台で遊べるゲームマスターアプリ</p>
        <h2 class="title-logo-main">人狼 GM</h2>
        <p class="title-catchcopy">
          端末1台をみんなで回すだけ。<br>
          役職配布・議論タイマー・投票・夜アクション・勝敗判定まで完全自動進行！
        </p>
      </div>

      <div class="title-feature-grid">
        <div class="title-feature-item">
          <span class="title-feature-icon">📱</span>
          <div class="title-feature-text">
            端末1台で完結
            <small>4人〜最大15人まで対応</small>
          </div>
        </div>
        <div class="title-feature-item">
          <span class="title-feature-icon">🔒</span>
          <div class="title-feature-text">
            覗き見・役職バレ防止
            <small>ワンクッション確認画面</small>
          </div>
        </div>
        <div class="title-feature-item">
          <span class="title-feature-icon">🎭</span>
          <div class="title-feature-text">
            標準6役職を完全収録
            <small>村人/人狼/占い/騎士/霊媒/狂人</small>
          </div>
        </div>
        <div class="title-feature-item">
          <span class="title-feature-icon">⚖️</span>
          <div class="title-feature-text">
            GM不要で全員参加
            <small>決選投票・連続護衛禁止対応</small>
          </div>
        </div>
      </div>

      <div class="title-cta-group">
        <button type="button" id="btn-title-start" class="btn btn-title-start btn-block">
          🌕 ゲームを始める
        </button>
        <button type="button" id="btn-title-rules" class="btn btn-secondary btn-block">
          📖 ルール・役職一覧を見る
        </button>
      </div>
    </section>
  `;

  document.getElementById('btn-title-start').addEventListener('click', () => {
    if (isTransitionGuarded()) return;
    returnToSetupPhase();
  });

  document.getElementById('btn-title-rules').addEventListener('click', () => {
    openRulesModal();
  });
}

/* ---------------------------------------------------------
 * Phase 0: セットアップ画面
 * --------------------------------------------------------- */
function renderSetupScreen(container) {
  const playerCount = uiState.setupNames.length;
  const validation = validateSetup();

  const playerListHtml = uiState.setupNames
    .map(
      (name, idx) => `
      <div class="player-setup-item">
        <div class="player-setup-left">
          <span class="player-index">${idx + 1}</span>
          <span class="player-setup-name">${escapeHtml(name)}</span>
        </div>
        <div class="player-setup-controls">
          <button type="button" class="btn-mini" data-action="move-up" data-index="${idx}" ${idx === 0 ? 'disabled' : ''} aria-label="上へ移動">↑</button>
          <button type="button" class="btn-mini" data-action="move-down" data-index="${idx}" ${idx === playerCount - 1 ? 'disabled' : ''} aria-label="下へ移動">↓</button>
          <button type="button" class="btn-mini danger" data-action="remove-player" data-index="${idx}" aria-label="削除">✕</button>
        </div>
      </div>
    `
    )
    .join('');

  const roleConfigHtml = ROLE_ORDER.map((roleKey) => {
    const def = ROLES[roleKey];
    const count = uiState.roleConfig[roleKey];
    const isWerewolfTeam = def.team === 'WEREWOLVES';
    return `
      <div class="role-config-row">
        <div class="role-info">
          <span class="role-icon">${def.icon}</span>
          <div class="role-name-wrap">
            <span class="role-name">${escapeHtml(def.name)}</span>
            <span class="role-team-label">${def.teamLabel}${roleKey === 'MADMAN' ? '（人間カウント）' : ''}</span>
          </div>
        </div>
        <div class="stepper">
          <button type="button" class="btn-stepper" data-action="role-dec" data-role="${roleKey}" ${count <= 0 ? 'disabled' : ''}>−</button>
          <span class="stepper-val" style="color:${isWerewolfTeam ? '#fda4af' : '#93c5fd'}">${count}</span>
          <button type="button" class="btn-stepper" data-action="role-inc" data-role="${roleKey}" ${count >= 15 ? 'disabled' : ''}>＋</button>
        </div>
      </div>
    `;
  }).join('');

  const timeChoices = [
    { label: '2分', seconds: 120 },
    { label: '3分', seconds: 180 },
    { label: '4分', seconds: 240 },
    { label: '5分', seconds: 300 }
  ];

  const timeButtonsHtml = timeChoices
    .map(
      (t) => `
      <button type="button" class="btn-time-opt ${gameState.discussionSeconds === t.seconds ? 'active' : ''}" data-action="select-time" data-seconds="${t.seconds}">
        ${t.label}
      </button>
    `
    )
    .join('');

  container.innerHTML = `
    <!-- 1. プレイヤー管理 -->
    <section class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">👥 プレイヤー登録（${playerCount} / 15名）</h2>
          <p class="card-subtitle">端末を回す順番に並べてください（4〜15名）</p>
        </div>
        <button type="button" id="btn-reset-players" class="btn btn-outline-danger" ${playerCount === 0 ? 'disabled' : ''}>
          🗑️ 履歴リセット
        </button>
      </div>

      <div class="input-group">
        <input type="text" id="input-player-name" class="text-input" placeholder="プレイヤー名を入力（例：たろう）" maxlength="12" autocomplete="off">
        <button type="button" id="btn-add-player" class="btn btn-primary" style="min-height:42px;padding:8px 14px;">追加</button>
      </div>
      <div id="setup-error-msg" class="error-msg">${escapeHtml(uiState.setupError)}</div>

      <div class="player-setup-list">
        ${playerListHtml || '<p style="text-align:center;color:var(--text-muted);padding:12px;">プレイヤーを追加してください</p>'}
      </div>
      <p class="storage-note">※保存データは最終利用から7日経過すると自動削除されます</p>
    </section>

    <!-- 2. 役職人数設定 -->
    <section class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">🎭 役職人数設定</h2>
          <p class="card-subtitle">合計人数を参加者数（${playerCount}名）に合わせます</p>
        </div>
        <button type="button" id="btn-recommend-roles" class="btn btn-outline-gold">
          ✨ おすすめ構成
        </button>
      </div>

      <div class="role-config-list">
        ${roleConfigHtml}
      </div>

      <div class="validation-box ${validation.valid ? 'valid' : 'invalid'}">
        ${validation.valid ? '✅ ' : '⚠️ '}${escapeHtml(validation.message)}
      </div>
    </section>

    <!-- 3. 議論時間設定 -->
    <section class="card">
      <div class="card-header" style="margin-bottom:8px;">
        <h2 class="card-title">⏱️ 昼の議論時間（1日あたり）</h2>
      </div>
      <div class="time-options">
        ${timeButtonsHtml}
      </div>
    </section>

    <!-- ゲーム開始ボタン -->
    <button type="button" id="btn-start-game" class="btn btn-primary btn-block" style="min-height:54px;font-size:1.05rem;" ${validation.valid ? '' : 'disabled'}>
      🌕 ゲームを開始する
    </button>
  `;

  // イベントバインド
  const nameInput = document.getElementById('input-player-name');
  const addBtn = document.getElementById('btn-add-player');

  const handleAddPlayer = () => {
    const raw = nameInput.value.trim();
    if (!raw) {
      uiState.setupError = '名前を入力してください。';
      render();
      return;
    }
    if (uiState.setupNames.length >= 15) {
      uiState.setupError = 'プレイヤーは最大15名までです。';
      render();
      return;
    }
    if (uiState.setupNames.includes(raw)) {
      uiState.setupError = `「${raw}」はすでに登録されています。別の名前を入力してください。`;
      render();
      return;
    }
    uiState.setupError = '';
    uiState.setupNames.push(raw);
    saveSetupToStorage();
    render();
    const newInput = document.getElementById('input-player-name');
    if (newInput) newInput.focus();
  };

  addBtn.addEventListener('click', handleAddPlayer);
  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPlayer();
    }
  });

  container.querySelectorAll('[data-action="move-up"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.index);
      if (idx > 0) {
        [uiState.setupNames[idx - 1], uiState.setupNames[idx]] = [
          uiState.setupNames[idx],
          uiState.setupNames[idx - 1]
        ];
        uiState.setupError = '';
        saveSetupToStorage();
        render();
      }
    });
  });

  container.querySelectorAll('[data-action="move-down"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.index);
      if (idx < uiState.setupNames.length - 1) {
        [uiState.setupNames[idx + 1], uiState.setupNames[idx]] = [
          uiState.setupNames[idx],
          uiState.setupNames[idx + 1]
        ];
        uiState.setupError = '';
        saveSetupToStorage();
        render();
      }
    });
  });

  container.querySelectorAll('[data-action="remove-player"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.dataset.index);
      uiState.setupNames.splice(idx, 1);
      uiState.setupError = '';
      saveSetupToStorage();
      render();
    });
  });

  document.getElementById('btn-reset-players').addEventListener('click', () => {
    if (uiState.setupNames.length === 0) return;
    openConfirmModal({
      title: 'プレイヤー履歴をリセット',
      message: '登録されているプレイヤー名とブラウザに保存された履歴をすべて削除します。\nよろしいですか？',
      okText: 'リセットする',
      isDanger: true,
      onConfirm: () => {
        resetPlayerHistoryStorage();
        render();
      }
    });
  });

  container.querySelectorAll('[data-action="role-dec"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.role;
      if (uiState.roleConfig[role] > 0) {
        uiState.roleConfig[role] -= 1;
        saveSetupToStorage();
        render();
      }
    });
  });

  container.querySelectorAll('[data-action="role-inc"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const role = btn.dataset.role;
      if (uiState.roleConfig[role] < 15) {
        uiState.roleConfig[role] += 1;
        saveSetupToStorage();
        render();
      }
    });
  });

  document.getElementById('btn-recommend-roles').addEventListener('click', () => {
    if (uiState.setupNames.length < 4) {
      uiState.setupError = 'おすすめ構成をセットするにはプレイヤーを4名以上登録してください。';
      render();
      return;
    }
    uiState.setupError = '';
    applyRecommendedRoles(uiState.setupNames.length);
    render();
  });

  container.querySelectorAll('[data-action="select-time"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      gameState.discussionSeconds = Number(btn.dataset.seconds);
      saveSetupToStorage();
      render();
    });
  });

  document.getElementById('btn-start-game').addEventListener('click', () => {
    if (isTransitionGuarded()) return;
    startNewGame();
  });
}

/* ---------------------------------------------------------
 * Phase 1: 役職確認フェーズ（初日のみ）
 * --------------------------------------------------------- */
function renderRoleCheckScreen(container) {
  const player = gameState.players[gameState.turnIndex];
  const total = gameState.players.length;
  const currentNum = gameState.turnIndex + 1;

  // ワンクッション待機画面
  if (uiState.subStep === 'INTERSTITIAL') {
    container.innerHTML = `
      <section class="card interstitial-card">
        <div class="step-progress">役職確認（${currentNum} / ${total}人目）</div>

        <div>
          <div class="pass-icon-wrap" style="margin:0 auto 12px;">📱</div>
          <p class="pass-instruction">次のプレイヤーへ渡してください</p>
          <h2 class="pass-player-name">【${escapeHtml(player.name)}】さん</h2>
          <p class="pass-instruction">に端末を渡してください</p>
        </div>

        <div class="privacy-notice">
          🔒 <strong>覗き見防止：</strong><br>
          周囲から画面が見えないことを確認してから、ご本人が下のボタンを押してください。
        </div>

        <button type="button" id="btn-reveal-role" class="btn btn-primary btn-block">
          👁️ 自分の役職を確認する
        </button>
      </section>
    `;

    document.getElementById('btn-reveal-role').addEventListener('click', () => {
      if (isTransitionGuarded()) return;
      uiState.subStep = 'ACTION';
      setTransitionGuard();
      render();
    });
    return;
  }

  // 役職確認画面（本人閲覧中）
  const roleDef = ROLES[player.role];
  const isWerewolf = player.role === 'WEREWOLF';
  const isWerewolfTeam = roleDef.team === 'WEREWOLVES';

  let fellowWolvesHtml = '';
  if (isWerewolf) {
    const otherWolves = gameState.players.filter(
      (p) => p.role === 'WEREWOLF' && p.id !== player.id
    );
    const wolfNames =
      otherWolves.length > 0
        ? otherWolves.map((w) => `<strong>${escapeHtml(w.name)}</strong> さん`).join('、')
        : 'なし（人狼はあなた1人です）';

    fellowWolvesHtml = `
      <div class="fellow-wolves-box">
        <div>🐺 <strong>仲間の人狼：</strong>${wolfNames}</div>
        <div style="font-size:0.75rem;color:#fda4af;margin-top:4px;">※狂人がいる場合でも、人狼から狂人が誰かは分かりません。</div>
      </div>
    `;
  }

  const isLastPlayer = gameState.turnIndex === total - 1;

  container.innerHTML = `
    <section class="card secret-card">
      <div>
        <div class="card-header">
          <span class="badge ${isWerewolfTeam ? 'badge-werewolf' : 'badge-villager'}">${roleDef.teamLabel}</span>
          <span style="font-size:0.8rem;color:var(--text-secondary);">${escapeHtml(player.name)} さんの役職</span>
        </div>

        <div class="role-reveal-box ${isWerewolfTeam ? 'werewolf-theme' : ''}">
          <div class="role-reveal-icon">${roleDef.icon}</div>
          <div class="role-reveal-title">${escapeHtml(roleDef.name)}</div>
          <span class="badge ${isWerewolfTeam ? 'badge-werewolf' : 'badge-villager'}">${roleDef.teamLabel}</span>
          <p class="role-reveal-desc">${escapeHtml(roleDef.description)}</p>
          ${fellowWolvesHtml}
        </div>
      </div>

      <div style="margin-top:16px;">
        <p style="font-size:0.78rem;color:var(--text-secondary);text-align:center;margin-bottom:10px;">
          内容を覚えたらボタンを押して画面を閉じてください
        </p>
        <button type="button" id="btn-role-check-done" class="btn btn-secondary btn-block">
          ✅ 確認完了（${isLastPlayer ? '1日目の昼へ進む' : '次の人へ渡す'}）
        </button>
      </div>
    </section>
  `;

  document.getElementById('btn-role-check-done').addEventListener('click', () => {
    if (isTransitionGuarded()) return;
    if (gameState.turnIndex + 1 < total) {
      gameState.turnIndex += 1;
      uiState.subStep = 'INTERSTITIAL';
      setTransitionGuard();
      render();
    } else {
      startDayDiscussionPhase();
    }
  });
}

/* ---------------------------------------------------------
 * Phase 2: 昼フェーズ（議論）
 * --------------------------------------------------------- */
function renderDayDiscussionScreen(container) {
  const alivePlayers = gameState.players.filter((p) => p.isAlive);
  const survivorCardsHtml = gameState.players
    .map((p) => {
      let badgeHtml = '<span class="badge badge-alive">生存</span>';
      if (!p.isAlive) {
        const reason = p.deathReason === 'EXECUTION' ? '処刑' : '襲撃';
        badgeHtml = `<span class="badge badge-dead">${p.deathDay}日目${reason}</span>`;
      }
      return `
        <div class="survivor-item ${p.isAlive ? '' : 'dead'}">
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(p.name)}</span>
          ${badgeHtml}
        </div>
      `;
    })
    .join('');

  let timerClass = 'timer-digits';
  if (uiState.timerRemaining <= 15) timerClass += ' urgent';
  else if (uiState.timerRemaining <= 45) timerClass += ' warning';

  container.innerHTML = `
    <section class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">☀️ ${gameState.day}日目 昼の議論</h2>
          <p class="card-subtitle">本日処刑する人物を話し合って決めてください</p>
        </div>
        <span class="badge badge-alive">生存 ${alivePlayers.length}名</span>
      </div>

      <div class="timer-display-box">
        <div style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:2px;">
          残り議論時間 ${uiState.timerPaused ? '（一時停止中）' : ''}
        </div>
        <div id="discussion-timer-digits" class="${timerClass}">
          ${formatTimeMMSS(uiState.timerRemaining)}
        </div>
        <div class="timer-controls">
          <button type="button" id="btn-toggle-timer" class="btn btn-secondary" style="min-height:42px;font-size:0.88rem;">
            ${uiState.timerPaused ? '▶️ 再開する' : '⏸️ 一時停止'}
          </button>
          <button type="button" id="btn-extend-timer" class="btn btn-secondary" style="min-height:42px;font-size:0.88rem;">
            ＋1分延長
          </button>
        </div>
      </div>

      <button type="button" id="btn-go-vote" class="btn btn-primary btn-block" style="margin-top:8px;">
        🗳️ 議論を終了して投票へ進む
      </button>
    </section>

    <section class="card">
      <div class="card-header">
        <h3 class="card-title">👥 プレイヤー状況一覧</h3>
      </div>
      <div class="survivor-grid">
        ${survivorCardsHtml}
      </div>
    </section>
  `;

  document.getElementById('btn-toggle-timer').addEventListener('click', () => {
    uiState.timerPaused = !uiState.timerPaused;
    render();
  });

  document.getElementById('btn-extend-timer').addEventListener('click', () => {
    uiState.timerRemaining += 60;
    updateTimerDigitsOnly();
  });

  document.getElementById('btn-go-vote').addEventListener('click', () => {
    if (isTransitionGuarded()) return;
    openConfirmModal({
      title: '投票フェーズへ進みますか？',
      message: '議論を終了し、生存者全員による投票を開始します。',
      okText: '投票へ進む',
      onConfirm: () => {
        startVotePhase(false);
      }
    });
  });
}

/* ---------------------------------------------------------
 * Phase 3: 投票フェーズ（通常投票・決選投票・開票集計）
 * --------------------------------------------------------- */
function renderVoteScreen(container) {
  const voterIndices = getEligibleVoterIndices();
  const isRunoff = gameState.voteState.isRunoff;
  const voteTitlePrefix = isRunoff ? '【決選投票】' : '【投票】';

  // 全員の投票が完了している場合：開票結果画面（TALLY）
  if (uiState.subStep === 'TALLY') {
    renderVoteTallySubScreen(container);
    return;
  }

  const currentVoter = gameState.players[gameState.turnIndex];
  const currentOrder = voterIndices.indexOf(gameState.turnIndex) + 1;
  const totalVoters = voterIndices.length;

  // ワンクッション待機画面
  if (uiState.subStep === 'INTERSTITIAL') {
    container.innerHTML = `
      <section class="card interstitial-card">
        <div class="step-progress">${voteTitlePrefix} ${currentOrder} / ${totalVoters}人目</div>

        <div>
          <div class="pass-icon-wrap" style="margin:0 auto 12px;">🗳️</div>
          <p class="pass-instruction">${isRunoff ? '決選投票を行います。' : ''}次の投票者へ渡してください</p>
          <h2 class="pass-player-name">【${escapeHtml(currentVoter.name)}】さん</h2>
          <p class="pass-instruction">に端末を渡してください</p>
        </div>

        <div class="privacy-notice">
          🔒 <strong>投票の秘密保護：</strong><br>
          他の人に画面が見えない状態でボタンを押して投票してください。
        </div>

        <button type="button" id="btn-open-vote-panel" class="btn btn-primary btn-block">
          🗳️ 投票画面を表示する
        </button>
      </section>
    `;

    document.getElementById('btn-open-vote-panel').addEventListener('click', () => {
      if (isTransitionGuarded()) return;
      uiState.subStep = 'ACTION';
      uiState.selectedTargetId = null;
      setTransitionGuard();
      render();
    });
    return;
  }

  // 投票選択画面（自分以外の候補者リスト）
  const selectableCandidates = gameState.voteState.candidates
    .map((cid) => getPlayerById(cid))
    .filter((p) => p && p.isAlive && p.id !== currentVoter.id);

  const candidatesHtml = selectableCandidates
    .map((cand) => {
      const isSelected = uiState.selectedTargetId === cand.id;
      return `
        <button type="button" class="target-btn ${isSelected ? 'selected' : ''}" data-target-id="${cand.id}">
          <span>${escapeHtml(cand.name)} さん</span>
          <span class="badge ${isSelected ? 'badge-phase' : 'badge-alive'}">${isSelected ? '✓ 選択中' : '投票対象'}</span>
        </button>
      `;
    })
    .join('');

  container.innerHTML = `
    <section class="card secret-card">
      <div>
        <div class="card-header">
          <div>
            <h2 class="card-title">🗳️ ${voteTitlePrefix}${escapeHtml(currentVoter.name)} さんの投票</h2>
            <p class="card-subtitle">本日処刑したい人物を1名選んでください（自分は選択不可）</p>
          </div>
        </div>

        <div class="target-list">
          ${candidatesHtml}
        </div>
      </div>

      <button type="button" id="btn-submit-vote" class="btn btn-danger btn-block" ${uiState.selectedTargetId ? '' : 'disabled'}>
        この人物に投票する
      </button>
    </section>
  `;

  container.querySelectorAll('.target-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      uiState.selectedTargetId = btn.dataset.targetId;
      render();
    });
  });

  document.getElementById('btn-submit-vote').addEventListener('click', () => {
    if (!uiState.selectedTargetId || isTransitionGuarded()) return;
    const targetPlayer = getPlayerById(uiState.selectedTargetId);
    if (!targetPlayer) return;

    openConfirmModal({
      title: '投票の確認',
      message: `【${targetPlayer.name}】さんに投票します。\nよろしいですか？`,
      okText: '投票を確定する',
      isDanger: true,
      onConfirm: () => {
        gameState.voteState.votes[currentVoter.id] = targetPlayer.id;
        const pos = voterIndices.indexOf(gameState.turnIndex);
        if (pos + 1 < voterIndices.length) {
          gameState.turnIndex = voterIndices[pos + 1];
          uiState.subStep = 'INTERSTITIAL';
          uiState.selectedTargetId = null;
        } else {
          uiState.subStep = 'TALLY';
          uiState.selectedTargetId = null;
        }
        setTransitionGuard();
        render();
      }
    });
  });
}

/**
 * 開票結果＆同票・決選投票分岐画面
 */
function renderVoteTallySubScreen(container) {
  const tally = computeVoteTally();
  const isRunoff = gameState.voteState.isRunoff;

  // 得票数順にソートして表示
  const sortedCandidateIds = [...gameState.voteState.candidates].sort(
    (a, b) => tally.counts[b] - tally.counts[a]
  );

  const tallyListHtml = sortedCandidateIds
    .map((cid) => {
      const player = getPlayerById(cid);
      const count = tally.counts[cid];
      const isTop = tally.topCandidateIds.includes(cid);
      const voters = tally.votersByTarget[cid];
      return `
        <div class="tally-row ${isTop ? 'top-getter' : ''}">
          <div class="tally-row-header">
            <span>${escapeHtml(player ? player.name : cid)} さん ${isTop ? '🔥' : ''}</span>
            <span>${count} 票</span>
          </div>
          <div class="tally-voters">
            投票者：${voters.length > 0 ? voters.map(escapeHtml).join('、') : 'なし'}
          </div>
        </div>
      `;
    })
    .join('');

  const isTie = tally.topCandidateIds.length > 1;
  let footerActionHtml = '';

  if (!isTie) {
    const executedPlayer = getPlayerById(tally.topCandidateIds[0]);
    footerActionHtml = `
      <div class="validation-box invalid" style="margin-bottom:12px;text-align:center;">
        最多得票により <strong>【${escapeHtml(executedPlayer.name)}】さん</strong> の処刑が確定しました。
      </div>
      <button type="button" id="btn-confirm-execution" class="btn btn-danger btn-block">
        ⚖️ 処刑結果発表へ進む
      </button>
    `;
  } else if (!isRunoff) {
    const tiedNames = tally.topCandidateIds
      .map((id) => getPlayerById(id)?.name)
      .filter(Boolean)
      .join(' さん、');
    footerActionHtml = `
      <div class="validation-box invalid" style="margin-bottom:12px;">
        ⚠️ <strong>同票発生（${tally.maxVotes}票）：</strong><br>
        ${escapeHtml(tiedNames)} さんが最多得票で並びました。決選投票を行います。
      </div>
      <button type="button" id="btn-start-runoff" class="btn btn-primary btn-block">
        🗳️ 決選投票を開始する
      </button>
    `;
  } else {
    const tiedNames = tally.topCandidateIds
      .map((id) => getPlayerById(id)?.name)
      .filter(Boolean)
      .join(' さん、');
    footerActionHtml = `
      <div class="validation-box invalid" style="margin-bottom:12px;">
        ⚠️ <strong>決選投票でも再同票（${tally.maxVotes}票）：</strong><br>
        ${escapeHtml(tiedNames)} さんが再び同票となりました。ルールによりランダム抽選で処刑者を1名決定します。
      </div>
      <button type="button" id="btn-random-execution" class="btn btn-danger btn-block">
        🎲 ランダム抽選で処刑者を決定する
      </button>
    `;
  }

  container.innerHTML = `
    <section class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">📊 ${isRunoff ? '決選投票 ' : ''}開票結果</h2>
          <p class="card-subtitle">全員の投票が完了しました</p>
        </div>
      </div>

      <div class="tally-list">
        ${tallyListHtml}
      </div>

      ${footerActionHtml}
    </section>
  `;

  const btnConfirmExec = document.getElementById('btn-confirm-execution');
  if (btnConfirmExec) {
    btnConfirmExec.addEventListener('click', () => {
      if (isTransitionGuarded()) return;
      executePlayerAndJudge(tally.topCandidateIds[0], false);
    });
  }

  const btnStartRunoff = document.getElementById('btn-start-runoff');
  if (btnStartRunoff) {
    btnStartRunoff.addEventListener('click', () => {
      if (isTransitionGuarded()) return;
      startVotePhase(true, tally.topCandidateIds);
    });
  }

  const btnRandomExec = document.getElementById('btn-random-execution');
  if (btnRandomExec) {
    btnRandomExec.addEventListener('click', () => {
      if (isTransitionGuarded()) return;
      const randomIdx = Math.floor(Math.random() * tally.topCandidateIds.length);
      const chosenId = tally.topCandidateIds[randomIdx];
      executePlayerAndJudge(chosenId, true);
    });
  }
}

/* ---------------------------------------------------------
 * Phase 4: 処刑結果発表 ＆ 勝敗判定①
 * --------------------------------------------------------- */
function renderExecutionResultScreen(container) {
  const executed = getPlayerById(gameState.nightActions.lastExecutedPlayerId);
  const hasWinner = gameState.winner !== null;

  const executionMessage = uiState.executionWasRandom
    ? `再同票のためランダム抽選で【${escapeHtml(executed.name)}】さんが処刑されました。`
    : `投票の結果、本日の処刑者は【${escapeHtml(executed.name)}】さんに決定しました。`;

  container.innerHTML = `
    <section class="card interstitial-card">
      <div class="step-progress">${gameState.day}日目・処刑結果発表</div>

      <div>
        <div class="pass-icon-wrap" style="margin:0 auto 12px;border-color:rgba(239,68,68,0.5);background:rgba(239,68,68,0.14);">⚖️</div>
        <h2 class="pass-player-name" style="color:#fca5a5;">${escapeHtml(executed.name)} さん処刑</h2>
        <p class="pass-instruction" style="margin-top:8px;">${executionMessage}</p>
      </div>

      <div class="privacy-notice" style="border-color:var(--border-subtle);background:rgba(255,255,255,0.04);color:var(--text-secondary);">
        ${
          hasWinner
            ? '⚡ この処刑によってゲームの勝敗が決着しました！'
            : '🌙 村に夜が訪れます。生存しているプレイヤーは順番に端末を受け取って夜の行動を行ってください。'
        }
      </div>

      <button type="button" id="btn-after-execution" class="btn ${hasWinner ? 'btn-primary' : 'btn-secondary'} btn-block">
        ${hasWinner ? '🏆 勝敗結果（リザルト）を見る' : '🌙 夜フェーズへ進む'}
      </button>
    </section>
  `;

  document.getElementById('btn-after-execution').addEventListener('click', () => {
    if (isTransitionGuarded()) return;
    if (hasWinner) {
      goToGameOverPhase();
    } else {
      startNightPhase();
    }
  });
}

/* ---------------------------------------------------------
 * Phase 5: 夜フェーズ（個別アクション：生存者全員に順番に回す）
 * --------------------------------------------------------- */
function renderNightScreen(container) {
  const player = gameState.players[gameState.turnIndex];
  const alivePlayers = gameState.players.filter((p) => p.isAlive);
  const currentAliveOrder = alivePlayers.findIndex((p) => p.id === player.id) + 1;
  const totalAlive = alivePlayers.length;

  // 1. ワンクッション待機画面
  if (uiState.subStep === 'INTERSTITIAL') {
    container.innerHTML = `
      <section class="card interstitial-card">
        <div class="step-progress">${gameState.day}日目の夜（${currentAliveOrder} / ${totalAlive}人目）</div>

        <div>
          <div class="pass-icon-wrap" style="margin:0 auto 12px;">🌙</div>
          <p class="pass-instruction">夜の行動・確認を行います</p>
          <h2 class="pass-player-name">【${escapeHtml(player.name)}】さん</h2>
          <p class="pass-instruction">に端末を渡してください</p>
        </div>

        <div class="privacy-notice">
          🔒 <strong>メタ推理・覗き見防止：</strong><br>
          役職の有無にかかわらず、生存者全員が同じ手順で端末を操作します。周囲から画面が見えない状態でボタンを押してください。
        </div>

        <button type="button" id="btn-open-night-action" class="btn btn-primary btn-block">
          🌙 夜の行動画面を表示する
        </button>
      </section>
    `;

    document.getElementById('btn-open-night-action').addEventListener('click', () => {
      if (isTransitionGuarded()) return;
      uiState.subStep = 'ACTION';
      // 複数人狼で既に襲撃予定がある場合は初期選択状態にする
      if (player.role === 'WEREWOLF' && gameState.nightActions.attackTargetId) {
        uiState.selectedTargetId = gameState.nightActions.attackTargetId;
      } else {
        uiState.selectedTargetId = null;
      }
      setTransitionGuard();
      render();
    });
    return;
  }

  // 2. 役職別アクション画面
  const roleDef = ROLES[player.role];
  const nextAliveIdx = findNextAlivePlayerIndex(gameState.turnIndex);
  const nextBtnLabel =
    nextAliveIdx !== -1 ? '✅ 確認完了（次の人へ渡す）' : '🌅 確認完了（朝フェーズへ進む）';

  const advanceToNextNightPlayer = () => {
    if (nextAliveIdx !== -1) {
      gameState.turnIndex = nextAliveIdx;
      uiState.subStep = 'INTERSTITIAL';
      uiState.selectedTargetId = null;
      uiState.seerResultText = '';
      setTransitionGuard();
      render();
    } else {
      resolveNightAndStartMorning();
    }
  };

  // --- (A) 占い師の占い結果表示サブステップ ---
  if (player.role === 'SEER' && uiState.subStep === 'RESULT') {
    const target = getPlayerById(uiState.selectedTargetId);
    const isWolf = target && target.role === 'WEREWOLF';
    container.innerHTML = `
      <section class="card secret-card">
        <div>
          <div class="card-header">
            <span class="badge badge-villager">🔮 占い結果</span>
            <span style="font-size:0.8rem;color:var(--text-secondary);">${escapeHtml(player.name)} さん</span>
          </div>

          <div class="role-reveal-box ${isWolf ? 'werewolf-theme' : ''}" style="margin:18px 0;">
            <div class="role-reveal-icon">${isWolf ? '🐺' : '🧑'}</div>
            <p style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:6px;">占った対象：${escapeHtml(target.name)} さん</p>
            <div class="role-reveal-title" style="color:${isWolf ? '#fda4af' : '#93c5fd'};">
              ${escapeHtml(target.name)} さんは【${isWolf ? '人狼' : '人間'}】です
            </div>
          </div>
        </div>

        <button type="button" id="btn-night-next" class="btn btn-secondary btn-block">
          ${nextBtnLabel}
        </button>
      </section>
    `;

    document.getElementById('btn-night-next').addEventListener('click', () => {
      if (isTransitionGuarded()) return;
      advanceToNextNightPlayer();
    });
    return;
  }

  // --- (B) 人狼のアクション画面 ---
  if (player.role === 'WEREWOLF') {
    const otherWolves = gameState.players.filter(
      (p) => p.role === 'WEREWOLF' && p.id !== player.id
    );
    const fellowText =
      otherWolves.length > 0
        ? otherWolves
            .map((w) => `${escapeHtml(w.name)}さん（${w.isAlive ? '生存' : '死亡'}）`)
            .join('、')
        : 'なし（あなた1人です）';

    const currentPlannedTarget = gameState.nightActions.attackTargetId
      ? getPlayerById(gameState.nightActions.attackTargetId)
      : null;

    const plannedBannerHtml = currentPlannedTarget
      ? `<div class="fellow-wolves-box" style="margin-bottom:10px;">
          📌 <strong>現在の襲撃予定：${escapeHtml(currentPlannedTarget.name)} さん（変更可能）</strong>
          <div style="font-size:0.74rem;color:#fda4af;margin-top:2px;">※最後に操作した人狼の選択で上書き確定します。</div>
        </div>`
      : '';

    const attackCandidates = gameState.players.filter(
      (p) => p.isAlive && p.role !== 'WEREWOLF'
    );

    const targetsHtml = attackCandidates
      .map((cand) => {
        const isSelected = uiState.selectedTargetId === cand.id;
        return `
          <button type="button" class="target-btn ${isSelected ? 'selected' : ''}" data-target-id="${cand.id}">
            <span>${escapeHtml(cand.name)} さん</span>
            <span class="badge ${isSelected ? 'badge-werewolf' : 'badge-alive'}">${isSelected ? '✓ 襲撃対象に選択中' : '人間'}</span>
          </button>
        `;
      })
      .join('');

    container.innerHTML = `
      <section class="card secret-card">
        <div>
          <div class="card-header">
            <span class="badge badge-werewolf">🐺 人狼の襲撃</span>
            <span style="font-size:0.8rem;color:var(--text-secondary);">${escapeHtml(player.name)} さん</span>
          </div>

          <div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:8px;">
            仲間の人狼：${fellowText}
          </div>

          ${plannedBannerHtml}

          <p style="font-size:0.86rem;margin-bottom:6px;">今晩襲撃する人間（人狼以外）を1名選択してください：</p>
          <div class="target-list">
            ${targetsHtml}
          </div>
        </div>

        <button type="button" id="btn-confirm-attack" class="btn btn-danger btn-block" ${uiState.selectedTargetId ? '' : 'disabled'}>
          🐺 襲撃対象を決定して完了
        </button>
      </section>
    `;

    container.querySelectorAll('.target-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        uiState.selectedTargetId = btn.dataset.targetId;
        render();
      });
    });

    document.getElementById('btn-confirm-attack').addEventListener('click', () => {
      if (!uiState.selectedTargetId || isTransitionGuarded()) return;
      const target = getPlayerById(uiState.selectedTargetId);
      if (!target) return;

      openConfirmModal({
        title: '襲撃対象の確認',
        message: `今晩の襲撃対象を【${target.name}】さんに決定します。\nよろしいですか？`,
        okText: '決定して次へ',
        isDanger: true,
        onConfirm: () => {
          gameState.nightActions.attackTargetId = target.id;
          advanceToNextNightPlayer();
        }
      });
    });
    return;
  }

  // --- (C) 占い師の選択画面 ---
  if (player.role === 'SEER') {
    const candidates = gameState.players.filter((p) => p.isAlive && p.id !== player.id);
    const targetsHtml = candidates
      .map((cand) => {
        const isSelected = uiState.selectedTargetId === cand.id;
        return `
          <button type="button" class="target-btn ${isSelected ? 'selected' : ''}" data-target-id="${cand.id}">
            <span>${escapeHtml(cand.name)} さん</span>
            <span class="badge ${isSelected ? 'badge-phase' : 'badge-alive'}">${isSelected ? '✓ 選択中' : '占う'}</span>
          </button>
        `;
      })
      .join('');

    container.innerHTML = `
      <section class="card secret-card">
        <div>
          <div class="card-header">
            <span class="badge badge-villager">🔮 占い師の行動</span>
            <span style="font-size:0.8rem;color:var(--text-secondary);">${escapeHtml(player.name)} さん</span>
          </div>
          <p style="font-size:0.86rem;color:var(--text-secondary);margin-bottom:8px;">
            今晩占うプレイヤーを1名選択してください（自分以外）：
          </p>
          <div class="target-list">
            ${targetsHtml}
          </div>
        </div>

        <button type="button" id="btn-confirm-divine" class="btn btn-primary btn-block" ${uiState.selectedTargetId ? '' : 'disabled'}>
          🔮 この人物を占う
        </button>
      </section>
    `;

    container.querySelectorAll('.target-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        uiState.selectedTargetId = btn.dataset.targetId;
        render();
      });
    });

    document.getElementById('btn-confirm-divine').addEventListener('click', () => {
      if (!uiState.selectedTargetId || isTransitionGuarded()) return;
      const target = getPlayerById(uiState.selectedTargetId);
      if (!target) return;

      openConfirmModal({
        title: '占いの確認',
        message: `【${target.name}】さんを占いますか？`,
        okText: '占う',
        onConfirm: () => {
          uiState.subStep = 'RESULT';
          setTransitionGuard();
          render();
        }
      });
    });
    return;
  }

  // --- (D) 騎士（狩人）の選択画面 ---
  if (player.role === 'KNIGHT') {
    const lastGuardedId = gameState.nightActions.lastGuardedPlayerId;
    const otherSurvivors = gameState.players.filter((p) => p.isAlive && p.id !== player.id);
    const guardableSurvivors = otherSurvivors.filter((p) => p.id !== lastGuardedId);

    const targetsHtml = otherSurvivors
      .map((cand) => {
        const isConsecutiveBlocked = cand.id === lastGuardedId;
        const isSelected = uiState.selectedTargetId === cand.id;
        return `
          <button type="button" class="target-btn ${isSelected ? 'selected' : ''}" data-target-id="${cand.id}" ${isConsecutiveBlocked ? 'disabled' : ''}>
            <span>${escapeHtml(cand.name)} さん</span>
            ${
              isConsecutiveBlocked
                ? '<span class="badge badge-dead">🚫 連続護衛不可</span>'
                : `<span class="badge ${isSelected ? 'badge-phase' : 'badge-alive'}">${isSelected ? '✓ 護衛選択中' : '護衛可能'}</span>`
            }
          </button>
        `;
      })
      .join('');

    const hasValidTarget = guardableSurvivors.length > 0;

    container.innerHTML = `
      <section class="card secret-card">
        <div>
          <div class="card-header">
            <span class="badge badge-villager">🛡️ 騎士の護衛</span>
            <span style="font-size:0.8rem;color:var(--text-secondary);">${escapeHtml(player.name)} さん</span>
          </div>
          <p style="font-size:0.86rem;color:var(--text-secondary);margin-bottom:8px;">
            今晩、人狼の襲撃から護衛する人物を1名選んでください（前夜に護衛した人物は連続護衛不可）：
          </p>
          <div class="target-list">
            ${targetsHtml}
          </div>
        </div>

        ${
          hasValidTarget
            ? `<button type="button" id="btn-confirm-guard" class="btn btn-primary btn-block" ${uiState.selectedTargetId ? '' : 'disabled'}>
                🛡️ この人物を護衛して完了
              </button>`
            : `<button type="button" id="btn-skip-guard" class="btn btn-secondary btn-block">
                護衛なしで確認完了（次の人へ渡す）
              </button>`
        }
      </section>
    `;

    container.querySelectorAll('.target-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        uiState.selectedTargetId = btn.dataset.targetId;
        render();
      });
    });

    const btnConfirmGuard = document.getElementById('btn-confirm-guard');
    if (btnConfirmGuard) {
      btnConfirmGuard.addEventListener('click', () => {
        if (!uiState.selectedTargetId || isTransitionGuarded()) return;
        const target = getPlayerById(uiState.selectedTargetId);
        if (!target) return;

        openConfirmModal({
          title: '護衛の確認',
          message: `今晩は【${target.name}】さんを護衛します。\nよろしいですか？`,
          okText: '護衛を決定する',
          onConfirm: () => {
            gameState.nightActions.guardTargetId = target.id;
            advanceToNextNightPlayer();
          }
        });
      });
    }

    const btnSkipGuard = document.getElementById('btn-skip-guard');
    if (btnSkipGuard) {
      btnSkipGuard.addEventListener('click', () => {
        if (isTransitionGuarded()) return;
        gameState.nightActions.guardTargetId = null;
        advanceToNextNightPlayer();
      });
    }
    return;
  }

  // --- (E) 霊媒師の確認画面 ---
  if (player.role === 'MEDIUM') {
    const executed = gameState.nightActions.lastExecutedPlayerId
      ? getPlayerById(gameState.nightActions.lastExecutedPlayerId)
      : null;

    let mediumBoxHtml = '';
    if (!executed) {
      mediumBoxHtml = `
        <div class="role-reveal-box" style="margin:18px 0;">
          <div class="role-reveal-icon">🕯️</div>
          <div class="role-reveal-title">対象なし</div>
          <p style="font-size:0.86rem;color:var(--text-secondary);">直前の昼フェーズで処刑されたプレイヤーはいません。</p>
        </div>
      `;
    } else {
      const isWolf = executed.role === 'WEREWOLF';
      mediumBoxHtml = `
        <div class="role-reveal-box ${isWolf ? 'werewolf-theme' : ''}" style="margin:18px 0;">
          <div class="role-reveal-icon">${isWolf ? '🐺' : '🧑'}</div>
          <p style="font-size:0.9rem;color:var(--text-secondary);margin-bottom:6px;">直前の昼に処刑された人物：${escapeHtml(executed.name)} さん</p>
          <div class="role-reveal-title" style="color:${isWolf ? '#fda4af' : '#93c5fd'};">
            ${escapeHtml(executed.name)} さんは【${isWolf ? '人狼' : '人間'}】でした
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <section class="card secret-card">
        <div>
          <div class="card-header">
            <span class="badge badge-villager">🕯️ 霊媒師の霊媒結果</span>
            <span style="font-size:0.8rem;color:var(--text-secondary);">${escapeHtml(player.name)} さん</span>
          </div>
          ${mediumBoxHtml}
        </div>

        <button type="button" id="btn-medium-done" class="btn btn-secondary btn-block">
          ${nextBtnLabel}
        </button>
      </section>
    `;

    document.getElementById('btn-medium-done').addEventListener('click', () => {
      if (isTransitionGuarded()) return;
      advanceToNextNightPlayer();
    });
    return;
  }

  // --- (F) 村人・狂人のダミー確認画面 ---
  container.innerHTML = `
    <section class="card secret-card">
      <div>
        <div class="card-header">
          <span class="badge ${roleDef.team === 'WEREWOLVES' ? 'badge-werewolf' : 'badge-villager'}">${roleDef.icon} ${escapeHtml(roleDef.name)}</span>
          <span style="font-size:0.8rem;color:var(--text-secondary);">${escapeHtml(player.name)} さん</span>
        </div>

        <div class="role-reveal-box" style="margin:18px 0;">
          <div class="role-reveal-icon">🌙</div>
          <p style="font-size:0.96rem;font-weight:700;color:var(--text-primary);line-height:1.6;">
            あなたは今晩できる行動はありません。<br>確認ボタンを押して次の人に渡してください。
          </p>
          <p style="font-size:0.78rem;color:var(--text-secondary);margin-top:10px;">
            💡 操作時間の長短で役職が推測されないよう、数秒ほど画面を見てからボタンを押すのがおすすめです。
          </p>
        </div>
      </div>

      <button type="button" id="btn-dummy-done" class="btn btn-secondary btn-block">
        ${nextBtnLabel}
      </button>
    </section>
  `;

  document.getElementById('btn-dummy-done').addEventListener('click', () => {
    if (isTransitionGuarded()) return;
    advanceToNextNightPlayer();
  });
}

/* ---------------------------------------------------------
 * Phase 6: 朝フェーズ（結果発表 ＆ 勝敗判定②）
 * --------------------------------------------------------- */
function renderMorningResultScreen(container) {
  const victim = uiState.morningVictimId ? getPlayerById(uiState.morningVictimId) : null;
  const hasWinner = gameState.winner !== null;

  const resultBoxHtml = victim
    ? `
      <div class="pass-icon-wrap" style="margin:0 auto 12px;border-color:rgba(239,68,68,0.5);background:rgba(239,68,68,0.15);">🩸</div>
      <p class="pass-instruction">恐ろしい夜が明けました…</p>
      <h2 class="pass-player-name" style="color:#fca5a5;">昨晩の犠牲者は<br>【${escapeHtml(victim.name)}】さんでした</h2>
    `
    : `
      <div class="pass-icon-wrap" style="margin:0 auto 12px;border-color:rgba(16,185,129,0.5);background:rgba(16,185,129,0.15);">🛡️</div>
      <p class="pass-instruction">夜が明けました</p>
      <h2 class="pass-player-name" style="color:#6ee7b7;font-size:1.3rem;">昨晩の犠牲者はいませんでした<br>（護衛成功）</h2>
    `;

  container.innerHTML = `
    <section class="card interstitial-card">
      <div class="step-progress">${gameState.day + 1}日目の朝・襲撃結果発表</div>

      <div>
        ${resultBoxHtml}
      </div>

      <div class="privacy-notice" style="border-color:var(--border-subtle);background:rgba(255,255,255,0.04);color:var(--text-secondary);">
        ${
          hasWinner
            ? '⚡ 昨晩の結果により、ゲームの勝敗が決着しました！'
            : `☀️ ${gameState.day + 1}日目の昼の議論へ進みます。`
        }
      </div>

      <button type="button" id="btn-after-morning" class="btn btn-primary btn-block">
        ${hasWinner ? '🏆 勝敗結果（リザルト）を見る' : `☀️ ${gameState.day + 1}日目の昼フェーズへ進む`}
      </button>
    </section>
  `;

  document.getElementById('btn-after-morning').addEventListener('click', () => {
    if (isTransitionGuarded()) return;
    if (hasWinner) {
      goToGameOverPhase();
    } else {
      gameState.day += 1;
      startDayDiscussionPhase();
    }
  });
}

/* ---------------------------------------------------------
 * Phase 7: ゲーム終了・リザルト画面
 * --------------------------------------------------------- */
function renderGameOverScreen(container) {
  const isVillagersWin = gameState.winner === 'VILLAGERS';

  const heroTitle = isVillagersWin ? '村人陣営の勝利！' : '人狼陣営の勝利！';
  const heroSub = isVillagersWin
    ? 'すべての人狼を追放し、村に平和が戻りました！'
    : '生存している人狼の数が人間と同数以上になり、村は人狼に支配されました…';

  const rowsHtml = gameState.players
    .map((p) => {
      const def = ROLES[p.role];
      const isWolfTeam = def.team === 'WEREWOLVES';
      let finalStatusText = '生存';
      if (!p.isAlive) {
        finalStatusText =
          p.deathReason === 'EXECUTION' ? `${p.deathDay}日目処刑` : `${p.deathDay}日目襲撃`;
      }
      return `
        <tr>
          <td style="font-weight:700;">${escapeHtml(p.name)}</td>
          <td>
            <span class="badge ${isWolfTeam ? 'badge-werewolf' : 'badge-villager'}">
              ${def.icon} ${escapeHtml(def.name)}
            </span>
          </td>
          <td>
            <span class="badge ${p.isAlive ? 'badge-alive' : 'badge-dead'}">
              ${finalStatusText}
            </span>
          </td>
        </tr>
      `;
    })
    .join('');

  container.innerHTML = `
    <section class="result-hero ${isVillagersWin ? 'villagers-win' : 'werewolves-win'}">
      <div class="result-hero-icon">${isVillagersWin ? '🌅' : '🐺'}</div>
      <h2 class="result-hero-title">${heroTitle}</h2>
      <p class="result-hero-sub">${heroSub}</p>
    </section>

    <section class="card">
      <div class="card-header">
        <h3 class="card-title">📋 全プレイヤーの役職・最終結果</h3>
      </div>

      <table class="result-table">
        <thead>
          <tr>
            <th>プレイヤー名</th>
            <th>役職（陣営）</th>
            <th>最終状態</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </section>

    <div style="display:flex;flex-direction:column;gap:10px;margin-top:4px;">
      <button type="button" id="btn-replay-same" class="btn btn-primary btn-block">
        🔄 同じメンバー・設定でもう一度遊ぶ
      </button>
      <button type="button" id="btn-back-to-top" class="btn btn-secondary btn-block">
        🏠 トップへ戻る（メンバー・設定変更）
      </button>
    </div>
  `;

  document.getElementById('btn-replay-same').addEventListener('click', () => {
    if (isTransitionGuarded()) return;
    startNewGame();
  });

  document.getElementById('btn-back-to-top').addEventListener('click', () => {
    if (isTransitionGuarded()) return;
    returnToSetupPhase();
  });
}

/* =========================================================
 * 初期化 ＆ グローバルイベント登録
 * ========================================================= */

function initApp() {
  loadSetupFromStorage();

  // モーダルボタンのイベント
  document.getElementById('btn-modal-cancel').addEventListener('click', () => {
    closeConfirmModal();
  });

  document.getElementById('btn-modal-ok').addEventListener('click', () => {
    const cb = modalConfirmCallback;
    closeConfirmModal();
    if (typeof cb === 'function') cb();
  });

  // セットアップ画面用ヘッダーボタン
  document.getElementById('btn-open-rules-header').addEventListener('click', () => {
    openRulesModal();
  });
  document.getElementById('btn-back-title-header').addEventListener('click', () => {
    returnToTitlePhase();
  });

  // 村の状況・役職内訳モーダル
  document.getElementById('btn-open-info').addEventListener('click', () => {
    openInfoModal();
  });
  document.getElementById('btn-close-info').addEventListener('click', () => {
    closeInfoModal();
  });
  document.getElementById('btn-close-info-bottom').addEventListener('click', () => {
    closeInfoModal();
  });

  // ゲーム中断ボタン
  document.getElementById('btn-abort-game').addEventListener('click', () => {
    openConfirmModal({
      title: 'ゲームを中断しますか？',
      message: '現在の進行状況はリセットされ、セットアップ画面へ戻ります。',
      okText: '中断して戻る',
      isDanger: true,
      onConfirm: () => {
        returnToSetupPhase();
      }
    });
  });

  // 誤リロード・戻る操作によるデータ消失防止（要件定義書 6. 準拠）
  window.addEventListener('beforeunload', (e) => {
    if (gameState.phase !== 'TITLE' && gameState.phase !== 'SETUP' && gameState.phase !== 'GAME_OVER') {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  render();
}

document.addEventListener('DOMContentLoaded', initApp);
