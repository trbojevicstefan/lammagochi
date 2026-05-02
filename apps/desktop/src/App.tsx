import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Panel } from '@lamagotchi/ui';
import { OllamaHttpAdapter } from '@lamagotchi/ai-adapter';
import { getWordCapForLevel, xpThreshold } from '@lamagotchi/core';
import { CreatureCanvas3D } from './CreatureCanvas3D';
import { useAppStore, type ChatMessage } from './store';
import { buildLamagotchiSystemPrompt } from './game/promptBuilder';
import { chooseAutonomousPrompt } from './game/simulationTick';
import { generateHeartbeatPrompt, buildTeachingPrompt } from './game/systemPrompt';
import { getEvolutionStage, getEvolutionName } from './game/evolution';
import { getUpcoming } from './game/stageAbilities';
import { getWeather, weatherIcons } from './game/weather';
import { StatMeter, ActionButton, ACTION_DEFS, ChatBubble, ChatLog, OnboardingScreen, HatchScreen, SettingsPanel, ToastContainer, ItemRibbon, showToast } from './ui';
import { MiniGameOverlay } from './ui/MiniGameOverlay';
import { PetControls } from './ui/PetControls';
import { canvasEngine } from './engine';
import { getCurrentSlot, checkRoutineStreak, getRoutineText } from './game/routine';
import { decideBehavior } from './game/behaviorTree';
import { getFriendshipTier, getTierInfo } from './game/friendship';
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
  const [sideTab, setSideTab] = useState<'care' | 'chat' | 'memory' | 'journal' | 'skills'>('care');
  const [interactionSpark, setInteractionSpark] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [miniGameOpen, setMiniGameOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [petMuted, setPetMuted] = useState(false);
  const [petPaused, setPetPaused] = useState(false);
  const [perfMode, setPerfMode] = useState<string>('full');
  const sparkTimeout = useRef<ReturnType<typeof setTimeout>>();
  const lastInteractionRef = useRef(Date.now());
  const abortRef = useRef<AbortController | null>(null);

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
    currentAnimation,
    currentSkin,
    behaviorEvents,
    preferences,
    personality,
    skillTrees,
    friendship,
    setPetName,
    setSkin,
    exportSave,
    importSave,
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
    useItem,
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
    lastInteractionRef.current = Date.now();
    setInteractionSpark(1);
    if (sparkTimeout.current) clearTimeout(sparkTimeout.current);
    sparkTimeout.current = setTimeout(() => setInteractionSpark(0), 600);
  }, []);

  // Hydrate on mount
  useEffect(() => {
    hydrateFromLocal();
  }, [hydrateFromLocal]);

  // "While you were away" summary after hydration
  useEffect(() => {
    if (stage !== 'alive') return;
    const lastTick = useAppStore.getState().lastTick;
    const minsAway = Math.floor((Date.now() - lastTick) / 60000);
    if (minsAway >= 5 && chatHistory.length === 0) {
      const awayMsg: ChatMessage = {
        id: `msg_away_${Date.now()}`,
        role: 'system',
        content: minsAway >= 1440
          ? `😴 You were gone for ${Math.floor(minsAway / 1440)} day(s)! ${petName} missed you.`
          : minsAway >= 120
            ? `💤 ${petName} waited ${Math.floor(minsAway / 60)}h ${minsAway % 60}m for you to return.`
            : `👋 Welcome back! ${petName} was alone for ${minsAway} minutes.`,
        timestamp: Date.now(),
      };
      addChatMessage(awayMsg);
    }
  }, [stage]); // eslint-disable-line

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

  // Routine timer
  useEffect(() => {
    const id = setInterval(() => {
      if (stage !== 'alive') return;
      const slot = getCurrentSlot();
      if (slot) checkRoutineStreak();
    }, 60000);
    return () => clearInterval(id);
  }, [stage]);

  // Heartbeat watchdog — behavior tree + memory + personality
  useEffect(() => {
    const id = setInterval(() => {
      if (stage !== 'alive' || isStreaming) return;
      const minsSinceInteraction = (Date.now() - lastInteractionRef.current) / 60000;
      const slot = getCurrentSlot();
      // Try behavior tree first (autonomous decisions)
      const decision = decideBehavior(stats, personality, dayPhase === 'night', minsSinceInteraction, !!slot);
      // Then personality chatter, then memory thoughts, then old fallback
      const heartbeat = decision.speech
        || generateHeartbeatPrompt(stats, dayPhase, minsSinceInteraction, preferences, behaviorEvents, personality);
      const prompt = heartbeat || chooseAutonomousPrompt(stats, dayPhase);
      if (prompt) setBubbleText(capWords(prompt, level) || prompt);
    }, 15000);
    return () => clearInterval(id);
  }, [capWords, dayPhase, isStreaming, level, setBubbleText, stage, stats, personality, preferences, behaviorEvents]);

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
        petName,
        memoryLines: memoryItems.filter((m) => m.approved).slice(0, 4).map((m) => `- ${m.title}: ${m.content}`),
      }),
    [dayPhase, level, memoryItems, modelName, stage, stats, taskDifficulty, petName],
  );

  // Send chat message to LLM
  const sendUserMessage = useCallback(async () => {
    if (stage !== 'alive' || !userInput.trim() || isStreaming || modelName === 'Not connected') return;
    const userMessage = userInput.trim();

    // Abort any existing stream
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

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
      // Detect teaching mode
      const isTeaching = /^teach\s/i.test(userMessage);
      const activePrompt = isTeaching
        ? buildTeachingPrompt(petName, level, userMessage.replace(/^teach\s+/i, ''))
        : systemPrompt;

      let full = '';
      for await (const chunk of adapter.streamChat({
        model: modelName,
        messages: [
          { role: 'system', content: activePrompt },
          { role: 'user', content: isTeaching ? `I want to learn about: ${userMessage.replace(/^teach\s+/i, '')}` : userMessage },
        ],
        temperature: 0.7,
        signal: controller.signal,
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
      <ToastContainer />
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
            <>
              <span className="topbar__phase">
                {dayPhase === 'morning' ? '🌅' : dayPhase === 'day' ? '☀️' : dayPhase === 'evening' ? '🌆' : '🌙'} {dayPhase}
              </span>
              <span className="topbar__phase" style={{fontSize:'0.7rem'}} title="Weather">
                {weatherIcons[getWeather().type]}
              </span>
              <span className="topbar__phase" style={{fontSize:'0.6rem',opacity:0.7}}>
                {getRoutineText(getCurrentSlot())}
              </span>
            </>
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
          <button
            onClick={() => setSettingsOpen(true)}
            style={{ fontSize: '0.7rem', padding: '4px 8px' }}
            title="Settings"
          >
            ⚙️
          </button>
          <button onClick={() => setMiniGameOpen(true)} style={{ fontSize:'0.7rem', padding:'4px 8px' }} title="Mini-Games">
            🎮
          </button>
          <button onClick={() => setControlsOpen(true)} style={{ fontSize:'0.7rem', padding:'4px 8px' }} title="Pet Controls">
            🎛️
          </button>
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
              currentAnimation={currentAnimation}
              skin={currentSkin}
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
            <button
              className={`tab-btn ${sideTab === 'skills' ? 'tab-btn--active' : ''}`}
              onClick={() => setSideTab('skills')}
            >
              Skills
            </button>
          </div>

          <div className="side-pane" key={sideTab}>
            <div className="side-pane-content">
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

                <hr className="sep" />

                {/* Upcoming Abilities */}
                <h2>Upcoming</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {getUpcoming(level, 3).map((ab) => (
                    <div key={ab.level} style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '4px 8px', borderRadius: 'var(--radius-sm)',
                      background: 'rgba(99,102,241,0.06)', border: '1px solid var(--border-subtle)',
                      fontSize: '0.68rem',
                    }}>
                      <span>{ab.icon}</span>
                      <span style={{ flex: 1, color: 'var(--text-secondary)' }}>{ab.title}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>Lv.{ab.level}</span>
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
            {/* Skills Tab */}
            {sideTab === 'skills' && (
              <>
                <h2>Skill Tree</h2>
                <div style={{flex:1,overflowY:'auto',display:'flex',flexDirection:'column',gap:'8px'}}>
                  {skillTrees.map(tree => {
                    const tier = tree.tiers[tree.currentTier];
                    const nextTier = tree.tiers[tree.currentTier + 1];
                    return (
                      <div key={tree.id} style={{
                        border:'1px solid var(--border-subtle)',borderRadius:'var(--radius-sm)',
                        padding:'8px',background:'rgba(99,102,241,0.04)',
                      }}>
                        <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'4px'}}>
                          <span style={{fontSize:'1.1rem'}}>{tree.icon}</span>
                          <span style={{fontWeight:600,fontSize:'0.78rem'}}>{tree.label}</span>
                          <span style={{marginLeft:'auto',fontSize:'0.6rem',color:'var(--text-muted)'}}>
                            Lv.{tree.currentTier + 1}/4
                          </span>
                        </div>
                        <div style={{fontSize:'0.68rem',color:'var(--text-secondary)',marginBottom:'4px'}}>
                          {tier.name}: {tier.description}
                        </div>
                        <div style={{height:'3px',background:'rgba(99,102,241,0.1)',borderRadius:'3px',overflow:'hidden'}}>
                          <div style={{height:'100%',width:`${Math.min(100,(tree.xp/((nextTier||tier).unlockLevel*10))*100)}%`,background:'var(--accent-cyan)',borderRadius:'3px'}}/>
                        </div>
                        <div style={{fontSize:'0.58rem',color:'var(--text-muted)',marginTop:'2px'}}>
                          {tree.xp} XP {nextTier ? `→ ${nextTier.name} at ${nextTier.unlockLevel*10} XP` : '● Mastered!'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            </div>
          </div>
        </div>
      </section>

      {/* Item Ribbon */}
      <ItemRibbon
        level={level}
        onUseItem={(item) => { useItem(item); spark(); }}
        disabled={stage !== 'alive' || isStreaming}
      />

      {/* Bottom Action Zone */}
      <footer className="action-zone">
        <div className="keyboard-hint">
          Press <span>1</span>-<span>7</span> for quick actions &middot; <span>Enter</span> to chat
        </div>
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
            placeholder={
              stats.hunger < 25 ? `${petName} looks hungry...` :
              stats.energy < 25 ? `${petName} seems sleepy...` :
              stats.hygiene < 25 ? `${petName} needs a wash...` :
              stats.boredom > 70 ? `${petName} wants to play...` :
              `Talk to ${petName}...`
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendUserMessage();
            }}
            disabled={stage !== 'alive' || isStreaming}
          />
          <button onClick={() => { setUserInput(`Teach ${petName} something new...`); }}
            disabled={stage !== 'alive' || isStreaming}
            style={{fontSize:'0.7rem',padding:'8px 10px',whiteSpace:'nowrap'}}
            title="Send a teaching prompt to the LLM">📖 Teach</button>
          {isStreaming ? (
            <button
              onClick={() => { abortRef.current?.abort(); setStreaming(false); setBubbleText('...'); }}
              className="btn-primary"
              style={{ background: 'rgba(248,113,113,0.2)', borderColor: '#f87171', color: '#f87171' }}
            >
              Stop
            </button>
          ) : (
            <button
              onClick={sendUserMessage}
              disabled={stage !== 'alive'}
              className="btn-primary"
            >
              Send
            </button>
          )}
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        petName={petName}
        modelName={modelName}
        soundEnabled={soundEnabled}
        level={level}
        xp={xp}
        stage={getEvolutionName(evolutionStage)}
        wordCap={getWordCapForLevel(level)}
        onRename={(name) => { setPetName(name); setSettingsOpen(false); }}
        onToggleSound={toggleSound}
        currentSkin={currentSkin}
        personality={personality}
        onSetSkin={setSkin}
        onExport={exportSave}
        onImport={importSave}
        friendship={friendship}
      />
      <MiniGameOverlay
        level={level}
        onClose={() => setMiniGameOpen(false)}
        isOpen={miniGameOpen}
        onReward={(xp, msg) => { showToast('xp', `+${xp} XP`, msg, 3000); }}
      />
      <PetControls
        isOpen={controlsOpen}
        onClose={() => setControlsOpen(false)}
        muted={petMuted}
        paused={petPaused}
        performanceMode={perfMode}
        onToggleMute={() => setPetMuted(m => !m)}
        onTogglePause={() => { setPetPaused(p => { if (!p) canvasEngine.pause(); else canvasEngine.resume(); return !p; }); }}
        onSetPerformance={(m) => { setPerfMode(m); canvasEngine.setMode(m as any); }}
      />
    </main>
  );
};
