import { useState, useEffect } from 'react';

const DEFAULT_PROFILE = {
  exp: 0,
  level: 1,
  unlockedSubStages: ['space_1', 'ninja_1', 'jungle_1', 'ocean_1', 'desert_1'], // Initial stages across subjects are unlocked
  badges: [],
  parentPin: null,
  defeatedMonsters: [],
  reports: []
};

// L * (L - 1) * 50 = Total EXP required for Level L
const getLevelFromExp = (exp) => {
  const L = Math.floor((1 + Math.sqrt(1 + 4 * (exp / 50))) / 2);
  return Math.min(999, Math.max(1, L));
};

const getExpForLevel = (L) => {
  return L * (L - 1) * 50;
};

export const useProfile = () => {
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('battleship_study_profile');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        // Backward compatibility for stage -> substage switch
        if (!parsed.unlockedSubStages) {
          parsed.unlockedSubStages = DEFAULT_PROFILE.unlockedSubStages;
          // If they unlocked jungle/ocean previously, give them the first substage
          if (parsed.unlockedStages?.includes('jungle')) parsed.unlockedSubStages.push('jungle_1');
          if (parsed.unlockedStages?.includes('ocean')) parsed.unlockedSubStages.push('ocean_1');
          if (parsed.unlockedStages?.includes('desert')) parsed.unlockedSubStages.push('desert_1');
        }
        return { ...DEFAULT_PROFILE, ...parsed }; 
      } 
      catch (e) { return DEFAULT_PROFILE; }
    }
    return DEFAULT_PROFILE;
  });

  useEffect(() => {
    localStorage.setItem('battleship_study_profile', JSON.stringify(profile));
  }, [profile]);

  const addExp = (amount) => {
    setProfile(prev => {
      if (prev.level >= 999) return prev;
      const newExp = prev.exp + amount;
      const newLevel = getLevelFromExp(newExp);
      return { ...prev, exp: newExp, level: newLevel };
    });
  };

  const unlockSubStage = (subStageId) => {
    setProfile(prev => {
      if (prev.unlockedSubStages.includes(subStageId)) return prev;
      return { ...prev, unlockedSubStages: [...prev.unlockedSubStages, subStageId] };
    });
  };

  const unlockBadge = (badgeId) => {
    setProfile(prev => {
      if (prev.badges.includes(badgeId)) return prev;
      return { ...prev, badges: [...prev.badges, badgeId] };
    });
  };

  const saveDefeatedMonster = (monsterId) => {
    setProfile(prev => {
      if (prev.defeatedMonsters.includes(monsterId)) return prev;
      return { ...prev, defeatedMonsters: [...prev.defeatedMonsters, monsterId] };
    });
  };

  const setPin = (pinStr) => {
    setProfile(prev => ({ ...prev, parentPin: pinStr }));
  };

  const logPlaySession = (stage, durationMinutes) => {
    setProfile(prev => ({
      ...prev,
      reports: [...prev.reports, { date: new Date().toISOString(), stage, durationMinutes }]
    }));
  };

  // Logic to calculate progress to next level
  const currentLvlExp = getExpForLevel(profile.level);
  const nextLvlExp = getExpForLevel(profile.level + 1);
  const diffTotal = nextLvlExp - currentLvlExp;
  const currentProgress = profile.exp - currentLvlExp;
  
  let progressPercent = 100;
  if (profile.level < 999) {
    progressPercent = Math.min(100, Math.floor((currentProgress / diffTotal) * 100));
  }

  return {
    profile,
    addExp,
    unlockSubStage,
    unlockBadge,
    saveDefeatedMonster,
    setPin,
    logPlaySession,
    progressPercent,
    currentExp: profile.exp,
    nextLvlExp
  };
};
