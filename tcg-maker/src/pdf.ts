import type { CardData } from './types';
import { renderSavedCard } from './cardCanvas';
import { renderCardBack } from './renderer';

export interface PdfOptions {
  gapMm: number;
  cropMarks: boolean;
  backs: boolean;
  title: string;
  cardWidthMm?: number;
  cardHeightMm?: number;
}

const PAGE_W = 210; // A4 portrait (mm)
const PAGE_H = 297;
const COLS = 3;
const ROWS = 3;
const PER_PAGE = COLS * ROWS;

const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

/**
 * カードを A4 に 3×3 で敷き詰めた PDF を生成する。
 * カード画像は 756×1056px（≒305dpi）で描画して JPEG 埋め込み。同一カードは alias で再利用。
 */
export async function exportCardsPdf(
  entries: { card: CardData; count: number }[],
  opts: PdfOptions,
  onProgress: (msg: string) => void,
): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const cardW = opts.cardWidthMm || 63;
  const cardH = opts.cardHeightMm || 88;
  const g = opts.gapMm;
  const gridW = COLS * cardW + (COLS - 1) * g;
  const gridH = ROWS * cardH + (ROWS - 1) * g;
  const ml = (PAGE_W - gridW) / 2;
  const mt = (PAGE_H - gridH) / 2;

  // 1) ユニークなカードを高解像度で描画
  const images = new Map<string, string>();
  for (let i = 0; i < entries.length; i++) {
    onProgress(`カード画像を生成中… ${i + 1}/${entries.length}`);
    const { card } = entries[i];
    const canvas = await renderSavedCard(card);
    images.set(card.id, canvas.toDataURL('image/jpeg', 0.92));
    canvas.width = canvas.height = 0; // メモリ解放
    await nextFrame();
  }
  const backImage = opts.backs ? renderCardBack().toDataURL('image/jpeg', 0.92) : null;

  // 2) 配置
  const slots = entries.flatMap((e) => Array<string>(e.count).fill(e.card.id));
  const pageCount = Math.ceil(slots.length / PER_PAGE);
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });
  doc.setProperties({ title: opts.title, creator: '自作TCGカードメーカー' });

  const pos = (k: number, mirror: boolean) => {
    const col = k % COLS;
    const row = Math.floor(k / COLS);
    const c = mirror ? COLS - 1 - col : col;
    return { x: ml + c * (cardW + g), y: mt + row * (cardH + g) };
  };

  for (let p = 0; p < pageCount; p++) {
    onProgress(`PDFを組版中… ${p + 1}/${pageCount}ページ`);
    if (p > 0) doc.addPage();
    const pageSlots = slots.slice(p * PER_PAGE, (p + 1) * PER_PAGE);
    pageSlots.forEach((id, k) => {
      const { x, y } = pos(k, false);
      doc.addImage(images.get(id)!, 'JPEG', x, y, cardW, cardH, `card-${id}`, 'NONE');
    });
    if (opts.cropMarks) drawCropMarks(doc, ml, mt, g, cardW, cardH);

    if (backImage) {
      // 長辺とじの両面印刷では左右が反転するため列をミラー配置
      doc.addPage();
      pageSlots.forEach((_, k) => {
        const { x, y } = pos(k, true);
        doc.addImage(backImage, 'JPEG', x, y, cardW, cardH, 'card-back', 'NONE');
      });
      if (opts.cropMarks) drawCropMarks(doc, ml, mt, g, cardW, cardH);
    }
    await nextFrame();
  }

  onProgress('ファイルを保存中…');
  doc.save(`${opts.title || 'deck'}.pdf`);
}

type Doc = InstanceType<typeof import('jspdf').jsPDF>;

/** 余白にトンボ（カット位置の目印）を描画 */
function drawCropMarks(doc: Doc, ml: number, mt: number, g: number, cardW: number, cardH: number): void {
  const xs = new Set<number>();
  const ys = new Set<number>();
  for (let c = 0; c < COLS; c++) {
    const x = ml + c * (cardW + g);
    xs.add(+x.toFixed(3));
    xs.add(+(x + cardW).toFixed(3));
  }
  for (let r = 0; r < ROWS; r++) {
    const y = mt + r * (cardH + g);
    ys.add(+y.toFixed(3));
    ys.add(+(y + cardH).toFixed(3));
  }
  const gridR = ml + COLS * cardW + (COLS - 1) * g;
  const gridB = mt + ROWS * cardH + (ROWS - 1) * g;
  const off = 1.5;
  const len = Math.max(2, Math.min(5, ml - off - 0.5));
  const lenV = Math.max(2, Math.min(5, mt - off - 0.5));

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.15);
  xs.forEach((x) => {
    doc.line(x, mt - off - lenV, x, mt - off);
    doc.line(x, gridB + off, x, gridB + off + lenV);
  });
  ys.forEach((y) => {
    doc.line(ml - off - len, y, ml - off, y);
    doc.line(gridR + off, y, gridR + off + len, y);
  });
}
