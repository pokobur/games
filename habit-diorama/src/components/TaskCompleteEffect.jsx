import React, { useEffect, useState } from 'react';

/**
 * タスク完了時の紙吹雪＋お祝いメッセージ
 * isActive=true で表示し、一定時間後に自動非表示
 */
export default function TaskCompleteEffect({ isActive, taskName, onFinish }) {
  const [particles, setParticles] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    setVisible(true);

    // 紙吹雪パーティクルを生成
    const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff9ff3', '#feca57', '#48dbfb'];
    const shapes = ['●', '■', '▲', '★', '♦', '❤', '✿'];
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      char: shapes[Math.floor(Math.random() * shapes.length)],
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 12 + Math.random() * 20,
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 1.5,
      drift: (Math.random() - 0.5) * 60,
    }));
    setParticles(newParticles);

    const timer = setTimeout(() => {
      setVisible(false);
      setParticles([]);
      if (onFinish) onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [isActive]);

  if (!visible) return null;

  return (
    <div className="task-complete-overlay">
      {/* 紙吹雪 */}
      {particles.map(p => (
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
        <h2 className="complete-title">やったね！</h2>
        <p className="complete-task-name">「{taskName}」クリア！</p>
      </div>
    </div>
  );
}
