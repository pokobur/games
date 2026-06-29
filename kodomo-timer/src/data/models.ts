/* ============================================================
   Data Models
   ビジュアルタイマー データモデル型定義
   ============================================================ */

/** Available theme identifiers. */
export type ThemeId = 'space' | 'cleanup' | 'zoo';

/** User-configurable application settings. */
export interface AppSettings {
  /** Number of stamps required to complete a sheet. */
  stampGoal: 5 | 10 | 20;
  /** User-defined reward texts shown upon sheet completion. */
  rewards: string[];
  /** Currently selected visual theme. */
  currentTheme: ThemeId;
  /** Default timer duration in minutes. */
  defaultMinutes: number;
}

/** A single stamp earned after a timer session. */
export interface StampEntry {
  /** ISO 8601 date string of when the stamp was earned. */
  date: string;
  /** Theme used during the timer session. */
  themeId: ThemeId;
  /** Duration of the timer session in minutes. */
  durationMinutes: number;
  /** Whether the child finished within the allotted time. */
  completed: boolean;
}

/** Current stamp sheet state. */
export interface StampSheet {
  /** Ordered list of stamps on the current sheet. */
  stamps: StampEntry[];
  /** Target stamp count for the current sheet (mirrors settings). */
  goal: number;
  /** Number of previously completed (full) sheets. */
  completedSheets: number;
}

/** Daily activity log entry. */
export interface ActivityLog {
  /** ISO 8601 date string (date only, e.g. "2026-06-14"). */
  date: string;
  /** Number of timer attempts on this date. */
  attempts: number;
  /** Number of successful completions on this date. */
  completions: number;
  /** Total minutes spent on timers on this date. */
  totalMinutes: number;
}

/** Metadata for a saved voice recording. */
export interface RecordingMeta {
  /** Unique identifier for the recording. */
  id: string;
  /** User-provided label / display name. */
  label: string;
  /** Duration of the recording in seconds. */
  duration: number;
  /** ISO 8601 timestamp of when the recording was created. */
  createdAt: string;
}

/** Runtime state of the timer (not persisted). */
export interface TimerState {
  /** Active theme during this timer session. */
  themeId: ThemeId;
  /** Total duration of the timer in seconds. */
  totalSeconds: number;
  /** Seconds remaining on the countdown. */
  remainingSeconds: number;
  /** Whether the timer is actively counting down. */
  isRunning: boolean;
  /** Whether the timer is paused (still active but not ticking). */
  isPaused: boolean;
}
