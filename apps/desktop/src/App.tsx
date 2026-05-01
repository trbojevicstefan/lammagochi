import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Panel } from '@lamagotchi/ui';
import { OllamaHttpAdapter } from '@lamagotchi/ai-adapter';
import { getWordCapForLevel, xpThreshold } from '@lamagotchi/core';
import { CreatureCanvas3D } from './CreatureCanvas3D';
import { useAppStore, type ChatMessage } from './store';
import { buildLamagotchiSystemPrompt } from './game/promptBuilder';
import { chooseAutonomousPrompt } from './game/simulationTick';
import { getEvolutionStage, getEvolutionName } from './game/evolution';
import { StatMeter, ActionButton, ACTION_DEFS, ChatBubble, ChatLog, OnboardingScreen, HatchScreen } from './ui';
import { soundEffects } from './audio/soundEffects';

const adapter = new OllamaHttpAdapter();

const STAT_DEFS: Array<{ key: string; label: string; icon: string; color?: 'green' | 'teal' | 'amber' | 'red' | 'blue' | 'purple' }> = [
  { key: 'hunger', label: 'Hunger', icon: '🍎', color: 'amber' },
  { key: 'energy', label: 'Energy', icon: '⚡', color: 'teal' },
  { key: 'mood', label: 'Mood', icon: '💖', color: 'purple' },
  { key: 'hygiene', label: 'Hygiene', icon: '✨', color: 'blue' },
  { key: 'curiosity', label: 'Curiosity', icon: '🔍', color: 'teal' },
  { key: 'knowledge', label: 'Knowledge', icon: '📚', color: 'green' },
  { key: 'trust', label: 'Trust', icon: '🤝', color: 'purple' },
  { key: 'boredom', label: 'Boredom', icon: '🥱', color: 'red' },
];

