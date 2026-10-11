/**
 * localStorage ベースのデータ永続化ユーティリティ
 * - タスク管理 / 承認フロー
 * - 自動日次リセット & 連続達成ストリーク計算
 * - 未受け取りガチャ（親が承認→子どもが自分で引く体験）
 * - ジオラマ配置・テーマ設定
 * - イベント駆動による即時UI同期
 */

const KEYS = {
  TASKS: 'habit-diorama-tasks',
  INVENTORY: 'habit-diorama-inventory',
  PLACED_ITEMS: 'habit-diorama-placed',
  DAILY_LOG: 'habit-diorama-daily-log',
  PENDING_APPROVALS: 'habit-diorama-pending',
  PENDING_GACHAS: 'habit-diorama-pending-gachas',
  SETTINGS: 'habit-diorama-settings',
  LAST_ACTIVE_DATE: 'habit-diorama-last-date',
  DIORAMA_THEME: 'habit-diorama-theme',
};

// カスタムイベント名（アプリ内リアルタイム同期）
const EVENT_DATA_CHANGED = 'habit-diorama-data-changed';

export function emitDataChange(reason = 'general') {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_DATA_CHANGED, { detail: { reason } }));
  }
}

export function subscribeDataChange(callback) {
  if (typeof window === 'undefined') return () => {};
  const handler = (e) => callback(e.detail);
  const storageHandler = () => callback({ reason: 'storage' });
  window.addEventListener(EVENT_DATA_CHANGED, handler);
  window.addEventListener('storage', storageHandler);
  return () => {
    window.removeEventListener(EVENT_DATA_CHANGED, handler);
    window.removeEventListener('storage', storageHandler);
  };
}

// ============ 設定管理 ============

const DEFAULT_SETTINGS = {
  pin: '1234',
  soundEnabled: true,
};

export function getSettings() {
  const raw = localStorage.getItem(KEYS.SETTINGS);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  emitDataChange('settings');
}

export function getPin() {
  return getSettings().pin;
}

export function setPin(newPin) {
  const settings = getSettings();
  settings.pin = newPin;
  saveSettings(settings);
}

// ============ デイリーログ & 自動日次リセット & ストリーク ============

export function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDailyLog() {
  const raw = localStorage.getItem(KEYS.DAILY_LOG);
  return raw ? JSON.parse(raw) : {};
}

export function logTaskCompletion(taskId) {
  const log = getDailyLog();
  const today = getTodayKey();
  if (!log[today]) log[today] = [];
  if (!log[today].includes(taskId)) {
    log[today].push(taskId);
  }
  localStorage.setItem(KEYS.DAILY_LOG, JSON.stringify(log));
  emitDataChange('daily-log');
  return log;
}

/**
 * 日付が変わっていたら自動的にタスクの完了状態をリセットする
 */
export function checkAndAutoResetDaily() {
  const today = getTodayKey();
  const lastActive = localStorage.getItem(KEYS.LAST_ACTIVE_DATE);

  if (lastActive && lastActive !== today) {
    // 日付が変わったので未完了に戻す（承認待ちはそのまま維持）
    const tasks = getTasks().map(t => ({
      ...t,
      completed: false,
      completedAt: null,
    }));
    localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
    emitDataChange('auto-daily-reset');
  }
  localStorage.setItem(KEYS.LAST_ACTIVE_DATE, today);
}

/**
 * 連続クリア日数（ストリーク）の計算
 */
