import React from 'react';
import { MONSTERS_DATA, STAGES_DATA } from '../../data/monsters';
import { useProfile } from '../../hooks/useProfile';

export const Encyclopedia = ({ onBack }) => {
  const { profile } = useProfile();
  const defeatedIds = profile.defeatedMonsters || [];

  const renderMonsters = (stageObj) => {
    // Flatten all enemies from all substages
    const all = stageObj.substages.flatMap(sub => sub.enemies);
    return (
      <div style={{ display: 'flex', gap: '1.5rem', overflowX: 'auto', padding: '1rem 0' }}>
        {all.map(m => {
          const isDefeated = defeatedIds.includes(m.id);
          const isBoss = m.isBoss;
          
          return (
            <div key={m.id} style={{ 
              minWidth: '140px', height: '200px', 
              background: isDefeated ? `linear-gradient(135deg, #1e293b, ${m.color})` : '#0f172a',
              border: `3px solid ${isDefeated ? (isBoss ? '#fbbf24' : m.color) : '#334155'}`,
              borderRadius: '16px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: isDefeated ? (isBoss ? '0 0 15px rgba(251, 191, 36, 0.5)' : '0 10px 20px rgba(0,0,0,0.5)') : 'none',
              opacity: isDefeated ? 1 : 0.5,
              position: 'relative',
              overflow: 'hidden'
            }}>
              {!isDefeated && <span style={{fontSize: '3rem', color: '#475569'}}>❓</span>}
              
              {isDefeated && (
                <>
                  <div style={{
                    width: '100%', height: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.3)', borderBottom: `2px solid ${m.color}`
                  }}>
                    <span style={{
                      fontSize: isBoss ? '4.5rem' : '3.5rem', 
                      filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))'
                    }}>{m.icon}</span>
                  </div>
                  <div style={{ padding: '0.5rem', textAlign: 'center', width: '100%' }}>
                    <span style={{fontSize: '0.9rem', fontWeight: 'bold', color: '#fff', textShadow: '1px 1px 2px #000'}}>
                      {m.name}
                    </span>
                    {isBoss && <div style={{ fontSize: '0.7rem', color: '#fbbf24', marginTop: '4px' }}>★ BOSS ★</div>}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="app-container" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <button className="secondary-btn" onClick={onBack} style={{ alignSelf: 'flex-start', marginBottom: '1rem' }}>
        ← もどる
      </button>
      <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#fff', textAlign: 'center' }}>モンスターずかん</h2>
      
      {STAGES_DATA.map(stage => (
        <div key={stage.id} style={{ marginBottom: '2.5rem' }}>
          <h3 style={{ color: `var(${stage.themeLight})`, borderBottom: `2px solid var(${stage.themeLight})`, paddingBottom: '0.5rem', fontSize: '1.5rem' }}>
            {stage.title}
          </h3>
          {MONSTERS_DATA[stage.id] && renderMonsters(MONSTERS_DATA[stage.id])}
        </div>
      ))}
    </div>
  );
};
