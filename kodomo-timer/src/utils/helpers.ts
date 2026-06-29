/**
 * Utility functions for ビジュアルタイマー
 */

/** Format seconds to MM:SS display */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/** Calculate progress ratio (0 to 1) from remaining/total seconds */
export function calcProgress(remaining: number, total: number): number {
  if (total <= 0) return 1;
  return Math.max(0, Math.min(1, 1 - remaining / total));
}

/** Determine gauge color phase based on remaining ratio */
export function getColorPhase(remaining: number, total: number): 'green' | 'yellow' | 'red' {
  const ratio = remaining / total;
  if (ratio > 0.5) return 'green';
  if (ratio > 0.2) return 'yellow';
  return 'red';
}

/** Generate a unique ID */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Get today's date as ISO string (date only) */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/** Get start of current week (Monday) as ISO string */
export function weekStartISO(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/** Simple debounce */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

/** Escape HTML special characters */
export function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return str.replace(/[&<>"']/g, c => map[c] || c);
}

/** Generate a simple math quiz for child lock */
export function generateMathQuiz(): { question: string; answer: number } {
  const a = Math.floor(Math.random() * 8) + 2; // 2-9
  const b = Math.floor(Math.random() * 8) + 2; // 2-9
  const ops = ['+', '×'] as const;
  const op = ops[Math.floor(Math.random() * ops.length)];
  if (op === '+') {
    return { question: `${a} + ${b} = ?`, answer: a + b };
  } else {
    return { question: `${a} × ${b} = ?`, answer: a * b };
  }
}

/** Vibrate the device if supported (for stamp slam effect) */
export function vibrate(pattern: number | number[]): void {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}
