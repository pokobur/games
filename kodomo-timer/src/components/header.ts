/**
 * Header component for the ビジュアルタイマー app.
 * Provides navigation back button, app title, and cooldown bubble button.
 */

export function renderHeader(options?: {
  showBack?: boolean;
  showCooldown?: boolean;
  title?: string;
}): string {
  const { showBack = false, showCooldown = true, title = 'ビジュアルタイマー' } = options ?? {};

  const backButton = showBack
    ? `<button class="header__back" data-action="back" aria-label="もどる">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15,18 9,12 15,6"/>
        </svg>
      </button>`
    : `<div class="header__spacer"></div>`;

  const cooldownButton = showCooldown
    ? `<button class="header__cooldown" data-action="cooldown" aria-label="おちつく">
        <span class="header__cooldown-text">おちつく</span>
        <svg viewBox="0 0 32 32" width="24" height="24">
          <!-- Bubble icon -->
          <circle cx="16" cy="14" r="10" fill="none" stroke="#7dd3fc" stroke-width="2" opacity="0.8"/>
          <circle cx="16" cy="14" r="10" fill="#e0f2fe" opacity="0.3"/>
          <ellipse cx="13" cy="11" rx="3" ry="2" fill="#fff" opacity="0.6" transform="rotate(-20, 13, 11)"/>
          <!-- Small bubbles -->
          <circle cx="24" cy="22" r="3.5" fill="none" stroke="#7dd3fc" stroke-width="1.5" opacity="0.6"/>
          <circle cx="24" cy="22" r="3.5" fill="#e0f2fe" opacity="0.2"/>
          <circle cx="28" cy="28" r="2" fill="none" stroke="#7dd3fc" stroke-width="1" opacity="0.4"/>
        </svg>
      </button>`
    : `<div class="header__spacer"></div>`;

  return `
    <header class="header" role="banner">
      ${backButton}
      <h1 class="header__title">${title}</h1>
      ${cooldownButton}
    </header>
    <style>
      .header {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 56px;
        padding: 0 12px;
        padding-top: env(safe-area-inset-top, 0px);
        background: rgba(255, 255, 255, 0.72);
        backdrop-filter: blur(16px) saturate(180%);
        -webkit-backdrop-filter: blur(16px) saturate(180%);
        border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
        font-family: 'M PLUS Rounded 1c', sans-serif;
        box-sizing: border-box;
      }

      .header__back {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border: none;
        background: rgba(0, 0, 0, 0.04);
        border-radius: 12px;
        color: #6b7280;
        cursor: pointer;
        transition: all 0.2s ease;
        -webkit-tap-highlight-color: transparent;
        flex-shrink: 0;
      }

      .header__back:hover {
        background: rgba(0, 0, 0, 0.08);
        color: #374151;
      }

      .header__back:active {
        transform: scale(0.92);
        background: rgba(0, 0, 0, 0.12);
      }

      .header__title {
        flex: 1;
        text-align: center;
        font-size: 1.1rem;
        font-weight: 700;
        color: #374151;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        padding: 0 8px;
      }

      .header__cooldown {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 0 8px 0 12px;
        height: 38px;
        border: none;
        background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
        border-radius: 19px;
        cursor: pointer;
        transition: all 0.3s ease;
        -webkit-tap-highlight-color: transparent;
        flex-shrink: 0;
        position: relative;
        box-shadow: 0 2px 8px rgba(125, 211, 252, 0.3);
      }

      .header__cooldown-text {
        font-size: 0.75rem;
        font-weight: 800;
        color: #0369a1;
        font-family: 'M PLUS Rounded 1c', sans-serif;
      }

      .header__cooldown:hover {
        transform: scale(1.05);
        box-shadow: 0 3px 12px rgba(125, 211, 252, 0.4);
      }

      .header__cooldown:active {
        transform: scale(0.95);
      }

      /* Pulse animation to draw attention */
      .header__cooldown::after {
        content: '';
        position: absolute;
        inset: -3px;
        border-radius: 22px;
        border: 2px solid rgba(125, 211, 252, 0.5);
        animation: cooldownPulse 2.5s ease-in-out infinite;
      }

      @keyframes cooldownPulse {
        0%, 100% {
          transform: scale(1);
          opacity: 0.6;
        }
        50% {
          transform: scale(1.15);
          opacity: 0;
        }
      }

      .header__spacer {
        width: 40px;
        height: 40px;
        flex-shrink: 0;
      }

      /* Account for header fixed height in page content */
      .header + * {
        padding-top: calc(56px + env(safe-area-inset-top, 0px));
      }
    </style>
  `;
}

/**
 * Initialize header click handlers.
 * Call this after the header HTML has been inserted into the DOM.
 */
export function initHeader(appContainer: HTMLElement): void {
  // Back button
  const backBtn = appContainer.querySelector<HTMLButtonElement>('[data-action="back"]');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.hash = '#/home';
      }
    });
  }

  // Cooldown button
  const cooldownBtn = appContainer.querySelector<HTMLButtonElement>('[data-action="cooldown"]');
  if (cooldownBtn) {
    cooldownBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.hash = '#/cooldown';
    });
  }
}
