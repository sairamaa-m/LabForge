import type { ExperimentStatus } from "../../types/experiment";

const styles: Record<ExperimentStatus, string> = {
  draft: "bg-draft-soft text-draft",
  published: "bg-published-soft text-published",
};

const labels: Record<ExperimentStatus, string> = {
  draft: "Draft",
  published: "Published",
};

export default function StatusBadge({ status }: { status: ExperimentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
