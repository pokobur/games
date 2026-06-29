/**
 * Confetti particle effect using canvas.
 * Creates colorful falling paper rectangles with gravity, wind sway, and rotation.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  swayOffset: number;
  swaySpeed: number;
  opacity: number;
}

let activeCanvas: HTMLCanvasElement | null = null;
let animationId: number | null = null;
let fadeOutTimer: ReturnType<typeof setTimeout> | null = null;

const COLORS = [
  '#ff6b6b', // red
  '#ffa500', // orange
  '#ffd700', // yellow
  '#4ade80', // green
  '#38bdf8', // blue
  '#6c3ce0', // purple
  '#ff69b4', // pink
  '#ffb347', // gold
  '#7dd3fc', // light blue
  '#a78bfa', // lavender
];

function createParticle(canvasWidth: number): Particle {
  return {
    x: Math.random() * canvasWidth,
    y: -20 - Math.random() * 100,
    vx: (Math.random() - 0.5) * 2,
    vy: Math.random() * 2 + 1.5,
    width: 5 + Math.random() * 10,
    height: 5 + Math.random() * 10,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.15,
    swayOffset: Math.random() * Math.PI * 2,
    swaySpeed: 0.02 + Math.random() * 0.03,
    opacity: 1,
  };
}

/**
 * Start the confetti animation.
 * @param container - DOM element to overlay the confetti on
 * @param duration - Duration in milliseconds (default: 5000)
 */
export function startConfetti(container: HTMLElement, duration = 5000): void {
  // Clean up any existing confetti
  stopConfetti();

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    z-index: 9999;
  `;
  canvas.width = window.innerWidth * (window.devicePixelRatio || 1);
  canvas.height = window.innerHeight * (window.devicePixelRatio || 1);
  container.appendChild(canvas);
  activeCanvas = canvas;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  const drawWidth = window.innerWidth;
  const drawHeight = window.innerHeight;

  // Create particles
  const particleCount = 100;
  const particles: Particle[] = [];
  for (let i = 0; i < particleCount; i++) {
    const p = createParticle(drawWidth);
    // Stagger initial Y positions so they don't all appear at once
    p.y = -20 - Math.random() * 300;
    particles.push(p);
  }

  let globalOpacity = 1;
  let startTime = performance.now();
  let isFadingOut = false;

  function animate(now: number) {
    if (!ctx || !activeCanvas) return;

    const elapsed = now - startTime;
    ctx.clearRect(0, 0, drawWidth, drawHeight);

    // Fade out phase
    if (isFadingOut) {
      globalOpacity = Math.max(0, globalOpacity - 0.02);
      if (globalOpacity <= 0) {
        stopConfetti();
        return;
      }
    }

    ctx.globalAlpha = globalOpacity;

    for (const p of particles) {
      // Update physics
      p.vy += 0.04; // gravity
      p.x += p.vx + Math.sin(elapsed * p.swaySpeed + p.swayOffset) * 0.8; // wind sway
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      // Recycle particles that fall off screen (only during active phase)
      if (p.y > drawHeight + 20 && !isFadingOut) {
        p.y = -20;
        p.x = Math.random() * drawWidth;
        p.vy = Math.random() * 2 + 1.5;
      }

      // Draw
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
      ctx.restore();
    }

    animationId = requestAnimationFrame(animate);
  }

  animationId = requestAnimationFrame(animate);

  // Start fade out before duration ends
  fadeOutTimer = setTimeout(() => {
    isFadingOut = true;
  }, duration - 1000);
}

/**
 * Stop and clean up confetti animation.
 */
export function stopConfetti(): void {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  if (fadeOutTimer !== null) {
    clearTimeout(fadeOutTimer);
    fadeOutTimer = null;
  }

  if (activeCanvas) {
    activeCanvas.remove();
    activeCanvas = null;
  }
}
