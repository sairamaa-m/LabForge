import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ExperimentNodeData } from "../../../types/experiment";
import type { FlowExperimentNode } from "../../../utils/experimentFlowAdapter";
import { blockIcons, categoryAccent } from "../nodeVisuals";

/**
 * Short, human-readable summary lines shown in the node body so the graph
 * stays legible at a glance. Kept separate from the properties panel, which
 * shows the full editable form for the selected node.
 */
function summarizeConfig(data: ExperimentNodeData): string[] {
  const { blockType, config } = data;
  switch (blockType) {
    case "stimulus-text":
    case "stimulus-image":
    case "stimulus-audio":
    case "stimulus-video":
      return [
        String(config.stimulusType ?? blockType.replace("stimulus-", "")),
        `Duration: ${config.duration ?? 0} ms`,
      ];
    case "wait":
      return [`Duration: ${config.duration ?? 0} ms`];
    case "timer":
      return [String(config.timerName ?? ""), `Duration: ${config.duration ?? 0} ms`];
    case "keyboard-response": {
      const keys = Array.isArray(config.allowedKeys) ? config.allowedKeys : [];
      return [`Keys: ${keys.join(", ") || "—"}`];
    }
    case "mouse-response":
      return [`Timeout: ${config.timeoutMs ?? 0} ms`];
    case "multiple-choice": {
      const options = Array.isArray(config.options) ? config.options : [];
      return [`${options.length} options`];
    }
    case "record-data":
      return [`Field: ${config.fieldName ?? "—"}`];
    case "variable":
      return [`${config.variableName ?? "—"}`];
    case "loop":
      return [`${config.iterations ?? 1} iteration(s)`];
    case "if-else":
      return [String(config.condition || "No condition set")];
    case "randomize":
      return [config.seed ? `Seed: ${config.seed}` : "Random each run"];
    case "custom-function":
      return [config.definitionId ? `Block: ${config.definitionId}` : "Custom block"];
    case "shape":
      return [String(config.shape ?? "circle"), `Object: ${config.objectId ?? data.label}`];
    case "fixation":
      return [`Duration: ${config.duration ?? 0} ms`];
    case "clear-screen":
      return ["Remove visible objects"];
    case "text-input":
      return [`Max length: ${config.maxLength ?? 200}`];
    case "slider-response":
      return [`${config.min ?? 0} – ${config.max ?? 100}`];
    case "set-variable":
      return [`${config.variableName ?? "variable"}`];
    default:
      return [];
  }
}

function ExperimentNodeComponent({ data, selected }: NodeProps<FlowExperimentNode>) {
  const Icon = blockIcons[data.blockType];
  const accent = data.blockType === "end"
    ? { text: "text-red-700", bg: "bg-red-50", border: "border-red-200" }
    : categoryAccent[data.category];
  const lines = summarizeConfig(data);
  const isTerminal = data.blockType === "start" || data.blockType === "end";

  return (
    <div
      className={`w-52 rounded-lg border bg-white shadow-panel transition-shadow ${
        selected ? "border-signal ring-2 ring-signal/20" : accent.border
      }`}
    >
      {data.blockType !== "start" && (
        <Handle type="target" position={Position.Left} />
      )}
      <div className={`flex items-center gap-2 rounded-t-lg px-3 py-2 ${accent.bg}`}>
        <Icon className={`h-4 w-4 ${accent.text}`} strokeWidth={2} />
        <span className={`text-sm font-medium ${accent.text}`}>{data.label}</span>
      </div>
      {!isTerminal && (
        <div className="space-y-0.5 px-3 py-2.5">
          {lines.map((line, i) => (
            <div key={i} className="truncate text-xs text-ink-soft">
              {line}
            </div>
          ))}
        </div>
      )}
      {data.blockType === "if-else" ? (
        <>
          <Handle id="true" type="source" position={Position.Right} style={{ top: "35%" }} />
          <Handle id="false" type="source" position={Position.Right} style={{ top: "65%" }} />
        </>
      ) : data.blockType === "loop" ? (
        <>
          <Handle id="body" type="source" position={Position.Right} style={{ top: "35%" }} />
          <Handle id="exit" type="source" position={Position.Right} style={{ top: "65%" }} />
        </>
      ) : data.blockType !== "end" ? (
        <Handle type="source" position={Position.Right} />
      ) : null}
    </div>
  );
}

export default memo(ExperimentNodeComponent);
