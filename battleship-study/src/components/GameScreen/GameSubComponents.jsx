import React from 'react';
import '../components.css';

export const ActionArea = ({ 
  playerHp, maxPlayerHp, 
  monster, 
  timeLeft, maxTime, 
  phase, stageId 
}) => {
  const hpPercent = (playerHp / maxPlayerHp) * 100;
  const enemyHpPercent = monster ? (monster.hp / monster.maxHp) * 100 : 100;
  const timePercent = (timeLeft / maxTime) * 100;
  const timeDanger = timePercent < 30;

  let monsterAnim = 'anim-float';
  if (phase === 'player_attack') monsterAnim = 'anim-hit';
  
  let playerDamageAnim = '';
  if (phase === 'enemy_attack') playerDamageAnim = 'anim-shake';

  // Calculate approach based on time left (timePercent goes 100 -> 0)
  // At 100% (start), it's far away (scale 0.5, translateY -50px)
  // At 0% (time up), it's very close (scale 1.3, translateY 30px)
  const approachScale = 0.5 + ((100 - timePercent) / 100) * 0.8;
  const approachY = -50 + ((100 - timePercent) / 100) * 80;

  return (
    <div className={`action-area ${playerDamageAnim}`}>
      <div className="hp-bars">
        <div className="hp-bar-container">
          <div className="hp-label player-hp">Player HP</div>
          <div className="hp-fill-bg">
            <div className="hp-fill player" style={{ width: `${hpPercent}%` }}></div>
          </div>
        </div>
        
        {monster && (
          <div className="hp-bar-container">
            <div className="hp-label enemy-hp">Enemy HP</div>
            <div className="hp-fill-bg">
              <div className="hp-fill enemy" style={{ width: `${enemyHpPercent}%` }}></div>
            </div>
          </div>
        )}
      </div>

      <div className="monster-container">
        {monster && (
          <div 
            style={{ 
              transform: `translateY(${approachY}px) scale(${approachScale})`,
              transition: 'transform 0.1s linear',
              zIndex: 5
            }}
          >
            <div className={`monster-model ${monsterAnim}`} style={{ backgroundColor: monster.color }}>
              <span style={{fontSize: '3rem'}}>
                {monster.icon || '👾'}
              </span>
              <div className="monster-name">{monster.name}</div>
            </div>
          </div>
        )}
        
        {phase === 'player_attack' && (
          <div className="attack-effect">💥</div>
        )}
        {phase === 'enemy_attack' && (
          <div className="attack-effect" style={{top: '10px', fontSize: '5rem'}}>💢</div>
        )}
      </div>

      <div className="timer-bar">
        <div className={`timer-fill ${timeDanger ? 'danger' : ''}`} style={{ width: `${timePercent}%` }}></div>
      </div>
    </div>
  );
};

export const QuestionArea = ({ question }) => {
  return (
    <div className="question-area">
      <div className="question-text">
        {question ? question.text : '...'}
      </div>
    </div>
  );
};

export const OperationArea = ({ question, onAnswer, disabled }) => {
  if (!question) return <div className="operation-area"></div>;
  
  return (
    <div className="operation-area">
      <div className="options-grid">
        {question.options.map((opt, index) => (
          <button 
            key={index} 
            className="option-btn"
            onClick={() => onAnswer(opt)}
            disabled={disabled}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};

export const ComboEffect = ({ combo }) => {
  if (combo < 2) return null;
  
  return (
    <div className="combo-display">
      {combo} COMBO!
    </div>
  );
};
