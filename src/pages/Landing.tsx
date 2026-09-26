import { useNavigate } from "react-router-dom";
import {
  Beaker,
  Layers,
  Sparkles,
  Shuffle,
  Database,
  BarChart3,
  ArrowUpRight,
} from "lucide-react";
import Button from "../components/ui/Button";

const creationPaths = [
  {
    icon: Layers,
    title: "Start from a preset",
    body: "Load a validated paradigm — Stroop, N-Back, visual search — and adjust it to your protocol.",
  },
  {
    icon: Beaker,
    title: "Build visually",
    body: "Assemble trials from stimulus, timing, and response blocks on an infinite canvas. No code required.",
  },
  {
    icon: Sparkles,
    title: "Generate with AI",
    body: "Describe your paradigm in plain language and get a working experiment graph to refine.",
  },
];

const capabilities = [
  {
    icon: Beaker,
    title: "No-code visual builder",
    body: "A node-based editor purpose-built for trial structure: flow control, stimuli, timing, and response blocks that snap together.",
  },
  {
    icon: Sparkles,
    title: "AI-assisted creation",
    body: "Turn a written protocol into a starting graph, then edit it by hand — the AI proposes, you stay in control.",
  },
  {
    icon: Shuffle,
    title: "Advanced randomization",
    body: "Counterbalance conditions, shuffle trial order, and set seeds for reproducible runs across participants.",
  },
  {
    icon: Database,
    title: "Precise local data collection",
    body: "Reaction times and responses are captured on-device with millisecond precision before syncing anywhere.",
  },
  {
    icon: BarChart3,
    title: "Researcher analytics",
    body: "Track completion, drop-off, and response distributions per experiment as participants come in.",
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <Beaker className="h-5 w-5 text-signal" strokeWidth={2} />
          <span className="font-display text-[15px] font-semibold tracking-tight">
            ExperimentLab
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
          <Button variant="primary" onClick={() => navigate("/experiments/new")}>
            Create Experiment
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 pb-16 pt-12 text-center">
        <h1 className="font-display text-4xl font-semibold leading-[1.15] tracking-tight text-ink sm:text-5xl">
          Design complex behavioral experiments without writing code.
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
          ExperimentLab is a visual authoring environment for researchers: build trial
          structures, control timing and randomization, and collect precise response data —
          all without a line of JavaScript.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button
            variant="primary"
            className="px-6 py-3 text-base"
            onClick={() => navigate("/experiments/new")}
          >
            Create Experiment
            <ArrowUpRight className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            className="px-6 py-3 text-base"
            onClick={() => navigate("/dashboard")}
          >
            View dashboard
          </Button>
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-6 py-14">
          <h2 className="font-display text-xl font-semibold tracking-tight">
            Three ways to create an experiment
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {creationPaths.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-lg border border-line p-5">
                <Icon className="h-5 w-5 text-signal" strokeWidth={2} />
                <h3 className="mt-3 font-display text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <h2 className="font-display text-xl font-semibold tracking-tight">
          Built for rigorous behavioral research
        </h2>
        <div className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2">
          {capabilities.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex gap-3.5">
              <Icon className="mt-0.5 h-5 w-5 shrink-0 text-signal" strokeWidth={2} />
              <div>
                <h3 className="font-display text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-line px-6 py-8 text-center text-xs text-ink-soft">
        ExperimentLab — a research tooling project.
      </footer>
    </div>
  );
}
