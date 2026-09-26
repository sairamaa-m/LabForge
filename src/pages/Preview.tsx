import { useEffect, useState } from "react";
import { loadExperiment } from "../utils/storage";
import type { ExperimentDefinition } from "../types/experiment";
import PreviewRunner from "../runtime/PreviewRunner";

export default function Preview() {
  const [experiment, setExperiment] = useState<ExperimentDefinition | null>(null);
  useEffect(() => setExperiment(loadExperiment()), []);
  if (!experiment) return <div className="flex min-h-screen items-center justify-center bg-paper text-sm text-ink-soft">No saved experiment found.</div>;
  return <PreviewRunner experiment={experiment} />;
}
