import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import ParentDashboard from './pages/ParentDashboard';
import ChildPlayroom from './pages/ChildPlayroom';
import { isAudioMuted, toggleAudioMute, playClickSound } from './utils/sound';
import './App.css';

function Navigation() {
  const location = useLocation();
  const [muted, setMuted] = useState(isAudioMuted());

  const handleToggleSound = () => {
    const next = toggleAudioMute();
    setMuted(next);
    if (!next) {
      playClickSound();
    }
  };

  return (
    <nav className="global-nav">
      <Link to="/" className="nav-logo" onClick={playClickSound}>
        <span className="logo-icon">🏘️</span>
        <span className="logo-text">しゅうかんジオラマ</span>
      </Link>

      <div className="nav-menu">
        <Link
          to="/play"
          className={`nav-btn play-btn ${location.pathname === '/play' ? 'active-nav' : ''}`}
          onClick={playClickSound}
        >
          🎮 ぼくのまち
        </Link>
        <Link
          to="/parent"
          className={`nav-btn parent-btn ${location.pathname === '/parent' ? 'active-nav' : ''}`}
          onClick={playClickSound}
        >
          ⚙️ おとなのかたへ
        </Link>

        {/* 音声ミュートトグル */}
        <button
          className="sound-toggle-btn"
          onClick={handleToggleSound}
          title={muted ? '音をだす' : 'ミュートにする'}
        >
          {muted ? '🔇' : '🔊'}
        </button>
      </div>
    </nav>
  );
}

function HomeScreen() {
  return (
    <div className="home-screen">
      <div className="home-hero-badge">子どもが自分で習慣をつくる！</div>
      <h1 className="home-title">🏘️ しゅうかんジオラマ</h1>
      <p className="home-desc">
        まいにちの「できた！」をあつめて、<br />
        自分だけのすてきな街をつくろう！
      </p>

      <div className="home-features-grid">
        <div className="feature-card">
          <div className="feature-icon">⭐</div>
          <h3>タスクをクリア！</h3>
          <p>「はみがき」や「しゅくだい」が終わったらボタンを押して報告しよう！</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🎰</div>
          <h3>ガチャでパーツゲット</h3>
          <p>おうちのひとに承認してもらうと、ガチャを引いて新しい建物を獲得！</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🎨</div>
          <h3>じぶんの街に配置</h3>
          <p>集めたパーツを好きな場所に置いて、街をどんどん発展させよう！</p>
        </div>
      </div>

      <div className="home-cta-wrap">
        <Link to="/play" className="cta-play-btn" onClick={playClickSound}>
          🎮 まちへ あそびにいく！
        </Link>
        <Link to="/parent" className="cta-parent-btn" onClick={playClickSound}>
          ⚙️ 保護者用ダッシュボード（設定）
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <Navigation />

        <main className="main-content">
          <Routes>
            <Route path="/play" element={<ChildPlayroom />} />
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/" element={<HomeScreen />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
