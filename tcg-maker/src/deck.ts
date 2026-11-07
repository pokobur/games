import type { CardData } from './types';
import { ATTRIBUTES, LIMITS } from './types';
import { THEMES } from './theme';
import { openCardDetail } from './collection';
import {
  changeDeckCount,
  createDeck,
  currentDeck,
  deckTotal,
  deleteDeck,
  getCard,
  on,
  setCurrentDeck,
  store,
  updateDeck,
} from './store';
import { $, $input, escapeHtml, hideBusy, showBusy, toast, updateBusy } from './utils';

const ATTR_ORDER = new Map(ATTRIBUTES.map((a, i) => [a, i]));

function deckEntries(): { card: CardData; count: number }[] {
  const deck = currentDeck();
  if (!deck) return [];
  return deck.cards
    .map((e) => ({ card: getCard(e.cardId), count: e.count }))
    .filter((e): e is { card: CardData; count: number } => !!e.card && e.count > 0)
    .sort(
      (a, b) =>
        ATTR_ORDER.get(a.card.attribute)! - ATTR_ORDER.get(b.card.attribute)! ||
        b.card.level - a.card.level ||
        a.card.name.localeCompare(b.card.name, 'ja'),
    );
}

function renderDeckSelect(): void {
  const sel = $('#deckSelect') as HTMLSelectElement;
  if (!store.decks.length) {
    sel.innerHTML = '<option value="">（デッキがありません）</option>';
  } else {
    sel.innerHTML = store.decks
      .map((d) => `<option value="${d.id}">${escapeHtml(d.name)}（${deckTotal(d)}枚）</option>`)
      .join('');
  }
  sel.value = store.currentDeckId;
  const has = !!currentDeck();
  ($('#renameDeck') as HTMLButtonElement).disabled = !has;
  ($('#deleteDeck') as HTMLButtonElement).disabled = !has;
}

function renderDeck(): void {
  const entries = deckEntries();
  const total = entries.reduce((s, e) => s + e.count, 0);
  $('#deckTotal').textContent = String(total);
  $('#deckMax').textContent = String(LIMITS.deckMax);
  const bar = $('#deckProgress');
  bar.style.width = `${Math.min(100, (total / LIMITS.deckMax) * 100)}%`;
  bar.classList.toggle('full', total >= LIMITS.deckMax);

  const counts = new Map<string, number>();
  entries.forEach((e) => counts.set(e.card.attribute, (counts.get(e.card.attribute) ?? 0) + e.count));
  $('#deckBreakdown').innerHTML = ATTRIBUTES.filter((a) => counts.get(a))
    .map((a) => `<span class="chip attr-${a} static">${THEMES[a].kanji} ${counts.get(a)}</span>`)
    .join('');

  $('#deckList').innerHTML = entries
    .map(
      ({ card, count }) => `
      <li class="deck-row" data-id="${card.id}">
        <button type="button" class="deck-thumb" data-act="detail"><img src="${card.thumbnailDataUrl}" alt=""></button>
        <div class="deck-row-info">
          <div class="deck-row-name">${escapeHtml(card.name)}</div>
          <div class="deck-row-meta"><span class="dot attr-${card.attribute}"></span>${THEMES[card.attribute].kanji} Lv.${card.level} ・ ${card.atk}/${card.hp}</div>
        </div>
        <div class="stepper">
          <button type="button" data-act="minus" aria-label="1枚減らす">−</button>
          <span>${count}</span>
          <button type="button" data-act="plus" aria-label="1枚増やす" ${total >= LIMITS.deckMax ? 'disabled' : ''}>＋</button>
        </div>
      </li>`,
    )
    .join('');
  $('#deckEmpty').hidden = entries.length > 0;
  ($('#clearDeck') as HTMLButtonElement).hidden = entries.length === 0;
  ($('#exportPdf') as HTMLButtonElement).disabled = total === 0;
}

