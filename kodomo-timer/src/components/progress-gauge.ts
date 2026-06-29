/**
 * Donut/ring progress gauge component.
 * SVG-based circular progress indicator with color phases and time display.
 */

export function renderProgressGauge(
  progress: number,
  timeText: string,
  colorPhase: 'green' | 'yellow' | 'red'
): string {
  const p = Math.max(0, Math.min(1, progress));

  // Ring geometry
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - p);

  // Color phases
  const colorMap = {
    green: {
      stroke: 'hsl(145, 65%, 45%)',
      glow: 'hsla(145, 65%, 45%, 0.35)',
      glowOuter: 'hsla(145, 65%, 45%, 0.15)',
    },
    yellow: {
      stroke: 'hsl(45, 95%, 55%)',
      glow: 'hsla(45, 95%, 55%, 0.35)',
      glowOuter: 'hsla(45, 95%, 55%, 0.15)',
    },
    red: {
      stroke: 'hsl(0, 75%, 60%)',
      glow: 'hsla(0, 75%, 60%, 0.35)',
      glowOuter: 'hsla(0, 75%, 60%, 0.15)',
    },
  };

  const colors = colorMap[colorPhase];
  const filterId = `gaugeGlow-${colorPhase}`;

  // Time text sizing: shorter text gets bigger font
  const fontSize = timeText.length <= 5 ? 36 : timeText.length <= 8 ? 28 : 22;

  return `
    <div class="progress-gauge" role="timer" aria-label="のこり ${timeText}">
      <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="progress-gauge__svg">
        <defs>
          <filter id="${filterId}" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <!-- Background ring -->
        <circle
          cx="${cx}" cy="${cy}" r="${radius}"
          fill="none"
          stroke="#e5e7eb"
          stroke-width="${strokeWidth}"
          opacity="0.5"
        />

        <!-- Subtle outer glow ring -->
        <circle
          cx="${cx}" cy="${cy}" r="${radius}"
          fill="none"
          stroke="${colors.glowOuter}"
          stroke-width="${strokeWidth + 8}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${dashoffset}"
          stroke-linecap="round"
          transform="rotate(-90, ${cx}, ${cy})"
          class="progress-gauge__glow"
        />

        <!-- Progress ring -->
        <circle
          cx="${cx}" cy="${cy}" r="${radius}"
          fill="none"
          stroke="${colors.stroke}"
          stroke-width="${strokeWidth}"
          stroke-dasharray="${circumference}"
          stroke-dashoffset="${dashoffset}"
          stroke-linecap="round"
          transform="rotate(-90, ${cx}, ${cy})"
          filter="url(#${filterId})"
          class="progress-gauge__ring"
        />

        <!-- Time text -->
        <text
          x="${cx}" y="${cy}"
          text-anchor="middle"
          dominant-baseline="central"
          font-family="'M PLUS Rounded 1c', sans-serif"
          font-weight="900"
          font-size="${fontSize}"
          fill="#374151"
          class="progress-gauge__time"
        >${timeText}</text>
      </svg>
    </div>
    <style>
      .progress-gauge {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        max-width: 220px;
        margin: 0 auto;
      }

      .progress-gauge__svg {
        width: 100%;
        height: auto;
        display: block;
        filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.08));
      }

      .progress-gauge__ring {
        transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1),
                    stroke 0.6s ease;
      }

      .progress-gauge__glow {
        transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1),
                    stroke 0.6s ease;
      }

      .progress-gauge__time {
        transition: fill 0.3s ease;
        user-select: none;
      }

      /* Urgent pulsing when red */
      @keyframes gaugeUrgentPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
    </style>
  `;
}
