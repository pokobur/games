/** UUID v4（非セキュアコンテキストでも動作するようフォールバック付き） */
export function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      /* fallthrough */
    }
  }
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** 5桁のランダム数字コード (00000〜99999) */
export function generateSerialCode(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return String(arr[0] % 100000).padStart(5, '0');
  }
  return String(Math.floor(Math.random() * 100000)).padStart(5, '0');
}

export function $(selector: string, root: ParentNode = document): HTMLElement {
  const el = root.querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  return el;
}

export function $input(selector: string, root: ParentNode = document): HTMLInputElement {
  return $(selector, root) as HTMLInputElement;
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/** 全角数字→半角、数字以外を除去、0〜max にクランプ */
export function sanitizeNumber(raw: string, maxDigits = 6): string {
  return raw
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[^0-9]/g, '')
    .slice(0, maxDigits);
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/* ---------------- Toast ---------------- */
let toastTimer = 0;
export function toast(message: string, kind: 'info' | 'error' | 'success' = 'info'): void {
  const el = $('#toast');
  el.textContent = message;
  el.className = `toast show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    el.className = 'toast';
  }, 2400);
}

/* ---------------- Busy overlay ---------------- */
export function showBusy(message: string): void {
  const el = $('#busy');
  $('.busy-text', el).textContent = message;
  el.hidden = false;
}
export function updateBusy(message: string): void {
  $('.busy-text', $('#busy')).textContent = message;
}
export function hideBusy(): void {
  $('#busy').hidden = true;
}

/* ---------------- Modal ---------------- */
let modalCloseHandler: (() => void) | null = null;

export function openModal(content: HTMLElement, onClose?: () => void): void {
  const modal = $('#modal');
  const body = $('.modal-body', modal);
  body.replaceChildren(content);
  modal.hidden = false;
  document.body.classList.add('modal-open');
  modalCloseHandler = onClose ?? null;
}

export function closeModal(): void {
  const modal = $('#modal');
  if (modal.hidden) return;
  modal.hidden = true;
  $('.modal-body', modal).replaceChildren();
  document.body.classList.remove('modal-open');
  const h = modalCloseHandler;
  modalCloseHandler = null;
  h?.();
}

export function initModal(): void {
  const modal = $('#modal');
  modal.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    if (t === modal || t.closest('[data-close-modal]')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

/* ---------------- Download ---------------- */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function canvasToBlob(canvas: HTMLCanvasElement, type = 'image/png', quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('画像の生成に失敗しました'))), type, quality);
  });
}

export function safeFileName(name: string): string {
  return (name || 'card').replace(/[\\/:*?"<>|\s]+/g, '_').slice(0, 40);
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
