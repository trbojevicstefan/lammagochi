# Lamagotchi

Lamagotchi is a local-first desktop cyberpet where a local LLM (via Ollama) is embodied as a growing 3D creature.

## MVP Promise
A magical hatch moment + strict early progression + local AI companion loop.

## Core Experience
1. Launch app.
2. Detect Ollama and local models.
3. Choose model.
4. Name egg.
5. Egg hatches into Lamagotchi.
6. Chat in creature bubble (Level 1 = one word).
7. Care loop: Feed, Play, Sleep, Clean, Teach, Task, Daydream.

## Tech Stack
- Tauri v2
- React + TypeScript + Vite
- Three.js + React Three Fiber
- Zustand
- SQLite + Drizzle ORM
- Ollama HTTP API
- Vitest (+ Playwright later)

## Principles
- Local-first and offline-capable.
- Permissioned memory and tool unlocks.
- Gameplay as capability progression.
- Polished vertical slice over broad feature spread.

## Quick Start (target)
```bash
pnpm install
pnpm dev
```

## Documentation
- [PRD](./PRD.md)
- [Implementation Specification](./IMPLEMENTATION_SPEC.md)
- [Task Breakdown](./TASKS.md)
- [Roadmap](./ROADMAP.md)
- [Agent Build Prompt](./PROMPT_CODING_AGENT.md)

## License
MIT
