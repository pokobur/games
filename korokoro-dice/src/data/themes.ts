import { DiceType, DiceTypeDef, Theme, ThemeFace, ThemeId } from '../types/index.ts';

/** 多面体サイコロの一覧定義 */
export const DICE_TYPES: Record<DiceType, DiceTypeDef> = {
  d4: {
    type: 'd4',
    sides: 4,
    name: '4めん',
    label: 'よんめん',
    badge: 'D4',
    description: '1〜4 がでる さんかくの サイコロ',
  },
  d6: {
    type: 'd6',
    sides: 6,
    name: '6めん',
    label: 'ろくめん',
    badge: 'D6',
    description: '1〜6 がでる いつもの しかくサイコロ',
  },
  d8: {
    type: 'd8',
    sides: 8,
    name: '8めん',
    label: 'はちめん',
    badge: 'D8',
    description: '1〜8 がでる ダイヤがた サイコロ',
  },
  d10: {
    type: 'd10',
    sides: 10,
    name: '10めん',
    label: 'じゅうめん',
    badge: 'D10',
    description: '1〜10 がでる きらきら サイコロ',
  },
  d12: {
    type: 'd12',
    sides: 12,
    name: '12めん',
    label: 'じゅうにめん',
    badge: 'D12',
    description: '1〜12 がでる ごかっけい サイコロ',
  },
  d20: {
    type: 'd20',
    sides: 20,
    name: '20めん',
    label: 'にじゅうめん',
    badge: 'D20',
    description: '1〜20 がでる ぼうけんの だいサイコロ',
  },
};

export const DICE_TYPE_LIST: DiceTypeDef[] = [
  DICE_TYPES.d4,
  DICE_TYPES.d6,
  DICE_TYPES.d8,
  DICE_TYPES.d10,
  DICE_TYPES.d12,
  DICE_TYPES.d20,
];

/** すうじ用の面リスト（最大20まで生成可能） */
function generateNumberFaces(count: number): ThemeFace[] {
  const numberLabels: Record<number, string> = {
    1: 'いち', 2: 'に', 3: 'さん', 4: 'よん', 5: 'ご', 6: 'ろく',
    7: 'なな', 8: 'はち', 9: 'きゅう', 10: 'じゅう',
    11: 'じゅういち', 12: 'じゅうに', 13: 'じゅうさん', 14: 'じゅうよん',
    15: 'じゅうご', 16: 'じゅうろく', 17: 'じゅうなな', 18: 'じゅうはち',
    19: 'じゅうきゅう', 20: 'にじゅう'
  };

  return Array.from({ length: count }, (_, i) => {
    const val = i + 1;
    return {
      value: val,
      display: `${val}`,
      label: numberLabels[val] || `${val}`,
      desc: `すうじの ${val}（${numberLabels[val] || val}）`,
    };
  });
}

