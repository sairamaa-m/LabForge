import { useNavigate } from "react-router-dom";
import { FlaskConical, CheckCircle2, Users, FileEdit, Plus } from "lucide-react";
import Sidebar from "../components/layout/Sidebar";
import StatCard from "../components/dashboard/StatCard";
import ExperimentRow from "../components/dashboard/ExperimentRow";
import Button from "../components/ui/Button";
import { mockExperiments } from "../data/mockExperiments";

export default function Dashboard() {
  const navigate = useNavigate();

  const total = mockExperiments.length;
  const published = mockExperiments.filter((e) => e.metadata.status === "published").length;
  const drafts = mockExperiments.filter((e) => e.metadata.status === "draft").length;
  const participants = mockExperiments.reduce((sum, e) => sum + e.metadata.participantCount, 0);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 px-8 py-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Good morning, Researcher
            </h1>
            <p className="mt-1 text-sm text-ink-soft">
              Here's what's happening across your experiments.
            </p>
          </div>
          <Button onClick={() => navigate("/experiments/new")}>
            <Plus className="h-4 w-4" />
            New Experiment
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Experiments" value={total} icon={FlaskConical} />
          <StatCard label="Published Experiments" value={published} icon={CheckCircle2} />
          <StatCard label="Participants" value={participants} icon={Users} />
          <StatCard label="Draft Experiments" value={drafts} icon={FileEdit} />
        </div>

        <div className="mt-8">
          <h2 className="font-display text-base font-semibold tracking-tight">
            Recent Experiments
          </h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-line bg-white shadow-panel">
            {mockExperiments.map((experiment) => (
              <ExperimentRow key={experiment.id} experiment={experiment} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
