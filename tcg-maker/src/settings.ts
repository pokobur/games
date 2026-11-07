import type { CardData, CardSizePreset, DeckData, PrintSettings } from './types';
import { DEFAULT_PRINT_SETTINGS } from './types';
import { db } from './db';
import { refreshCards, refreshDecks, store } from './store';
import { resetEditor } from './editor';
import {
  blobToDataUrl,
  closeModal,
  dataUrlToBlob,
  downloadBlob,
  hideBusy,
  openModal,
  showBusy,
  toast,
} from './utils';

const SETTINGS_KEY = 'tcg.printSettings';

/** 保存されている印刷設定を取得 */
export function getPrintSettings(): PrintSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_PRINT_SETTINGS, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_PRINT_SETTINGS };
}

/** 印刷設定を保存 */
export function savePrintSettings(s: PrintSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

interface BackupFile {
  app: 'tcg-card-maker';
  version: 1;
  exportedAt: number;
  cards: (Omit<CardData, 'imageBlob'> & { imageDataUrl: string | null })[];
  decks: DeckData[];
}

/** バックアップ（JSON エクスポート） */
export async function exportBackup(): Promise<void> {
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
    toast('バックアップを保存しました', 'success');
  } catch (err) {
    console.error(err);
    toast('バックアップの作成に失敗しました', 'error');
  } finally {
    hideBusy();
  }
}