/** 全テーマの定義 */
export const themes: Record<ThemeId, Theme> = {
  number: {
    id: 'number',
    name: 'すうじ',
    emoji: '🔢',
    counter: '',
    noun: '',
    faces: generateNumberFaces(6),
  },
  animal: {
    id: 'animal',
    name: 'どうぶつ',
    emoji: '🐶',
    counter: 'ひき',
    noun: 'どうぶつ',
    faces: [
      { value: 1, display: '🐶', label: 'いぬ', desc: 'げんきに わんわん！' },
      { value: 2, display: '🐱', label: 'ねこ', desc: 'あまえんぼう にゃー！' },
      { value: 3, display: '🐰', label: 'うさぎ', desc: 'ぴょんぴょん はねるよ' },
      { value: 4, display: '🐼', label: 'ぱんだ', desc: 'ささが だいすき！' },
      { value: 5, display: '🦁', label: 'らいおん', desc: 'つよい ひゃくじゅうの おう！' },
      { value: 6, display: '🐘', label: 'ぞう', desc: 'おはなが ながーい！' },
    ],
  },
  color: {
    id: 'color',
    name: 'いろ',
    emoji: '🎨',
    counter: 'しゅるい',
    noun: 'いろ',
    faces: [
      { value: 1, display: '🔴', label: 'あか', desc: 'りんごや ポストの あかいろ' },
      { value: 2, display: '🔵', label: 'あお', desc: 'うみや そらの あおいろ' },
      { value: 3, display: '🟡', label: 'きいろ', desc: 'ひまわりや バナナの きいろ' },
      { value: 4, display: '🟢', label: 'みどり', desc: 'もりや はっぱの みどりいろ' },
      { value: 5, display: '🟣', label: 'むらさき', desc: 'ぶどうの むらさきいろ' },
      { value: 6, display: '🟠', label: 'だいだい', desc: 'みかんや ゆうやけの オレンジ' },
    ],
  },
  fruit: {
    id: 'fruit',
    name: 'くだもの',
    emoji: '🍎',
    counter: 'こ',
    noun: 'くだもの',
    faces: [
      { value: 1, display: '🍎', label: 'りんご', desc: 'あまくて しゃきしゃき！' },
      { value: 2, display: '🍊', label: 'みかん', desc: 'かわを むいて パクッ！' },
      { value: 3, display: '🍇', label: 'ぶどう', desc: 'つぶつぶ ジューシー！' },
      { value: 4, display: '🍌', label: 'ばなな', desc: 'エネルギー まんたん！' },
      { value: 5, display: '🍓', label: 'いちご', desc: 'あまずっぱくて かわいい！' },
      { value: 6, display: '🍉', label: 'すいか', desc: 'なつに ぴったり！' },
    ],
  },
  vehicle: {
    id: 'vehicle',
    name: 'のりもの',
    emoji: '🚗',
    counter: 'だい',
    noun: 'のりもの',
    faces: [
      { value: 1, display: '🚗', label: 'くるま', desc: 'ぶーんと おでかけ！' },
      { value: 2, display: '🚌', label: 'ばす', desc: 'みんなで のるよ！' },
      { value: 3, display: '🚄', label: 'しんかんせん', desc: 'びゅーんと はやい！' },
      { value: 4, display: '✈️', label: 'ひこうき', desc: 'そらを とぶよ！' },
      { value: 5, display: '🚀', label: 'ろけっと', desc: 'うちゅうへ しゅっぱつ！' },
      { value: 6, display: '🚢', label: 'ふね', desc: 'うみを すいすい！' },
    ],
  },
};

/** テーマを取得する */
export function getTheme(id: ThemeId): Theme {
  return themes[id];
}

/** 特定テーマの特定面を取得する（多面体数字にも対応） */
export function getFace(themeId: ThemeId, value: number, diceType: DiceType = 'd6'): ThemeFace {
  if (themeId === 'number') {
    const sides = DICE_TYPES[diceType]?.sides || 6;
    const numberLabels: Record<number, string> = {
      1: 'いち', 2: 'に', 3: 'さん', 4: 'よん', 5: 'ご', 6: 'ろく',
      7: 'なな', 8: 'はち', 9: 'きゅう', 10: 'じゅう',
      11: 'じゅういち', 12: 'じゅうに', 13: 'じゅうさん', 14: 'じゅうよん',
      15: 'じゅうご', 16: 'じゅうろく', 17: 'じゅうなな', 18: 'じゅうはち',
      19: 'じゅうきゅう', 20: 'にじゅう'
    };
    return {
      value,
      display: `${value}`,
      label: numberLabels[value] || `${value}`,
      desc: `1〜${sides} のうちの ${value}`,
    };
  }
  const theme = themes[themeId];
  return theme.faces[value - 1] || {
    value,
    display: `${value}`,
    label: `${value}`,
  };
}

/** 全テーマのリスト */
export function getThemeList(): Theme[] {
  return Object.values(themes);
}

/** 指定したテーマ/ダイスタイプの全面リストを取得する（ずかん用） */
export function getAllFacesForTheme(themeId: ThemeId, diceType: DiceType = 'd6'): ThemeFace[] {
  if (themeId === 'number') {
    const sides = DICE_TYPES[diceType]?.sides || 6;
    return generateNumberFaces(sides);
  }
  return themes[themeId]?.faces || [];
}
