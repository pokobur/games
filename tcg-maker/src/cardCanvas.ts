import type { CardData } from './types';
import { ensureFonts, loadImageFromBlob, renderCardToCanvas, type LoadedImage } from './renderer';

/** 保存済みカードを高解像度 Canvas に描画 */
export async function renderSavedCard(card: CardData): Promise<HTMLCanvasElement> {
  let image: LoadedImage | null = null;
  if (card.imageBlob) {
    try {
      image = await loadImageFromBlob(card.imageBlob);
    } catch {
      image = null;
    }
  }
  await ensureFonts(card.name + card.subType + card.effectText);
  const canvas = renderCardToCanvas({
    name: card.name,
    attribute: card.attribute,
    rarity: card.rarity ?? 4,
    level: card.level ?? 4,
    subType: card.subType,
    effectText: card.effectText,
    atk: card.atk,
    hp: card.hp,
    serialCode: card.serialCode || '00000',
    image,
    imageTransform: card.imageTransform,
  });
  if (image && 'close' in image.source && typeof image.source.close === 'function') {
    image.source.close(); // ImageBitmap のメモリを解放
  }
  return canvas;
}
