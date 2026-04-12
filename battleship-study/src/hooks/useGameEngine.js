import { useState, useCallback, useEffect } from 'react';
import { getRandomQuestion } from '../data/questions';
import { MONSTERS_DATA } from '../data/monsters';

// Fisher-Yates array shuffle
function shuffleFisherYates(array) {
  let i = array.length;
  while (i--) {
    const ri = Math.floor(Math.random() * (i + 1));
    [array[i], array[ri]] = [array[ri], array[i]];
  }
  return array;
}

export const useGameEngine = (stageId, subStageId, onPhaseChange) => {
  const [playerHp, setPlayerHp] = useState(100);
  const maxPlayerHp = 100;
  
  const [currentMonsterIndex, setCurrentMonsterIndex] = useState(0);
  const [monster, setMonster] = useState(null);
  
  const [combo, setCombo] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [phase, setPhase] = useState('loading'); // loading, playing, player_attack, enemy_attack, stage_clear, game_over

  const initGame = useCallback(() => {
    setPlayerHp(100);
    setCombo(0);
    setCurrentMonsterIndex(0);
    
    // Load first monster from Substage
    const stageDef = MONSTERS_DATA[stageId];
    if (!stageDef) return;
    const substageDef = stageDef.substages.find(s => s.id === subStageId);
    if (substageDef && substageDef.enemies.length > 0) {
      const firstMonster = substageDef.enemies[0];
      setMonster({ ...firstMonster, maxHp: firstMonster.hp });
      loadNextQuestion(firstMonster.id);
      setPhase('playing');
    }
  }, [stageId, subStageId]);

  const loadNextQuestion = useCallback((mId = null) => {
    const targetMonsterId = mId || (monster ? monster.id : null);
    if (!targetMonsterId) return;

    const q = getRandomQuestion(targetMonsterId);
    if (q) {
      // Shuffle the options before setting it
      const shuffledOptions = shuffleFisherYates([...q.options]);
      setCurrentQuestion({ ...q, options: shuffledOptions });
    }
  }, [monster]);

  const handleAnswer = useCallback((selectedString) => {
    if (phase !== 'playing' || !currentQuestion) return;

    // Time out sends selectedString == null
    if (selectedString === currentQuestion.correctAnswer) {
      // Correct! Player attacks
      setCombo(c => c + 1);
      setPhase('player_attack');
      
      const damage = 10 + (combo * 2); // Damage formula
      setTimeout(() => {
        setMonster(prev => {
          if(!prev) return prev;
          const newHp = Math.max(0, prev.hp - damage);
          return { ...prev, hp: newHp };
        });
      }, 500); // Wait for animation
    } else {
      // Incorrect! Enemy attacks
      setCombo(0);
      setPhase('enemy_attack');
      setTimeout(() => {
        setPlayerHp(prev => Math.max(0, prev - 15));
      }, 500);
    }
  }, [phase, currentQuestion, combo]);

  // Effect to handle state changes resulting from HP updates
  useEffect(() => {
    if (phase === 'player_attack' && monster && monster.hp <= 0) {
      // Monster defeated
      setTimeout(() => {
        const stageDef = MONSTERS_DATA[stageId];
        if (!stageDef) return;
        const substageDef = stageDef.substages.find(s => s.id === subStageId);
        
        const nextIndex = currentMonsterIndex + 1;
        
        if (substageDef && nextIndex < substageDef.enemies.length) {
          // Next monster in the substage
          const nextMonster = substageDef.enemies[nextIndex];
          setCurrentMonsterIndex(nextIndex);
          setMonster({ ...nextMonster, maxHp: nextMonster.hp });
          loadNextQuestion(nextMonster.id);
          setPhase('playing');
        } else {
          // Substage cleared
          setPhase('stage_clear');
          if (onPhaseChange) onPhaseChange('stage_clear');
        }
      }, 1000);
    } else if (phase === 'player_attack' && monster && monster.hp > 0) {
      // Monster survived
      setTimeout(() => {
        loadNextQuestion();
        setPhase('playing');
      }, 800);
    }
  }, [monster, stageId, subStageId]);

  useEffect(() => {
    if (phase === 'enemy_attack') {
      if (playerHp <= 0) {
        setTimeout(() => {
          setPhase('game_over');
          if (onPhaseChange) onPhaseChange('game_over');
        }, 800);
      } else {
        setTimeout(() => {
          loadNextQuestion();
          setPhase('playing');
        }, 800);
      }
    }
  }, [playerHp]);

  return {
    playerHp, maxPlayerHp,
    monster,
    combo,
    currentQuestion,
    phase,
    initGame,
    handleAnswer,
    setPhase // manually trigger time out etc
  };
};