function renderPool(): void {
  const q = $input('#poolSearch').value.trim().toLowerCase();
  const deck = currentDeck();
  const inDeck = new Map(deck?.cards.map((c) => [c.cardId, c.count]) ?? []);
  const cards = store.cards.filter((c) => !q || c.name.toLowerCase().includes(q) || c.subType.toLowerCase().includes(q));
  $('#poolGrid').innerHTML = cards
    .map((c) => {
      const n = inDeck.get(c.id);
      return `
      <button type="button" class="card-tile" data-id="${c.id}" title="${escapeHtml(c.name)}">
        <img src="${c.thumbnailDataUrl}" alt="${escapeHtml(c.name)}" loading="lazy" decoding="async">
        ${n ? `<span class="count-badge">×${n}</span>` : ''}
      </button>`;
    })
    .join('');
  $('#poolEmpty').hidden = store.cards.length > 0;
}

function renderAll(): void {
  renderDeckSelect();
  renderDeck();
  renderPool();
}

async function addToDeck(cardId: string, delta: number): Promise<void> {
  let deck = currentDeck();
  if (!deck) deck = await createDeck('マイデッキ');
  const err = await changeDeckCount(deck.id, cardId, delta);
  if (err) toast(err, 'error');
}

async function exportPdf(): Promise<void> {
  const deck = currentDeck();
  const entries = deckEntries();
  if (!deck || !entries.length) {
    toast('デッキにカードを追加してください', 'error');
    return;
  }
  showBusy('PDFを準備中…');
  try {
    const { exportCardsPdf } = await import('./pdf');
    await exportCardsPdf(
      entries,
      {
        gapMm: parseFloat(($('#optGap') as HTMLSelectElement).value) || 0,
        cropMarks: $input('#optCropMarks').checked,
        backs: $input('#optBacks').checked,
        title: deck.name,
      },
      updateBusy,
    );
    toast('PDFを出力しました', 'success');
  } catch (err) {
    console.error(err);
    toast('PDFの生成に失敗しました', 'error');
  } finally {
    hideBusy();
  }
}

export function initDeck(): void {
  $('#deckSelect').addEventListener('change', (e) => setCurrentDeck((e.target as HTMLSelectElement).value));

  $('#newDeck').addEventListener('click', async () => {
    const name = prompt('新しいデッキの名前', `デッキ${store.decks.length + 1}`)?.trim();
    if (!name) return;
    await createDeck(name.slice(0, 30));
    toast(`「${name}」を作成しました`, 'success');
  });

  $('#renameDeck').addEventListener('click', async () => {
    const deck = currentDeck();
    if (!deck) return;
    const name = prompt('デッキ名を変更', deck.name)?.trim();
    if (!name) return;
    deck.name = name.slice(0, 30);
    await updateDeck(deck);
  });

  $('#deleteDeck').addEventListener('click', async () => {
    const deck = currentDeck();
    if (!deck || !confirm(`デッキ「${deck.name}」を削除しますか？\n（カード自体は削除されません）`)) return;
    await deleteDeck(deck.id);
    toast('デッキを削除しました');
  });

  $('#clearDeck').addEventListener('click', async () => {
    const deck = currentDeck();
    if (!deck || !confirm('デッキを空にしますか？')) return;
    deck.cards = [];
    await updateDeck(deck);
  });

  $('#deckList').addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const act = t.closest<HTMLElement>('[data-act]')?.dataset.act;
    const id = t.closest<HTMLElement>('.deck-row')?.dataset.id;
    if (!act || !id) return;
    if (act === 'plus') void addToDeck(id, 1);
    else if (act === 'minus') void addToDeck(id, -1);
    else if (act === 'detail') void openCardDetail(id);
  });

  $('#poolGrid').addEventListener('click', (e) => {
    const id = (e.target as HTMLElement).closest<HTMLElement>('.card-tile')?.dataset.id;
    if (id) void addToDeck(id, 1);
  });
  $('#poolSearch').addEventListener('input', renderPool);
  $('#exportPdf').addEventListener('click', () => void exportPdf());

  on('cards', renderAll);
  on('decks', renderAll);
  on('current-deck', renderAll);
  renderAll();
}
