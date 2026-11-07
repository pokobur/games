import type { Attribute, CardData, ImageTransform } from './types';
import { ATTRIBUTES, LIMITS } from './types';
import { THEMES } from './theme';
import {
  CARD_W,
  ensureFonts,
  loadImageFromBlob,
  makeThumbnail,
  renderCard,
  renderCardToCanvas,
  type LoadedImage,
  type RenderInput,
} from './renderer';
import { saveCard } from './store';
import { requestPersistence } from './db';
import {
  $,
  $input,
  canvasToBlob,
  clamp,
  downloadBlob,
  safeFileName,
  sanitizeNumber,
  toast,
  uuid,
} from './utils';

interface EditorState {
  id: string | null;
  createdAt: number | null;
  name: string;
  attribute: Attribute;
  level: number;
  subType: string;
  effectText: string;
  atk: number;
  hp: number;
  imageBlob: Blob | null;
  image: LoadedImage | null;
  imageTransform: ImageTransform;
  dirty: boolean;
}

const DEFAULT_TRANSFORM: ImageTransform = { x: 0, y: 0, scale: 1 };

function blankState(): EditorState {
  return {
    id: null,
    createdAt: null,
    name: '',
    attribute: 'fire',
    level: 4,
    subType: '',
    effectText: '',
    atk: 1000,
    hp: 1000,
    imageBlob: null,
    image: null,
    imageTransform: { ...DEFAULT_TRANSFORM },
    dirty: false,
  };
}

let state: EditorState = blankState();
let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let rafId = 0;

/* ------------------------------------------------------------------ */
/* 描画                                                                */
/* ------------------------------------------------------------------ */

function toRenderInput(s: EditorState): RenderInput {
  return {
    name: s.name,
    attribute: s.attribute,
    level: s.level,
    subType: s.subType,
    effectText: s.effectText,
    atk: s.atk,
    hp: s.hp,
    image: s.image,
    imageTransform: s.imageTransform,
  };
}

/** rAF で間引いてリアルタイム描画 */
export function scheduleRender(): void {
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    rafId = 0;
    renderCard(ctx, toRenderInput(state), { placeholder: true });
  });
}

let fontTimer = 0;
function scheduleFontLoad(): void {
  clearTimeout(fontTimer);
  fontTimer = window.setTimeout(async () => {
    await ensureFonts(state.name + state.subType + state.effectText);
    scheduleRender();
  }, 150);
}

function markDirty(): void {
  state.dirty = true;
  updateStatus();
}

function updateStatus(): void {
  const el = $('#editStatus');
  const label = state.id ? `編集中：${state.name || '(無題)'}` : '新規カード';
  el.textContent = state.dirty ? `${label} ●未保存` : label;
  el.classList.toggle('dirty', state.dirty);
  $('#saveCopy').hidden = !state.id;
  $('#saveCard').textContent = state.id ? '💾 上書き保存' : '💾 図鑑に保存';
}

/* ------------------------------------------------------------------ */
/* フォーム ⇔ state                                                    */
/* ------------------------------------------------------------------ */

function updateCounters(): void {
  document.querySelectorAll<HTMLElement>('.counter[data-for]').forEach((el) => {
    const key = el.dataset.for as 'name' | 'subType' | 'effectText';
    const max = key === 'name' ? LIMITS.name : key === 'subType' ? LIMITS.subType : LIMITS.effect;
    const len = Array.from(state[key]).length;
    let text = `${len}/${max}`;
    if (key === 'effectText') {
      const lines = state.effectText.split('\n').length;
      text += `・${lines}/${LIMITS.effectLines}行`;
    }
    el.textContent = text;
    el.classList.toggle('full', len >= max);
  });
}

function syncTransformUI(): void {
  const t = state.imageTransform;
  $input('#tx').value = String(Math.round(t.x));
  $input('#ty').value = String(Math.round(t.y));
  $input('#tscale').value = String(t.scale);
  $('#txOut').textContent = String(Math.round(t.x));
  $('#tyOut').textContent = String(Math.round(t.y));
  $('#tscaleOut').textContent = `${t.scale.toFixed(2)}x`;
  $('#transformControls').classList.toggle('disabled', !state.image);
  ($('#removeImage') as HTMLButtonElement).disabled = !state.image;
  ($('#resetTransform') as HTMLButtonElement).disabled = !state.image;
}

