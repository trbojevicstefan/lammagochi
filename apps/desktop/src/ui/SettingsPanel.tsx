import { useState, useRef } from 'react';

import { SKINS, getUnlockedSkins, type PetSkin } from '../game/evolution';
import type { PetPersonality } from '../game/personality';

type SettingsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
  petName: string;
  modelName: string;
  soundEnabled: boolean;
  level: number;
  xp: number;
  stage: string;
  wordCap: number;
  currentSkin: string;
  personality?: PetPersonality;
  onRename: (name: string) => void;
  onToggleSound: () => void;
  onSetSkin: (skin: string) => void;
  onExport: () => string;
  onImport: (json: string) => void;
};

export const SettingsPanel = ({
  isOpen,
  onClose,
  petName,
  modelName,
  soundEnabled,
  level,
  xp,
  stage,
  wordCap,
  onRename,
  onToggleSound,
  currentSkin,
  personality,
  onSetSkin,
  onExport,
  onImport,
}: SettingsPanelProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const handleExport = () => {
    const json = onExport();
    const blob = new Blob([json], {type:'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href=url; a.download='lamagotchi-save.json'; a.click();
    URL.revokeObjectURL(url);
  };
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = () => onImport(reader.result as string);
    reader.readAsText(file);
  };
  const [editName, setEditName] = useState(petName);

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-card" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>⚙️ Settings</h2>
          <button onClick={onClose} className="settings-close">✕</button>
        </div>

        <div className="settings-body">
          {/* Pet Profile */}
          <section className="settings-section">
            <h3>Pet Profile</h3>
            <div className="settings-field">
              <label>Name</label>
              <div className="settings-field-row">
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Pet name..."
                />
                <button onClick={() => { onRename(editName); }} disabled={!editName.trim()}>
                  Rename
                </button>
              </div>
            </div>
            <div className="settings-stats">
              <div><span>Level</span><span>{level}</span></div>
              <div><span>XP</span><span>{xp}</span></div>
              <div><span>Stage</span><span>{stage}</span></div>
              <div><span>Word Cap</span><span>{wordCap >= 999 ? '∞' : wordCap}</span></div>
              {personality && (
                <>
                  <div><span>Personality</span><span>{personality.primary} / {personality.secondary}</span></div>
                  <div><span>Quirk</span><span style={{fontSize:'0.65rem'}}>{personality.quirk}</span></div>
                </>
              )}
            </div>
          </section>

          {/* Audio */}
          <section className="settings-section">
            <h3>Audio</h3>
            <div className="settings-field">
              <label>Sound Effects</label>
              <button onClick={onToggleSound} className="settings-toggle">
                {soundEnabled ? '🔊 ON' : '🔇 OFF'}
              </button>
            </div>
          </section>

          {/* Skins */}
          <section className="settings-section">
            <h3>Skins</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {getUnlockedSkins(level).map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSetSkin(s.id)}
                  className={currentSkin === s.id ? 'settings-skin--active' : ''}
                  style={{
                    padding: '6px 10px',
                    border: currentSkin === s.id ? '2px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    background: currentSkin === s.id ? 'rgba(34,211,238,0.1)' : 'rgba(99,102,241,0.05)',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title={s.name}
                >
                  <span>{s.icon}</span>
                  <span>{s.name}</span>
                </button>
              ))}
              {SKINS.filter((s) => s.unlockLevel > level).length > 0 && (
                <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', padding: '6px 4px' }}>
                  +{SKINS.filter((s) => s.unlockLevel > level).length} more to unlock
                </span>
              )}
            </div>
          </section>

          {/* Model */}
          <section className="settings-section">
            <h3>AI Model</h3>
            <div className="settings-field">
              <label>Connected Model</label>
              <div className="settings-model-badge">{modelName}</div>
            </div>
            <p className="settings-note">
              Model selection happens automatically from your local Ollama instance.
            </p>
          </section>

          {/* Save Management */}
          <section className="settings-section">
            <h3>Save Data</h3>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={handleExport} style={{flex:1,fontSize:'0.7rem'}}>📥 Export Save</button>
              <button onClick={()=>fileRef.current?.click()} style={{flex:1,fontSize:'0.7rem'}}>📤 Import Save</button>
              <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{display:'none'}} />
            </div>
            <p className="settings-note" style={{marginTop:'6px'}}>Export to backup your pet. Import to restore from a previous save.</p>
          </section>

          {/* About */}
          <section className="settings-section">
            <h3>About</h3>
            <p className="settings-note">
              Lamagotchi v0.2.0 — A local-first desktop cyberpet powered by your own LLM via Ollama.
              Built with the Hatchling 16-bit retro-future arcade design language.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
