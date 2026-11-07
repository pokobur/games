import type { Attribute } from './types';

export interface Theme {
  label: string;
  kanji: string;
  /** UI 用の代表色 */
  base: string;
  /** Layer1 背景グラデーション */
  bg: string[];
  /** 外周フチの色 */
  edge: string[];
  /** 金属装飾（ゴールド/シルバー/ブロンズ/メタリック） */
  metal: string[];
  /** カード名バー */
  nameBar: string[];
  nameText: string;
  nameStroke: string;
  /** 種族・効果テキストのパネル */
  panel: string;
  panelText: string;
  /** ATK/HP バッジ */
  statBg: string[];
  statLabel: string;
  /** 属性シンボル */
  symbol: string[];
}

const GOLD = ['#6b4a0e', '#d9a93a', '#fff3b8', '#e2b54a', '#8a6116', '#f5d77a', '#6b4a0e'];
const SILVER = ['#4f5961', '#b9c3cc', '#ffffff', '#c9d2da', '#6b757e', '#e9eef2', '#4f5961'];
const BRONZE = ['#3e220d', '#a8662f', '#f2c79a', '#c07f43', '#5a3417', '#d9a06a', '#3e220d'];
const METALLIC = ['#1b1426', '#6d5a92', '#e8e0ff', '#9a88c4', '#2e2340', '#c5b8ea', '#1b1426'];

export const THEMES: Record<Attribute, Theme> = {
  fire: {
    label: '炎',
    kanji: '炎',
    base: '#B71C1C',
    bg: ['#4a0000', '#B71C1C', '#e53935', '#7f0000'],
    edge: ['#2a0505', '#4a0b0b'],
    metal: GOLD,
    nameBar: ['#d84343', '#B71C1C', '#6d0a0a'],
    nameText: '#ffffff',
    nameStroke: '#3b0000',
    panel: '#fdf1e6',
    panelText: '#3b0d0d',
    statBg: ['#5c0b0b', '#2a0404'],
    statLabel: '#ffd36b',
    symbol: ['#ff8a65', '#d32f2f', '#5c0b0b'],
  },
  water: {
    label: '水',
    kanji: '水',
    base: '#0D47A1',
    bg: ['#021a40', '#0D47A1', '#1e88e5', '#062a66'],
    edge: ['#04122b', '#0a2147'],
    metal: SILVER,
    nameBar: ['#3f7fd6', '#0D47A1', '#062a66'],
    nameText: '#ffffff',
    nameStroke: '#021433',
    panel: '#eef5fd',
    panelText: '#0a2147',
    statBg: ['#0a2c66', '#04122b'],
    statLabel: '#cfe3ff',
    symbol: ['#81d4fa', '#1976d2', '#062a66'],
  },
  earth: {
    label: '地',
    kanji: '地',
    base: '#4E342E',
    bg: ['#24140f', '#4E342E', '#8d6e63', '#3a2520'],
    edge: ['#1a0f0b', '#2e1d17'],
    metal: BRONZE,
    nameBar: ['#8d6e63', '#5d4037', '#2e1d17'],
    nameText: '#fff6e8',
    nameStroke: '#1a0f0b',
    panel: '#f6efe6',
    panelText: '#2e1d17',
    statBg: ['#3e2723', '#1a0f0b'],
    statLabel: '#f2c79a',
    symbol: ['#d7a86e', '#795548', '#2e1d17'],
  },
  wind: {
    label: '風',
    kanji: '風',
    base: '#1B5E20',
    bg: ['#06260a', '#1B5E20', '#43a047', '#0b3d10'],
    edge: ['#04170a', '#0b2a10'],
    metal: SILVER,
    nameBar: ['#4caf50', '#1B5E20', '#0b3d10'],
    nameText: '#ffffff',
    nameStroke: '#04170a',
    panel: '#eef8ef',
    panelText: '#0b2a10',
    statBg: ['#14421a', '#04170a'],
    statLabel: '#c8f5cb',
    symbol: ['#a5d6a7', '#2e7d32', '#0b3d10'],
  },
  light: {
    label: '光',
    kanji: '光',
    base: '#FBC02D',
    bg: ['#fffef2', '#FFF9C4', '#FBC02D', '#fff59d'],
    edge: ['#c79100', '#e8b923'],
    metal: GOLD,
    nameBar: ['#fffbe0', '#FFF9C4', '#f3d36b'],
    nameText: '#4a3500',
    nameStroke: '#fffdf0',
    panel: '#fffdf2',
    panelText: '#4a3500',
    statBg: ['#fff3c4', '#e8b923'],
    statLabel: '#7a5600',
    symbol: ['#ffffff', '#FBC02D', '#b07d00'],
  },
  dark: {
    label: '闇',
    kanji: '闇',
    base: '#4A148C',
    bg: ['#0b0b0f', '#212121', '#4A148C', '#14051f'],
    edge: ['#050508', '#17101f'],
    metal: METALLIC,
    nameBar: ['#5a2a8f', '#2b1145', '#121212'],
    nameText: '#f1e8ff',
    nameStroke: '#08020f',
    panel: '#f1ecf8',
    panelText: '#1e0b33',
    statBg: ['#2b1145', '#050508'],
    statLabel: '#d6c2ff',
    symbol: ['#b388ff', '#4A148C', '#0b0b0f'],
  },
};
