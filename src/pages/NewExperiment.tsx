import { useNavigate } from "react-router-dom";
import { Layers, Blocks, Sparkles, ArrowLeft, Clock } from "lucide-react";
import Sidebar from "../components/layout/Sidebar";
import Button from "../components/ui/Button";
import { mockPresets } from "../data/mockPresets";

export default function NewExperiment() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 px-8 py-8">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </button>

        <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
          New Experiment
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Choose how you'd like to start. You can always switch approaches later.
        </p>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {/* PRESET */}
          <div className="flex flex-col rounded-lg border border-line bg-white p-6 shadow-panel">
            <Layers className="h-6 w-6 text-signal" strokeWidth={2} />
            <h2 className="mt-4 font-display text-lg font-semibold">Start with a preset</h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              Begin from a ready-made experiment and adjust it to your protocol.
            </p>
            <div className="mt-5 flex-1 space-y-2.5">
              {mockPresets.map((preset) => (
                <div key={preset.id} className="rounded-md border border-line px-3 py-2.5">
                  <div className="text-sm font-medium text-ink">{preset.name}</div>
                  <div className="mt-0.5 text-xs text-ink-soft">{preset.description}</div>
                  <div className="mt-1.5 text-xs text-ink-soft/70">
                    {preset.blockCount} blocks
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-ink-soft">
              Preset execution arrives in a later phase — for now, presets are for browsing.
            </p>
          </div>

          {/* VISUAL BUILDER */}
          <div className="flex flex-col rounded-lg border-2 border-signal bg-white p-6 shadow-panel">
            <Blocks className="h-6 w-6 text-signal" strokeWidth={2} />
            <h2 className="mt-4 font-display text-lg font-semibold">Build visually</h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              Assemble your experiment from flow, stimulus, timing, and response blocks on an
              infinite canvas.
            </p>
            <div className="mt-5 flex-1 rounded-md border border-dashed border-line bg-paper p-4 text-xs text-ink-soft">
              Start → Stimulus → Response → End, ready to extend with drag-and-drop blocks.
            </div>
            <Button className="mt-5 w-full" onClick={() => navigate("/builder")}>
              Open Visual Builder
            </Button>
          </div>

          {/* AI CREATE */}
          <div className="flex flex-col rounded-lg border border-line bg-white p-6 opacity-70 shadow-panel">
            <Sparkles className="h-6 w-6 text-ink-soft" strokeWidth={2} />
            <h2 className="mt-4 font-display text-lg font-semibold">Generate with AI</h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              Describe your experiment in plain language and let AI draft the graph for you.
            </p>
            <div className="mt-5 flex-1 rounded-md border border-line bg-paper p-4 text-sm text-ink-soft">
              "A Stroop task with 40 trials, 60% incongruent, 2s response window…"
            </div>
            <div className="mt-5 flex items-center justify-center gap-2 rounded-md bg-paper py-2.5 text-sm text-ink-soft">
              <Clock className="h-4 w-4" />
              AI generation will be available in the next phase.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
