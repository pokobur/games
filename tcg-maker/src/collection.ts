import type { Attribute, CardData, DeckData } from './types';
import { ATTRIBUTES } from './types';
import { THEMES } from './theme';
import { db } from './db';
import { renderSavedCard } from './cardCanvas';
import { confirmDiscard, loadCardIntoEditor, onCardDeleted } from './editor';
import { switchTab } from './nav';
import {
  changeDeckCount,
  currentDeck,
  deleteCard,
  ensureCurrentDeck,
  on,
  refreshCards,
  refreshDecks,
  store,
} from './store';
import {
  $,
  $input,
  blobToDataUrl,
  canvasToBlob,
  closeModal,
  dataUrlToBlob,
  downloadBlob,
  escapeHtml,
  hideBusy,
  openModal,
  safeFileName,
  showBusy,
  toast,
} from './utils';

let filterAttr: Attribute | 'all' = 'all';

function sortCards(cards: CardData[], key: string): CardData[] {
  const arr = [...cards];
  switch (key) {
    case 'created':
      return arr.sort((a, b) => b.createdAt - a.createdAt);
    case 'name':
      return arr.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    case 'level':
      return arr.sort((a, b) => b.level - a.level || b.updatedAt - a.updatedAt);
    case 'atk':
      return arr.sort((a, b) => b.atk - a.atk);
    case 'hp':
      return arr.sort((a, b) => b.hp - a.hp);
    default:
      return arr.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}

function renderFilterChips(): void {
  const row = $('#collectionFilter');
  const counts = new Map<string, number>();
  store.cards.forEach((c) => counts.set(c.attribute, (counts.get(c.attribute) ?? 0) + 1));
  const chips: string[] = [
    `<button type="button" class="chip ${filterAttr === 'all' ? 'active' : ''}" data-attr="all">すべて <small>${store.cards.length}</small></button>`,
  ];
  for (const attr of ATTRIBUTES) {
    chips.push(
      `<button type="button" class="chip attr-${attr} ${filterAttr === attr ? 'active' : ''}" data-attr="${attr}">${THEMES[attr].kanji} <small>${counts.get(attr) ?? 0}</small></button>`,
    );
  }
  row.innerHTML = chips.join('');
}

export function cardTileHtml(card: CardData, badge = ''): string {
  return `
    <button type="button" class="card-tile" data-id="${card.id}" title="${escapeHtml(card.name)}">
      <img src="${card.thumbnailDataUrl}" alt="${escapeHtml(card.name)}" loading="lazy" decoding="async">
      ${badge}
    </button>`;
}

function renderGrid(): void {
  const q = $input('#collectionSearch').value.trim().toLowerCase();
  const sort = ($('#collectionSort') as HTMLSelectElement).value;
  let cards = store.cards;
  if (filterAttr !== 'all') cards = cards.filter((c) => c.attribute === filterAttr);
  if (q) cards = cards.filter((c) => c.name.toLowerCase().includes(q) || c.subType.toLowerCase().includes(q));
  cards = sortCards(cards, sort);

  $('#collectionGrid').innerHTML = cards
    .map((c) => cardTileHtml(c, `<span class="tile-caption">${escapeHtml(c.name)}</span>`))
    .join('');
  $('#collectionCount').textContent = `${store.cards.length}枚`;
  $('#collectionEmpty').hidden = store.cards.length > 0;
}

function render(): void {
  renderFilterChips();
  renderGrid();
}

/* ------------------------------------------------------------------ */
/* カード詳細モーダル                                                  */
/* ------------------------------------------------------------------ */

export async function openCardDetail(id: string): Promise<void> {
  const card = store.cards.find((c) => c.id === id);
  if (!card) return;
  const wrap = document.createElement('div');
  wrap.className = 'detail';
  const deck = currentDeck();
  wrap.innerHTML = `
    <div class="detail-card"><img src="${card.thumbnailDataUrl}" alt="" class="detail-placeholder"></div>
    <div class="detail-info">
      <h3>${escapeHtml(card.name)}</h3>
      <p class="meta">${THEMES[card.attribute].kanji}属性 ・ Lv.${card.level}${card.subType ? ` ・ ${escapeHtml(card.subType)}` : ''}</p>
      <p class="meta">ATK ${card.atk} / HP ${card.hp}</p>
      <div class="detail-actions">
        <button type="button" class="btn primary" data-act="edit">✎ 編集</button>
        <button type="button" class="btn" data-act="duplicate">複製して編集</button>
        <button type="button" class="btn" data-act="deck">＋ デッキに追加${deck ? `<small>（${escapeHtml(deck.name)}）</small>` : ''}</button>
        <button type="button" class="btn" data-act="png">PNG保存</button>
        <button type="button" class="btn danger-ghost" data-act="delete">削除</button>
      </div>
    </div>`;
  openModal(wrap);

  // 高解像度で描き直し
  const canvasPromise = renderSavedCard(card);
  void canvasPromise.then((canvas) => {
    if (wrap.isConnected) $('.detail-card', wrap).replaceChildren(canvas);
  });

  wrap.addEventListener('click', async (e) => {
    const act = (e.target as HTMLElement).closest<HTMLElement>('[data-act]')?.dataset.act;
    if (!act) return;
    switch (act) {
      case 'edit':
      case 'duplicate':
        if (!confirmDiscard()) return;
        closeModal();
        await loadCardIntoEditor(card, act === 'duplicate');
        switchTab('create');
        break;
      case 'deck': {
        const d = await ensureCurrentDeck();
        const err = await changeDeckCount(d.id, card.id, 1);
        toast(err ?? `「${d.name}」に追加しました`, err ? 'error' : 'success');
        break;
      }
      case 'png': {
        const blob = await canvasToBlob(await canvasPromise, 'image/png');
        downloadBlob(blob, `${safeFileName(card.name)}.png`);
        break;
      }
      case 'delete':
        if (!confirm(`「${card.name}」を削除しますか？\n（デッキからも取り除かれます）`)) return;
        await deleteCard(card.id);
        onCardDeleted(card.id);
        closeModal();
        toast('削除しました');
        break;
    }
  });
}

/* ------------------------------------------------------------------ */
/* バックアップ（JSON エクスポート / インポート）                      */
/* ------------------------------------------------------------------ */

interface BackupFile {
  app: 'tcg-card-maker';
  version: 1;
  exportedAt: number;
  cards: (Omit<CardData, 'imageBlob'> & { imageDataUrl: string | null })[];
  decks: DeckData[];
}

async function exportBackup(): Promise<void> {
  if (!store.cards.length && !store.decks.length) {
    toast('バックアップするデータがありません');
    return;
  }
  showBusy('バックアップを作成中…');
  try {
    const cards = await Promise.all(
      store.cards.map(async ({ imageBlob, ...rest }) => ({
        ...rest,
        imageDataUrl: imageBlob ? await blobToDataUrl(imageBlob) : null,
      })),
    );
    const data: BackupFile = {
      app: 'tcg-card-maker',
      version: 1,
      exportedAt: Date.now(),
      cards,
      decks: store.decks,
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
    downloadBlob(blob, `tcg-backup-${stamp}.json`);
  } finally {
    hideBusy();
  }
}

async function importBackup(file: File): Promise<void> {
  showBusy('復元中…');
  try {
    const data = JSON.parse(await file.text()) as BackupFile;
    if (data.app !== 'tcg-card-maker' || !Array.isArray(data.cards)) throw new Error('invalid');
    const cards: CardData[] = await Promise.all(
      data.cards.map(async ({ imageDataUrl, ...rest }) => ({
        ...rest,
        imageBlob: imageDataUrl ? await dataUrlToBlob(imageDataUrl) : null,
      })),
    );
    await db.transaction('rw', db.cards, db.decks, async () => {
      await db.cards.bulkPut(cards);
      if (Array.isArray(data.decks)) await db.decks.bulkPut(data.decks);
    });
    await Promise.all([refreshCards(), refreshDecks()]);
    toast(`${cards.length}枚のカードを復元しました`, 'success');
  } catch (err) {
    console.error(err);
    toast('バックアップファイルを読み込めませんでした', 'error');
  } finally {
    hideBusy();
  }
}

/* ------------------------------------------------------------------ */

export function initCollection(): void {
  $('#collectionFilter').addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest<HTMLElement>('.chip');
    if (!chip) return;
    filterAttr = chip.dataset.attr as Attribute | 'all';
    render();
  });
  $('#collectionSearch').addEventListener('input', renderGrid);
  $('#collectionSort').addEventListener('change', renderGrid);
  $('#collectionGrid').addEventListener('click', (e) => {
    const tile = (e.target as HTMLElement).closest<HTMLElement>('.card-tile');
    if (tile?.dataset.id) void openCardDetail(tile.dataset.id);
  });
  $('#exportBackup').addEventListener('click', () => void exportBackup());
  const imp = $input('#importBackup');
  imp.addEventListener('change', () => {
    const f = imp.files?.[0];
    imp.value = '';
    if (f) void importBackup(f);
  });
  on('cards', render);
  render();
}
