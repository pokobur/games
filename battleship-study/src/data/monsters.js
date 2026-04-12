// Monster metadata completely expanded
export const MONSTERS_DATA = {
  space: {
    substages: [
      { id: 'space_1', title: 'たしざん・ひきざん', level: 1, enemies: [
        { id: 'm_space_1', name: 'プチいんせき', hp: 30, color: '#94a3b8', icon: '🪨' },
        { id: 'm_space_2', name: 'スペースUFO', hp: 40, color: '#38bdf8', icon: '🛸' },
      ]},
      { id: 'space_2', title: 'かけざん・わりざん', level: 2, enemies: [
        { id: 'm_space_3', name: 'エイリアンソルジャー', hp: 70, color: '#a3e635', icon: '👽' },
        { id: 'm_space_4', name: 'ギャラクシーロボ', hp: 80, color: '#8b5cf6', icon: '🤖' },
      ]},
      { id: 'space_boss', title: '宇宙大魔王', level: 3, enemies: [
        { id: 'b_space', name: '巨大メテオデス', hp: 450, color: '#ef4444', icon: '☄️', isBoss: true }
      ]}
    ]
  },
  ninja: {
    substages: [
      { id: 'ninja_1', title: '漢字のよみかた', level: 1, enemies: [
        { id: 'm_ninja_1', name: 'からくり木人', hp: 30, color: '#d97706', icon: '🪵' },
        { id: 'm_ninja_2', name: '見習いクノイチ', hp: 40, color: '#f43f5e', icon: '🥷' },
      ]},
      { id: 'ninja_2', title: '反対のことば', level: 2, enemies: [
        { id: 'm_ninja_3', name: '風魔ガエル', hp: 70, color: '#2dd4bf', icon: '🐸' },
        { id: 'm_ninja_4', name: '影法師', hp: 80, color: '#334155', icon: '👤' },
      ]},
      { id: 'ninja_boss', title: 'からくり屋敷の主', level: 3, enemies: [
        { id: 'b_ninja', name: '服部マスター', hp: 450, color: '#881337', icon: '👺', isBoss: true }
      ]}
    ]
  },
  jungle: {
    substages: [
      { id: 'jungle_1', title: '動物・植物のなかま', level: 1, enemies: [
        { id: 'm_jungle_1', name: 'マッドモンキー', hp: 30, color: '#a16207', icon: '🐒' },
        { id: 'm_jungle_2', name: 'ポイズンフラワー', hp: 40, color: '#84cc16', icon: '🌺' },
      ]},
      { id: 'jungle_2', title: '地球と宇宙・理科', level: 2, enemies: [
        { id: 'm_jungle_3', name: '暴れゴリラ', hp: 70, color: '#4d7c0f', icon: '🦍' },
        { id: 'm_jungle_4', name: 'キラーバグ', hp: 80, color: '#eab308', icon: '🐛' },
      ]},
      { id: 'jungle_boss', title: '密林の守り神', level: 3, enemies: [
        { id: 'b_jungle', name: '大地の精霊木', hp: 450, color: '#14532d', icon: '🌳', isBoss: true }
      ]}
    ]
  },
  ocean: {
    substages: [
      { id: 'ocean_1', title: '英語のどうぶつ達', level: 1, enemies: [
        { id: 'm_ocean_1', name: '子分フグ', hp: 30, color: '#60a5fa', icon: '🐡' },
        { id: 'm_ocean_2', name: 'イカセーラー', hp: 40, color: '#38bdf8', icon: '🦑' },
      ]},
      { id: 'ocean_2', title: '数・色・あいさつ', level: 2, enemies: [
        { id: 'm_ocean_3', name: 'オオウツボ', hp: 70, color: '#0ea5e9', icon: '🐉' },
        { id: 'm_ocean_4', name: 'さまよう海賊船', hp: 80, color: '#64748b', icon: '⛴️' },
      ]},
      { id: 'ocean_boss', title: '深海の覇者', level: 3, enemies: [
        { id: 'b_ocean', name: 'クラーケンキング', hp: 450, color: '#1e3a8a', icon: '🐙', isBoss: true }
      ]}
    ]
  },
  desert: {
    substages: [
      { id: 'desert_1', title: '地図・生活科', level: 1, enemies: [
        { id: 'm_desert_1', name: 'サボテンダー', hp: 30, color: '#10b981', icon: '🌵' },
        { id: 'm_desert_2', name: 'ミイラ男', hp: 40, color: '#fde047', icon: '🤕' },
      ]},
      { id: 'desert_2', title: 'お仕事と社会', level: 2, enemies: [
        { id: 'm_desert_3', name: 'サンドゴーレム', hp: 70, color: '#d97706', icon: '🗿' },
        { id: 'm_desert_4', name: 'マジックカメレオン', hp: 80, color: '#14b8a6', icon: '🦎' },
      ]},
      { id: 'desert_boss', title: '古代の王', level: 3, enemies: [
        { id: 'b_desert', name: '黄金スフィンクス', hp: 450, color: '#fbbf24', icon: '🐪', isBoss: true }
      ]}
    ]
  },
  final_boss: {
    substages: [
      { id: 'final_1', title: '魔王の城門', level: 1, enemies: [
        { id: 'm_final_1', name: 'ダークシャドウ', hp: 100, color: '#475569', icon: '👻' },
      ]},
      { id: 'final_2', title: '魔王の側近', level: 2, enemies: [
        { id: 'm_final_2', name: 'カオスキメラ', hp: 150, color: '#c026d3', icon: '🐉' },
      ]},
      { id: 'final_boss', title: '最後の戦い', level: 3, enemies: [
        { id: 'b_final', name: '全知全能の魔王', hp: 999, color: '#000000', icon: '👑', isBoss: true }
      ]}
    ]
  }
};

export const STAGES_DATA = [
  {
    id: 'space',
    title: '宇宙ステージ (算数)',
    description: '隕石を破壊して進め！',
    themeLight: '--stage-space-light',
    themeDark: '--stage-space-dark',
  },
  {
    id: 'ninja',
    title: '忍者屋敷ステージ (国語)',
    description: 'からくり忍者を倒せ！',
    themeLight: '--stage-ninja-light',
    themeDark: '--stage-ninja-dark',
  },
  {
    id: 'jungle',
    title: 'ジャングルステージ (理科)',
    description: '不思議な動植物をかき分けろ！',
    themeLight: '--stage-jungle-light',
    themeDark: '--stage-jungle-dark',
  },
  {
    id: 'ocean',
    title: '海賊ステージ (英語)',
    description: '海のモンスターをたおせ！',
    themeLight: '--stage-ocean-light',
    themeDark: '--stage-ocean-dark',
  },
  {
    id: 'desert',
    title: '遺跡ステージ (社会)',
    description: '砂漠の謎を解き明かせ！',
    themeLight: '--stage-desert-light',
    themeDark: '--stage-desert-dark',
  },
  {
    id: 'final_boss',
    title: '魔王城 (全ジャンルMIX)',
    description: '最強の敵に立ち向かえ！',
    themeLight: '--stage-final-light',
    themeDark: '--stage-final-dark',
  }
];
