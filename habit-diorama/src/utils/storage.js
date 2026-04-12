/**
 * localStorage ベースのデータ永続化ユーティリティ
 * 将来的にFirestore等に差し替え可能な設計
 */

const KEYS = {
  TASKS: 'habit-diorama-tasks',
  INVENTORY: 'habit-diorama-inventory',
  PLACED_ITEMS: 'habit-diorama-placed',
  DAILY_LOG: 'habit-diorama-daily-log',
  PENDING_APPROVALS: 'habit-diorama-pending',
  SETTINGS: 'habit-diorama-settings',
};

// ============ 設定管理 ============

const DEFAULT_SETTINGS = {
  pin: '1234',
};

export function getSettings() {
  const raw = localStorage.getItem(KEYS.SETTINGS);
  return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings) {
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
}

export function getPin() {
  return getSettings().pin;
}

export function setPin(newPin) {
  const settings = getSettings();
  settings.pin = newPin;
  saveSettings(settings);
}

// ============ タスク管理 ============

export function getTasks() {
  const raw = localStorage.getItem(KEYS.TASKS);
  return raw ? JSON.parse(raw) : [];
}

export function saveTasks(tasks) {
  localStorage.setItem(KEYS.TASKS, JSON.stringify(tasks));
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
  // 承認待ちもクリア
  localStorage.setItem(KEYS.PENDING_APPROVALS, JSON.stringify([]));
  return tasks;
}

// ============ 承認待ちタスク ============

export function getPendingApprovals() {
  const raw = localStorage.getItem(KEYS.PENDING_APPROVALS);
  return raw ? JSON.parse(raw) : [];
}

export function addPendingApproval(taskId, taskTitle, difficulty) {
  const pending = getPendingApprovals();
  // 同じタスクの重複送信を防ぐ
  if (pending.find(p => p.taskId === taskId)) return pending;
  pending.push({
    id: Date.now().toString(),
    taskId,
    taskTitle,
    difficulty,
    submittedAt: new Date().toISOString(),
  });
  localStorage.setItem(KEYS.PENDING_APPROVALS, JSON.stringify(pending));
  return pending;
}

export function approveTask(pendingId) {
  const pending = getPendingApprovals();
  const item = pending.find(p => p.id === pendingId);
  if (!item) return null;

  // タスクを完了状態にする
  completeTask(item.taskId);
  logTaskCompletion(item.taskId);

  // 承認待ちリストから削除
  const newPending = pending.filter(p => p.id !== pendingId);
  localStorage.setItem(KEYS.PENDING_APPROVALS, JSON.stringify(newPending));

  return item;
}

export function rejectApproval(pendingId) {
  const pending = getPendingApprovals().filter(p => p.id !== pendingId);
  localStorage.setItem(KEYS.PENDING_APPROVALS, JSON.stringify(pending));
  return pending;
}

// ============ インベントリ（獲得パーツ） ============

const PARTS_CATALOG = [
  { type: 'house',    name: 'おうち',     emoji: '🏠', rarity: 2 },
  { type: 'tree',     name: 'き',         emoji: '🌳', rarity: 1 },
  { type: 'flower',   name: 'おはな',     emoji: '🌸', rarity: 1 },
  { type: 'car',      name: 'くるま',     emoji: '🚗', rarity: 2 },
  { type: 'train',    name: 'でんしゃ',   emoji: '🚃', rarity: 3 },
  { type: 'shop',     name: 'おみせ',     emoji: '🏪', rarity: 2 },
  { type: 'pond',     name: 'いけ',       emoji: '💧', rarity: 1 },
  { type: 'fence',    name: 'さく',       emoji: '🏗️', rarity: 1 },
  { type: 'bench',    name: 'ベンチ',     emoji: '🪑', rarity: 1 },
  { type: 'slide',    name: 'すべりだい', emoji: '🛝', rarity: 2 },
  { type: 'castle',   name: 'おしろ',     emoji: '🏰', rarity: 3 },
  { type: 'fountain', name: 'ふんすい',   emoji: '⛲', rarity: 3 },
];

export function getPartsCatalog() {
  return PARTS_CATALOG;
}

export function rollGacha(difficulty = 1) {
  // 難易度に応じてレアリティの出やすさを調整
  const pool = PARTS_CATALOG.filter(p => p.rarity <= difficulty + 1);
  const idx = Math.floor(Math.random() * pool.length);
  return { ...pool[idx], id: Date.now().toString() };
}

export function getInventory() {
  const raw = localStorage.getItem(KEYS.INVENTORY);
  return raw ? JSON.parse(raw) : [];
}

export function addToInventory(part) {
  const inventory = getInventory();
  inventory.push(part);
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));
  return inventory;
}

// ============ 配置済みパーツ ============

export function getPlacedItems() {
  const raw = localStorage.getItem(KEYS.PLACED_ITEMS);
  return raw ? JSON.parse(raw) : [];
}

export function savePlacedItems(items) {
  localStorage.setItem(KEYS.PLACED_ITEMS, JSON.stringify(items));
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

  return placed;
}

export function removeFromPlaced(placedAt) {
  const placed = getPlacedItems();
  const item = placed.find(p => p.placedAt === placedAt);
  if (!item) return;

  // 配置リストから削除
  const newPlaced = placed.filter(p => p.placedAt !== placedAt);
  savePlacedItems(newPlaced);

  // インベントリに返す
  const inventory = getInventory();
  inventory.push({ id: item.id, type: item.type, name: item.name, emoji: item.emoji, rarity: item.rarity });
  localStorage.setItem(KEYS.INVENTORY, JSON.stringify(inventory));

  return newPlaced;
}

// ============ デイリーログ ============

export function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
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
  return log;
}
