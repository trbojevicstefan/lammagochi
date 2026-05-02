import { useState } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  muted: boolean;
  paused: boolean;
  performanceMode: string;
  onToggleMute: () => void;
  onTogglePause: () => void;
  onSetPerformance: (mode: string) => void;
};

export const PetControls = ({ isOpen, onClose, muted, paused, performanceMode, onToggleMute, onTogglePause, onSetPerformance }: Props) => {
  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-card" onClick={e => e.stopPropagation()} style={{maxWidth: 360}}>
        <div className="settings-header"><h2>🎛️ Pet Controls</h2><button className="settings-close" onClick={onClose}>✕</button></div>
        <div className="settings-body">
          <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
            <button onClick={onToggleMute} style={{padding:'12px',textAlign:'left',fontSize:'0.85rem'}}>
              {muted ? '🔇' : '🔊'} {muted ? 'Unmute' : 'Mute'} Pet
              <br/><small style={{color:'var(--text-muted)'}}>{muted ? 'Speech bubbles hidden' : 'Speech bubbles visible'}</small>
            </button>
            <button onClick={onTogglePause} style={{padding:'12px',textAlign:'left',fontSize:'0.85rem'}}>
              {paused ? '▶️' : '⏸️'} {paused ? 'Resume' : 'Pause'} Animation
              <br/><small style={{color:'var(--text-muted)'}}>{paused ? 'Animation frozen' : 'Animation running'}</small>
            </button>
            <div>
              <label style={{fontSize:'0.7rem',color:'var(--text-muted)',marginBottom:'4px',display:'block'}}>Performance</label>
              <div style={{display:'flex',gap:'6px'}}>
                {(['full','eco','min'] as const).map(m => (
                  <button key={m} onClick={() => onSetPerformance(m)}
                    style={{flex:1,padding:'8px',fontSize:'0.7rem',
                      background: performanceMode===m ? 'rgba(34,211,238,0.15)' : 'rgba(99,102,241,0.05)',
                      borderColor: performanceMode===m ? 'var(--accent-cyan)' : 'var(--border-subtle)'}}>
                    {m === 'full' ? '⚡ 60fps' : m === 'eco' ? '🌱 30fps' : '💤 15fps'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="settings-note" style={{marginTop:'12px'}}>
            The pet auto-pauses when you switch tabs and reduces performance when idle.
          </p>
        </div>
      </div>
    </div>
  );
};
