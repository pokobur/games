import React, { useState } from 'react';
import './App.css';
import { StageSelect } from './components/UI/StageSelect';
import { Encyclopedia } from './components/UI/Encyclopedia';
import { ParentDashboard } from './components/UI/ParentDashboard';
import { GameScreen } from './components/GameScreen/GameScreen';

function App() {
  const [currentScreen, setCurrentScreen] = useState('home'); // 'home', 'stage_select', 'game', 'encyclopedia', 'parent'
  const [selectedStage, setSelectedStage] = useState(null);
  const [selectedSubStage, setSelectedSubStage] = useState(null);

  const startStage = (stageId, subStageId) => {
    setSelectedStage(stageId);
    setSelectedSubStage(subStageId);
    setCurrentScreen('game');
  };

  return (
    <div className="app-container">
      {currentScreen === 'home' && (
        <div className="home-screen">
          <h1 className="title-logo">戦艦<br/>スタディ</h1>
          <div className="home-buttons">
            <button className="primary-btn pulse" onClick={() => setCurrentScreen('stage_select')}>
              ゲームスタート！
            </button>
            <button className="secondary-btn" onClick={() => setCurrentScreen('encyclopedia')}>
              モンスターずかん 📖
            </button>
            <button className="parent-btn" onClick={() => setCurrentScreen('parent')}>
              保護者の方へ 🔒
            </button>
          </div>
        </div>
      )}
      
      {currentScreen === 'stage_select' && (
        <StageSelect onSelectStage={startStage} onBack={() => setCurrentScreen('home')} />
      )}

      {currentScreen === 'game' && selectedStage && selectedSubStage && (
        <GameScreen stageId={selectedStage} subStageId={selectedSubStage} onExit={() => setCurrentScreen('home')} />
      )}

      {currentScreen === 'encyclopedia' && (
        <Encyclopedia onBack={() => setCurrentScreen('home')} />
      )}

      {currentScreen === 'parent' && (
        <ParentDashboard onBack={() => setCurrentScreen('home')} />
      )}
    </div>
  );
}

export default App;
