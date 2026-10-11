import React, { useState, useEffect, useRef } from 'react';
import { rollGacha, addToInventory } from '../utils/storage';
import { playGachaSpinSound, playGachaWinSound, playClickSound } from '../utils/sound';

const GACHA_STATES = {
  SPINNING: 'spinning',
  REVEAL: 'reveal',
};

const EMOJIS = ['🏠', '🌳', '🌸', '🚗', '🚃', '🏪', '💧', '🪑', '🛝', '🏰', '⛲', '🏗️'];

export default function GachaModal({ isOpen, onClose, onResult, difficulty = 1, ticketTitle = '' }) {
  const [state, setState] = useState(GACHA_STATES.SPINNING);
  const [displayEmoji, setDisplayEmoji] = useState('❓');
  const [result, setResult] = useState(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasStarted.current = false;
      setState(GACHA_STATES.SPINNING);
      setDisplayEmoji('❓');
      setResult(null);
      return;
    }

    if (hasStarted.current) return;
    hasStarted.current = true;

    let count = 0;
    const maxCount = 22 + Math.floor(Math.random() * 8);

    const interval = setInterval(() => {
      setDisplayEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
      playGachaSpinSound();
      count++;
      if (count >= maxCount) {
        clearInterval(interval);
        const part = rollGacha(difficulty);
        setResult(part);
        setDisplayEmoji(part.emoji);
        setState(GACHA_STATES.REVEAL);
        playGachaWinSound(part.rarity);
      }
    }, 75);

    return () => clearInterval(interval);
  }, [isOpen, difficulty]);

  const handleCollect = () => {
    playClickSound();
    if (result) {
      addToInventory(result);
      if (onResult) onResult(result);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="gacha-overlay">
      <div className="gacha-modal">
        <div className="gacha-machine">
          <div className="gacha-title">🎰 ガチャタイム！</div>

          {ticketTitle && (
            <p className="gacha-ticket-title">
              ⭐ 「{ticketTitle}」の ごほうび！
            </p>
          )}

          <div className={`gacha-display ${state} ${result && result.rarity >= 3 ? 'super-rare' : ''}`}>
            <span className="gacha-emoji">{displayEmoji}</span>
          </div>

          {state === GACHA_STATES.REVEAL && result && (
            <div className="gacha-result-info">
              <div className="rarity-badge">
                {'⭐'.repeat(result.rarity)}
                {result.rarity === 3 ? ' レア！' : ''}
              </div>
              <p className="gacha-result-name">
                「{result.name}」を ゲット！
              </p>
              {result.desc && (
                <p className="gacha-result-desc">{result.desc}</p>
              )}
              <button className="gacha-collect-btn pulse-anim" onClick={handleCollect}>
                🎁 まちのリュックにいれる！
              </button>
            </div>
          )}

          {state === GACHA_STATES.SPINNING && (
            <div className="gacha-spinning-container">
              <p className="gacha-spinning-text">なにが でるかな...？</p>
              <div className="gacha-spin-dots">
                <span>●</span><span>●</span><span>●</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
