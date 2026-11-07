import type { Attribute, ImageTransform } from './types';
import { LIMITS } from './types';
import { THEMES, type Theme } from './theme';

/** 63mm × 88mm を 12px/mm で描画 */
export const CARD_W = 756;
export const CARD_H = 1056;
export const PX_PER_MM = 12;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** カード内の各領域（px） */
export const LAYOUT = {
  border: 28,
  name: { x: 44, y: 44, w: 668, h: 88 },
  level: { x: 66, y: 140, w: 624, h: 54 },
  art: { x: 66, y: 204, w: 624, h: 474 },
  type: { x: 44, y: 692, w: 668, h: 50 },
  effect: { x: 44, y: 750, w: 668, h: 208 },
  stats: { x: 44, y: 966, w: 668, h: 58 },
} satisfies Record<string, Rect | number>;

export const FONT_SANS =
  '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Hiragino Sans", "Yu Gothic", Meiryo, sans-serif';
export const FONT_SERIF =
  '"Noto Serif JP", "Hiragino Mincho ProN", "Yu Mincho", "YuMincho", serif';

export interface LoadedImage {
  source: CanvasImageSource;
  width: number;
  height: number;
}

export interface RenderInput {
  name: string;
  attribute: Attribute;
  level: number;
  subType: string;
  effectText: string;
  atk: number;
  hp: number;
  image: LoadedImage | null;
  imageTransform: ImageTransform;
}

export interface RenderOptions {
  /** 未入力欄にプレースホルダを表示（エディタ用） */
  placeholder?: boolean;
}

/* ------------------------------------------------------------------ */
/* ユーティリティ                                                      */
/* ------------------------------------------------------------------ */

type Ctx = CanvasRenderingContext2D;

function createCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function get2d(c: HTMLCanvasElement): Ctx {
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context is not available');
  return ctx;
}

function linear(ctx: Ctx, x0: number, y0: number, x1: number, y1: number, stops: string[]): CanvasGradient {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach((c, i) => g.addColorStop(stops.length === 1 ? 0 : i / (stops.length - 1), c));
  return g;
}

