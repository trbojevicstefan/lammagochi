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
  const [feedText, setFeedText] = useState('');
  const [sideTab, setSideTab] = useState<'care' | 'memory' | 'journal'>('care');

  const {
    stage,
    petName,
    modelName,
    level,
    xp,
    stats,
    bubbleText,
    isStreaming,
    memoryItems,
    journalEntries,
    taskDifficulty,
    dayPhase,
    userInput,
    setPetName,
    setModelName,
    hatch,
    setUserInput,
    setBubbleText,
    setStreaming,
    setTaskDifficulty,
    clearUserInput,
    performAction,
    feedKnowledge,
    setMemoryApproval,
    hydrateFromLocal,
    persistToLocal,
    applyDecayTick,
    refreshDayPhase,
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
  }, [stage, petName, modelName, level, xp, stats, bubbleText, taskDifficulty, dayPhase, memoryItems, journalEntries, persistToLocal]);

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
      if (names.length > 0 && (modelName === 'Not connected' || !modelName)) {
        setModelName(names[0]);
        setModelStatus(`Connected: ${names[0]}`);
      } else if (names.includes(modelName)) {
        setModelStatus(`Connected: ${modelName}`);
      } else if (modelName && modelName !== 'Not connected') {
        setModelStatus(`Selected model unavailable: ${modelName}`);
      } else {
        setModelStatus('Ollama detected, but no models found. Pull one model first.');
      }
    };

    run();
    const id = setInterval(run, 15000);
    return () => clearInterval(id);
  }, [modelName, setModelName]);

  useEffect(() => {
    const id = setInterval(() => applyDecayTick(), 10000);
    return () => clearInterval(id);
  }, [applyDecayTick]);

  useEffect(() => {
    const id = setInterval(() => refreshDayPhase(), 30000);
    return () => clearInterval(id);
  }, [refreshDayPhase]);

  const systemPrompt = useMemo(
    () => {
      const approvedMemories = memoryItems
        .filter((m) => m.approved)
        .slice(0, 4)
        .map((m) => `- ${m.title}: ${m.content}`)
        .join('\n');

      return [
        'You are Lamagotchi, a local AI creature living in a cyberpet shell.',
        'Stay in-character: cute, curious, slightly weird, emotionally expressive.',
        `Current stage: ${stage}.`,
        `Current level: ${level}.`,
        `Word limit: ${getWordCapForLevel(level) >= 999 ? 'No hard cap' : getWordCapForLevel(level)}.`,
        `Current day phase: ${dayPhase}.`,
        `Current model identity: ${modelName}.`,
        `Needs snapshot: hunger=${stats.hunger}, curiosity=${stats.curiosity}, energy=${stats.energy}, hygiene=${stats.hygiene}, mood=${stats.mood}.`,
        `Task difficulty preference: ${taskDifficulty}.`,
        'Rules:',
        '- If level is 1-10, never exceed word limit.',
        '- If energy is low or hunger is low, you can refuse with short wording.',
        '- Be proactive but brief.',
        approvedMemories ? `Approved memories:\n${approvedMemories}` : 'Approved memories: none yet.',
      ].join('\n');
    },
    [dayPhase, level, memoryItems, modelName, stage, stats, taskDifficulty],
  );

  const sendUserMessage = useCallback(async () => {
    if (stage !== 'alive' || !userInput.trim() || isStreaming || modelName === 'Not connected') return;
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
              onChange={(e) => {
                const nextModel = e.target.value;
                setModelName(nextModel);
                setModelStatus(`Connected: ${nextModel}`);
              }}
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
          <div className="tab-row">
            <button className={sideTab === 'care' ? 'tab-active' : ''} onClick={() => setSideTab('care')}>
              Care
            </button>
            <button className={sideTab === 'memory' ? 'tab-active' : ''} onClick={() => setSideTab('memory')}>
              Memory
            </button>
            <button className={sideTab === 'journal' ? 'tab-active' : ''} onClick={() => setSideTab('journal')}>
              Journal
            </button>
          </div>

          {sideTab === 'care' && (
            <div className="side-pane">
              <h2>Status</h2>
              <p>Model: {modelName}</p>
              <p>Level: {level}</p>
              <p>XP: {xp}</p>
              <p>Word cap: {getWordCapForLevel(level) >= 999 ? 'Sentence mode' : getWordCapForLevel(level)}</p>
              <p>Streaming: {isStreaming ? 'yes' : 'no'}</p>
              <p>Day phase: {dayPhase}</p>
              <div className="model-row">
                <label htmlFor="task-difficulty">Task difficulty</label>
                <select
                  id="task-difficulty"
                  value={taskDifficulty}
                  onChange={(e) => setTaskDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                  disabled={stage !== 'alive' || isStreaming}
                >
                  <option value="easy">easy</option>
                  <option value="medium">medium</option>
                  <option value="hard">hard</option>
                </select>
              </div>
              <ul className="stats-list">
                {Object.entries(stats).map(([key, value]) => (
                  <li key={key}>
                    <span>{key}</span>
                    <span>{value}</span>
                  </li>
                ))}
              </ul>
              <hr className="sep" />
              <h3>Feed Knowledge</h3>
              <textarea
                value={feedText}
                onChange={(e) => setFeedText(e.target.value)}
                placeholder="Paste note or markdown snippet..."
                rows={4}
                disabled={stage !== 'alive' || isStreaming}
              />
              <button
                onClick={() => {
                  feedKnowledge(feedText);
                  setFeedText('');
                }}
                disabled={stage !== 'alive' || !feedText.trim() || isStreaming}
              >
                Digest
              </button>
            </div>
          )}

          {sideTab === 'memory' && (
            <div className="side-pane">
              <h3>Memory Queue</h3>
              <ul className="memory-list">
                {memoryItems.length === 0 && <li className="memory-empty">No memories yet</li>}
                {memoryItems.map((item) => (
                  <li key={item.id}>
                    <p>{item.title}</p>
                    <small>{item.content}</small>
                    <div className="memory-actions">
                      <button onClick={() => setMemoryApproval(item.id, true)} disabled={item.approved}>
                        Approve
                      </button>
                      <button onClick={() => setMemoryApproval(item.id, false)} disabled={!item.approved}>
                        Unapprove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sideTab === 'journal' && (
            <div className="side-pane">
              <h3>Skill Journal</h3>
              <ul className="memory-list">
                {journalEntries.length === 0 && <li className="memory-empty">No journal entries yet</li>}
                {journalEntries.map((entry) => (
                  <li key={entry.id}>
                    <p>{entry.type}</p>
                    <small>{entry.content}</small>
                  </li>
                ))}
              </ul>
            </div>
          )}
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
