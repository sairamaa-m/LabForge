import { useNavigate } from "react-router-dom";
import type { Experiment } from "../../types/experiment";
import { formatRelativeDate } from "../../data/mockExperiments";
import StatusBadge from "../ui/StatusBadge";
import Button from "../ui/Button";

export default function ExperimentRow({ experiment }: { experiment: Experiment }) {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-6 border-b border-line px-5 py-4 last:border-b-0">
      <div>
        <div className="font-medium text-ink">{experiment.name}</div>
      </div>
      <StatusBadge status={experiment.metadata.status} />
      <div className="w-28 text-right text-sm text-ink-soft">
        {experiment.metadata.participantCount.toLocaleString()} participants
      </div>
      <div className="w-32 text-right text-sm text-ink-soft">
        {formatRelativeDate(experiment.metadata.updatedAt)}
      </div>
      <Button variant="secondary" onClick={() => navigate("/builder")}>
        Open
      </Button>
    </div>
  );
}
