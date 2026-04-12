/**
 * storage.js
 * LocalStorageを使ったギャラリー保存
 */

const GALLERY_KEY = 'pma_gallery';

/**
 * @typedef {{ id: string, title: string, dataUrl: string, palette: string[], grid: any[][], createdAt: number }} GalleryItem
 */

/**
 * ギャラリーアイテムを保存する
 */
export function saveToGallery(item) {
  const gallery = loadGallery();
  gallery.unshift({ ...item, id: Date.now().toString(), createdAt: Date.now() });
  // 最大20件
  if (gallery.length > 20) gallery.length = 20;
  try {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
    return true;
  } catch (e) {
    console.error('Gallery save failed (storage full?):', e);
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
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * ギャラリーアイテムを削除する
 */
export function deleteFromGallery(id) {
  const gallery = loadGallery().filter(item => item.id !== id);
  localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
}

const WIP_KEY = 'pma_wip_puzzle';

export function saveWipPuzzle(data) {
  try {
    localStorage.setItem(WIP_KEY, JSON.stringify(data));
  } catch(e) {
    console.error('WIP save failed:', e);
  }
}

export function loadWipPuzzle() {
  try {
    const raw = localStorage.getItem(WIP_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch(e) {
    return null;
  }
}

export function clearWipPuzzle() {
  localStorage.removeItem(WIP_KEY);
}

export function exportData() {
  return JSON.stringify({
    gallery: localStorage.getItem(GALLERY_KEY) || '[]',
    wip: localStorage.getItem(WIP_KEY) || 'null'
  });
}

export function importData(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data && typeof data === 'object') {
      if (data.gallery !== undefined) localStorage.setItem(GALLERY_KEY, data.gallery);
      if (data.wip !== undefined) localStorage.setItem(WIP_KEY, data.wip);
      return true;
    }
    return false;
  } catch(e) {
    console.error('Import failed:', e);
    return false;
  }
}

const API_KEY_STORAGE = 'pma_api_key';

export function saveApiKey(key) {
  if (key) {
    localStorage.setItem(API_KEY_STORAGE, key);
  } else {
    localStorage.removeItem(API_KEY_STORAGE);
  }
}

export function loadApiKey() {
  return localStorage.getItem(API_KEY_STORAGE) || '';
}
