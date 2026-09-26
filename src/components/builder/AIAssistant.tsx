import { useMemo, useState } from "react";
import { Bot, Sparkles, X, AlertTriangle } from "lucide-react";
import Button from "../ui/Button";
import type { ExperimentDefinition } from "../../types/experiment";
import { validateExperiment } from "../../utils/experimentValidation";
import { generateExperimentFromPrompt, getAIProviderStatus } from "../../services/aiExperimentService";

interface Props {
  onGenerate: (experiment: ExperimentDefinition) => void;
}

export default function AIAssistant({ onGenerate }: Props) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [message, setMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const status = useMemo(() => getAIProviderStatus(), []);

  const generate = async () => {
    if (isGenerating) return;

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt) {
      setMessage("Please describe the experiment you want to generate.");
      return;
    }

    setIsGenerating(true);
    setMessage("");

    try {
      const definition = await generateExperimentFromPrompt(trimmedPrompt);
      const validation = validateExperiment(definition);

      if (!validation.valid) {
        setMessage(`Generated experiment failed validation: ${validation.errors.join(" ")}`);
        return;
      }

      onGenerate(definition);
      setPrompt("");
      setMessage("Generated and validated. The graph is now editable.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Experiment generation failed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="absolute bottom-5 right-5 z-20">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:opacity-90"
          aria-label="Open ExperimentLab AI"
        >
          <Sparkles className="h-4 w-4" /> AI
        </button>
      ) : (
        <div className="w-80 rounded-xl border border-line bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Bot className="h-4 w-4 text-signal" /> ExperimentLab AI
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close AI assistant">
              <X className="h-4 w-4 text-ink-soft" />
            </button>
          </div>
          <div className="p-4">
            <p className="text-xs text-ink-soft">
              Describe the experiment you want. The AI service returns canonical experiment JSON,
              validates it, then loads the graph.
            </p>
            {status.configured ? (
              <p className="mt-2 flex items-start gap-1.5 rounded-md bg-amber-50 p-2 text-[11px] text-amber-800">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                {status.warning}
              </p>
            ) : (
              <p className="mt-2 flex items-start gap-1.5 rounded-md bg-paper p-2 text-[11px] text-ink-soft">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                No AI provider is configured — generating with a deterministic mock, not real AI. Set{" "}
                <code className="font-mono">{status.envVar}</code> in your .env file to use real generation.
              </p>
            )}
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={isGenerating}
              className="mt-3 h-28 w-full rounded-md border border-line px-3 py-2 text-sm focus:border-signal focus:outline-none disabled:opacity-60"
              placeholder="Create a reaction-time task where participants press F for red and J for blue."
            />
            <Button className="mt-3 w-full" onClick={generate} disabled={isGenerating}>
              <Sparkles className="h-4 w-4" />
              {isGenerating ? "Generating..." : "Generate experiment"}
            </Button>
            {message && (
              <p className="mt-3 rounded-md bg-paper p-2.5 text-xs text-ink-soft">{message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
