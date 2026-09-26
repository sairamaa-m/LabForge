# ExperimentLab — Phase 1

AI-powered no-code/low-code behavioral experiment platform for researchers.
This is the **application foundation only** — landing page, dashboard, new
experiment flow, and the visual experiment builder. No backend, auth, AI, or
IndexedDB yet; those arrive in later phases (see bottom of this file).

## Run it

```bash
npm install
npm run dev
```

Then open the URL Vite prints (typically http://localhost:5173).

To type-check and build for production:

```bash
npm run build
```

## What's here

- `/` — Landing page
- `/dashboard` — Researcher dashboard with mock experiments
- `/experiments/new` — Choose preset / visual builder / AI create
- `/builder` — Visual experiment builder (React Flow), the centerpiece of Phase 1

The builder's graph (nodes + edges) is the experiment definition. It's
persisted to `localStorage` on **Save** and reloaded on refresh.

## Folder structure

```
src/
  components/
    layout/     Sidebar
    builder/    BlockLibrary, PropertiesPanel, node visuals, custom node
    dashboard/  StatCard, ExperimentRow
    ui/         Button, StatusBadge
  pages/        Landing, Dashboard, NewExperiment, Builder
  types/        experiment.ts — the shared data model
  data/         mockExperiments, mockPresets, blockLibrary (block registry)
  hooks/        useExperimentBuilder — builder state + persistence
  utils/        storage.ts — localStorage read/write
```

## Future phases (not implemented yet, architecture allows for them)

2. Experiment runtime (execute the graph as a live trial sequence)
3. IndexedDB local trial storage + reaction-time measurement
4. Supabase backend + sync
5. Presets (currently just a browsable mock list)
6. AI experiment generation (currently a disabled "coming soon" card)
7. AI custom blocks (the Custom Function block is scaffolded, unimplemented)
8. Researcher results dashboard

## AI experiment generation

The Builder's AI assistant (bottom-right panel) needs a real provider key to
do real AI generation. Without one, it falls back to a deterministic mock
generator and says so directly in the panel — it never claims the mock is
real AI.

To enable real generation:

1. Copy `.env.example` to `.env`.
2. Set `VITE_ANTHROPIC_API_KEY=<your key>`.
3. Restart `npm run dev`.

**Security note:** this project has no backend, so the key is used directly
from the browser and is visible to anyone who inspects network requests on a
deployed build. This is fine for local development only. Before deploying
publicly, add a small backend endpoint that holds the key server-side and
point `src/services/aiExperimentService.ts` at that endpoint instead of
calling `api.anthropic.com` directly.
