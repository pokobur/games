import React, { useEffect, useState } from 'react';
import { ActionArea, QuestionArea, OperationArea, ComboEffect } from './GameSubComponents';
import { useGameEngine } from '../../hooks/useGameEngine';
import { useTimer } from '../../hooks/useTimer';
import { useProfile } from '../../hooks/useProfile';

const TIME_LIMIT_MS = 10000;

export const GameScreen = ({ stageId, subStageId, onExit }) => {
  const { addExp, unlockSubStage, unlockBadge, saveDefeatedMonster, logPlaySession, profile } = useProfile();
  
  // Custom effect overlay state
  const [levelUpAlert, setLevelUpAlert] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(profile.level);

  useEffect(() => {
    if (profile.level > currentLevel) {
      setLevelUpAlert(true);
      setCurrentLevel(profile.level);
      setTimeout(() => setLevelUpAlert(false), 3000);
    }
  }, [profile.level, currentLevel]);

  const { 
    playerHp, maxPlayerHp, 
    monster, 
    combo, currentQuestion, phase, 
    initGame, handleAnswer, setPhase
  } = useGameEngine(stageId, subStageId, (newPhase) => {
    if (newPhase === 'game_over' || newPhase === 'stage_clear') {
      stopTimer();
      logPlaySession(stageId, 5); // Example: 5 minutes logged
    }
    
    if (newPhase === 'stage_clear') {
      // Award big EXP based on substage level
      const isLv1 = subStageId.endsWith('_1');
      const isLv2 = subStageId.endsWith('_2');
      const isBoss = subStageId.endsWith('_boss');
      
      if (isLv1) { addExp(50); unlockSubStage(`${stageId}_2`); }
      if (isLv2) { addExp(100); unlockSubStage(`${stageId}_boss`); }
      if (isBoss) {
        addExp(300);
        let stageTitle = stageId === 'space' ? '宇宙' : stageId === 'ninja' ? '忍者' : stageId === 'jungle' ? 'ジャングル' : stageId === 'ocean' ? '海賊' : stageId === 'desert' ? '砂漠' : '魔界';
        unlockBadge(`${stageTitle}マスター`);
        
        // Final Boss logic: check if space, ninja, jungle, ocean, desert bosses are all unlocked meaning you reached/cleared them.
        // Actually better to check if all *bosses* were defeated, but we can just check if you unlocked all 5 badges!
        const requiredBadges = ['宇宙マスター', '忍者マスター', 'ジャングルマスター', '海賊マスター', '砂漠マスター'];
        // Note: the newly awarded badge won't be in `profile.badges` array simultaneously in this execution tick.
        // So we assume it gets added, and we check the rest.
        const currentBadges = [...profile.badges, `${stageTitle}マスター`];
        const allCleared = requiredBadges.every(b => currentBadges.includes(b));
        
        if (allCleared) {
          unlockSubStage('final_1');
        }
        
        if (stageId === 'final_boss') {
          unlockSubStage('final_2');
        } else if (subStageId === 'final_2') {
          unlockSubStage('final_boss');
        } else if (subStageId === 'final_boss') {
          unlockBadge('全知全能の勇者');
          addExp(10000);
        }
      }
    }
  });

  const { timeLeft, isActive, startTimer, stopTimer, resetTimer } = useTimer(TIME_LIMIT_MS, () => {
    // Time out!
    setPhase('enemy_attack');
    handleAnswer(-1); // wrong answer triggers damage logic
  });

  const onAnswerSelected = (idx) => {
    if (phase !== 'playing') return;
    stopTimer();
    addExp(2); // Small EXP on answer
    handleAnswer(idx);
  };

  useEffect(() => {
    if (phase === 'loading') {
      initGame();
    } else if (phase === 'playing' && !isActive) {
      resetTimer(TIME_LIMIT_MS);
      startTimer();
    } else if (phase !== 'playing') {
      stopTimer();
    }
  }, [phase, initGame, isActive, resetTimer, startTimer, stopTimer]);

  useEffect(() => {
    if (phase === 'player_attack' && monster && monster.hp <= 0) {
      saveDefeatedMonster(monster.id);
      addExp(10); // Exp for defeating monster
    }
  }, [phase, monster, saveDefeatedMonster, addExp]);

  return (
    <div className={`game-screen theme-${stageId}`}>
      {levelUpAlert && (
        <div style={{ position: 'absolute', top: '30%', left: '0', right: '0', textAlign: 'center', zIndex: 100, animation: 'comboPop 0.5s ease-out', pointerEvents: 'none' }}>
          <h1 style={{ fontSize: '4rem', color: '#fbbf24', textShadow: '0 0 20px #f59e0b, 0 5px 0 #b45309', margin: 0 }}>LEVEL UP!</h1>
        </div>
      )}
      
      <ComboEffect combo={combo} />
      
      <ActionArea 
        playerHp={playerHp} maxPlayerHp={maxPlayerHp}
        monster={monster}
        timeLeft={timeLeft} maxTime={TIME_LIMIT_MS}
        phase={phase} stageId={stageId}
      />
      
      <QuestionArea question={currentQuestion} />
      
      <OperationArea 
        question={currentQuestion} 
        onAnswer={onAnswerSelected} 
        disabled={phase !== 'playing'}
      />

      {phase === 'stage_clear' && (
        <div className="overlay">
          <h2>STAGE CLEAR!</h2>
          <button className="primary-btn" onClick={onExit}>もどる</button>
        </div>
      )}

      {phase === 'game_over' && (
        <div className="overlay">
          <h2 style={{color: '#ef4444'}}>GAME OVER...</h2>
          <button className="primary-btn" onClick={onExit}>もどる</button>
        </div>
      )}
    </div>
  );
};
