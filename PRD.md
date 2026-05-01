# Product Requirements Document (PRD): Lamagotchi

## 1. Product Summary
Lamagotchi is a local-first desktop cyberpet that embodies a local Ollama LLM as a living 3D creature. Users care for it, chat with it, and help it grow from a one-word baby into a capable companion through a game-like progression system.

## 2. Problem and Opportunity
Local LLMs are powerful but emotionally flat. Existing local AI tools are utility-first and low-delight. Lamagotchi creates attachment and retention by combining local privacy with playful progression and high-quality animation.

## 3. Goals
- Deliver a magical first 60 seconds: egg -> hatch -> first one-word reply.
- Keep everything local and offline-ready after Ollama/model setup.
- Build a polished vertical slice in 2-4 weeks.
- Provide open-source architecture that can scale into tools/plugins later.

## 4. Non-Goals (MVP)
- No real terminal execution.
- No browser automation.
- No email/calendar integrations.
- No PDF ingestion.
- No multiplayer/mobile/voice.

## 5. Target Users
- AI enthusiasts
- Developers
- Privacy/local-first users
- Users who enjoy expressive software toys

## 6. Core User Journey
1. App launches.
2. App checks Ollama health and model availability.
3. User selects local model.
4. User names egg.
5. Hatch cinematic plays.
6. Level 1 creature appears and replies in one word.
7. User starts care loop and earns XP.

## 7. Core Gameplay Systems

### 7.1 Actions (MVP)
- Chat
- Feed
- Play
- Sleep
- Clean
- Teach
- Task
- Daydream

### 7.2 Stats
- Hunger
- Curiosity
- Energy
- Hygiene
- Mood
- Knowledge
- Trust
- Boredom
- XP
- Level

### 7.3 Decay and Rhythm
- Gentle stat decay continues when app is closed.
- Daily rhythm states: morning, day, evening, night.

### 7.4 Life Rules
- Creature does not die in MVP.
- It can become low-energy/sad/dirty/bored/unresponsive.

## 8. Progression Model

### 8.1 Word-Cap Rules
- L1: 1 word
- L2: 2 words
- L3: 3 words
- L4: 4 words
- L5: 5 words
- Continue strict cap through L10.
- After L10 unlock sentence mode progression.

### 8.2 Ability Unlocks
- L1: Basic emotions, one-word replies
- L3: Tiny questions
- L4: Remembers name and simple prefs
- L5: Can accept notes/text feeding
- L6: Daydream available
- L7: Small summaries
- L8: Requests specific info food
- L9: Simple tasks
- L10: Sentence mode
- L15: Local file reading (permissioned)
- L20: Tool/plugin unlock framework

## 9. AI Behavior and Prompting
- System prompt receives creature state: level, word limit, mood, needs, permissions, memory summary.
- Strict output shaping enforces word cap.
- Behavior tone: cute, curious, slightly weird, emotionally expressive.
- Model may refuse actions if tired/hungry/under-leveled.

## 10. Memory and Feeding
- Feed input types in MVP: pasted text, `.txt`, `.md`, manual facts.
- Explicit memory approval required.
- Digesting phase converts feed into candidate memories and XP effects.
- User can inspect and delete memories.

## 11. UI/UX Requirements
- Center: main 3D creature canvas in a digital container frame.
- Bubble chat over creature.
- Side panel: compact stats/care state.
- Bottom: text input + action buttons.
- Optional collapsible chat log.

## 12. Visual and Animation Direction
- Stylized 3D cyberpet with terminal/CRT/pixel treatment.
- Creature: egg-dino-llama hybrid.
- Signature moment: hatch cinematic with glitch/liquid energy.
- Aesthetic target: expensive developer art toy.

## 13. Technical Requirements
- Desktop shell: Tauri v2.
- Frontend: React + TypeScript + Vite.
- 3D: Three.js + React Three Fiber.
- State: Zustand.
- Persistence: SQLite + Drizzle.
- Local LLM: Ollama HTTP API.
- Test stack: Vitest first, Playwright later.

## 14. Privacy and Security
- Local-only by default.
- No internet dependency for core use.
- Safe mode defaults on.
- Permission prompts for sensitive actions.
- Audit log for memory and future tool usage.

## 15. Success Metrics (MVP)
- Time to first hatch < 2 minutes from launch when Ollama is running.
- First-session completion (hatch + first interaction) > 80% in dogfood.
- Median frame rate >= 45 FPS on mid-tier laptops.
- 0 network calls during normal offline use.

## 16. Acceptance Criteria
- User can select model and hatch egg.
- L1-L10 word cap reliably enforced.
- Core actions mutate stats and trigger animations.
- Feed + digest + memory approval workflow works.
- Creature can daydream and log reflections.
- State persists after closing/reopening app.
- Build and run on Windows/macOS/Linux.
