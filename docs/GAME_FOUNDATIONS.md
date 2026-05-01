# Lamagotchi Game Foundations (Skill-Aligned)

## Architecture Boundaries
- Simulation state is owned in Zustand store and core logic modules.
- Renderer layer (`CreatureCanvas3D`) is view-only and derives motion from simulation mood/day phase.
- Prompt construction is isolated in `src/game/promptBuilder.ts`.
- Input/action vocabulary is centralized in `src/game/actionMap.ts`.

## UI Playfield Rules
- One primary persistent HUD cluster (left creature cluster).
- One compact secondary cluster (right panel with tab disclosure).
- Text-heavy surfaces (memory/journal) are DOM overlays with contained internal scrolling.
- Main viewport has no document scrolling on desktop.

## Asset and Runtime Conventions
- 3D runtime remains React Three Fiber + Three.js.
- Creature animation behavior is state-derived, not user camera driven.
- Model identity and local memory state are injected into system prompt for stable role behavior.

## Next Cornerstone Tasks
- Move persistence writes from localStorage to SQLite gateway wiring.
- Add explicit simulation tick module separate from store mutation plumbing.
- Add asset manifest keys for creature variants, FX, and audio cues.
