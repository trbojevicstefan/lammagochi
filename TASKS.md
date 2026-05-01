# Task Breakdown (GitHub-Issue Ready)

## Epic 1: Project Foundation
1. Initialize monorepo with `pnpm`, `apps/desktop`, and `packages/*`.
2. Set up TypeScript configs, linting, formatting, and scripts.
3. Add Tauri v2 desktop shell and run app in dev mode.
4. Add CI workflow for typecheck/lint/test/build.

## Epic 2: Onboarding and Ollama Connectivity
5. Implement Ollama health check.
6. Implement local model listing.
7. Build onboarding UI with model selection and setup help.
8. Persist selected model and reconnect on launch.

## Epic 3: Creature Lifecycle and 3D Scene
9. Build R3F scene scaffold and rendering pipeline.
10. Integrate egg model + idle animation.
11. Implement naming flow before hatch.
12. Implement hatch cinematic transition.
13. Load baby creature model and idle loops.

## Epic 4: Core State and Gameplay Loop
14. Implement Zustand store slices (profile, stats, gameplay, UI).
15. Implement stat system and decay tick logic.
16. Implement actions: feed/play/sleep/clean/daydream.
17. Implement XP and leveling calculations.
18. Implement level-based ability gates.

## Epic 5: Chat and LLM Behavior
19. Build chat bubble UX and collapsible log.
20. Implement prompt builder with creature-state injection.
21. Implement Ollama streaming response handling.
22. Implement strict word-cap enforcement and fallback logic.
23. Add model-family flavor profiles without breaking core identity.

## Epic 6: Feeding, Digesting, and Memory
24. Build feed input flow (paste text, `.txt`, `.md`).
25. Implement digesting state and outcome generation.
26. Implement memory candidate approval modal.
27. Persist approved memories and expose memory list panel.
28. Implement basic task actions (summarize/explain/rewrite/plan).

## Epic 7: Persistence Layer
29. Create SQLite schema with Drizzle migrations.
30. Add repository methods for profile/state/stats/memory/journal.
31. Implement app startup hydration.
32. Implement graceful save points and crash-safe writes.

## Epic 8: Journal, Reflection, and Proactivity
33. Implement daydream reflections and journal entries.
34. Build Skill Journal UI.
35. Add low-frequency proactive prompts from creature.
36. Add daily phase transitions (morning/day/evening/night).

## Epic 9: Quality and Performance
37. Add unit tests for level rules and decay math.
38. Add integration tests for Ollama adapter contracts.
39. Add state machine transition tests.
40. Run rendering performance pass and quality presets.

## Epic 10: Open Source Readiness
41. Add MIT `LICENSE`.
42. Add `CONTRIBUTING.md` and issue templates.
43. Add architecture and gameplay diagrams to docs.
44. Write demo script and recordable walkthrough steps.
45. Tag `v0.1.0-mvp` release checklist.
