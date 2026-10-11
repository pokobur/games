import React, { useEffect } from 'react';
import { playSuccessSound } from '../utils/sound';

const COLORS = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff9ff3', '#feca57', '#48dbfb', '#a29bfe'];
const SHAPES = ['★', '🌸', '✨', '●', '▲', '❤', '🍀', '🌟'];

// 決定論的なパーティクル定義
const PRESET_PARTICLES = Array.from({ length: 55 }, (_, i) => {
  const x = (i * 19.3) % 100;
  const char = SHAPES[i % SHAPES.length];
  const color = COLORS[(i * 3) % COLORS.length];
  const size = 14 + ((i * 7) % 22);
  const delay = ((i * 13) % 40) / 100;
  const duration = 1.8 + (((i * 17) % 16) / 10);
  const drift = ((i % 2 === 0 ? 1 : -1) * ((i * 11) % 40)) * 2;
  return { id: i, x, char, color, size, delay, duration, drift };
});

/**
 * タスク完了時の紙吹雪＋お祝いメッセージ
 */
export default function TaskCompleteEffect({ isActive, taskName, onFinish }) {
  useEffect(() => {
    if (!isActive) return;
    playSuccessSound();

    const timer = setTimeout(() => {
      if (onFinish) onFinish();
    }, 2800);

    return () => clearTimeout(timer);
  }, [isActive, onFinish]);

  if (!isActive) return null;

  return (
    <div className="task-complete-overlay">
      {/* 紙吹雪・キラキラ */}
      {PRESET_PARTICLES.map(p => (
        <span
          key={p.id}
          className="confetti-particle"
          style={{
            left: `${p.x}%`,
            color: p.color,
            fontSize: `${p.size}px`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}px`,
          }}
        >
          {p.char}
        </span>
      ))}

      {/* お祝いメッセージ */}
      <div className="complete-message">
        <div className="complete-emoji">🎉</div>
        <h2 className="complete-title">すごい！ できたね！</h2>
        <p className="complete-task-name">「{taskName}」</p>
        <p className="complete-sub-text">おうちのひとに「できたよ！」をおくったよ✨</p>
      </div>
    </div>
  );
}
