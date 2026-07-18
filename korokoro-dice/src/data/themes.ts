import { Theme, ThemeId } from '../types/index.ts';

/** 全テーマの定義 */
export const themes: Record<ThemeId, Theme> = {
  number: {
    id: 'number',
    name: 'すうじ',
    emoji: '🔢',
    counter: '',
    noun: '',
    faces: [
      { value: 1, display: '1', label: 'いち' },
      { value: 2, display: '2', label: 'に' },
      { value: 3, display: '3', label: 'さん' },
      { value: 4, display: '4', label: 'よん' },
      { value: 5, display: '5', label: 'ご' },
      { value: 6, display: '6', label: 'ろく' },
    ],
  },
  animal: {
    id: 'animal',
    name: 'どうぶつ',
    emoji: '🐶',
    counter: 'ひき',
    noun: 'どうぶつ',
    faces: [
      { value: 1, display: '🐶', label: 'いぬ' },
      { value: 2, display: '🐱', label: 'ねこ' },
      { value: 3, display: '🐰', label: 'うさぎ' },
      { value: 4, display: '🐼', label: 'ぱんだ' },
      { value: 5, display: '🦁', label: 'らいおん' },
      { value: 6, display: '🐘', label: 'ぞう' },
    ],
  },
  color: {
    id: 'color',
    name: 'いろ',
    emoji: '🎨',
    counter: 'しゅるい',
    noun: 'いろ',
    faces: [
      { value: 1, display: '🔴', label: 'あか' },
      { value: 2, display: '🔵', label: 'あお' },
      { value: 3, display: '🟡', label: 'きいろ' },
      { value: 4, display: '🟢', label: 'みどり' },
      { value: 5, display: '🟣', label: 'むらさき' },
      { value: 6, display: '🟠', label: 'だいだい' },
    ],
  },
};

/** テーマを取得する */
export function getTheme(id: ThemeId): Theme {
  return themes[id];
}

/** 特定テーマの特定面を取得する */
export function getFace(themeId: ThemeId, value: number) {
  return themes[themeId].faces[value - 1];
}

/** 全テーマのリスト */
export function getThemeList(): Theme[] {
  return Object.values(themes);
}