/** バックアップ復元（JSON インポート） */
export async function importBackup(file: File): Promise<void> {
  showBusy('復元中…');
  try {
    const data = JSON.parse(await file.text()) as BackupFile;
    if (data.app !== 'tcg-card-maker' || !Array.isArray(data.cards)) throw new Error('invalid format');
    const cards: CardData[] = await Promise.all(
      data.cards.map(async ({ imageDataUrl, ...rest }) => ({
        ...rest,
        rarity: (rest as any).rarity ?? 4,
        level: rest.level ?? 4,
        serialCode: rest.serialCode || String(Math.floor(Math.random() * 100000)).padStart(5, '0'),
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

/** 全データ初期化（リセット） */
export async function resetAllData(): Promise<void> {
  const cardCount = store.cards.length;
  const deckCount = store.decks.length;
  const msg =
    `【警告】保存されているすべてのデータ（カード ${cardCount}枚、デッキ ${deckCount}個）を完全に消去します。\n\n` +
    `この操作は取り消せません。本当によろしいですか？`;
  if (!confirm(msg)) return;

  const doubleCheck = prompt('確認のため、半角で「リセット」と入力してください。');
  if (doubleCheck !== 'リセット') {
    toast('リセットをキャンセルしました');
    return;
  }

  showBusy('データを初期化中…');
  try {
    await db.transaction('rw', db.cards, db.decks, async () => {
      await db.cards.clear();
      await db.decks.clear();
    });
    localStorage.removeItem('tcg.currentDeck');
    resetEditor();
    await Promise.all([refreshCards(), refreshDecks()]);
    closeModal();
    toast('すべてのデータを初期化しました', 'success');
  } catch (err) {
    console.error(err);
    toast('初期化に失敗しました', 'error');
  } finally {
    hideBusy();
  }
}

/** 設定モーダルを開く */
export function openSettingsModal(): void {
  const s = getPrintSettings();
  const wrap = document.createElement('div');
  wrap.className = 'settings-dialog';
  wrap.innerHTML = `
    <div class="settings-head">
      <h3>⚙️ 設定</h3>
    </div>

    <!-- 印刷設定 -->
    <fieldset class="panel">
      <legend>🖨️ カードサイズ・印刷設定</legend>
      <label class="field">
        <span class="field-label">カード規格サイズ</span>
        <select id="setCardPreset">
          <option value="standard" ${s.preset === 'standard' ? 'selected' : ''}>レギュラーサイズ（63×88mm）ポケカ/MTG/ワンピ等</option>
          <option value="mini" ${s.preset === 'mini' ? 'selected' : ''}>スモール・ミニサイズ（59×86mm）遊戯王/ヴァンガード等</option>
          <option value="custom" ${s.preset === 'custom' ? 'selected' : ''}>カスタムサイズ</option>
        </select>
      </label>

      <div class="stat-row" id="customSizeRow" style="${s.preset === 'custom' ? '' : 'display: none;'}">
        <label class="field">
          <span class="field-label">カード幅 (mm)</span>
          <input type="number" id="setWidthMm" min="40" max="150" value="${s.widthMm}">
        </label>
        <label class="field">
          <span class="field-label">カード高さ (mm)</span>
          <input type="number" id="setHeightMm" min="40" max="200" value="${s.heightMm}">
        </label>
      </div>

      <div class="field">
        <span class="field-label">印刷デフォルト設定</span>
        <div class="print-options-grid">
          <label class="check">
            <input type="checkbox" id="setCropMarks" ${s.cropMarks ? 'checked' : ''}> トンボ（裁断線ガイド）
          </label>
          <label class="check">
            <input type="checkbox" id="setBacks" ${s.backs ? 'checked' : ''}> 裏面ページを追加（両面印刷対応）
          </label>
          <label class="inline-field">
            カード間隔
            <select id="setGapMm">
              <option value="0" ${s.gapMm === 0 ? 'selected' : ''}>0mm</option>
              <option value="1" ${s.gapMm === 1 ? 'selected' : ''}>1mm</option>
              <option value="2" ${s.gapMm === 2 ? 'selected' : ''}>2mm（推奨）</option>
              <option value="3" ${s.gapMm === 3 ? 'selected' : ''}>3mm</option>
            </select>
          </label>
        </div>
      </div>
      <button type="button" class="btn small primary" id="savePrintSettingsBtn" style="margin-top: 8px;">💾 印刷設定を保存</button>
    </fieldset>

    <!-- データ管理 -->
    <fieldset class="panel">
      <legend>💾 データバックアップ & 復元</legend>
      <p class="note" style="margin-bottom: 10px;">作成したカードやデッキをJSONファイルとして保存・復元できます（機種変更時にも便利です）。</p>
      <div class="btn-row">
        <button type="button" class="btn" id="setExportBtn">💾 バックアップをダウンロード</button>
        <label class="btn file-btn">
          <input type="file" id="setImportFile" accept="application/json,.json" hidden>
          📥 データを復元
        </label>
      </div>
    </fieldset>

    <!-- データ初期化 -->
    <fieldset class="panel danger-zone">
      <legend>⚠️ データ初期化</legend>
      <p class="note" style="margin-bottom: 10px; color: #ffab91;">ブラウザに保存されているすべてのカード・デッキを完全に消去します。</p>
      <button type="button" class="btn danger-ghost" id="setResetAllBtn">⚠️ 全データを初期化する</button>
    </fieldset>
  `;

  openModal(wrap);

  const presetSel = wrap.querySelector<HTMLSelectElement>('#setCardPreset')!;
  const customRow = wrap.querySelector<HTMLElement>('#customSizeRow')!;
  const widthInput = wrap.querySelector<HTMLInputElement>('#setWidthMm')!;
  const heightInput = wrap.querySelector<HTMLInputElement>('#setHeightMm')!;

  presetSel.addEventListener('change', () => {
    const p = presetSel.value as CardSizePreset;
    customRow.style.display = p === 'custom' ? 'grid' : 'none';
    if (p === 'standard') {
      widthInput.value = '63';
      heightInput.value = '88';
    } else if (p === 'mini') {
      widthInput.value = '59';
      heightInput.value = '86';
    }
  });

  wrap.querySelector('#savePrintSettingsBtn')?.addEventListener('click', () => {
    const preset = presetSel.value as CardSizePreset;
    const w = parseFloat(widthInput.value) || 63;
    const h = parseFloat(heightInput.value) || 88;
    const crop = (wrap.querySelector('#setCropMarks') as HTMLInputElement).checked;
    const backs = (wrap.querySelector('#setBacks') as HTMLInputElement).checked;
    const gap = parseFloat((wrap.querySelector('#setGapMm') as HTMLSelectElement).value) || 0;

    const newSettings: PrintSettings = {
      preset,
      widthMm: w,
      heightMm: h,
      cropMarks: crop,
      backs,
      gapMm: gap,
    };
    savePrintSettings(newSettings);
    toast('印刷設定を保存しました', 'success');
  });

  wrap.querySelector('#setExportBtn')?.addEventListener('click', () => {
    void exportBackup();
  });

  const importFile = wrap.querySelector<HTMLInputElement>('#setImportFile')!;
  importFile.addEventListener('change', () => {
    const f = importFile.files?.[0];
    importFile.value = '';
    if (f) void importBackup(f);
  });

  wrap.querySelector('#setResetAllBtn')?.addEventListener('click', () => {
    void resetAllData();
  });
}
