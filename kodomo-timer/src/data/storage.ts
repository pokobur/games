/* ============================================================
   Data Persistence Layer
   ビジュアルタイマー ストレージ管理
   ============================================================ */

import type {
  AppSettings,
  StampSheet,
  StampEntry,
  ActivityLog,
  RecordingMeta,
} from './models';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LS_PREFIX = 'kodomo-timer-';
const LS_SETTINGS = `${LS_PREFIX}settings`;
const LS_STAMP_SHEET = `${LS_PREFIX}stamp-sheet`;
const LS_ACTIVITY_LOGS = `${LS_PREFIX}activity-logs`;

const DB_NAME = 'KodomoTimerDB';
const DB_VERSION = 1;
const DB_STORE = 'recordings';

// ---------------------------------------------------------------------------
// Default Values
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: AppSettings = {
  stampGoal: 5,
  rewards: ['すきなおやつ 🍪', 'こうえんであそぶ 🏞️', 'すきなどうがを みる 📺'],
  currentTheme: 'space',
  defaultMinutes: 5,
};

const DEFAULT_STAMP_SHEET: StampSheet = {
  stamps: [],
  goal: 5,
  completedSheets: 0,
};

// ---------------------------------------------------------------------------
// LocalStorage Helpers
// ---------------------------------------------------------------------------

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function lsSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable — silently fail
    console.warn(`[storage] Failed to write key "${key}"`);
  }
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export function getSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...lsGet<AppSettings>(LS_SETTINGS, DEFAULT_SETTINGS) };
}

export function saveSettings(settings: AppSettings): void {
  lsSet(LS_SETTINGS, settings);
}

// ---------------------------------------------------------------------------
// Stamp Sheet
// ---------------------------------------------------------------------------

export function getStampSheet(): StampSheet {
  const stored = lsGet<StampSheet>(LS_STAMP_SHEET, DEFAULT_STAMP_SHEET);
  return {
    ...DEFAULT_STAMP_SHEET,
    ...stored,
    stamps: Array.isArray(stored.stamps) ? stored.stamps : [],
  };
}

export function saveStampSheet(sheet: StampSheet): void {
  lsSet(LS_STAMP_SHEET, sheet);
}

export function addStampEntry(entry: StampEntry): StampSheet {
  const sheet = getStampSheet();
  sheet.stamps.push(entry);

  // Check if the sheet is now complete
  const settings = getSettings();
  if (sheet.stamps.length >= settings.stampGoal) {
    sheet.completedSheets += 1;
    sheet.stamps = [];
  }

  sheet.goal = settings.stampGoal;
  saveStampSheet(sheet);
  return sheet;
}

// ---------------------------------------------------------------------------
// Activity Logs
// ---------------------------------------------------------------------------

export function getActivityLogs(): ActivityLog[] {
  return lsGet<ActivityLog[]>(LS_ACTIVITY_LOGS, []);
}

export function addActivityLog(log: ActivityLog): void {
  const logs = getActivityLogs();

  // Merge with existing entry for the same date
  const existing = logs.find((l) => l.date === log.date);
  if (existing) {
    existing.attempts += log.attempts;
    existing.completions += log.completions;
    existing.totalMinutes += log.totalMinutes;
  } else {
    logs.push(log);
  }

  // Keep only the last 90 days to avoid unbounded growth
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffISO = cutoff.toISOString().slice(0, 10);

  const trimmed = logs.filter((l) => l.date >= cutoffISO);
  lsSet(LS_ACTIVITY_LOGS, trimmed);
}

/** Returns aggregated stats for the last 7 days. */
export function getWeeklyStats(): {
  attempts: number;
  completions: number;
  stamps: number;
} {
  const logs = getActivityLogs();
  const sheet = getStampSheet();

  const now = new Date();
  const weekAgo = new Date();
  weekAgo.setDate(now.getDate() - 7);
  const weekAgoISO = weekAgo.toISOString().slice(0, 10);

  let attempts = 0;
  let completions = 0;

  for (const log of logs) {
    if (log.date >= weekAgoISO) {
      attempts += log.attempts;
      completions += log.completions;
    }
  }

  // Count stamps earned in the last 7 days
  let stamps = 0;
  for (const stamp of sheet.stamps) {
    const stampDate = stamp.date.slice(0, 10);
    if (stampDate >= weekAgoISO) {
      stamps += 1;
    }
  }

  return { attempts, completions, stamps };
}

// ---------------------------------------------------------------------------
// IndexedDB — Audio Recordings
// ---------------------------------------------------------------------------

let dbInstance: IDBDatabase | null = null;

export function initAudioDB(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;

      // Handle unexpected close (e.g. storage cleared while app is open)
      dbInstance.onclose = () => {
        dbInstance = null;
      };

      resolve(dbInstance);
    };

    request.onerror = () => {
      console.error('[storage] IndexedDB open failed', request.error);
      reject(request.error);
    };
  });
}

export async function saveRecording(
  id: string,
  blob: Blob,
  meta: RecordingMeta,
): Promise<void> {
  const db = await initAudioDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    store.put({ id, blob, meta });

    tx.oncomplete = () => resolve();
    tx.onerror = () => {
      console.error('[storage] saveRecording failed', tx.error);
      reject(tx.error);
    };
  });
}

export async function getRecording(
  id: string,
): Promise<{ blob: Blob; meta: RecordingMeta } | null> {
  const db = await initAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const store = tx.objectStore(DB_STORE);
    const req = store.get(id);

    req.onsuccess = () => {
      const result = req.result as
        | { id: string; blob: Blob; meta: RecordingMeta }
        | undefined;
      if (result) {
        resolve({ blob: result.blob, meta: result.meta });
      } else {
        resolve(null);
      }
    };

    req.onerror = () => {
      console.error('[storage] getRecording failed', req.error);
      reject(req.error);
    };
  });
}

export async function getAllRecordingMetas(): Promise<RecordingMeta[]> {
  const db = await initAudioDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const store = tx.objectStore(DB_STORE);
    const req = store.getAll();

    req.onsuccess = () => {
      const results = req.result as Array<{
        id: string;
        blob: Blob;
        meta: RecordingMeta;
      }>;
      resolve(results.map((r) => r.meta));
    };

    req.onerror = () => {
      console.error('[storage] getAllRecordingMetas failed', req.error);
      reject(req.error);
    };
  });
}

export async function deleteRecording(id: string): Promise<void> {
  const db = await initAudioDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    store.delete(id);

    tx.oncomplete = () => resolve();
    tx.onerror = () => {
      console.error('[storage] deleteRecording failed', tx.error);
      reject(tx.error);
    };
  });
}