export const App = () => {
  const [modelStatus, setModelStatus] = useState('Checking Ollama...');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [feedText, setFeedText] = useState('');
  const [sideTab, setSideTab] = useState<'care' | 'chat' | 'memory' | 'journal'>('care');
  const [interactionSpark, setInteractionSpark] = useState(0);
  const sparkTimeout = useRef<ReturnType<typeof setTimeout>>();

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
    hatchProgress,
    chatHistory,
    evolutionStage,
    achievements,
    soundEnabled,
    setPetName,
    setModelName,
    startHatch,
    completeHatch,
    updateHatchProgress,
    setUserInput,
    setBubbleText,
    setStreaming,
    setTaskDifficulty,
    clearUserInput,
    performAction,
    feedKnowledge,
    setMemoryApproval,
    addChatMessage,
    toggleSound,
    hydrateFromLocal,
    persistToLocal,
    applyDecayTick,
    refreshDayPhase,
  } = useAppStore();

  const capWords = useCallback(
    (text: string, capLevel: number) => {
      const cap = getWordCapForLevel(capLevel);
      if (cap >= 999) return text.trim();
      return text
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, cap)
        .join(' ');
    },
    [],
  );

  // Trigger spark animation
  const spark = useCallback(() => {
    setInteractionSpark(1);
    if (sparkTimeout.current) clearTimeout(sparkTimeout.current);
    sparkTimeout.current = setTimeout(() => setInteractionSpark(0), 600);
  }, []);

  // Hydrate on mount
  useEffect(() => {
    hydrateFromLocal();
  }, [hydrateFromLocal]);

  // Persist on state change
  useEffect(() => {
    persistToLocal();
  }, [stage, petName, modelName, level, xp, stats, bubbleText, taskDifficulty, dayPhase, memoryItems, journalEntries, chatHistory, evolutionStage, achievements, soundEnabled, persistToLocal]);

  // Ollama health check
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

  // Decay tick
  useEffect(() => {
    const id = setInterval(() => applyDecayTick(), 10000);
    return () => clearInterval(id);
  }, [applyDecayTick]);

  // Day phase
  useEffect(() => {
    const id = setInterval(() => refreshDayPhase(), 30000);
    return () => clearInterval(id);
  }, [refreshDayPhase]);

  // Autonomous prompts
  useEffect(() => {
    const id = setInterval(() => {
      if (stage !== 'alive' || isStreaming) return;
      const prompt = chooseAutonomousPrompt(stats, dayPhase);
      if (prompt) setBubbleText(capWords(prompt, level) || prompt);
    }, 20000);
    return () => clearInterval(id);
  }, [capWords, dayPhase, isStreaming, level, setBubbleText, stage, stats]);

  // Hatch animation progression
  useEffect(() => {
    if (stage !== 'hatching') return;
    const start = Date.now();
    const duration = 3500; // total hatch animation time
    const id = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min(1, elapsed / duration);
      updateHatchProgress(p);
      if (p >= 1) {
        clearInterval(id);
      }
    }, 50);
    return () => clearInterval(id);
  }, [stage, updateHatchProgress]);

  // System prompt
  const systemPrompt = useMemo(
    () =>
      buildLamagotchiSystemPrompt({
        stage,
        level,
        dayPhase,
        modelName,
        stats,
        taskDifficulty,
        memoryLines: memoryItems.filter((m) => m.approved).slice(0, 4).map((m) => `- ${m.title}: ${m.content}`),
      }),
    [dayPhase, level, memoryItems, modelName, stage, stats, taskDifficulty],
  );

  // Send chat message to LLM
  const sendUserMessage = useCallback(async () => {
    if (stage !== 'alive' || !userInput.trim() || isStreaming || modelName === 'Not connected') return;
    const userMessage = userInput.trim();

    // Add user message to chat
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    addChatMessage(userMsg);
    clearUserInput();
    setStreaming(true);
    setBubbleText('...');
    spark();
    if (soundEnabled) soundEffects.blip();

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

      // Add creature response to chat
      const creatureMsg: ChatMessage = {
        id: `msg_${Date.now()}_r`,
        role: 'creature',
        content: finalText,
        timestamp: Date.now(),
      };
      addChatMessage(creatureMsg);
    } catch {
      setBubbleText('...?');
      const errMsg: ChatMessage = {
        id: `msg_${Date.now()}_e`,
        role: 'system',
        content: 'Connection hiccup — is Ollama still running?',
        timestamp: Date.now(),
      };
      addChatMessage(errMsg);
    } finally {
      setStreaming(false);
    }
  }, [
    stage, userInput, isStreaming, modelName, addChatMessage, clearUserInput,
    setStreaming, setBubbleText, spark, soundEnabled, capWords, level, systemPrompt,
  ]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (stage !== 'alive') return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const keyMap: Record<string, () => void> = {
        '1': () => { performAction('feed'); spark(); },
        '2': () => { performAction('play'); spark(); },
        '3': () => { performAction('sleep'); spark(); },
        '4': () => { performAction('clean'); spark(); },
        '5': () => { performAction('teach'); spark(); },
        '6': () => { performAction('task'); spark(); },
        '7': () => { performAction('daydream'); spark(); },
      };
      keyMap[e.key]?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [performAction, spark, stage]);

  const evoName = getEvolutionName(evolutionStage);
  const xpNeeded = xpThreshold(level);
  const xpPct = Math.min(100, (xp / xpNeeded) * 100);
  const unlockedAchievements = achievements.filter((a) => a.unlockedAt !== null);

  return (
    <main className="app-shell">
      {/* Onboarding overlay */}
      {(stage === 'onboarding' || stage === 'named_egg') && (
        <OnboardingScreen
          modelStatus={modelStatus}
          availableModels={availableModels}
          selectedModel={modelName}
          petName={petName}
          onModelSelect={setModelName}
          onNameChange={setPetName}
          onSetName={() => setPetName(petName)}
          onHatch={startHatch}
          stage={stage}
        />
      )}

      {/* Hatch overlay */}
      {stage === 'hatching' && (
        <HatchScreen
          petName={petName}
          onComplete={completeHatch}
        />
      )}

      {/* Top Bar */}
      <header className="topbar">
        <div className="topbar__left">
          <h1 className="topbar__title">Lamagotchi</h1>
          {stage === 'alive' && (
            <>
              <span className="topbar__level-badge">
                Lv.{level} {evoName}
              </span>
              <div className="topbar__xp-bar">
                <div className="topbar__xp-fill" style={{ width: `${xpPct}%` }} />
              </div>
            </>
          )}
        </div>
        <div className="topbar__right">
          {stage === 'alive' && (
            <span className="topbar__phase">
              {dayPhase === 'morning' ? '🌅' : dayPhase === 'day' ? '☀️' : dayPhase === 'evening' ? '🌆' : '🌙'} {dayPhase}
            </span>
          )}
          <span className="topbar__status">
            <span className="status-dot" />
            {modelStatus}
          </span>
          {stage === 'alive' && (
            <button
              onClick={toggleSound}
              style={{ fontSize: '0.7rem', padding: '4px 8px' }}
              title={soundEnabled ? 'Mute sounds' : 'Enable sounds'}
            >
              {soundEnabled ? '🔊' : '🔇'}
            </button>
          )}
        </div>
      </header>

      {/* Main Layout */}
      <section className="layout">
        {/* Left: 3D Creature */}
        <div className="creature-panel">
          <div className="canvas-wrap">
            <CreatureCanvas3D
              stage={stage}
              stats={stats}
              dayPhase={dayPhase}
              level={level}
              isStreaming={isStreaming}
              hatchProgress={hatchProgress}
              interactionSpark={interactionSpark}
            />
          </div>
          {stage === 'alive' && (
            <ChatBubble text={bubbleText} isStreaming={isStreaming} petName={petName} />
          )}
        </div>

        {/* Right: Side Panel */}
        <div className="side-panel">
          <div className="tab-row">
            <button
              className={`tab-btn ${sideTab === 'care' ? 'tab-btn--active' : ''}`}
              onClick={() => setSideTab('care')}
            >
              Care
            </button>
            <button
              className={`tab-btn ${sideTab === 'chat' ? 'tab-btn--active' : ''}`}
              onClick={() => setSideTab('chat')}
            >
              Chat
            </button>
            <button
              className={`tab-btn ${sideTab === 'memory' ? 'tab-btn--active' : ''}`}
              onClick={() => setSideTab('memory')}
            >
              Memory
            </button>
            <button
              className={`tab-btn ${sideTab === 'journal' ? 'tab-btn--active' : ''}`}
              onClick={() => setSideTab('journal')}
            >
              Journal
            </button>
          </div>

          <div className="side-pane">
            {/* Care Tab */}
            {sideTab === 'care' && (
              <>
                <h2>Vitals</h2>
                {STAT_DEFS.map((def) => (
                  <StatMeter
                    key={def.key}
                    label={def.label}
                    value={stats[def.key as keyof typeof stats] ?? 0}
                    icon={def.icon}
                    color={def.color}
                  />
                ))}

                <hr className="sep" />

                <h2>Game</h2>
                <div className="model-row">
                  <label>Model</label>
                  <select
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    disabled={availableModels.length === 0 || isStreaming}
                  >
                    {availableModels.length === 0 && <option>No models</option>}
                    {availableModels.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>

                <div className="model-row">
                  <label>Difficulty</label>
                  <select
                    value={taskDifficulty}
                    onChange={(e) => setTaskDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                    disabled={stage !== 'alive' || isStreaming}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <p><span className="stage-pill">{stage}</span> <span className="stage-pill">Word cap: {getWordCapForLevel(level) >= 999 ? '∞' : getWordCapForLevel(level)}</span></p>

                <hr className="sep" />

                {/* Achievements */}
                <h2>Achievements ({unlockedAchievements.length}/{achievements.length})</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {achievements.map((ach) => (
                    <div
                      key={ach.id}
                      className={`achievement-badge ${ach.unlockedAt ? 'achievement-badge--unlocked' : 'achievement-badge--locked'}`}
                      title={`${ach.title}: ${ach.description} (${ach.progress}/${ach.target})`}
                    >
                      {ach.icon}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Chat Tab */}
            {sideTab === 'chat' && (
              <ChatLog
                messages={chatHistory}
                petName={petName}
                isStreaming={isStreaming}
              />
            )}

            {/* Memory Tab */}
            {sideTab === 'memory' && (
              <>
                <h2>Memory Queue</h2>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {memoryItems.length === 0 && (
                    <p className="memory-empty" style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No memories yet. Feed text to create one.</p>
                  )}
                  {memoryItems.map((item) => (
                    <div key={item.id} style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px',
                      marginBottom: '8px',
                    }}>
                      <p style={{ margin: '0 0 4px', fontSize: '0.8rem', fontWeight: 600 }}>{item.title}</p>
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{item.content}</small>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <button
                          onClick={() => setMemoryApproval(item.id, true)}
                          disabled={item.approved}
                          style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                        >
                          {item.approved ? '✓ Approved' : 'Approve'}
                        </button>
                        {item.approved && (
                          <button
                            onClick={() => setMemoryApproval(item.id, false)}
                            style={{ fontSize: '0.7rem', padding: '3px 8px' }}
                          >
                            Unapprove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <hr className="sep" />

                <h3>Feed Knowledge</h3>
                <textarea
                  value={feedText}
                  onChange={(e) => setFeedText(e.target.value)}
                  placeholder="Paste text, notes, or markdown..."
                  rows={3}
                  disabled={stage !== 'alive' || isStreaming}
                />
                <button
                  onClick={() => {
                    feedKnowledge(feedText);
                    setFeedText('');
                    spark();
                  }}
                  disabled={stage !== 'alive' || !feedText.trim() || isStreaming}
                  className="btn-primary"
                  style={{ width: '100%' }}
                >
                  Digest
                </button>
              </>
            )}

            {/* Journal Tab */}
            {sideTab === 'journal' && (
              <>
                <h2>Skill Journal</h2>
                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {journalEntries.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No journal entries yet. Daydream or complete tasks.</p>
                  )}
                  {journalEntries.map((entry) => (
                    <div key={entry.id} style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 8px',
                      marginBottom: '6px',
                      fontSize: '0.75rem',
                    }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        fontSize: '0.6rem',
                        background: entry.type === 'daydream' ? 'rgba(103,232,249,0.15)' : entry.type === 'task' ? 'rgba(244,114,182,0.15)' : 'rgba(148,163,184,0.1)',
                        color: entry.type === 'daydream' ? '#67e8f9' : entry.type === 'task' ? '#f472b6' : '#94b8d4',
                        marginBottom: '4px',
                      }}>
                        {entry.type}
                      </span>
                      <p style={{ margin: 0 }}>{entry.content}</p>
                      <small style={{ color: 'var(--text-muted)' }}>
                        {new Date(entry.createdAt).toLocaleString()}
                      </small>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Bottom Action Zone */}
      <footer className="action-zone">
        <div className="action-row">
          {ACTION_DEFS.map((def) => (
            <ActionButton
              key={def.action}
              action={def.action}
              icon={def.icon}
              label={def.label}
              onClick={() => {
                performAction(def.action as 'feed' | 'play' | 'sleep' | 'clean' | 'teach' | 'task' | 'daydream');
                spark();
              }}
              disabled={stage !== 'alive'}
              hotkey={`${ACTION_DEFS.indexOf(def) + 1}`}
            />
          ))}
        </div>

        <div className="chat-row">
          <input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={`Talk to ${petName}...`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendUserMessage();
            }}
            disabled={stage !== 'alive' || isStreaming}
          />
          <button
            onClick={sendUserMessage}
            disabled={stage !== 'alive' || isStreaming}
            className="btn-primary"
          >
            {isStreaming ? '···' : 'Send'}
          </button>
        </div>
      </footer>
    </main>
  );
};