function syncAttrUI(): void {
  document.querySelectorAll<HTMLButtonElement>('#attrPicker .attr-chip').forEach((b) => {
    const active = b.dataset.attr === state.attribute;
    b.classList.toggle('active', active);
    b.setAttribute('aria-checked', String(active));
  });
}

function syncLevelUI(): void {
  $('#levelOut').textContent = `${'★'.repeat(state.level)} Lv.${state.level}`;
}

function stateToForm(): void {
  $input('#name').value = state.name;
  $input('#subType').value = state.subType;
  ($('#effectText') as HTMLTextAreaElement).value = state.effectText;
  $input('#level').value = String(state.level);
  $input('#atk').value = String(state.atk);
  $input('#hp').value = String(state.hp);
  syncAttrUI();
  syncLevelUI();
  syncTransformUI();
  updateCounters();
  updateStatus();
}

/** 効果テキストを最大5行に制限 */
function limitLines(text: string): string {
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  return lines.length > LIMITS.effectLines
    ? lines.slice(0, LIMITS.effectLines - 1).join('\n') + '\n' + lines.slice(LIMITS.effectLines - 1).join('')
    : lines.join('\n');
}

function bindForm(): void {
  const textField = (id: 'name' | 'subType', max: number) => {
    const el = $input(`#${id}`);
    el.addEventListener('input', () => {
      // サロゲートペア等で maxlength をすり抜けた場合の保険
      const chars = Array.from(el.value);
      if (chars.length > max) el.value = chars.slice(0, max).join('');
      state[id] = el.value;
      updateCounters();
      markDirty();
      scheduleRender();
      scheduleFontLoad();
    });
  };
  textField('name', LIMITS.name);
  textField('subType', LIMITS.subType);

  const effect = $('#effectText') as HTMLTextAreaElement;
  effect.addEventListener('input', () => {
    let v = limitLines(effect.value);
    const chars = Array.from(v);
    if (chars.length > LIMITS.effect) v = chars.slice(0, LIMITS.effect).join('');
    if (v !== effect.value) {
      const pos = effect.selectionStart;
      effect.value = v;
      effect.setSelectionRange(Math.min(pos, v.length), Math.min(pos, v.length));
    }
    state.effectText = v;
    updateCounters();
    markDirty();
    scheduleRender();
    scheduleFontLoad();
  });

  const level = $input('#level');
  level.addEventListener('input', () => {
    state.level = clamp(parseInt(level.value, 10) || 1, LIMITS.levelMin, LIMITS.levelMax);
    syncLevelUI();
    markDirty();
    scheduleRender();
  });

  for (const id of ['atk', 'hp'] as const) {
    const el = $input(`#${id}`);
    el.addEventListener('input', () => {
      const v = sanitizeNumber(el.value);
      if (v !== el.value) el.value = v;
      state[id] = clamp(parseInt(v, 10) || 0, 0, LIMITS.statMax);
      markDirty();
      scheduleRender();
    });
    el.addEventListener('blur', () => {
      el.value = String(state[id]);
    });
  }

  // 属性ピッカー
  const picker = $('#attrPicker');
  for (const attr of ATTRIBUTES) {
    const t = THEMES[attr];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `attr-chip attr-${attr}`;
    b.dataset.attr = attr;
    b.setAttribute('role', 'radio');
    b.innerHTML = `<span class="attr-kanji">${t.kanji}</span><span class="attr-name">${attrName(attr)}</span>`;
    b.addEventListener('click', () => {
      state.attribute = attr;
      syncAttrUI();
      markDirty();
      scheduleRender();
    });
    picker.appendChild(b);
  }

  // 画像変形スライダー
  const slider = (id: string, key: keyof ImageTransform) => {
    const el = $input(`#${id}`);
    el.addEventListener('input', () => {
      state.imageTransform[key] = parseFloat(el.value);
      syncTransformUI();
      markDirty();
      scheduleRender();
    });
  };
  slider('tx', 'x');
  slider('ty', 'y');
  slider('tscale', 'scale');

  $('#resetTransform').addEventListener('click', () => {
    state.imageTransform = { ...DEFAULT_TRANSFORM };
    syncTransformUI();
    markDirty();
    scheduleRender();
  });

  $('#removeImage').addEventListener('click', () => {
    state.image = null;
    state.imageBlob = null;
    state.imageTransform = { ...DEFAULT_TRANSFORM };
    syncTransformUI();
    markDirty();
    scheduleRender();
  });

  const fileInput = $input('#imageInput');
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    try {
      const blob = await normalizeUpload(file);
      state.imageBlob = blob;
      state.image = await loadImageFromBlob(blob);
      state.imageTransform = { ...DEFAULT_TRANSFORM };
      syncTransformUI();
      markDirty();
      scheduleRender();
    } catch (err) {
      console.error(err);
      toast('画像を読み込めませんでした', 'error');
    }
  });

  $('#newCard').addEventListener('click', () => {
    if (!confirmDiscard()) return;
    resetEditor();
  });
  $('#saveCard').addEventListener('click', () => void save(false));
  $('#saveCopy').addEventListener('click', () => void save(true));
  $('#downloadPng').addEventListener('click', () => void downloadPng());

  $('#togglePreviewSize').addEventListener('click', () => {
    $('#previewPane').classList.toggle('large');
  });

  // Ctrl/Cmd + S で保存
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's' && !$('#tab-create').hidden) {
      e.preventDefault();
      void save(false);
    }
  });
}

