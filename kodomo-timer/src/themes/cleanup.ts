import { ThemeConfig } from './types';

/**
 * おかたづけ (Cleanup) theme
 * A room that gets progressively cleaner as the timer progresses.
 */
export const cleanupTheme: ThemeConfig = {
  id: 'cleanup',
  name: 'おかたづけ',
  emoji: '🧹',
  description: 'おへやをピカピカにしよう！',
  colors: {
    primary: '#4facfe',
    secondary: '#43e97b',
    bg: '#fff8e7',
    accent: '#c4956a',
  },
  speechTriggerKey: 'cleanup',

  renderIllustration(progress: number): string {
    const p = Math.max(0, Math.min(1, progress));

    // Floor and walls
    const room = `
      <!-- Back wall -->
      <rect x="20" y="20" width="360" height="200" fill="#fff8e7" rx="4"/>
      <!-- Wall decoration - stripe -->
      <rect x="20" y="20" width="360" height="8" fill="#f0e6d0"/>
      <!-- Floor -->
      <rect x="10" y="220" width="380" height="80" fill="#deb887" rx="2"/>
      <!-- Floor boards -->
      <line x1="10" y1="250" x2="390" y2="250" stroke="#c4956a" stroke-width="0.5" opacity="0.4"/>
      <line x1="10" y1="270" x2="390" y2="270" stroke="#c4956a" stroke-width="0.5" opacity="0.4"/>`;

    // Window with sun
    const window = `
      <g transform="translate(280, 45)">
        <rect x="0" y="0" width="70" height="70" rx="4" fill="#87ceeb" stroke="#c4956a" stroke-width="3"/>
        <line x1="35" y1="0" x2="35" y2="70" stroke="#c4956a" stroke-width="2"/>
        <line x1="0" y1="35" x2="70" y2="35" stroke="#c4956a" stroke-width="2"/>
        <!-- Sun -->
        <circle cx="55" cy="20" r="12" fill="#ffd700"/>
        <g stroke="#ffd700" stroke-width="1.5" stroke-linecap="round">
          <line x1="55" y1="4" x2="55" y2="1"/>
          <line x1="55" y1="36" x2="55" y2="39"/>
          <line x1="39" y1="20" x2="36" y2="20"/>
          <line x1="71" y1="20" x2="74" y2="20"/>
        </g>
      </g>`;

    // Bookshelf (always present, items fill in)
    const shelf = `
      <g transform="translate(30, 60)">
        <!-- Shelf frame -->
        <rect x="0" y="0" width="80" height="150" fill="none" stroke="#c4956a" stroke-width="3" rx="3"/>
        <!-- Shelf boards -->
        <line x1="0" y1="50" x2="80" y2="50" stroke="#c4956a" stroke-width="3"/>
        <line x1="0" y1="100" x2="80" y2="100" stroke="#c4956a" stroke-width="3"/>
        <!-- Back panel -->
        <rect x="1.5" y="1.5" width="77" height="147" fill="#f5e6d0" opacity="0.5" rx="2"/>
      </g>`;

    // Toy box (always present)
    const toyBox = `
      <g transform="translate(150, 170)">
        <rect x="0" y="0" width="70" height="50" rx="5" fill="#ff9a76" stroke="#e07050" stroke-width="2"/>
        <rect x="-2" y="-5" width="74" height="10" rx="3" fill="#e07050"/>
        <text x="35" y="32" text-anchor="middle" fill="#fff" font-size="10" font-family="'M PLUS Rounded 1c', sans-serif" font-weight="700">おもちゃ</text>
      </g>`;

    // Items - each moves from floor to shelf/box based on progress thresholds
    // Ball (circle) - moves at p > 0.15
    const ballOnFloor = p < 0.15;
    const ballX = ballOnFloor ? 200 : 170;
    const ballY = ballOnFloor ? 255 : 182;
    const ballScale = ballOnFloor ? 1 : 0.8;
    const ball = `
      <g transform="translate(${ballX}, ${ballY}) scale(${ballScale})" opacity="${p >= 1 ? 1 : 0.95}">
        <circle cx="0" cy="0" r="12" fill="#ff6b6b"/>
        <circle cx="-3" cy="-4" r="3" fill="#ff8a8a" opacity="0.6"/>
        <path d="M-8,4 Q0,8 8,4" fill="none" stroke="#e05555" stroke-width="1"/>
      </g>`;

    // Book (rectangle) - moves at p > 0.30
    const bookOnFloor = p < 0.30;
    const bookX = bookOnFloor ? 130 : 42;
    const bookY = bookOnFloor ? 248 : 72;
    const bookRotation = bookOnFloor ? -15 : 0;
    const book = `
      <g transform="translate(${bookX}, ${bookY}) rotate(${bookRotation})">
        <rect x="0" y="0" width="22" height="30" rx="2" fill="#4facfe"/>
        <rect x="2" y="3" width="18" height="2" fill="#fff" opacity="0.5"/>
        <rect x="2" y="8" width="14" height="2" fill="#fff" opacity="0.3"/>
        <rect x="0" y="0" width="4" height="30" rx="1" fill="#3a8fe0"/>
      </g>`;

    // Teddy bear (simple shapes) - moves at p > 0.50
    const bearOnFloor = p < 0.50;
    const bearX = bearOnFloor ? 300 : 175;
    const bearY = bearOnFloor ? 245 : 182;
    const bearScale = bearOnFloor ? 1 : 0.7;
    const bear = `
      <g transform="translate(${bearX}, ${bearY}) scale(${bearScale})">
        <!-- Body -->
        <circle cx="0" cy="5" r="12" fill="#c4956a"/>
        <!-- Head -->
        <circle cx="0" cy="-10" r="9" fill="#d4a574"/>
        <!-- Ears -->
        <circle cx="-8" cy="-17" r="4" fill="#c4956a"/>
        <circle cx="8" cy="-17" r="4" fill="#c4956a"/>
        <circle cx="-8" cy="-17" r="2.5" fill="#e8c9a8"/>
        <circle cx="8" cy="-17" r="2.5" fill="#e8c9a8"/>
        <!-- Eyes -->
        <circle cx="-3" cy="-11" r="1.5" fill="#333"/>
        <circle cx="3" cy="-11" r="1.5" fill="#333"/>
        <!-- Nose -->
        <ellipse cx="0" cy="-8" rx="2" ry="1.5" fill="#8b6f47"/>
        <!-- Mouth -->
        <path d="M-2,-6.5 Q0,-5 2,-6.5" fill="none" stroke="#8b6f47" stroke-width="0.8"/>
      </g>`;

    // Clothes / t-shirt shape - moves at p > 0.70
    const clothesOnFloor = p < 0.70;
    const clothesX = clothesOnFloor ? 90 : 55;
    const clothesY = clothesOnFloor ? 252 : 115;
    const clothesRotation = clothesOnFloor ? 25 : 0;
    const clothes = `
      <g transform="translate(${clothesX}, ${clothesY}) rotate(${clothesRotation})">
        <!-- T-shirt -->
        <polygon points="0,-10 -15,-5 -15,5 -8,5 -8,15 8,15 8,5 15,5 15,-5" fill="#9b59b6"/>
        <!-- Collar -->
        <path d="M-4,-10 Q0,-7 4,-10" fill="none" stroke="#8e44ad" stroke-width="1.5"/>
        <!-- Star decoration -->
        <polygon points="0,0 1,3 4,3 2,5 3,8 0,6 -3,8 -2,5 -4,3 -1,3" fill="#ffd700" opacity="0.7" transform="scale(0.8)"/>
      </g>`;

    // Second book - moves at p > 0.85
    const book2OnFloor = p < 0.85;
    const book2X = book2OnFloor ? 250 : 68;
    const book2Y = book2OnFloor ? 255 : 72;
    const book2Rotation = book2OnFloor ? 10 : 0;
    const book2 = `
      <g transform="translate(${book2X}, ${book2Y}) rotate(${book2Rotation})">
        <rect x="0" y="0" width="18" height="28" rx="2" fill="#43e97b"/>
        <rect x="2" y="3" width="14" height="2" fill="#fff" opacity="0.4"/>
        <rect x="0" y="0" width="3" height="28" rx="1" fill="#2ecc71"/>
      </g>`;

    // Sparkles when complete
    let sparkles = '';
    if (p >= 0.95) {
      const sparkleOpacity = Math.min(1, (p - 0.95) * 20);
      const positions = [
        [100, 140], [200, 100], [300, 130], [160, 60],
        [250, 80], [80, 190], [320, 200], [180, 180],
      ];
      positions.forEach(([sx, sy], i) => {
        sparkles += `
          <g transform="translate(${sx}, ${sy})" opacity="${sparkleOpacity}">
            <line x1="-4" y1="0" x2="4" y2="0" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/>
            <line x1="0" y1="-4" x2="0" y2="4" stroke="#ffd700" stroke-width="2" stroke-linecap="round"/>
            <animate attributeName="opacity" values="${sparkleOpacity};${sparkleOpacity * 0.3};${sparkleOpacity}" dur="1s" begin="${i * 0.15}s" repeatCount="indefinite"/>
          </g>`;
      });
    }

    return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
      ${room}
      ${window}
      ${shelf}
      ${toyBox}
      ${ball}
      ${book}
      ${book2}
      ${bear}
      ${clothes}
      ${sparkles}
    </svg>`;
  },

  renderStamp(completed: boolean): string {
    if (completed) {
      // Sparkling clean star with broom
      return `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
        <defs>
          <linearGradient id="cleanGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#43e97b"/>
            <stop offset="50%" stop-color="#7bf5a5"/>
            <stop offset="100%" stop-color="#43e97b"/>
          </linearGradient>
          <filter id="cleanGlow">
            <feGaussianBlur stdDeviation="1.5" result="glow"/>
            <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <!-- Star -->
        <polygon points="30,8 35,22 50,22 38,31 42,46 30,38 18,46 22,31 10,22 25,22"
          fill="url(#cleanGold)" stroke="#2ecc71" stroke-width="1" filter="url(#cleanGlow)"/>
        <!-- Broom -->
        <g transform="translate(42, 12) rotate(30)">
          <rect x="-1" y="0" width="2" height="14" fill="#c4956a" rx="0.5"/>
          <rect x="-3" y="14" width="6" height="5" fill="#deb887" rx="1"/>
          <line x1="-2" y1="16" x2="-2" y2="19" stroke="#c4956a" stroke-width="0.5"/>
          <line x1="0" y1="16" x2="0" y2="19" stroke="#c4956a" stroke-width="0.5"/>
          <line x1="2" y1="16" x2="2" y2="19" stroke="#c4956a" stroke-width="0.5"/>
        </g>
        <!-- Sparkles -->
        <g opacity="0.8">
          <line x1="10" y1="10" x2="14" y2="10" stroke="#ffd700" stroke-width="1.5"/>
          <line x1="12" y1="8" x2="12" y2="12" stroke="#ffd700" stroke-width="1.5"/>
          <line x1="48" y1="42" x2="52" y2="42" stroke="#ffd700" stroke-width="1.5"/>
          <line x1="50" y1="40" x2="50" y2="44" stroke="#ffd700" stroke-width="1.5"/>
        </g>
      </svg>`;
    }

    // Good effort badge with heart
    return `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
      <defs>
        <linearGradient id="effortBadge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffd6e0"/>
          <stop offset="100%" stop-color="#ffb3c6"/>
        </linearGradient>
      </defs>
      <!-- Badge circle -->
      <circle cx="30" cy="30" r="22" fill="url(#effortBadge)" stroke="#ff8fab" stroke-width="2" stroke-dasharray="4,2"/>
      <!-- Heart -->
      <path d="M30,38 C24,32 18,27 18,23 C18,19 21,17 24,17 C27,17 29,19 30,21 C31,19 33,17 36,17 C39,17 42,19 42,23 C42,27 36,32 30,38Z"
        fill="#ff6b8a" opacity="0.8"/>
      <!-- Effort marks -->
      <line x1="46" y1="14" x2="50" y2="10" stroke="#ff8fab" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="49" y1="16" x2="53" y2="12" stroke="#ff8fab" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
  },

  renderStampDecoration(): string {
    // Room shelf-style grid with wooden frame
    return `<svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;position:absolute;top:0;left:0;pointer-events:none;">
      <!-- Wooden shelf borders -->
      <rect x="20" y="10" width="360" height="260" fill="none" stroke="#c4956a" stroke-width="3" rx="8" opacity="0.3"/>
      <!-- Horizontal shelves -->
      <line x1="20" y1="100" x2="380" y2="100" stroke="#c4956a" stroke-width="2" opacity="0.25"/>
      <line x1="20" y1="190" x2="380" y2="190" stroke="#c4956a" stroke-width="2" opacity="0.25"/>
      <!-- Vertical dividers -->
      <line x1="140" y1="10" x2="140" y2="270" stroke="#c4956a" stroke-width="1" opacity="0.15"/>
      <line x1="260" y1="10" x2="260" y2="270" stroke="#c4956a" stroke-width="1" opacity="0.15"/>
      <!-- Small decorative brackets at corners -->
      <path d="M28,18 L28,30 M28,18 L40,18" fill="none" stroke="#c4956a" stroke-width="1.5" opacity="0.4" stroke-linecap="round"/>
      <path d="M372,18 L372,30 M372,18 L360,18" fill="none" stroke="#c4956a" stroke-width="1.5" opacity="0.4" stroke-linecap="round"/>
      <path d="M28,262 L28,250 M28,262 L40,262" fill="none" stroke="#c4956a" stroke-width="1.5" opacity="0.4" stroke-linecap="round"/>
      <path d="M372,262 L372,250 M372,262 L360,262" fill="none" stroke="#c4956a" stroke-width="1.5" opacity="0.4" stroke-linecap="round"/>
    </svg>`;
  },
};