function roundRectPath(ctx: Ctx, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.arcTo(x + w, y, x + w, y + rr, rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  ctx.lineTo(x + rr, y + h);
  ctx.arcTo(x, y + h, x, y + h - rr, rr);
  ctx.lineTo(x, y + rr);
  ctx.arcTo(x, y, x + rr, y, rr);
  ctx.closePath();
}

function starPath(ctx: Ctx, cx: number, cy: number, outer: number, inner: number, points = 5): void {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function diamond(ctx: Ctx, cx: number, cy: number, r: number, fill: CanvasGradient | string): void {
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx, cy + r);
  ctx.lineTo(cx - r, cy);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.stroke();
}

/** 金属枠付きのパネルを描画 */
function metalPanel(
  ctx: Ctx,
  theme: Theme,
  r: Rect,
  radius: number,
  fill: CanvasGradient | string,
  borderWidth = 5,
): void {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  roundRectPath(ctx, r.x, r.y, r.w, r.h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();

  roundRectPath(ctx, r.x, r.y, r.w, r.h, radius);
  ctx.lineWidth = borderWidth;
  ctx.strokeStyle = linear(ctx, r.x, r.y, r.x + r.w, r.y + r.h, theme.metal);
  ctx.stroke();

  // 内側の細い暗線で立体感
  roundRectPath(
    ctx,
    r.x + borderWidth / 2 + 1,
    r.y + borderWidth / 2 + 1,
    r.w - borderWidth - 2,
    r.h - borderWidth - 2,
    Math.max(0, radius - borderWidth / 2),
  );
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.stroke();
}

/* ------------------------------------------------------------------ */
/* テキスト折り返し                                                    */
/* ------------------------------------------------------------------ */

/** 行頭に来てはいけない文字（ぶら下げ処理） */
const KINSOKU_HEAD = '、。，．,.・：；:;！？!?」』）)】〕＞>ー～〜ぁぃぅぇぉっゃゅょゎァィゥェォッャュョヮヵヶ';

/** 半角英数字の連続は単語として扱い、それ以外は1文字ずつのトークンに分割 */
function tokenize(text: string): string[] {
  return text.match(/[A-Za-z0-9_\-+'.%#@&]+|./gu) ?? [];
}

export function wrapText(ctx: Ctx, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const para of text.replace(/\r\n?/g, '\n').split('\n')) {
    let line = '';
    for (const token of tokenize(para)) {
      const test = line + token;
      if (ctx.measureText(test).width <= maxWidth) {
        line = test;
        continue;
      }
      // 句読点などは行頭に置かず、前の行にぶら下げる
      if (line !== '' && token.length === 1 && KINSOKU_HEAD.includes(token)) {
        lines.push(test);
        line = '';
        continue;
      }
      if (line !== '') {
        lines.push(line);
        line = '';
      }
      if (token.trim() === '') continue; // 行頭の空白は捨てる
      if (ctx.measureText(token).width <= maxWidth) {
        line = token;
        continue;
      }
      // 1トークンだけで幅を超える（長い英単語など）→ 1文字ずつ分割
      for (const ch of Array.from(token)) {
        if (line !== '' && ctx.measureText(line + ch).width > maxWidth) {
          lines.push(line);
          line = ch;
        } else {
          line += ch;
        }
      }
    }
    lines.push(line);
  }
  return lines;
}

/* ------------------------------------------------------------------ */
/* Layer 1 : 背景（属性ごとにキャッシュ）                              */
/* ------------------------------------------------------------------ */

const bgCache = new Map<Attribute, HTMLCanvasElement>();

function getBackgroundLayer(attr: Attribute): HTMLCanvasElement {
  const cached = bgCache.get(attr);
  if (cached) return cached;
  const theme = THEMES[attr];
  const c = createCanvas(CARD_W, CARD_H);
  const ctx = get2d(c);

  ctx.fillStyle = linear(ctx, 0, 0, CARD_W, CARD_H, theme.bg);
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // 中央の光彩
  const glow = ctx.createRadialGradient(CARD_W / 2, CARD_H * 0.38, 40, CARD_W / 2, CARD_H * 0.38, CARD_H * 0.7);
  glow.addColorStop(0, 'rgba(255,255,255,0.28)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // 斜めの地紋
  ctx.save();
  ctx.globalAlpha = attr === 'light' ? 0.08 : 0.06;
  ctx.strokeStyle = attr === 'light' ? '#8a6100' : '#ffffff';
  ctx.lineWidth = 2;
  for (let i = -CARD_H; i < CARD_W + CARD_H; i += 18) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i - CARD_H, CARD_H);
    ctx.stroke();
  }
  ctx.restore();

  // 菱形の紋様
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = attr === 'light' ? '#8a6100' : '#ffffff';
  for (let y = 0; y < CARD_H + 60; y += 60) {
    for (let x = (y / 60) % 2 === 0 ? 0 : 30; x < CARD_W + 60; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, y - 7);
      ctx.lineTo(x + 7, y);
      ctx.lineTo(x, y + 7);
      ctx.lineTo(x - 7, y);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();

  bgCache.set(attr, c);
  return c;
}

/* ------------------------------------------------------------------ */
/* Layer 3 : フレーム（属性ごとにキャッシュ／イラスト枠内は透過）      */
/* ------------------------------------------------------------------ */

const frameCache = new Map<Attribute, HTMLCanvasElement>();

function getFrameLayer(attr: Attribute): HTMLCanvasElement {
  const cached = frameCache.get(attr);
  if (cached) return cached;
  const theme = THEMES[attr];
  const c = createCanvas(CARD_W, CARD_H);
  const ctx = get2d(c);
  const b = LAYOUT.border;

  // 外周フチ（evenodd でくり抜き）
  ctx.beginPath();
  ctx.rect(0, 0, CARD_W, CARD_H);
  ctx.rect(b, b, CARD_W - b * 2, CARD_H - b * 2);
  ctx.fillStyle = linear(ctx, 0, 0, CARD_W, CARD_H, [theme.edge[0], theme.edge[1], theme.edge[0]]);
  ctx.fill('evenodd');

  // 外周の金属ライン
  ctx.lineWidth = 6;
  ctx.strokeStyle = linear(ctx, 0, 0, CARD_W, CARD_H, theme.metal);
  ctx.strokeRect(b + 3, b + 3, CARD_W - b * 2 - 6, CARD_H - b * 2 - 6);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.strokeRect(b + 7, b + 7, CARD_W - b * 2 - 14, CARD_H - b * 2 - 14);

  // 四隅の装飾
  const metalFill = linear(ctx, 0, 0, CARD_W, CARD_H, theme.metal);
  for (const [cx, cy] of [
    [b + 3, b + 3],
    [CARD_W - b - 3, b + 3],
    [b + 3, CARD_H - b - 3],
    [CARD_W - b - 3, CARD_H - b - 3],
  ]) {
    diamond(ctx, cx, cy, 14, metalFill);
  }

  // カード名バー
  const n = LAYOUT.name;
  metalPanel(ctx, theme, n, 14, linear(ctx, 0, n.y, 0, n.y + n.h, theme.nameBar), 6);
  // 光沢
  ctx.save();
  roundRectPath(ctx, n.x + 6, n.y + 6, n.w - 12, n.h / 2 - 6, 9);
  ctx.fillStyle = linear(ctx, 0, n.y, 0, n.y + n.h / 2, ['rgba(255,255,255,0.32)', 'rgba(255,255,255,0.04)']);
  ctx.fill();
  ctx.restore();

  // レベル帯（半透明の帯）
  const lv = LAYOUT.level;
  ctx.save();
  roundRectPath(ctx, lv.x, lv.y + 4, lv.w, lv.h - 8, 23);
  ctx.fillStyle = attr === 'light' ? 'rgba(120,80,0,0.14)' : 'rgba(0,0,0,0.28)';
  ctx.fill();
  ctx.restore();

  // イラスト枠
  const a = LAYOUT.art;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.shadowBlur = 14;
  ctx.lineWidth = 12;
  ctx.strokeStyle = linear(ctx, a.x, a.y, a.x + a.w, a.y + a.h, theme.metal);
  ctx.strokeRect(a.x - 6, a.y - 6, a.w + 12, a.h + 12);
  ctx.restore();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(0,0,0,0.65)';
  ctx.strokeRect(a.x - 1, a.y - 1, a.w + 2, a.h + 2);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.strokeRect(a.x - 11.5, a.y - 11.5, a.w + 23, a.h + 23);

  // 種族バー
  metalPanel(ctx, theme, LAYOUT.type, 10, theme.panel, 4);

  // 効果テキスト欄
  const e = LAYOUT.effect;
  const paper = ctx.createLinearGradient(0, e.y, 0, e.y + e.h);
  paper.addColorStop(0, theme.panel);
  paper.addColorStop(1, shade(theme.panel, -0.06));
  metalPanel(ctx, theme, e, 12, paper, 5);

  // ATK / HP バッジ
  const s = LAYOUT.stats;
  const gap = 16;
  const bw = (s.w - gap) / 2;
  for (let i = 0; i < 2; i++) {
    const r = { x: s.x + i * (bw + gap), y: s.y, w: bw, h: s.h };
    metalPanel(ctx, theme, r, s.h / 2, linear(ctx, 0, r.y, 0, r.y + r.h, theme.statBg), 4);
  }

  // イラスト枠の内側は完全に透過（Layer 2 を見せる）
  ctx.clearRect(a.x, a.y, a.w, a.h);

  frameCache.set(attr, c);
  return c;
}

/** #rrggbb を明るく/暗く */
function shade(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const num = parseInt(m[1], 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(amount < 0 ? v * (1 + amount) : v + (255 - v) * amount)));
  const r = f((num >> 16) & 255);
  const g = f((num >> 8) & 255);
  const b = f(num & 255);
  return `rgb(${r},${g},${b})`;
}

/* ------------------------------------------------------------------ */
/* Layer 2 : ユーザー画像                                              */
/* ------------------------------------------------------------------ */

/** 画像の描画矩形（cover フィット + offset + scale）を計算 */
export function computeImageRect(img: { width: number; height: number }, t: ImageTransform): Rect {
  const a = LAYOUT.art;
  const cover = Math.max(a.w / img.width, a.h / img.height);
  const s = cover * t.scale;
  const w = img.width * s;
  const h = img.height * s;
  return { x: a.x + (a.w - w) / 2 + t.x, y: a.y + (a.h - h) / 2 + t.y, w, h };
}

function drawArtwork(ctx: Ctx, input: RenderInput, opts: RenderOptions): void {
  const a = LAYOUT.art;
  const theme = THEMES[input.attribute];
  ctx.save();
  ctx.beginPath();
  ctx.rect(a.x, a.y, a.w, a.h);
  ctx.clip();

  if (input.image) {
    const r = computeImageRect(input.image, input.imageTransform);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(input.image.source, r.x, r.y, r.w, r.h);
  } else {
    // 画像未設定時のプレースホルダ
    const g = ctx.createRadialGradient(a.x + a.w / 2, a.y + a.h / 2, 20, a.x + a.w / 2, a.y + a.h / 2, a.w * 0.7);
    g.addColorStop(0, shade(theme.base, input.attribute === 'light' ? 0.5 : 0.25));
    g.addColorStop(1, shade(theme.base, -0.55));
    ctx.fillStyle = g;
    ctx.fillRect(a.x, a.y, a.w, a.h);

    ctx.globalAlpha = 0.16;
    ctx.fillStyle = '#ffffff';
    ctx.font = `900 300px ${FONT_SERIF}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(theme.kanji, a.x + a.w / 2, a.y + a.h / 2 + 10);
    ctx.globalAlpha = 1;

    if (opts.placeholder) {
      ctx.font = `700 34px ${FONT_SANS}`;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.shadowColor = 'rgba(0,0,0,0.6)';
      ctx.shadowBlur = 8;
      ctx.fillText('タップして画像を追加', a.x + a.w / 2, a.y + a.h - 50);
    }
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* Layer 4 : テキスト・アイコン                                        */
/* ------------------------------------------------------------------ */

function drawSymbol(ctx: Ctx, theme: Theme, cx: number, cy: number, r: number): void {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 8;
  const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
  g.addColorStop(0, theme.symbol[0]);
  g.addColorStop(0.55, theme.symbol[1]);
  g.addColorStop(1, theme.symbol[2]);
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = 5;
  ctx.strokeStyle = linear(ctx, cx - r, cy - r, cx + r, cy + r, theme.metal);
  ctx.stroke();

  ctx.font = `900 ${Math.round(r * 1.12)}px ${FONT_SERIF}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 5;
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.strokeText(theme.kanji, cx, cy + 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(theme.kanji, cx, cy + 2);
}

function drawName(ctx: Ctx, input: RenderInput, theme: Theme, opts: RenderOptions, symbolLeft: number): void {
  const n = LAYOUT.name;
  const left = n.x + 22;
  const right = symbolLeft - 12;
  const maxW = right - left;
  const cx = (left + right) / 2;
  const cy = n.y + n.h / 2 + 2;
  const isPlaceholder = !input.name && opts.placeholder;
  const text = input.name || (opts.placeholder ? 'カード名' : '');
  if (!text) return;

  let size = 54;
  ctx.font = `900 ${size}px ${FONT_SERIF}`;
  while (ctx.measureText(text).width > maxW && size > 22) {
    size -= 2;
    ctx.font = `900 ${size}px ${FONT_SERIF}`;
  }
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.save();
  if (isPlaceholder) ctx.globalAlpha = 0.45;
  ctx.lineWidth = 7;
  ctx.strokeStyle = theme.nameStroke;
  ctx.strokeText(text, cx, cy, maxW);
  ctx.fillStyle = theme.nameText;
  ctx.fillText(text, cx, cy, maxW);
  ctx.restore();
}

function drawLevel(ctx: Ctx, level: number): void {
  const lv = LAYOUT.level;
  const count = Math.max(LIMITS.levelMin, Math.min(LIMITS.levelMax, Math.round(level)));
  const step = 52;
  const outer = 23;
  const cy = lv.y + lv.h / 2;
  const right = lv.x + lv.w - 32;
  for (let i = 0; i < count; i++) {
    const cx = right - i * step;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    starPath(ctx, cx, cy, outer, outer * 0.46);
    const g = ctx.createRadialGradient(cx - 5, cy - 6, 2, cx, cy, outer);
    g.addColorStop(0, '#fff7c2');
    g.addColorStop(0.45, '#ffb300');
    g.addColorStop(1, '#c62828');
    ctx.fillStyle = g;
    ctx.fill();
    ctx.restore();
    starPath(ctx, cx, cy, outer, outer * 0.46);
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#5d1a00';
    ctx.stroke();
  }
  // 左端に数値も表示
  ctx.font = `900 30px ${FONT_SERIF}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = 5;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  const label = `Lv.${count}`;
  const lx = Math.min(lv.x + 22, right - (count - 1) * step - outer - 14 - ctx.measureText(label).width);
  if (lx >= lv.x + 6) {
    ctx.strokeText(label, lx, cy + 1);
    ctx.fillStyle = '#ffe9a3';
    ctx.fillText(label, lx, cy + 1);
  }
}

function drawSubType(ctx: Ctx, input: RenderInput, theme: Theme, opts: RenderOptions): void {
  const t = LAYOUT.type;
  const isPlaceholder = !input.subType && opts.placeholder;
  const sub = input.subType || (opts.placeholder ? '種族・タイプ' : '');
  if (!sub) return;
  ctx.save();
  if (isPlaceholder) ctx.globalAlpha = 0.35;
  ctx.font = `700 30px ${FONT_SANS}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = theme.panelText;
  ctx.fillText(`【${sub}】`, t.x + 14, t.y + t.h / 2 + 1, t.w - 28);
  ctx.restore();
}

function drawEffect(ctx: Ctx, input: RenderInput, theme: Theme, opts: RenderOptions): void {
  const e = LAYOUT.effect;
  const padX = 28;
  const padY = 10;
  const isPlaceholder = !input.effectText && opts.placeholder;
  const text = input.effectText || (opts.placeholder ? '効果テキストを入力…' : '');
  if (!text) return;

  // 基準: 36px × 16文字 = 576px で 1行約16文字、5行
  const innerW = 576;
  const innerH = e.h - padY * 2;
  let size = 36;
  let lineH = 0;
  let lines: string[] = [];
  let maxLines = 0;
  for (; size >= 20; size -= 1) {
    ctx.font = `500 ${size}px ${FONT_SANS}`;
    lineH = Math.round(size * 1.08);
    maxLines = Math.floor(innerH / lineH);
    lines = wrapText(ctx, text, innerW);
    while (lines.length > 1 && lines[lines.length - 1] === '') lines.pop();
    if (lines.length <= maxLines) break;
  }
  if (lines.length > maxLines) {
    lines = lines.slice(0, maxLines);
    let last = lines[maxLines - 1];
    while (last && ctx.measureText(last + '…').width > innerW) last = last.slice(0, -1);
    lines[maxLines - 1] = last + '…';
  }

  ctx.save();
  if (isPlaceholder) ctx.globalAlpha = 0.35;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillStyle = theme.panelText;
  const blockH = lines.length * lineH;
  // 行数が少ないときは上寄せ、多いときは全体を枠中央へ
  const top = e.y + padY + Math.max(0, Math.min(6, (innerH - blockH) / 2));
  lines.forEach((ln, i) => {
    ctx.fillText(ln, e.x + padX, top + i * lineH + (lineH - size) / 2);
  });
  ctx.restore();
}

function drawStats(ctx: Ctx, input: RenderInput, theme: Theme): void {
  const s = LAYOUT.stats;
  const gap = 16;
  const bw = (s.w - gap) / 2;
  const items: [string, number][] = [
    ['ATK', input.atk],
    ['HP', input.hp],
  ];
  const valueColor = input.attribute === 'light' ? '#3d2a00' : '#ffffff';
  items.forEach(([label, value], i) => {
    const x = s.x + i * (bw + gap);
    const cy = s.y + s.h / 2 + 1;
    ctx.textBaseline = 'middle';
    ctx.font = `900 26px ${FONT_SERIF}`;
    ctx.textAlign = 'left';
    ctx.fillStyle = theme.statLabel;
    ctx.fillText(label, x + 26, cy);

    const v = String(Math.max(0, Math.min(LIMITS.statMax, Math.floor(value || 0))));
    ctx.font = `900 42px ${FONT_SERIF}`;
    ctx.textAlign = 'right';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = input.attribute === 'light' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
    ctx.strokeText(v, x + bw - 28, cy);
    ctx.fillStyle = valueColor;
    ctx.fillText(v, x + bw - 28, cy);
  });
}

/* ------------------------------------------------------------------ */
/* 公開API                                                             */
/* ------------------------------------------------------------------ */

/** カードを ctx (756×1056) に描画する */
export function renderCard(ctx: Ctx, input: RenderInput, opts: RenderOptions = {}): void {
  const theme = THEMES[input.attribute];
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, CARD_W, CARD_H);

  // Layer 1: 背景
  ctx.drawImage(getBackgroundLayer(input.attribute), 0, 0);
  // Layer 2: イラスト（クリッピング）
  drawArtwork(ctx, input, opts);
  // Layer 3: フレーム
  ctx.drawImage(getFrameLayer(input.attribute), 0, 0);
  // Layer 4: テキスト・アイコン
  const n = LAYOUT.name;
  const symR = 34;
  const symCx = n.x + n.w - symR - 14;
  drawSymbol(ctx, theme, symCx, n.y + n.h / 2, symR);
  drawName(ctx, input, theme, opts, symCx - symR);
  drawLevel(ctx, input.level);
  drawSubType(ctx, input, theme, opts);
  drawEffect(ctx, input, theme, opts);
  drawStats(ctx, input, theme);

  ctx.restore();
}

/** オフスクリーンでカードを描画して canvas を返す */
export function renderCardToCanvas(input: RenderInput, opts: RenderOptions = {}): HTMLCanvasElement {
  const c = createCanvas(CARD_W, CARD_H);
  renderCard(get2d(c), input, opts);
  return c;
}

/** 一覧用サムネイル（JPEG dataURL） */
export function makeThumbnail(source: HTMLCanvasElement, width = 252): string {
  const h = Math.round((width * CARD_H) / CARD_W);
  const c = createCanvas(width, h);
  const ctx = get2d(c);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  // 段階的に縮小して画質を確保
  let src: HTMLCanvasElement = source;
  while (src.width / 2 > width) {
    const half = createCanvas(Math.round(src.width / 2), Math.round(src.height / 2));
    const hc = get2d(half);
    hc.imageSmoothingQuality = 'high';
    hc.drawImage(src, 0, 0, half.width, half.height);
    src = half;
  }
  ctx.drawImage(src, 0, 0, width, h);
  return c.toDataURL('image/jpeg', 0.85);
}

/** 印刷用カード裏面 */
let backCache: HTMLCanvasElement | null = null;
export function renderCardBack(): HTMLCanvasElement {
  if (backCache) return backCache;
  const c = createCanvas(CARD_W, CARD_H);
  const ctx = get2d(c);
  const gold = THEMES.light.metal;

  ctx.fillStyle = linear(ctx, 0, 0, CARD_W, CARD_H, ['#0b0f2a', '#1a1f4d', '#2a0f3d', '#0b0f2a']);
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  const cx = CARD_W / 2;
  const cy = CARD_H / 2;
  const glow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 460);
  glow.addColorStop(0, 'rgba(255,215,120,0.35)');
  glow.addColorStop(1, 'rgba(255,215,120,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // 放射線
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = '#ffe082';
  ctx.lineWidth = 2;
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 120, cy + Math.sin(a) * 120);
    ctx.lineTo(cx + Math.cos(a) * 900, cy + Math.sin(a) * 900);
    ctx.stroke();
  }
  ctx.restore();

  // 二重枠
  ctx.lineWidth = 10;
  ctx.strokeStyle = linear(ctx, 0, 0, CARD_W, CARD_H, gold);
  ctx.strokeRect(34, 34, CARD_W - 68, CARD_H - 68);
  ctx.lineWidth = 3;
  ctx.strokeRect(54, 54, CARD_W - 108, CARD_H - 108);

  // 中央の紋章：6属性の円
  const attrs: Attribute[] = ['fire', 'water', 'earth', 'wind', 'light', 'dark'];
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, 230, 0, Math.PI * 2);
  ctx.stroke();
  starPath(ctx, cx, cy, 230, 133, 6);
  ctx.lineWidth = 3;
  ctx.stroke();
  attrs.forEach((attr, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    drawSymbol(ctx, THEMES[attr], cx + Math.cos(a) * 230, cy + Math.sin(a) * 230, 40);
  });

  ctx.beginPath();
  ctx.arc(cx, cy, 110, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(10,10,30,0.85)';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = linear(ctx, cx - 110, cy - 110, cx + 110, cy + 110, gold);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = linear(ctx, 0, cy - 50, 0, cy + 50, ['#fff3b8', '#d9a93a', '#8a6116']);
  ctx.font = `900 76px ${FONT_SERIF}`;
  ctx.fillText('TCG', cx, cy - 12);
  ctx.font = `700 26px ${FONT_SERIF}`;
  ctx.fillText('ORIGINAL', cx, cy + 46);

  backCache = c;
  return c;
}

/* ------------------------------------------------------------------ */
/* 画像読み込み・フォント                                              */
/* ------------------------------------------------------------------ */

export async function loadImageFromBlob(blob: Blob): Promise<LoadedImage> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(blob);
      return { source: bmp, width: bmp.width, height: bmp.height };
    } catch {
      /* フォールバック */
    }
  }
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.src = url;
  try {
    await img.decode();
  } catch {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('画像を読み込めませんでした'));
    });
  }
  return { source: img, width: img.naturalWidth, height: img.naturalHeight };
}

const FONT_SPECS = [`900 40px ${FONT_SERIF}`, `500 36px ${FONT_SANS}`, `700 30px ${FONT_SANS}`];

/**
 * Web フォント（unicode-range でサブセット配信）を、描画するテキストに含まれる文字分だけロードする。
 * オフライン等で失敗してもシステムフォントで描画されるため例外は握りつぶす。
 */
export async function ensureFonts(text: string): Promise<void> {
  if (!('fonts' in document)) return;
  const sample = text + 'カード名効果種族・タイプを入力…タップして画像を追加ATKHP0123456789Lv.【】炎水地風光闇TCGORIGINAL';
  try {
    await Promise.race([
      Promise.all(FONT_SPECS.map((f) => document.fonts.load(f, sample))),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  } catch {
    /* noop */
  }
}
