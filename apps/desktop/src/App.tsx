import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const {
    stage,
    petName,
    modelName,
    level,
    xp,
    stats,
    bubbleText,
    isStreaming,
    userInput,
    setPetName,
    setModelName,
    hatch,
    setUserInput,
    setBubbleText,
    setStreaming,
    clearUserInput,
    performAction,
    hydrateFromLocal,
    persistToLocal,
    applyDecayTick,
  } = useAppStore();

  const capWords = useCallback((text: string, capLevel: number) => {
    const cap = getWordCapForLevel(capLevel);
    if (cap >= 999) return text.trim();
    return text
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, cap)
      .join(' ');
  }, []);

  useEffect(() => {
    hydrateFromLocal();
  }, [hydrateFromLocal]);

  useEffect(() => {
    persistToLocal();
  }, [stage, petName, modelName, level, xp, stats, bubbleText, persistToLocal]);

  useEffect(() => {
    const run = async () => {
      const health = await adapter.healthCheck();
      if (!health.ok) {
        setModelStatus('Ollama not detected. Start Ollama on localhost:11434.');
        setAvailableModels([]);
        return;
      }

      const models = await adapter.listModels();
      const names = models.map((m) => m.name);
      setAvailableModels(names);
      if (names.length > 0) {
        const existing = names.includes(modelName) ? modelName : names[0];
        setModelName(existing);
        setModelStatus(`Connected: ${existing}`);
      } else {
        setModelStatus('Ollama detected, but no models found. Pull one model first.');
      }
    };

    run();
  }, [modelName, setModelName]);

  useEffect(() => {
    const id = setInterval(() => applyDecayTick(), 10000);
    return () => clearInterval(id);
  }, [applyDecayTick]);

  const systemPrompt = useMemo(
    () =>
      [
        'You are Lamagotchi, a baby AI creature.',
        `Current level: ${level}.`,
        `Word limit: ${getWordCapForLevel(level) >= 999 ? 'No hard cap' : getWordCapForLevel(level)}.`,
        'Be cute, curious, and slightly weird.',
        'If under level cap, keep response short and emotional.',
      ].join('\n'),
    [level],
  );

  const sendUserMessage = useCallback(async () => {
    if (stage !== 'alive' || !userInput.trim() || isStreaming) return;
    setStreaming(true);
    setBubbleText('...');

    const userMessage = userInput.trim();
    clearUserInput();

    try {
      let full = '';
      for await (const chunk of adapter.streamChat({
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
      })) {
        if (!chunk.content) continue;
        full += chunk.content;
        setBubbleText(capWords(full, level) || '...');
      }

      const finalText = capWords(full, level) || 'Hi';
      setBubbleText(finalText);
    } catch {
      setBubbleText('Oops');
    } finally {
      setStreaming(false);
    }
  }, [capWords, clearUserInput, isStreaming, level, modelName, setBubbleText, setStreaming, stage, systemPrompt, userInput]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <h1>Lamagotchi</h1>
        <span>{modelStatus}</span>
      </header>

      <section className="layout">
        <Panel>
          <div className="model-row">
            <label htmlFor="model-select">Model</label>
            <select
              id="model-select"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              disabled={availableModels.length === 0 || isStreaming}
            >
              {availableModels.length === 0 && <option>No models</option>}
              {availableModels.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="naming-row">
            <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} placeholder="Name your egg" />
            <button onClick={() => setPetName(nameInput)} disabled={!modelName || modelName === 'Not connected'}>
              Set Name
            </button>
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
          <p>Streaming: {isStreaming ? 'yes' : 'no'}</p>
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
            disabled={stage !== 'alive' || isStreaming}
          />
          <button onClick={sendUserMessage} disabled={stage !== 'alive' || isStreaming}>
            {isStreaming ? '...' : 'Chat'}
          </button>
        </div>
      </footer>
    </main>
  );
};
