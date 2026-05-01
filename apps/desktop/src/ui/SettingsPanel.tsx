import { useState } from 'react';

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
  onRename: (name: string) => void;
  onToggleSound: () => void;
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
}: SettingsPanelProps) => {
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
