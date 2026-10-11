/**
 * storage.js
 * LocalStorageを使ったギャラリー保存・データ管理
 */

const GALLERY_KEY = 'pma_gallery';
const WIP_KEY = 'pma_wip_puzzle';
const API_KEY_STORAGE = 'pma_api_key';

/**
 * @typedef {{ id: string, title: string, dataUrl: string, palette: string[], grid: any[][], createdAt: number }} GalleryItem
 */

/**
 * ギャラリーアイテムを保存する（最大20件）
 */
export function saveToGallery(item) {
  const gallery = loadGallery();
  const newItem = {
    ...item,
    id: String(Date.now()),
    createdAt: Date.now()
  };
  gallery.unshift(newItem);

  if (gallery.length > 20) {
    gallery.length = 20;
  }

  try {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
    return true;
  } catch (e) {
    console.warn('Gallery save full, trimming older items:', e);
    // 古いアイテムを削って再試行
    while (gallery.length > 5) {
      gallery.pop();
      try {
        localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
        return true;
      } catch (err) {}
    }
    return false;
  }
}

/**
 * ギャラリー一覧を読み込む
 * @returns {GalleryItem[]}
 */
export function loadGallery() {
  try {
    const raw = localStorage.getItem(GALLERY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load gallery:', e);
    return [];
  }
}

/**
 * ギャラリーアイテムを削除する
 */
export function deleteFromGallery(id) {
  const gallery = loadGallery().filter(item => String(item.id) !== String(id));
  try {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
  } catch (e) {
    console.error('Failed to save gallery after delete:', e);
  }
}

/**
 * プレイ中のパズルの途中保存（WIP）
 */
export function saveWipPuzzle(data) {
  try {
    localStorage.setItem(WIP_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('WIP save failed:', e);
  }
}

/**
 * プレイ中のパズルの途中データを取得
 */
export function loadWipPuzzle() {
  try {
    const raw = localStorage.getItem(WIP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

/**
 * プレイ中の途中データを削除
 */
export function clearWipPuzzle() {
  localStorage.removeItem(WIP_KEY);
}

/**
 * 全データをJSON文字列としてエクスポート
 */
export function exportData() {
  return JSON.stringify({
    version: 1,
    gallery: localStorage.getItem(GALLERY_KEY) || '[]',
    wip: localStorage.getItem(WIP_KEY) || 'null'
  });
}

/**
 * JSON文字列からデータを復元
 */
export function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data && typeof data === 'object') {
      if (typeof data.gallery === 'string') {
        localStorage.setItem(GALLERY_KEY, data.gallery);
      }
      if (typeof data.wip === 'string') {
        localStorage.setItem(WIP_KEY, data.wip);
      }
      return true;
    }
    return false;
  } catch (e) {
    console.error('Import failed:', e);
    return false;
  }
}

/**
 * APIキーの保存
 */
export function saveApiKey(key) {
  if (key && key.trim()) {
    localStorage.setItem(API_KEY_STORAGE, key.trim());
  } else {
    localStorage.removeItem(API_KEY_STORAGE);
  }
}

/**
 * APIキーの読み込み
 */
export function loadApiKey() {
  return localStorage.getItem(API_KEY_STORAGE) || '';
}
