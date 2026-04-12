export const useStorage = () => {
  const saveDefeatedMonster = (monsterId) => {
    const data = JSON.parse(localStorage.getItem('battleship_study_encyclopedia') || '[]');
    if (!data.includes(monsterId)) {
      data.push(monsterId);
      localStorage.setItem('battleship_study_encyclopedia', JSON.stringify(data));
    }
  };

  const getDefeatedMonsters = () => {
    return JSON.parse(localStorage.getItem('battleship_study_encyclopedia') || '[]');
  };

  const logPlaySession = (stage, durationMinutes) => {
    const data = JSON.parse(localStorage.getItem('battleship_study_reports') || '[]');
    data.push({
      date: new Date().toISOString(),
      stage,
      durationMinutes
    });
    localStorage.setItem('battleship_study_reports', JSON.stringify(data));
  };

  const getPlayReports = () => {
    return JSON.parse(localStorage.getItem('battleship_study_reports') || '[]');
  };

  return { saveDefeatedMonster, getDefeatedMonsters, logPlaySession, getPlayReports };
};
