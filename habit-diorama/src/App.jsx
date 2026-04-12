import React from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ParentDashboard from './pages/ParentDashboard';
import ChildPlayroom from './pages/ChildPlayroom';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="global-nav">
          <Link to="/play" className="nav-btn play-btn">🎮 あそぶ</Link>
          <Link to="/parent" className="nav-btn parent-btn">⚙️ おやよう</Link>
        </nav>
        
        <main className="main-content">
          <Routes>
            <Route path="/play" element={<ChildPlayroom />} />
            <Route path="/parent" element={<ParentDashboard />} />
            <Route path="/" element={
              <div className="home-screen">
                <h1>🏘️ しゅうかんジオラマ</h1>
                <p style={{ fontSize: '1.2rem', lineHeight: 2, color: '#666' }}>
                  まいにちのタスクをクリアして<br/>
                  じぶんだけの まちを つくろう！
                </p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '30px' }}>
                  <Link to="/play" className="nav-btn play-btn" style={{ fontSize: '1.3rem', padding: '14px 32px' }}>
                    🎮 あそびにいく
                  </Link>
                </div>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