export function attrName(attr: Attribute): string {
  return { fire: '炎', water: '水', earth: '地', wind: '風', light: '光', dark: '闇' }[attr];
}

/**
 * アップロード画像を正規化：長辺 2000px に縮小し、JPEG/PNG で保存（ストレージ節約と描画高速化）
 */
async function normalizeUpload(file: File): Promise<Blob> {
  const MAX = 2000;
  const img = await loadImageFromBlob(file);
  const longSide = Math.max(img.width, img.height);
  const isPng = file.type === 'image/png';
  if (longSide <= MAX && (file.type === 'image/jpeg' || isPng) && file.size < 4 * 1024 * 1024) {
    return file;
  }
  const s = Math.min(1, MAX / longSide);
  const c = document.createElement('canvas');
  c.width = Math.round(img.width * s);
  c.height = Math.round(img.height * s);
  const cx = c.getContext('2d')!;
  cx.imageSmoothingQuality = 'high';
  cx.drawImage(img.source, 0, 0, c.width, c.height);
  return canvasToBlob(c, isPng ? 'image/png' : 'image/jpeg', 0.9);
}

/* ------------------------------------------------------------------ */
/* ドラッグ・ピンチ・ホイール                                          */
/* ------------------------------------------------------------------ */

function bindGestures(): void {
  const pointers = new Map<number, { x: number; y: number }>();
  let moved = false;

  const toCanvasScale = () => CARD_W / canvas.getBoundingClientRect().width;

  canvas.addEventListener('pointerdown', (e) => {
    if (!state.image) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved = false;
  });

  canvas.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev || !state.image) return;
    const k = toCanvasScale();
    const t = state.imageTransform;

    if (pointers.size === 1) {
      t.x += (e.clientX - prev.x) * k;
      t.y += (e.clientY - prev.y) * k;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    } else {
      const [aId, bId] = [...pointers.keys()];
      const a0 = pointers.get(aId)!;
      const b0 = pointers.get(bId)!;
      const d0 = Math.hypot(a0.x - b0.x, a0.y - b0.y);
      const m0 = { x: (a0.x + b0.x) / 2, y: (a0.y + b0.y) / 2 };
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const a1 = pointers.get(aId)!;
      const b1 = pointers.get(bId)!;
      const d1 = Math.hypot(a1.x - b1.x, a1.y - b1.y);
      const m1 = { x: (a1.x + b1.x) / 2, y: (a1.y + b1.y) / 2 };
      if (d0 > 0) {
        const next = clamp(t.scale * (d1 / d0), LIMITS.scaleMin, LIMITS.scaleMax);
        // 拡大率に応じてオフセットも比例させ、中心付近を基準に拡大
        const ratio = next / t.scale;
        t.x = t.x * ratio;
        t.y = t.y * ratio;
        t.scale = next;
      }
      t.x += (m1.x - m0.x) * k;
      t.y += (m1.y - m0.y) * k;
    }
    t.x = clamp(t.x, -LIMITS.offsetMax, LIMITS.offsetMax);
    t.y = clamp(t.y, -LIMITS.offsetMax, LIMITS.offsetMax);
    moved = true;
    syncTransformUI();
    scheduleRender();
  });

  const end = (e: PointerEvent) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (moved) markDirty();
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  canvas.addEventListener(
    'wheel',
    (e) => {
      if (!state.image) return;
      e.preventDefault();
      const t = state.imageTransform;
      const next = clamp(t.scale * Math.exp(-e.deltaY * 0.0015), LIMITS.scaleMin, LIMITS.scaleMax);
      const ratio = next / t.scale;
      t.x = clamp(t.x * ratio, -LIMITS.offsetMax, LIMITS.offsetMax);
      t.y = clamp(t.y * ratio, -LIMITS.offsetMax, LIMITS.offsetMax);
      t.scale = next;
      syncTransformUI();
      markDirty();
      scheduleRender();
    },
    { passive: false },
  );

  // 画像未設定時はタップで画像選択
  canvas.addEventListener('click', () => {
    if (!state.image) $input('#imageInput').click();
  });
}