export function getStreakCount() {
  const log = getDailyLog();
  const dates = Object.keys(log).filter(d => (log[d] || []).length > 0).sort();
  if (dates.length === 0) return 0;

  const todayStr = getTodayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // 今日、または昨日クリアした記録があるか
  const hasToday = dates.includes(todayStr);
  const hasYesterday = dates.includes(yesterdayStr);

  if (!hasToday && !hasYesterday) {
    return 0; // 連続が途切れた
  }

  let streak = 0;
  let checkDate = new Date();
  if (!hasToday && hasYesterday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const y = checkDate.getFullYear();
    const m = String(checkDate.getMonth() + 1).padStart(2, '0');
    const d = String(checkDate.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;

    if (dates.includes(key)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// ============ タスク管理 ============

const INITIAL_DEFAULT_TASKS = [
  { id: 'default-1', title: 'あさ はみがきをする', category: 'せいかつ', difficulty: 1, completed: false, createdAt: new Date().toISOString() },
  { id: 'default-2', title: 'つくえの うえを かたづける', category: 'おてつだい', difficulty: 1, completed: false, createdAt: new Date().toISOString() },
  { id: 'default-3', title: 'きょうの しゅくだいをやる', category: 'おべんきょう', difficulty: 2, completed: false, createdAt: new Date().toISOString() },
];

export function getTasks() {
  checkAndAutoResetDaily();
  const raw = localStorage.getItem(KEYS.TASKS);
  if (!raw) {
    localStorage.setItem(KEYS.TASKS, JSON.stringify(INITIAL_DEFAULT_TASKS));
    return INITIAL_DEFAULT_TASKS;
  }
  return JSON.parse(raw);
}

export function saveTasks(tasks) {
  localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
  emitDataChange('tasks');
}

export function addTask(task) {
  const tasks = getTasks();
  const newTask = {
    id: Date.now().toString(),
    title: task.title,
    category: task.category || 'せいかつ',
    difficulty: task.difficulty || 1,
    completed: false,
    completedAt: null,
    createdAt: new Date().toISOString(),
  };
  tasks.push(newTask);
  saveTasks(tasks);
  return newTask;
}

export function updateTask(id, updates) {
  const tasks = getTasks();
  const idx = tasks.findIndex(t => t.id === id);
  if (idx !== -1) {
    tasks[idx] = { ...tasks[idx], ...updates };
    saveTasks(tasks);
    return tasks[idx];
  }
  return null;
}

export function deleteTask(id) {
  const tasks = getTasks().filter(t => t.id !== id);
  saveTasks(tasks);
  return tasks;
}

export function completeTask(id) {
  return updateTask(id, {
    completed: true,
    completedAt: new Date().toISOString(),
  });
}

export function resetDailyTasks() {
  const tasks = getTasks().map(t => ({
    ...t,
    completed: false,
    completedAt: null,
  }));
  saveTasks(tasks);
  localStorage.setItem(KEYS.PENDING_APPROVALS, JSON.stringify([]));
  emitDataChange('reset-daily');
  return tasks;
}

// ============ 承認待ちタスク ============

export function getPendingApprovals() {
  const raw = localStorage.getItem(KEYS.PENDING_APPROVALS);
  return raw ? JSON.parse(raw) : [];
}

export function addPendingApproval(taskId, taskTitle, difficulty) {
  const pending = getPendingApprovals();
  if (pending.find(p => p.taskId === taskId)) return pending;
  pending.push({
    id: Date.now().toString(),
    taskId,
    taskTitle,
    difficulty: difficulty || 1,
    submittedAt: new Date().toISOString(),
  });
  localStorage.setItem(KEYS.PENDING_APPROVALS, JSON.stringify(pending));
  emitDataChange('pending-approval-add');
  return pending;
}

// ============ 未受け取りガチャ（親が承認→子どもが引く権利） ============

export function getPendingGachas() {
  const raw = localStorage.getItem(KEYS.PENDING_GACHAS);
  return raw ? JSON.parse(raw) : [];
}

export function addPendingGacha(gachaTicket) {
  const list = getPendingGachas();
  list.push({
    id: Date.now().toString(),
    taskId: gachaTicket.taskId,
    taskTitle: gachaTicket.taskTitle,
    difficulty: gachaTicket.difficulty || 1,
    approvedAt: new Date().toISOString(),
  });
  localStorage.setItem(KEYS.PENDING_GACHAS, JSON.stringify(list));
  emitDataChange('pending-gacha-add');
  return list;
}

export function consumePendingGacha(ticketId) {
  const list = getPendingGachas();
  const next = list.filter(g => g.id !== ticketId);
  localStorage.setItem(KEYS.PENDING_GACHAS, JSON.stringify(next));
  emitDataChange('pending-gacha-consumed');
  return next;
}

export function approveTask(pendingId) {
  const pending = getPendingApprovals();
  const item = pending.find(p => p.id === pendingId);
  if (!item) return null;

  // タスクを完了状態にし、デイリーログに記録
  completeTask(item.taskId);
  logTaskCompletion(item.taskId);

  // 承認待ちから削除
  const newPending = pending.filter(p => p.id !== pendingId);
  localStorage.setItem(KEYS.PENDING_APPROVALS, JSON.stringify(newPending));

  // 子どもが引くための未受け取りガチャチケットを追加！
  addPendingGacha({
    taskId: item.taskId,
    taskTitle: item.taskTitle,
    difficulty: item.difficulty,
  });

  emitDataChange('approve-task');
  return item;
}

export function rejectApproval(pendingId) {
  const pending = getPendingApprovals().filter(p => p.id !== pendingId);
  localStorage.setItem(KEYS.PENDING_APPROVALS, JSON.stringify(pending));
  emitDataChange('reject-approval');
  return pending;
}

// ============ インベントリ（獲得パーツ） ============

const PARTS_CATALOG = [
  { type: 'house',    name: 'おうち',     emoji: '🏠', rarity: 2, desc: 'あかいやねの かわいいおうち' },
  { type: 'tree',     name: 'き',         emoji: '🌳', rarity: 1, desc: 'みどりゆたかな おおきなき' },
  { type: 'flower',   name: 'おはな',     emoji: '🌸', rarity: 1, desc: 'カラフルで きれいなおはな' },
  { type: 'car',      name: 'くるま',     emoji: '🚗', rarity: 2, desc: 'まちをはしる あおいスポーツカー' },
  { type: 'train',    name: 'でんしゃ',   emoji: '🚃', rarity: 3, desc: 'みんなをはこぶ みどりのれっしゃ' },
  { type: 'shop',     name: 'おみせ',     emoji: '🏪', rarity: 2, desc: 'おいしいものがならぶ おみせ' },
  { type: 'pond',     name: 'いけ',       emoji: '💧', rarity: 1, desc: 'おさかながおよぐ すきとおったいけ' },
  { type: 'fence',    name: 'さく',       emoji: '🏗️', rarity: 1, desc: 'まちをまもる きのさく' },
  { type: 'bench',    name: 'ベンチ',     emoji: '🪑', rarity: 1, desc: 'ひとやすみできる きのベンチ' },
  { type: 'slide',    name: 'すべりだい', emoji: '🛝', rarity: 2, desc: 'こうえんの たのしいすべりだい' },
  { type: 'castle',   name: 'おしろ',     emoji: '🏰', rarity: 3, desc: 'きらきらかがやく まほうのおしろ' },
  { type: 'fountain', name: 'ふんすい',   emoji: '⛲', rarity: 3, desc: 'みずしぶきがあがる きれいなふんすい' },
];

export function getPartsCatalog() {
  return PARTS_CATALOG;
}

export function rollGacha(difficulty = 1) {
  // 難易度に応じてレアリティの出現率アップ
  let pool = PARTS_CATALOG;
  if (difficulty >= 3) {
    // 高難度: レア以上が出やすい（レア3が複数倍）
    pool = [...PARTS_CATALOG, ...PARTS_CATALOG.filter(p => p.rarity >= 3), ...PARTS_CATALOG.filter(p => p.rarity >= 2)];
  } else if (difficulty >= 2) {
    pool = [...PARTS_CATALOG, ...PARTS_CATALOG.filter(p => p.rarity >= 2)];
  }
  const idx = Math.floor(Math.random() * pool.length);
  const selected = pool[idx];
  return { ...selected, id: `${selected.type}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}` };
}

export function getInventory() {
  const raw = localStorage.getItem(KEYS.INVENTORY);
  return raw ? JSON.parse(raw) : [];
}

export function addToInventory(part) {
  const inventory = getInventory();
  inventory.push(part);
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
  emitDataChange('inventory-add');
  return inventory;
}

// ============ 配置済みパーツ ============

export function getPlacedItems() {
  const raw = localStorage.getItem(KEYS.PLACED_ITEMS);
  return raw ? JSON.parse(raw) : [];
}

export function savePlacedItems(items) {
  localStorage.setItem(KEYS.PLACED_ITEMS, JSON.stringify(items));
  emitDataChange('placed-update');
}

export function placeItem(partId, gridX, gridY) {
  const inventory = getInventory();
  const part = inventory.find(p => p.id === partId);
  if (!part) return null;

  const placed = getPlacedItems();
  placed.push({ ...part, gridX, gridY, placedAt: Date.now().toString() });
  savePlacedItems(placed);

  // インベントリから削除
  const newInventory = inventory.filter(p => p.id !== partId);
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(newInventory));
  emitDataChange('place-item');

  return placed;
}

export function removeFromPlaced(placedAt) {
  const placed = getPlacedItems();
  const item = placed.find(p => p.placedAt === placedAt);
  if (!item) return;

  const newPlaced = placed.filter(p => p.placedAt !== placedAt);
  savePlacedItems(newPlaced);

  // インベントリに復帰
  const inventory = getInventory();
  inventory.push({
    id: item.id || Date.now().toString(),
    type: item.type,
    name: item.name,
    emoji: item.emoji,
    rarity: item.rarity,
    desc: item.desc,
  });
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
  emitDataChange('remove-placed');

  return newPlaced;
}

export function clearAllPlaced() {
  const placed = getPlacedItems();
  if (placed.length === 0) return;

  // すべてインベントリに戻す
  const inventory = getInventory();
  placed.forEach(item => {
    inventory.push({
      id: item.id || Date.now().toString(),
      type: item.type,
      name: item.name,
      emoji: item.emoji,
      rarity: item.rarity,
      desc: item.desc,
    });
  });
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
  localStorage.setItem(KEYS.PLACED_ITEMS, JSON.stringify([]));
  emitDataChange('clear-all-placed');
}

// ============ ジオラマのテーマ（芝生/ビーチ/夜など） ============

export const DIORAMA_THEMES = [
  { id: 'grass', name: 'しえばし（みどり）', icon: '🌿', bg1: '#71cc65', bg2: '#6bc45e', gridLine: 0x5aaa4e },
  { id: 'beach', name: 'ビーチ（すなはま）', icon: '🏖️', bg1: '#ffd166', bg2: '#f4c454', gridLine: 0xdeb841 },
  { id: 'night', name: 'よるのまち（ほしぞら）', icon: '🌙', bg1: '#1e293b', bg2: '#0f172a', gridLine: 0x334155 },
  { id: 'snow',  name: 'ゆきげしき（しろ）', icon: '❄️', bg1: '#e2e8f0', bg2: '#cbd5e1', gridLine: 0x94a3b8 },
];

export function getDioramaTheme() {
  const saved = localStorage.getItem(KEYS.DIORAMA_THEME);
  return saved || 'grass';
}

export function setDioramaTheme(themeId) {
  localStorage.setItem(KEYS.DIORAMA_THEME, themeId);
  emitDataChange('theme-changed');
}
