import React, { useState, useEffect } from 'react';
import { useProfile } from '../../hooks/useProfile';

export const ParentDashboard = ({ onBack }) => {
  const { profile, setPin, logPlaySession, addExp } = useProfile();
  
  // Pin states
  const [inputPin, setInputPin] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [newPin, setNewPin] = useState('');

  // Auto layout
  const handleKeypad = (num) => {
    if (isSettingPin) {
      if (newPin.length < 4) setNewPin(newPin + num);
    } else {
      if (inputPin.length < 4) setInputPin(inputPin + num);
    }
  };

  const handleClear = () => {
    isSettingPin ? setNewPin('') : setInputPin('');
  };

  const handleSubmit = () => {
    if (isSettingPin) {
      if (newPin.length === 4) {
        setPin(newPin); // Save to profile
        setIsSettingPin(false);
        setIsAuthenticated(true);
      }
    } else {
      if (profile.parentPin === null || inputPin === profile.parentPin) {
        setIsAuthenticated(true);
      } else {
        alert('PINが違います！');
        setInputPin('');
      }
    }
  };

  // Skip auth if no PIN is set AND we are not trying to set one
  useEffect(() => {
    if (!profile.parentPin) {
      setIsSettingPin(true);
    }
  }, [profile.parentPin]);

  if (!isAuthenticated && profile.parentPin) {
    return (
      <div className="app-container" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <button className="primary-btn" onClick={onBack} style={{ position: 'absolute', top: '1rem', left: '1rem', background: '#334155' }}>もどる</button>
        <h2 style={{ color: '#fff', marginBottom: '2rem' }}>保護者用PINコード</h2>
        <div style={{ fontSize: '3rem', letterSpacing: '1rem', color: '#fde047', marginBottom: '2rem' }}>
          {inputPin.padEnd(4, '・')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} className="option-btn" style={{ padding: '1.5rem', fontSize: '1.5rem' }} onClick={() => handleKeypad(n.toString())}>{n}</button>
          ))}
          <button className="option-btn" style={{ padding: '1.5rem', fontSize: '1rem', background: '#ef4444' }} onClick={handleClear}>C</button>
          <button className="option-btn" style={{ padding: '1.5rem', fontSize: '1.5rem' }} onClick={() => handleKeypad('0')}>0</button>
          <button className="option-btn" style={{ padding: '1.5rem', fontSize: '1rem', background: '#38bdf8' }} onClick={handleSubmit}>OK</button>
        </div>
      </div>
    );
  }

  if (isSettingPin && !profile.parentPin && !isAuthenticated) {
    return (
      <div className="app-container" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <button className="primary-btn" onClick={onBack} style={{ position: 'absolute', top: '1rem', left: '1rem', background: '#334155' }}>もどる</button>
        <h2 style={{ color: '#fff', marginBottom: '1rem' }}>PINコードの初期設定</h2>
        <p style={{ color: '#cbd5e1', marginBottom: '2rem', textAlign: 'center' }}>子どもが勝手に設定を変えられないように、<br/>4桁の数字を決めてください。</p>
        <div style={{ fontSize: '3rem', letterSpacing: '1rem', color: '#fde047', marginBottom: '2rem' }}>
          {newPin.padEnd(4, '・')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} className="option-btn" style={{ padding: '1.5rem', fontSize: '1.5rem' }} onClick={() => handleKeypad(n.toString())}>{n}</button>
          ))}
          <button className="option-btn" style={{ padding: '1.5rem', fontSize: '1rem', background: '#ef4444' }} onClick={handleClear}>C</button>
          <button className="option-btn" style={{ padding: '1.5rem', fontSize: '1.5rem' }} onClick={() => handleKeypad('0')}>0</button>
          <button className="option-btn" style={{ padding: '1.5rem', fontSize: '1rem', background: '#38bdf8' }} onClick={handleSubmit}>OK</button>
        </div>
      </div>
    );
  }

  // Dashboard View
  const reports = [...profile.reports].reverse();

  const handleReset = () => {
    if(window.confirm('本当にすべてのセーブデータをリセットしますか？')) {
      localStorage.removeItem('battleship_study_profile');
      window.location.reload();
    }
  };

  return (
    <div className="app-container" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <button className="primary-btn" onClick={onBack} style={{ alignSelf: 'flex-start', marginBottom: '1rem', background: '#334155', boxShadow: '0 6px 0 #1e293b' }}>
        ← もどる
      </button>
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#fff', textAlign: 'center' }}>保護者ダッシュボード</h2>
      
      <div style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
        <h3 style={{ color: '#fbbf24', marginBottom: '1rem' }}>今日のがんばりレポート</h3>
        {reports.length === 0 ? (
          <p style={{ color: '#cbd5e1' }}>まだプレイ記録がありません。</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {reports.slice(0, 5).map((r, i) => (
              <li key={i} style={{ padding: '0.8rem 0', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#f8fafc' }}>{new Date(r.date).toLocaleDateString()} - {r.stage}ステージ</span>
                <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{r.durationMinutes}分</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
        <h3 style={{ color: '#fbbf24', marginBottom: '1rem' }}>プレイ時間のお約束</h3>
        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1rem' }}>1日のプレイ時間を決めることができます。（※デモ）</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <select style={{ padding: '0.5rem', borderRadius: '8px', background: '#334155', color: '#fff', border: 'none' }}>
            <option>15分</option>
            <option>30分</option>
            <option>1時間</option>
            <option>制限なし</option>
          </select>
          <button className="primary-btn" style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>保存</button>
        </div>
      </div>

      <div style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '16px', marginBottom: '2rem' }}>
        <h3 style={{ color: '#fbbf24', marginBottom: '1rem' }}>PINコードの再設定</h3>
        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1rem' }}>新しい4桁のPINコードを設定できます。</p>
        <button className="secondary-btn" onClick={() => { setIsSettingPin(true); setIsAuthenticated(false); setPin(null); }} style={{ padding: '0.5rem 1rem', fontSize: '1rem' }}>PINを再設定する</button>
      </div>

      <div style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '16px', border: '1px solid #ef4444' }}>
        <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>危険な操作</h3>
        <button className="primary-btn" style={{ background: '#ef4444', boxShadow: '0 6px 0 #991b1b' }} onClick={handleReset}>データをリセットする</button>
      </div>
    </div>
  );
};
