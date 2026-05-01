# Implementation Specification: Lamagotchi MVP

## 1. Architecture

## 1.1 Monorepo Layout
```text
lamagotchi/
  apps/
    desktop/                 # Tauri shell + React frontend
  packages/
    core/                    # domain logic, state rules, leveling, stat decay
    ai-adapter/              # Ollama API client + prompt orchestration
    persistence/             # Drizzle schema + repositories
    ui/                      # shared UI components
    config/                  # constants and balancing tables
  docs/
    prompts/
  .github/
    workflows/
  README.md
  PRD.md
  IMPLEMENTATION_SPEC.md
  TASKS.md
  ROADMAP.md
  PROMPT_CODING_AGENT.md
```

## 1.2 Runtime Layers
- `UI Layer`: React screens, R3F scene, interaction controls.
- `Domain Layer`: finite-state behavior, leveling engine, rules.
- `AI Layer`: prompt builder + Ollama streaming adapter.
- `Persistence Layer`: SQLite repositories.
- `Desktop Layer`: Tauri host APIs and platform integration.

## 2. Domain Model

## 2.1 Creature States
```text
egg_idle
egg_naming
egg_hatching
baby_idle
baby_chatting
baby_digesting
baby_sleeping
baby_playing
baby_cleaning
baby_daydreaming
```

## 2.2 Stat Ranges
- Integer 0-100 for all care stats.
- `xp`: unbounded integer.
- `level`: starts at 1.

## 2.3 Decay Tick
- Foreground: every 60s apply small decay deltas.
- Background/offline: compute elapsed time and replay decay on next launch.

## 2.4 XP Sources
- chat interaction
- feed accepted
- task completed
- care action timing bonus
- daydream cycle completion

## 3. LLM Integration Contract

## 3.1 Ollama Adapter Interface (TypeScript)
```ts
interface OllamaAdapter {
  healthCheck(): Promise<{ ok: boolean; version?: string }>;
  listModels(): Promise<Array<{ name: string; size?: number }>>;
  streamChat(req: ChatRequest): AsyncGenerator<ChatChunk>;
}
```

## 3.2 ChatRequest
```ts
interface ChatRequest {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature: number;
  top_p?: number;
  seed?: number;
}
```

## 3.3 Prompt Assembly
System prompt sections:
1. Identity and tone
2. Level and word cap
3. Current emotion and needs
4. Allowed actions by level
5. Memory summary (approved only)
6. Output restrictions

## 3.4 Word Cap Enforcement
- Soft: prompt instruction.
- Hard: post-generation validator truncates to cap and normalizes punctuation.
- If invalid after retries: fallback token (e.g., `...` or mood word).

## 4. Data Model (SQLite + Drizzle)

## 4.1 Tables
- `pet_profile` (id, name, model_name, created_at, updated_at)
- `pet_state` (pet_id, level, xp, mood_state, day_phase, current_mode, last_tick_at)
- `pet_stats` (pet_id, hunger, curiosity, energy, hygiene, mood, knowledge, trust, boredom)
- `memory_items` (id, pet_id, type, title, content, source_ref, approved, created_at)
- `feed_events` (id, pet_id, input_type, raw_text, digest_status, xp_awarded, created_at)
- `task_events` (id, pet_id, task_type, difficulty, result_summary, xp_awarded, created_at)
- `journal_entries` (id, pet_id, entry_type, content, created_at)
- `permissions` (id, pet_id, permission_key, status, updated_at)

## 4.2 Indexes
- `memory_items(pet_id, approved)`
- `feed_events(pet_id, created_at)`
- `journal_entries(pet_id, created_at)`

## 5. UI Screens and Components

## 5.1 Screens
- Onboarding screen
- Main pet screen
- Memory review panel
- Settings panel

## 5.2 Core Components
- `CreatureCanvas3D`
- `SpeechBubble`
- `StatPanel`
- `ActionBar`
- `ChatInput`
- `MemoryApprovalModal`
- `SkillJournalPanel`

## 5.3 3D Scene Requirements
- One hero creature GLB.
- Egg and hatch VFX assets.
- Shader overlays: scanlines, chromatic split, soft bloom.
- LOD fallback and quality preset.

## 6. Animation State Mapping
- `idle`: breathing + blink.
- `hungry`: attention motion + subtle chirp.
- `sleepy`: slowed blink + sway.
- `clean`: sparkle and reset.
- `digesting`: glow pulse + thought bubble.
- `daydreaming`: dreamy distortion and memory glyphs.
- `level_up`: brief cinematic burst and confetti-glitch.

## 7. APIs (Internal App Contracts)

## 7.1 Commands
- `initializeApp()`
- `connectModel(modelName)`
- `sendChat(message)`
- `performAction(actionType)`
- `feedContent(payload)`
- `approveMemory(memoryId, approved)`
- `tickDecay(now)`

## 7.2 Events
- `MODEL_CONNECTED`
- `PET_HATCHED`
- `CHAT_STREAM_TOKEN`
- `STAT_CHANGED`
- `LEVEL_UP`
- `MEMORY_CANDIDATE_READY`
- `DAYDREAM_COMPLETED`

## 8. Testing Strategy
- Unit: level rules, word-cap validator, stat decay, XP progression.
- Integration: Ollama adapter with mocked responses.
- State machine tests: transition validity and side effects.
- Smoke E2E (later): onboarding to first response.

## 9. CI/CD
- GitHub Actions:
  - typecheck
  - lint
  - unit tests
  - build verification

## 10. Performance Targets
- Cold launch < 3s on dev machine.
- 45+ FPS average in idle scene.
- Chat response stream starts within 1.5s after request when local model is warm.

## 11. Security Model
- No arbitrary file writes in MVP.
- No external network calls except optional help links.
- Permission checks centralized in domain layer.
- Audit log append-only for key events.

## 12. Milestone Definition of Done
- Feature complete against PRD acceptance criteria.
- All critical path tests passing.
- README/setup validated from clean machine.
- Demo script reproducible in < 60 seconds.
