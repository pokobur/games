import { ThemeConfig } from './types';

/**
 * どうぶつえん (Zoo) theme
 * Animals appear one by one as the timer progresses.
 */
export const zooTheme: ThemeConfig = {
  id: 'zoo',
  name: 'どうぶつえん',
  emoji: '🦁',
  description: 'どうぶつたちに あいにいこう！',
  colors: {
    primary: '#4ade80',
    secondary: '#38bdf8',
    bg: '#f0fdf4',
    accent: '#fb923c',
  },
  speechTriggerKey: 'zoo',

  renderIllustration(progress: number): string {
    const p = Math.max(0, Math.min(1, progress));

    // Sky background
    const sky = `
      <defs>
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#87ceeb"/>
          <stop offset="60%" stop-color="#b8e4f9"/>
          <stop offset="100%" stop-color="#d4f0ff"/>
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#skyGrad)"/>`;

    // Clouds (fluffy ellipses)
    const clouds = `
      <g>
        <ellipse cx="80" cy="50" rx="40" ry="18" fill="#fff" opacity="0.85"/>
        <ellipse cx="60" cy="50" rx="25" ry="14" fill="#fff" opacity="0.85"/>
        <ellipse cx="100" cy="50" rx="25" ry="14" fill="#fff" opacity="0.85"/>

        <ellipse cx="300" cy="35" rx="35" ry="15" fill="#fff" opacity="0.8"/>
        <ellipse cx="280" cy="35" rx="22" ry="12" fill="#fff" opacity="0.8"/>
        <ellipse cx="320" cy="35" rx="22" ry="12" fill="#fff" opacity="0.8"/>

        <ellipse cx="200" cy="65" rx="28" ry="12" fill="#fff" opacity="0.7"/>
        <ellipse cx="185" cy="65" rx="18" ry="10" fill="#fff" opacity="0.7"/>
      </g>`;

    // Ground
    const ground = `
      <ellipse cx="200" cy="320" rx="250" ry="110" fill="#4ade80"/>
      <ellipse cx="200" cy="330" rx="250" ry="100" fill="#34d470"/>`;

    // Fence
    const fence = `
      <g>
        <rect x="20" y="195" width="3" height="30" fill="#92400e" rx="1"/>
        <rect x="55" y="195" width="3" height="30" fill="#92400e" rx="1"/>
        <rect x="90" y="195" width="3" height="30" fill="#92400e" rx="1"/>
        <rect x="310" y="195" width="3" height="30" fill="#92400e" rx="1"/>
        <rect x="345" y="195" width="3" height="30" fill="#92400e" rx="1"/>
        <rect x="380" y="195" width="3" height="30" fill="#92400e" rx="1"/>
        <!-- Horizontal rails -->
        <rect x="18" y="200" width="77" height="3" fill="#a0522d" rx="1"/>
        <rect x="18" y="215" width="77" height="3" fill="#a0522d" rx="1"/>
        <rect x="308" y="200" width="77" height="3" fill="#a0522d" rx="1"/>
        <rect x="308" y="215" width="77" height="3" fill="#a0522d" rx="1"/>
      </g>`;

    // Tree
    const tree = `
      <g transform="translate(340, 130)">
        <!-- Trunk -->
        <rect x="-6" y="30" width="12" height="50" fill="#92400e" rx="3"/>
        <!-- Canopy -->
        <circle cx="0" cy="15" r="28" fill="#22c55e"/>
        <circle cx="-15" cy="25" r="20" fill="#16a34a"/>
        <circle cx="15" cy="25" r="20" fill="#16a34a"/>
        <circle cx="0" cy="5" r="22" fill="#4ade80"/>
        <!-- Leaf details -->
        <circle cx="-8" cy="10" r="5" fill="#22c55e" opacity="0.6"/>
        <circle cx="10" cy="18" r="4" fill="#16a34a" opacity="0.5"/>
      </g>`;

    // --- Animals appear based on progress ---

    // Rabbit at 20%
    const rabbitOpacity = p >= 0.2 ? Math.min(1, (p - 0.2) * 10) : 0;
    const rabbit = `
      <g transform="translate(80, 225)" opacity="${rabbitOpacity}">
        <!-- Body -->
        <ellipse cx="0" cy="8" rx="12" ry="10" fill="#f5f5dc"/>
        <!-- Head -->
        <circle cx="0" cy="-5" r="9" fill="#fff5e6"/>
        <!-- Ears -->
        <ellipse cx="-5" cy="-22" rx="4" ry="12" fill="#fff5e6" transform="rotate(-10)"/>
        <ellipse cx="5" cy="-22" rx="4" ry="12" fill="#fff5e6" transform="rotate(10)"/>
        <ellipse cx="-5" cy="-22" rx="2.5" ry="9" fill="#ffb6c1" transform="rotate(-10)"/>
        <ellipse cx="5" cy="-22" rx="2.5" ry="9" fill="#ffb6c1" transform="rotate(10)"/>
        <!-- Eyes -->
        <circle cx="-3" cy="-6" r="2" fill="#333"/>
        <circle cx="3" cy="-6" r="2" fill="#333"/>
        <circle cx="-2.5" cy="-6.5" r="0.7" fill="#fff"/>
        <circle cx="3.5" cy="-6.5" r="0.7" fill="#fff"/>
        <!-- Nose -->
        <ellipse cx="0" cy="-3" rx="1.5" ry="1" fill="#ffb6c1"/>
        <!-- Whiskers -->
        <line x1="-9" y1="-4" x2="-4" y2="-3" stroke="#ccc" stroke-width="0.5"/>
        <line x1="-9" y1="-2" x2="-4" y2="-2" stroke="#ccc" stroke-width="0.5"/>
        <line x1="9" y1="-4" x2="4" y2="-3" stroke="#ccc" stroke-width="0.5"/>
        <line x1="9" y1="-2" x2="4" y2="-2" stroke="#ccc" stroke-width="0.5"/>
        <!-- Tail -->
        <circle cx="-10" cy="12" r="4" fill="#fff"/>
      </g>`;

    // Bird at 40%
    const birdOpacity = p >= 0.4 ? Math.min(1, (p - 0.4) * 10) : 0;
    const bird = `
      <g transform="translate(330, 115)" opacity="${birdOpacity}">
        <!-- Body (triangle-ish) -->
        <ellipse cx="0" cy="0" rx="8" ry="6" fill="#ff6b6b"/>
        <!-- Head -->
        <circle cx="8" cy="-4" r="5" fill="#ff8a8a"/>
        <!-- Eye -->
        <circle cx="9" cy="-5" r="1.5" fill="#333"/>
        <circle cx="9.5" cy="-5.5" r="0.5" fill="#fff"/>
        <!-- Beak -->
        <polygon points="13,-4 17,-3 13,-2" fill="#ffa500"/>
        <!-- Wing -->
        <ellipse cx="-3" cy="-2" rx="6" ry="4" fill="#e05555" transform="rotate(-15)"/>
        <!-- Tail feathers -->
        <polygon points="-8,0 -14,-4 -12,2" fill="#e05555"/>
        <!-- Legs -->
        <line x1="-2" y1="6" x2="-2" y2="10" stroke="#ffa500" stroke-width="1"/>
        <line x1="2" y1="6" x2="2" y2="10" stroke="#ffa500" stroke-width="1"/>
      </g>`;

    // Elephant at 60%
    const elephantOpacity = p >= 0.6 ? Math.min(1, (p - 0.6) * 10) : 0;
    const elephant = `
      <g transform="translate(200, 220)" opacity="${elephantOpacity}">
        <!-- Body -->
        <ellipse cx="0" cy="0" rx="28" ry="20" fill="#a0aec0"/>
        <!-- Head -->
        <circle cx="25" cy="-10" r="16" fill="#b0bec5"/>
        <!-- Ear -->
        <ellipse cx="35" cy="-8" rx="10" ry="14" fill="#90a4ae"/>
        <ellipse cx="35" cy="-8" rx="7" ry="10" fill="#cfd8dc"/>
        <!-- Eye -->
        <circle cx="30" cy="-12" r="2.5" fill="#333"/>
        <circle cx="30.5" cy="-12.5" r="0.8" fill="#fff"/>
        <!-- Trunk -->
        <path d="M38,-5 Q45,5 42,18 Q40,22 37,20" fill="none" stroke="#a0aec0" stroke-width="5" stroke-linecap="round"/>
        <!-- Legs -->
        <rect x="-18" y="14" width="8" height="18" fill="#90a4ae" rx="3"/>
        <rect x="-6" y="14" width="8" height="18" fill="#90a4ae" rx="3"/>
        <rect x="6" y="14" width="8" height="18" fill="#90a4ae" rx="3"/>
        <rect x="18" y="14" width="8" height="16" fill="#90a4ae" rx="3"/>
        <!-- Tail -->
        <path d="M-28,0 Q-35,-5 -32,-12" fill="none" stroke="#90a4ae" stroke-width="2" stroke-linecap="round"/>
        <!-- Tusk -->
        <path d="M36,-2 Q40,4 38,8" fill="none" stroke="#fff5e6" stroke-width="2" stroke-linecap="round"/>
      </g>`;

    // Lion at 80%
    const lionOpacity = p >= 0.8 ? Math.min(1, (p - 0.8) * 10) : 0;
    const lion = `
      <g transform="translate(140, 235)" opacity="${lionOpacity}">
        <!-- Body -->
        <ellipse cx="0" cy="5" rx="18" ry="14" fill="#f59e0b"/>
        <!-- Mane (rays) -->
        <circle cx="-20" cy="-8" r="16" fill="#d97706"/>
        ${Array.from({ length: 10 }, (_, i) => {
          const angle = (i * 36 - 90) * Math.PI / 180;
          const cx = -20 + Math.cos(angle) * 20;
          const cy = -8 + Math.sin(angle) * 20;
          return `<circle cx="${cx}" cy="${cy}" r="5" fill="#b45309" opacity="0.6"/>`;
        }).join('')}
        <!-- Head -->
        <circle cx="-20" cy="-8" r="14" fill="#fbbf24"/>
        <!-- Eyes -->
        <circle cx="-24" cy="-10" r="2" fill="#333"/>
        <circle cx="-16" cy="-10" r="2" fill="#333"/>
        <circle cx="-23.5" cy="-10.5" r="0.7" fill="#fff"/>
        <circle cx="-15.5" cy="-10.5" r="0.7" fill="#fff"/>
        <!-- Nose -->
        <ellipse cx="-20" cy="-5" rx="3" ry="2" fill="#92400e"/>
        <!-- Mouth -->
        <path d="M-23,-3 Q-20,0 -17,-3" fill="none" stroke="#92400e" stroke-width="1" stroke-linecap="round"/>
        <!-- Whiskers -->
        <line x1="-30" y1="-5" x2="-25" y2="-4" stroke="#e5a300" stroke-width="0.7"/>
        <line x1="-30" y1="-3" x2="-25" y2="-3" stroke="#e5a300" stroke-width="0.7"/>
        <line x1="-10" y1="-5" x2="-15" y2="-4" stroke="#e5a300" stroke-width="0.7"/>
        <line x1="-10" y1="-3" x2="-15" y2="-3" stroke="#e5a300" stroke-width="0.7"/>
        <!-- Legs -->
        <rect x="-10" y="14" width="6" height="12" fill="#f59e0b" rx="2"/>
        <rect x="4" y="14" width="6" height="12" fill="#f59e0b" rx="2"/>
        <!-- Tail -->
        <path d="M18,5 Q28,0 25,-8" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="25" cy="-10" r="4" fill="#d97706"/>
      </g>`;

    // Rainbow at 100%
    let rainbow = '';
    if (p >= 0.95) {
      const rainbowOpacity = Math.min(1, (p - 0.95) * 20);
      const colors = ['#ff6b6b', '#ffa500', '#ffd700', '#4ade80', '#38bdf8', '#6c3ce0'];
      rainbow = `<g opacity="${rainbowOpacity}">`;
      colors.forEach((color, i) => {
        const r = 120 - i * 8;
        rainbow += `<path d="M80,210 A${r},${r} 0 0,1 ${80 + r * 2},210" 
          fill="none" stroke="${color}" stroke-width="6" opacity="0.7"/>`;
      });
      rainbow += `</g>`;
    }

    // Celebration at 100%
    let celebration = '';
    if (p >= 0.95) {
      const cOpacity = Math.min(1, (p - 0.95) * 20);
      // Musical notes / stars
      const particles = [
        [60, 100, '✦'], [150, 80, '♪'], [250, 70, '✦'],
        [350, 95, '♪'], [100, 60, '★'], [300, 55, '★'],
      ];
      particles.forEach(([x, y, _], i) => {
        celebration += `
          <circle cx="${x}" cy="${y}" r="4" fill="#ffd700" opacity="${cOpacity}">
            <animate attributeName="opacity" values="${cOpacity};${cOpacity * 0.3};${cOpacity}" dur="1s" begin="${i * 0.2}s" repeatCount="indefinite"/>
            <animate attributeName="cy" values="${Number(y)};${Number(y) - 5};${Number(y)}" dur="2s" begin="${i * 0.3}s" repeatCount="indefinite"/>
          </circle>`;
      });
    }

    return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
      ${sky}
      ${clouds}
      ${ground}
      ${fence}
      ${tree}
      ${rabbit}
      ${bird}
      ${elephant}
      ${lion}
      ${rainbow}
      ${celebration}
    </svg>`;
  },

  renderStamp(completed: boolean): string {
    if (completed) {
      // Gold paw print with sparkle
      return `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
        <defs>
          <linearGradient id="goldPaw" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffd700"/>
            <stop offset="50%" stop-color="#ffec80"/>
            <stop offset="100%" stop-color="#ffd700"/>
          </linearGradient>
          <filter id="pawGlow">
            <feGaussianBlur stdDeviation="1.5" result="glow"/>
            <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <!-- Paw pad -->
        <ellipse cx="30" cy="34" rx="12" ry="10" fill="url(#goldPaw)" filter="url(#pawGlow)"/>
        <!-- Toe beans -->
        <ellipse cx="20" cy="22" rx="5" ry="6" fill="url(#goldPaw)" transform="rotate(-15, 20, 22)"/>
        <ellipse cx="30" cy="18" rx="5" ry="6" fill="url(#goldPaw)"/>
        <ellipse cx="40" cy="22" rx="5" ry="6" fill="url(#goldPaw)" transform="rotate(15, 40, 22)"/>
        <!-- Sparkles -->
        <g opacity="0.9">
          <line x1="48" y1="10" x2="52" y2="10" stroke="#fff" stroke-width="1.5"/>
          <line x1="50" y1="8" x2="50" y2="12" stroke="#fff" stroke-width="1.5"/>
          <line x1="8" y1="42" x2="12" y2="42" stroke="#ffd700" stroke-width="1"/>
          <line x1="10" y1="40" x2="10" y2="44" stroke="#ffd700" stroke-width="1"/>
        </g>
      </svg>`;
    }

    // Silver paw print with heart
    return `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
      <defs>
        <linearGradient id="silverPaw" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#c0c0c0"/>
          <stop offset="50%" stop-color="#e0e0e0"/>
          <stop offset="100%" stop-color="#c0c0c0"/>
        </linearGradient>
      </defs>
      <!-- Paw pad -->
      <ellipse cx="30" cy="34" rx="12" ry="10" fill="url(#silverPaw)" stroke="#aaa" stroke-width="1" stroke-dasharray="3,2"/>
      <!-- Toe beans -->
      <ellipse cx="20" cy="22" rx="5" ry="6" fill="url(#silverPaw)" stroke="#aaa" stroke-width="0.8" stroke-dasharray="2,2" transform="rotate(-15, 20, 22)"/>
      <ellipse cx="30" cy="18" rx="5" ry="6" fill="url(#silverPaw)" stroke="#aaa" stroke-width="0.8" stroke-dasharray="2,2"/>
      <ellipse cx="40" cy="22" rx="5" ry="6" fill="url(#silverPaw)" stroke="#aaa" stroke-width="0.8" stroke-dasharray="2,2" transform="rotate(15, 40, 22)"/>
      <!-- Heart -->
      <path d="M30,48 C27,45 22,42 22,39 C22,37 23.5,36 25,36 C27,36 29,37.5 30,39 C31,37.5 33,36 35,36 C36.5,36 38,37 38,39 C38,42 33,45 30,48Z"
        fill="#ff8fab" opacity="0.7"/>
    </svg>`;
  },

  renderStampDecoration(): string {
    // Path of footprints leading to a goal flag
    let footprints = '';
    const footprintPositions = [
      [40, 250], [80, 230], [120, 240], [160, 220],
      [200, 230], [240, 215], [280, 225], [320, 210],
      [360, 200],
    ];

    footprintPositions.forEach(([x, y], i) => {
      const rot = (i % 2 === 0) ? -10 : 10;
      footprints += `
        <g transform="translate(${x}, ${y}) rotate(${rot}) scale(0.5)" opacity="0.25">
          <!-- Mini paw -->
          <ellipse cx="0" cy="4" rx="6" ry="5" fill="#92400e"/>
          <ellipse cx="-5" cy="-4" rx="2.5" ry="3" fill="#92400e"/>
          <ellipse cx="0" cy="-6" rx="2.5" ry="3" fill="#92400e"/>
          <ellipse cx="5" cy="-4" rx="2.5" ry="3" fill="#92400e"/>
        </g>`;
    });

    // Goal flag
    const flag = `
      <g transform="translate(375, 180)" opacity="0.35">
        <rect x="0" y="0" width="2" height="30" fill="#92400e"/>
        <polygon points="2,0 20,5 2,12" fill="#fb923c"/>
      </g>`;

    return `<svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;position:absolute;top:0;left:0;pointer-events:none;">
      ${footprints}
      ${flag}
    </svg>`;
  },
};
