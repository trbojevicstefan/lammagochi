# Coding Agent Prompt: Build Lamagotchi MVP

You are a senior full-stack game/product engineer. Build `Lamagotchi`, a local-first desktop cyberpet app where a local Ollama model is embodied as a 3D creature.

## Mission
Ship a polished MVP vertical slice with a magical hatch moment, strict early level word limits, local persistence, and core care loop.

## Product Constraints
- Desktop app: Tauri v2.
- Frontend: React + TypeScript + Vite.
- 3D: Three.js + React Three Fiber.
- State: Zustand.
- Persistence: SQLite + Drizzle ORM.
- Local AI: Ollama HTTP API (offline after setup).
- Tests: Vitest from day one.

## MVP Features (Must Have)
1. Onboarding: detect Ollama, detect local models, choose model.
2. Egg naming and hatch cinematic.
3. Main creature canvas and speech-bubble chat.
4. Core actions: Chat, Feed, Play, Sleep, Clean, Teach, Task, Daydream.
5. Stats: Hunger, Curiosity, Energy, Hygiene, Mood, Knowledge, Trust, Boredom, XP, Level.
6. Stat decay over time, including app-closed decay replay.
7. Level 1-10 strict word limits (L1=1 word, L2=2 ...).
8. Feed content: pasted text + `.txt` + `.md`.
9. Explicit memory approval flow.
10. Daydream reflection and skill journal entries.
11. Local persistence and safe-mode permissions baseline.

## Non-Goals
- No real tool execution (terminal/browser/email/calendar).
- No PDFs, no full RAG, no mobile, no voice.

## Behavioral Rules
- Creature personality: cute, curious, slightly weird, emotionally expressive.
- May refuse tasks if tired/hungry/under-leveled.
- Word cap must be hard-enforced even if model output violates prompt.
- Keep everything local-first with privacy messaging in UI.

## Architecture Requirements
- Use a monorepo layout (`apps/desktop`, `packages/core`, `packages/ai-adapter`, `packages/persistence`, `packages/ui`).
- Implement a clear domain state machine for creature modes.
- Build an Ollama adapter interface for health/list/chat stream.
- Implement prompt composer with level, cap, emotion, memory summary.

## Quality Bar
- 45+ FPS idle on normal laptops.
- Smooth hatch sequence and clean transitions.
- Clean TypeScript typing and testable modules.
- CI with typecheck/lint/tests/build.

## Deliverables
- Working codebase.
- README setup instructions.
- Initial tests for level/decay/word-cap logic.
- Docs aligned with PRD and implementation spec.

## Execution Plan
1. Scaffold monorepo + Tauri shell + CI.
2. Implement onboarding and Ollama integration.
3. Implement creature scene, egg flow, and hatch animation.
4. Implement gameplay store, stats, XP/level system.
5. Implement chat + word-cap enforcement.
6. Implement feeding, memory approval, and daydream journal.
7. Add tests, refine UX/performance, finalize docs.

Build iteratively with small commits and keep all major systems testable.
