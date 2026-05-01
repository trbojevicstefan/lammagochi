import { useEffect, useState } from 'react';
import { Panel } from '@lamagotchi/ui';
import { OllamaHttpAdapter } from '@lamagotchi/ai-adapter';
import { CreatureCanvas3D } from './CreatureCanvas3D';
import { useAppStore } from './store';

const adapter = new OllamaHttpAdapter();

const ACTIONS = ['feed', 'play', 'sleep', 'clean', 'teach', 'task', 'daydream'] as const;

export const App = () => {
  const [nameInput, setNameInput] = useState('Noodle');
  const [modelStatus, setModelStatus] = useState('Checking Ollama...');

  const {
    petName,
    modelName,
    level,
    xp,
    stats,
    bubbleText,
    userInput,
    setPetName,
    setModelName,
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
          </div>
          <p className="pet-name">{petName}</p>
          <p className="bubble">{bubbleText}</p>
          <div className="canvas-wrap">
            <CreatureCanvas3D />
          </div>
        </Panel>

        <Panel>
          <h2>Status</h2>
          <p>Model: {modelName}</p>
          <p>Level: {level}</p>
          <p>XP: {xp}</p>
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
            <button key={action} onClick={() => performAction(action)}>
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
          />
          <button onClick={sendUserMessage}>Chat</button>
        </div>
      </footer>
    </main>
  );
};
