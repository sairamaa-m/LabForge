# ExperimentLab Phase 2

Implemented the Phase 2 architecture on top of the Phase 1 project.

## Added
- Canonical `ExperimentDefinition` independent of React Flow.
- React Flow adapter: `src/utils/experimentFlowAdapter.ts`.
- Experiment validator: `src/utils/experimentValidation.ts`.
- Collapsible/accordion block library.
- Semantic node category colors.
- AI assistant UI with a local mock generator and validation boundary.
- Participant preview route: `/preview`.
- Minimal runtime engine for START → STIMULUS → RESPONSE → DATA → END.
- Local high-resolution reaction-time calculation using `performance.now()`.
- `TrialStore` abstraction with an in-memory implementation for Phase 2.
- Arbitrary JavaScript removed from Custom Function configuration.

## Intentionally not included
Supabase, IndexedDB, authentication, real AI provider, analytics, export, advanced IF/LOOP execution, and custom-block authoring. Those remain later phases.

## Runtime timing rule
No network operation exists in the reaction-time measurement path. The stimulus and response timestamps are captured locally with `performance.now()`, RT is calculated locally, and the completed trial is passed to `TrialStore`.

## Verification
The container did not have `node_modules`. Attempts to run `npm install` timed out because dependencies could not be installed in the available environment, so `npm run build` / `npm run lint` could not be fully verified here.
