/**
 * Theme selection card component.
 * Displays a preview of a theme with illustration, name, and description.
 */

import { ThemeConfig } from '../themes/types';

export function renderThemeCard(theme: ThemeConfig, selected: boolean): string {
  const { id, name, emoji, description, colors } = theme;

  // Render a small preview illustration at 50% progress
  const illustration = theme.renderIllustration(0.5);

  const selectedClass = selected ? 'theme-card--selected' : '';

  return `
    <button class="theme-card ${selectedClass}" data-theme="${id}" aria-pressed="${selected}" aria-label="${name}テーマ">
      <div class="theme-card__preview" style="background: linear-gradient(135deg, ${colors.bg} 0%, ${colors.primary}22 100%);">
        <div class="theme-card__illustration">
          ${illustration}
        </div>
      </div>
      <div class="theme-card__info">
        <span class="theme-card__name">
          <span class="theme-card__emoji">${emoji}</span>
          ${name}
        </span>
        <span class="theme-card__desc">${description}</span>
      </div>
      ${selected ? '<div class="theme-card__check">✓</div>' : ''}
    </button>
    <style>
      .theme-card {
        display: flex;
        flex-direction: column;
        width: 280px;
        height: 200px;
        border-radius: 24px;
        overflow: hidden;
        border: 3px solid transparent;
        background: #fff;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: 'M PLUS Rounded 1c', sans-serif;
        position: relative;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
        -webkit-tap-highlight-color: transparent;
        padding: 0;
        text-align: left;
      }

      .theme-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      }

      .theme-card:active {
        transform: translateY(-2px) scale(0.98);
      }

      .theme-card--selected {
        border-color: var(--theme-primary, #6c3ce0);
        transform: scale(1.02);
        box-shadow: 0 8px 28px rgba(108, 60, 224, 0.2);
      }

      .theme-card--selected:hover {
        transform: scale(1.02) translateY(-2px);
      }

      .theme-card__preview {
        flex: 1;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 0;
        padding: 8px;
      }

      .theme-card__illustration {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .theme-card__illustration svg {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }

      .theme-card__info {
        padding: 10px 16px 14px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        background: #fff;
      }

      .theme-card__name {
        font-size: 1.1rem;
        font-weight: 700;
        color: #374151;
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .theme-card__emoji {
        font-size: 1.3rem;
        line-height: 1;
      }

      .theme-card__desc {
        font-size: 0.8rem;
        color: #9ca3af;
        font-weight: 400;
      }

      .theme-card__check {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: var(--theme-primary, #6c3ce0);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: 700;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        animation: checkPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      @keyframes checkPop {
        0% {
          transform: scale(0);
          opacity: 0;
        }
        100% {
          transform: scale(1);
          opacity: 1;
        }
      }

      /* Responsive adjustments */
      @media (max-width: 360px) {
        .theme-card {
          width: 100%;
          max-width: 280px;
          height: 180px;
        }
      }
    </style>
  `;
}
