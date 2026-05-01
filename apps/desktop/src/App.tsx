import { useEffect, useState } from 'react';
import { Panel } from '@lamagotchi/ui';
import { OllamaHttpAdapter } from '@lamagotchi/ai-adapter';
import { CreatureCanvas3D } from './CreatureCanvas3D';
import { useAppStore } from './store';
import { getWordCapForLevel } from '@lamagotchi/core';

const adapter = new OllamaHttpAdapter();

const ACTIONS = ['feed', 'play', 'sleep', 'clean', 'teach', 'task', 'daydream'] as const;

export const App = () => {
  const [nameInput, setNameInput] = useState('Noodle');
  const [modelStatus, setModelStatus] = useState('Checking Ollama...');

  const {
    stage,
    petName,
    modelName,
    level,
    xp,
    stats,
    bubbleText,
    userInput,
    setPetName,
    setModelName,
    hatch,
    setUserInput,
    performAction,
    sendUserMessage,
    applyDecayTick,
  } = useAppStore();

  useEffect(() => {
    const run = async () => {
      const health = await adapter.healthCheck();
      if (!health.ok) {
        setModelStatus('Ollama not detected. Start Ollama on localhost:11434.');
        return;
      }

      const models = await adapter.listModels();
      const selected = models[0]?.name;
      if (selected) {
        setModelName(selected);
        setModelStatus(`Connected: ${selected}`);
      } else {
        setModelStatus('Ollama detected, but no models found. Pull one model first.');
      }
    };

    run();
  }, [setModelName]);

  useEffect(() => {
    const id = setInterval(() => applyDecayTick(), 10000);
    return () => clearInterval(id);
  }, [applyDecayTick]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <h1>Lamagotchi</h1>
        <span>{modelStatus}</span>
      </header>

      <section className="layout">
        <Panel>
          <div className="naming-row">
            <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Name your egg" />
            <button onClick={() => setPetName(nameInput)}>Set Name</button>
            <button onClick={hatch} disabled={stage !== 'named_egg'}>
              Hatch
            </button>
          </div>
          <p className="stage-pill">Stage: {stage}</p>
          <p className="pet-name">{petName}</p>
          <p className="bubble">{bubbleText}</p>
          <div className="canvas-wrap">
            <CreatureCanvas3D stage={stage} />
          </div>
        </Panel>

        <Panel>
          <h2>Status</h2>
          <p>Model: {modelName}</p>
          <p>Level: {level}</p>
          <p>XP: {xp}</p>
          <p>Word cap: {getWordCapForLevel(level) >= 999 ? 'Sentence mode' : getWordCapForLevel(level)}</p>
          <ul className="stats-list">
            {Object.entries(stats).map(([key, value]) => (
              <li key={key}>
                <span>{key}</span>
                <span>{value}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      <footer className="action-zone">
        <div className="action-row">
          {ACTIONS.map((action) => (
            <button key={action} onClick={() => performAction(action)} disabled={stage !== 'alive'}>
              {action}
            </button>
          ))}
        </div>

        <div className="chat-row">
          <input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Talk to Lamagotchi..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendUserMessage();
            }}
            disabled={stage !== 'alive'}
          />
          <button onClick={sendUserMessage} disabled={stage !== 'alive'}>
            Chat
          </button>
        </div>
      </footer>
    </main>
  );
};