/* ------------------------------------------------------------------ */
/* 保存・読込                                                          */
/* ------------------------------------------------------------------ */

async function save(asCopy: boolean): Promise<void> {
  if (!state.name.trim()) {
    toast('カード名を入力してください', 'error');
    $input('#name').focus();
    return;
  }
  try {
    await ensureFonts(state.name + state.subType + state.effectText);
    const now = Date.now();
    const isNew = asCopy || !state.id;
    const full = renderCardToCanvas(toRenderInput(state));
    const card: CardData = {
      id: isNew ? uuid() : state.id!,
      name: state.name,
      attribute: state.attribute,
      level: state.level,
      subType: state.subType,
      effectText: state.effectText,
      atk: state.atk,
      hp: state.hp,
      imageBlob: state.imageBlob,
      imageTransform: { ...state.imageTransform },
      thumbnailDataUrl: makeThumbnail(full),
      createdAt: isNew ? now : (state.createdAt ?? now),
      updatedAt: now,
    };
    await saveCard(card);
    void requestPersistence();
    state.id = card.id;
    state.createdAt = card.createdAt;
    state.dirty = false;
    updateStatus();
    toast(asCopy ? '複製して保存しました' : isNew ? '図鑑に保存しました' : '上書き保存しました', 'success');
  } catch (err) {
    console.error(err);
    toast('保存に失敗しました（容量不足の可能性）', 'error');
  }
}

async function downloadPng(): Promise<void> {
  await ensureFonts(state.name + state.subType + state.effectText);
  const c = renderCardToCanvas(toRenderInput(state));
  const blob = await canvasToBlob(c, 'image/png');
  downloadBlob(blob, `${safeFileName(state.name)}.png`);
}

export function confirmDiscard(): boolean {
  return !state.dirty || confirm('保存していない変更があります。破棄してよろしいですか？');
}

export function resetEditor(): void {
  state = blankState();
  stateToForm();
  scheduleRender();
}

/** 図鑑のカードをエディタに読み込む（duplicate=true で複製として読み込み） */
export async function loadCardIntoEditor(card: CardData, duplicate = false): Promise<void> {
  const image = card.imageBlob ? await loadImageFromBlob(card.imageBlob).catch(() => null) : null;
  state = {
    id: duplicate ? null : card.id,
    createdAt: duplicate ? null : card.createdAt,
    name: card.name,
    attribute: card.attribute,
    level: card.level,
    subType: card.subType,
    effectText: card.effectText,
    atk: card.atk,
    hp: card.hp,
    imageBlob: card.imageBlob,
    image,
    imageTransform: { ...card.imageTransform },
    dirty: duplicate,
  };
  stateToForm();
  scheduleRender();
  scheduleFontLoad();
}

/** 削除されたカードを編集中なら新規扱いに切り替え */
export function onCardDeleted(id: string): void {
  if (state.id === id) {
    state.id = null;
    state.createdAt = null;
    state.dirty = true;
    updateStatus();
  }
}

export function initEditor(): void {
  canvas = $('#preview') as HTMLCanvasElement;
  const c = canvas.getContext('2d');
  if (!c) throw new Error('Canvas not supported');
  ctx = c;
  bindForm();
  bindGestures();
  stateToForm();
  scheduleRender();
  scheduleFontLoad();

  // Web フォント読み込み完了時に再描画
  if ('fonts' in document) {
    document.fonts.addEventListener('loadingdone', () => scheduleRender());
    void document.fonts.ready.then(() => scheduleRender());
  }

  window.addEventListener('beforeunload', (e) => {
    if (state.dirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}
