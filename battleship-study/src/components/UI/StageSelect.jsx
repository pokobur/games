import React, { useState } from 'react';
import { STAGES_DATA, MONSTERS_DATA } from '../../data/monsters';
import { useProfile } from '../../hooks/useProfile';
import '../components.css';

export const StageSelect = ({ onSelectStage, onBack }) => {
  const { profile, progressPercent, currentExp, nextLvlExp } = useProfile();
  
  // Track which subject is currently expanded.
  const [expandedStageId, setExpandedStageId] = useState(null);

  const toggleExpand = (stageId) => {
    // If it's already expanded, collapse it. If it's another, expand it.
    // 'final_boss' also unlocks dynamically. 
    // Logic: Is 'final_boss' selectable? Yes, only if its _1 is in unlockedSubStages.
    // Wait, the prompt says "all subjects are unlocked from the start". 
    // But final boss is special.
    if (stageId === 'final_boss' && !profile.unlockedSubStages.includes('final_1')) {
      alert('魔王城にはまだ入れない...！\n他の全ての科目をクリアしよう！');
      return;
    }
    setExpandedStageId(prev => prev === stageId ? null : stageId);
  };

  const handleSelectSubstage = (stageId, subStageId) => {
    if (profile.unlockedSubStages.includes(subStageId)) {
      onSelectStage(stageId, subStageId); // Pass BOTH so the engine knows what to load
    }
  };

  return (
    <div className="app-container" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <button className="secondary-btn" onClick={onBack} style={{ padding: '0.8rem' }}>
          ← もどる
        </button>
        <div style={{ background: 'var(--glass-bg)', padding: '0.5rem 1rem', borderRadius: '12px', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#fde047' }}>Lv. {profile.level}</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '80px', height: '10px', background: 'rgba(0,0,0,0.5)', borderRadius: '5px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPercent}%`, background: 'linear-gradient(90deg, #fbbf24, #f59e0b)' }} />
            </div>
            <span style={{ fontSize: '0.6rem', color: '#cbd5e1', textAlign: 'right' }}>
              {profile.level === 999 ? 'MAX' : `${currentExp}/${nextLvlExp}`}
            </span>
          </div>
        </div>
      </div>
      
      {profile.badges.length > 0 && (
        <div style={{ marginBottom: '2rem', background: 'rgba(0,0,0,0.4)', padding: '1rem', borderRadius: '12px' }}>
          <span style={{ fontSize: '0.9rem', color: '#cbd5e1' }}>獲得した称号:</span>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {profile.badges.map(b => (
              <span key={b} style={{ background: '#3b82f6', color: '#fff', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                {b}
              </span>
            ))}
          </div>
        </div>
      )}

      <h2 style={{ fontSize: '2rem', marginBottom: '2rem', textAlign: 'center', color: '#fff' }}>
        科目をえらぼう
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
        {STAGES_DATA.map(stage => {
          const isExpanded = expandedStageId === stage.id;
          const isFinal = stage.id === 'final_boss';
          const finalLocked = isFinal && !profile.unlockedSubStages.includes('final_1');
          
          return (
            <div key={stage.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {/* Subject Banner */}
              <div 
                  style={{ 
                    background: finalLocked ? 'rgba(0,0,0,0.5)' : 'var(--glass-bg)', 
                    padding: '1.5rem', borderRadius: '16px', 
                    border: '2px solid',
                    borderColor: finalLocked ? '#334155' : `var(${stage.themeLight})`,
                    cursor: 'pointer',
                    boxShadow: finalLocked ? 'none' : '0 8px 16px rgba(0,0,0,0.3)', 
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onClick={() => toggleExpand(stage.id)}
              >
                {finalLocked && (
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', borderRadius: '16px', zIndex: 10 }}>
                    <span style={{ fontSize: '3rem' }}>🔒</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '1.5rem', color: finalLocked ? '#64748b' : `var(${stage.themeLight})`, marginBottom: '0.5rem' }}>
                    {stage.title}
                  </h3>
                  <span style={{ color: finalLocked ? '#475569' : '#fff', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: '0.3s' }}>
                    ▼
                  </span>
                </div>
                <p style={{ color: finalLocked ? '#475569' : '#cbd5e1' }}>{stage.description}</p>
              </div>

              {/* Substages List - Expanded View */}
              {isExpanded && MONSTERS_DATA[stage.id] && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingLeft: '1rem', marginTop: '0.5rem', borderLeft: `2px dashed var(${stage.themeLight})` }}>
                  {MONSTERS_DATA[stage.id].substages.map(sub => {
                    const isUnlocked = profile.unlockedSubStages.includes(sub.id);
                    return (
                      <div key={sub.id} 
                        style={{
                          background: isUnlocked ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.5)',
                          padding: '1rem', borderRadius: '12px',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          cursor: isUnlocked ? 'pointer' : 'not-allowed',
                          border: isUnlocked ? `1px solid var(${stage.themeLight})` : '1px solid #334155'
                        }}
                        onClick={() => handleSelectSubstage(stage.id, sub.id)}
                      >
                        <div style={{ color: isUnlocked ? '#fff' : '#64748b', fontWeight: 'bold' }}>
                          <span style={{ display: 'inline-block', width: '30px', color: `var(${stage.themeLight})` }}>
                            Lv{sub.level}
                          </span> 
                          {sub.title}
                        </div>
                        <div style={{ fontSize: '1.2rem' }}>
                          {isUnlocked ? '⚔️' : '🔒'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
};
