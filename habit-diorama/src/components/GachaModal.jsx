import React, { useState, useEffect, useRef } from 'react';
import { rollGacha, addToInventory } from '../utils/storage';

const GACHA_STATES = {
  SPINNING: 'spinning',
  REVEAL: 'reveal',
};

const EMOJIS = ['🏠', '🌳', '🌸', '🚗', '🚃', '🏪', '💧', '🪑', '🛝', '🏰', '⛲', '🏗️'];

export default function GachaModal({ isOpen, onClose, onResult, difficulty }) {
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
    const maxCount = 20 + Math.floor(Math.random() * 10);

    const interval = setInterval(() => {
      setDisplayEmoji(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);
      count++;
      if (count >= maxCount) {
        clearInterval(interval);
        const part = rollGacha(difficulty);
        setResult(part);
        setDisplayEmoji(part.emoji);
        setState(GACHA_STATES.REVEAL);
      }
    }, 80);

    return () => clearInterval(interval);
  }, [isOpen, difficulty]);

  const handleCollect = () => {
    if (result) {
      addToInventory(result);
      onResult(result);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="gacha-overlay">
      <div className="gacha-modal">
        <div className="gacha-machine">
          <div className="gacha-title">🎰 ガチャタイム！</div>

          <div className={`gacha-display ${state}`}>
            <span className="gacha-emoji">{displayEmoji}</span>
          </div>

          {state === GACHA_STATES.REVEAL && result && (
            <div className="gacha-result-info">
              <p className="gacha-result-name">
                <span className="rarity-stars">{'⭐'.repeat(result.rarity)}</span>
                <br />
                「{result.name}」をゲット！
              </p>
              <button className="gacha-collect-btn" onClick={handleCollect}>
                🎁 うけとる！
              </button>
            </div>
          )}

          {state === GACHA_STATES.SPINNING && (
            <p className="gacha-spinning-text">ドキドキ...</p>
          )}
        </div>
      </div>
    </div>
  );
}
