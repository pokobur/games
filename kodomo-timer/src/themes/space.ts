import { ThemeConfig } from './types';

/**
 * うちゅうひこう (Space Flight) theme
 * A rocket journeys through space toward Earth as the timer progresses.
 */
export const spaceTheme: ThemeConfig = {
  id: 'space',
  name: 'うちゅうひこう',
  emoji: '🚀',
  description: 'ロケットにのって ちきゅうをめざそう！',
  colors: {
    primary: '#0f0a2e',
    secondary: '#6c3ce0',
    bg: '#0f0a2e',
    accent: '#ff6b35',
  },
  speechTriggerKey: 'space',

  renderIllustration(progress: number): string {
    const p = Math.max(0, Math.min(1, progress));

    // Rocket position: moves from left (x=60) to right (x=310)
    const rocketX = 60 + p * 250;
    const rocketY = 150 - Math.sin(p * Math.PI) * 30; // slight arc

    // Earth grows as rocket approaches
    const earthRadius = 15 + p * 40;
    const earthOpacity = 0.3 + p * 0.7;

    // Stars: create deterministic star field
    let stars = '';
    const starSeeds = [
      [20, 30], [80, 60], [150, 20], [210, 70], [260, 25],
      [320, 50], [370, 30], [45, 90], [130, 80], [290, 85],
      [55, 130], [170, 110], [240, 130], [350, 120], [100, 140],
      [30, 180], [190, 175], [310, 170], [380, 180], [70, 210],
      [160, 220], [250, 200], [340, 215], [120, 250], [280, 250],
      [50, 270], [200, 280], [360, 260], [90, 160], [330, 100],
    ];
    starSeeds.forEach(([sx, sy], i) => {
      const size = (i % 3 === 0) ? 2.5 : 1.5;
      const delay = (i * 0.3) % 3;
      stars += `<circle cx="${sx}" cy="${sy}" r="${size}" fill="#fff" opacity="0.8">
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2s" begin="${delay}s" repeatCount="indefinite"/>
      </circle>`;
    });

    // Passing asteroids/planets (visible when rocket hasn't passed them)
    const asteroid1Opacity = p < 0.4 ? 1 : Math.max(0, 1 - (p - 0.4) * 5);
    const asteroid2Opacity = p < 0.6 ? 1 : Math.max(0, 1 - (p - 0.6) * 5);

    // Small planet (Saturn-like)
    const planet = `
      <g opacity="${asteroid1Opacity}" transform="translate(180, 80)">
        <circle cx="0" cy="0" r="14" fill="#e8a87c"/>
        <ellipse cx="0" cy="0" rx="24" ry="6" fill="none" stroke="#dda15e" stroke-width="2" transform="rotate(-15)"/>
        <circle cx="-4" cy="-4" r="3" fill="#d4845f" opacity="0.5"/>
      </g>`;

    // Asteroid
    const asteroid = `
      <g opacity="${asteroid2Opacity}" transform="translate(250, 200)">
        <ellipse cx="0" cy="0" rx="10" ry="8" fill="#8d8d8d" transform="rotate(20)"/>
        <circle cx="-3" cy="-2" r="2" fill="#6b6b6b"/>
        <circle cx="3" cy="1" r="1.5" fill="#6b6b6b"/>
      </g>`;

    // Exhaust flames
    const flameLength = 15 + Math.sin(Date.now() * 0.01) * 5;
    const exhaust = `
      <g transform="translate(${rocketX - 22}, ${rocketY})">
        <polygon points="0,0 -${flameLength},-4 -${flameLength + 5},0 -${flameLength},4" fill="#ff6b35" opacity="0.9">
          <animate attributeName="opacity" values="0.6;1;0.6" dur="0.3s" repeatCount="indefinite"/>
        </polygon>
        <polygon points="0,0 -${flameLength * 0.6},-2 -${flameLength * 0.7},0 -${flameLength * 0.6},2" fill="#ffd700" opacity="0.8">
          <animate attributeName="opacity" values="0.5;1;0.5" dur="0.2s" repeatCount="indefinite"/>
        </polygon>
      </g>`;

    // Rocket ship (simple geometric)
    const rocket = `
      <g transform="translate(${rocketX}, ${rocketY})">
        <!-- Body -->
        <rect x="-15" y="-8" width="30" height="16" rx="8" fill="#e0e0e0"/>
        <!-- Nose cone -->
        <polygon points="15,-8 15,8 28,0" fill="#ff6b35"/>
        <!-- Window -->
        <circle cx="5" cy="0" r="5" fill="#38bdf8"/>
        <circle cx="5" cy="0" r="3.5" fill="#7dd3fc"/>
        <!-- Fins -->
        <polygon points="-15,-8 -20,-16 -10,-8" fill="#6c3ce0"/>
        <polygon points="-15,8 -20,16 -10,8" fill="#6c3ce0"/>
        <!-- Stripe -->
        <rect x="-8" y="-8" width="3" height="16" fill="#ff6b35" opacity="0.6"/>
      </g>`;

    // Earth
    const earth = `
      <g transform="translate(350, 150)">
        <circle cx="0" cy="0" r="${earthRadius}" fill="#38bdf8" opacity="${earthOpacity}"/>
        <circle cx="0" cy="0" r="${earthRadius}" fill="none" stroke="#7dd3fc" stroke-width="1.5" opacity="${earthOpacity}"/>
        <!-- Continents -->
        <ellipse cx="-${earthRadius * 0.2}" cy="-${earthRadius * 0.1}" rx="${earthRadius * 0.3}" ry="${earthRadius * 0.25}" fill="#4ade80" opacity="${earthOpacity * 0.8}"/>
        <ellipse cx="${earthRadius * 0.15}" cy="${earthRadius * 0.2}" rx="${earthRadius * 0.2}" ry="${earthRadius * 0.15}" fill="#4ade80" opacity="${earthOpacity * 0.7}"/>
        <!-- Atmosphere glow -->
        <circle cx="0" cy="0" r="${earthRadius + 3}" fill="none" stroke="#7dd3fc" stroke-width="2" opacity="${earthOpacity * 0.3}"/>
      </g>`;

    // Celebration sparkles at completion
    let celebration = '';
    if (p >= 0.95) {
      const sparkleOpacity = Math.min(1, (p - 0.95) * 20);
      const sparkles = [
        [320, 100], [360, 120], [340, 180], [310, 160],
        [370, 90], [330, 200], [300, 130], [380, 160],
      ];
      sparkles.forEach(([sx, sy], i) => {
        const size = 3 + (i % 3);
        celebration += `
          <g transform="translate(${sx}, ${sy})" opacity="${sparkleOpacity}">
            <line x1="-${size}" y1="0" x2="${size}" y2="0" stroke="#ffd700" stroke-width="2"/>
            <line x1="0" y1="-${size}" x2="0" y2="${size}" stroke="#ffd700" stroke-width="2"/>
            <line x1="-${size * 0.7}" y1="-${size * 0.7}" x2="${size * 0.7}" y2="${size * 0.7}" stroke="#ffd700" stroke-width="1.5"/>
            <line x1="${size * 0.7}" y1="-${size * 0.7}" x2="-${size * 0.7}" y2="${size * 0.7}" stroke="#ffd700" stroke-width="1.5"/>
            <animate attributeName="opacity" values="${sparkleOpacity};${sparkleOpacity * 0.3};${sparkleOpacity}" dur="0.8s" begin="${i * 0.1}s" repeatCount="indefinite"/>
          </g>`;
      });
    }

    return `<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
      <!-- Deep space background -->
      <defs>
        <radialGradient id="spaceBg" cx="80%" cy="50%" r="60%">
          <stop offset="0%" stop-color="#1a1040"/>
          <stop offset="100%" stop-color="#0f0a2e"/>
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill="url(#spaceBg)"/>
      <!-- Nebula glow -->
      <ellipse cx="200" cy="150" rx="180" ry="100" fill="#6c3ce0" opacity="0.06"/>
      <!-- Stars -->
      ${stars}
      <!-- Celestial bodies -->
      ${planet}
      ${asteroid}
      <!-- Earth destination -->
      ${earth}
      <!-- Exhaust -->
      ${exhaust}
      <!-- Rocket -->
      ${rocket}
      <!-- Celebration -->
      ${celebration}
    </svg>`;
  },

  renderStamp(completed: boolean): string {
    if (completed) {
      // Golden star with sparkle
      return `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
        <defs>
          <linearGradient id="goldStar" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#ffd700"/>
            <stop offset="50%" stop-color="#ffec80"/>
            <stop offset="100%" stop-color="#ffd700"/>
          </linearGradient>
          <filter id="starGlow">
            <feGaussianBlur stdDeviation="2" result="glow"/>
            <feMerge><feMergeNode in="glow"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <!-- Star shape -->
        <polygon points="30,6 36,22 54,22 40,32 45,50 30,40 15,50 20,32 6,22 24,22"
          fill="url(#goldStar)" stroke="#e6a800" stroke-width="1" filter="url(#starGlow)"/>
        <!-- Sparkle top-right -->
        <line x1="46" y1="8" x2="50" y2="8" stroke="#fff" stroke-width="1.5" opacity="0.9"/>
        <line x1="48" y1="6" x2="48" y2="10" stroke="#fff" stroke-width="1.5" opacity="0.9"/>
        <!-- Sparkle bottom-left -->
        <line x1="10" y1="44" x2="14" y2="44" stroke="#ffd700" stroke-width="1" opacity="0.7"/>
        <line x1="12" y1="42" x2="12" y2="46" stroke="#ffd700" stroke-width="1" opacity="0.7"/>
      </svg>`;
    }

    // Silver star with effort marks (がんばった!)
    return `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
      <defs>
        <linearGradient id="silverStar" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#c0c0c0"/>
          <stop offset="50%" stop-color="#e8e8e8"/>
          <stop offset="100%" stop-color="#c0c0c0"/>
        </linearGradient>
      </defs>
      <!-- Star outline -->
      <polygon points="30,10 35,23 50,23 38,32 42,46 30,38 18,46 22,32 10,23 25,23"
        fill="url(#silverStar)" stroke="#a0a0a0" stroke-width="1.5" stroke-dasharray="3,2"/>
      <!-- Effort marks -->
      <line x1="46" y1="10" x2="50" y2="6" stroke="#a0a0a0" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="49" y1="12" x2="53" y2="8" stroke="#a0a0a0" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`;
  },

  renderStampDecoration(): string {
    // Constellation-style grid with dotted lines connecting stamp positions
    let lines = '';
    // Create a 3x3 grid of constellation points
    const positions = [
      [60, 50], [200, 40], [340, 55],
      [80, 140], [200, 150], [320, 135],
      [60, 230], [200, 240], [340, 225],
    ];

    // Connect with dotted constellation lines
    const connections = [
      [0, 1], [1, 2], [0, 3], [1, 4], [2, 5],
      [3, 4], [4, 5], [3, 6], [4, 7], [5, 8],
      [6, 7], [7, 8],
    ];

    connections.forEach(([a, b]) => {
      const [x1, y1] = positions[a];
      const [x2, y2] = positions[b];
      lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
        stroke="#6c3ce0" stroke-width="1" stroke-dasharray="4,6" opacity="0.4"/>`;
    });

    // Small stars at each position
    let starDots = '';
    positions.forEach(([x, y], i) => {
      starDots += `<circle cx="${x}" cy="${y}" r="3" fill="#ffd700" opacity="0.5">
        <animate attributeName="opacity" values="0.3;0.7;0.3" dur="3s" begin="${i * 0.3}s" repeatCount="indefinite"/>
      </circle>`;
    });

    return `<svg viewBox="0 0 400 280" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;position:absolute;top:0;left:0;pointer-events:none;">
      ${lines}
      ${starDots}
    </svg>`;
  },
};
