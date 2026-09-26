import type { ReactNode } from "react";
import { X } from "lucide-react";
import type { BlockConfig, ExperimentNode } from "../../types/experiment";
import { getBlockDefinition } from "../../data/blockLibrary";

interface PropertiesPanelProps {
  node: ExperimentNode | null;
  onChange: (nodeId: string, patch: BlockConfig) => void;
  onDeselect: () => void;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-line bg-white px-2.5 py-1.5 text-sm text-ink focus:border-signal";

function NumberField({
  label,
  value,
  onCommit,
  suffix,
}: {
  label: string;
  value: number;
  onCommit: (v: number) => void;
  suffix?: string;
}) {
  return (
    <Field label={suffix ? `${label} (${suffix})` : label}>
      <input
        type="number"
        className={inputClass}
        defaultValue={value}
        key={value}
        onBlur={(e) => onCommit(Number(e.target.value) || 0)}
      />
    </Field>
  );
}

function TextField({
  label,
  value,
  onCommit,
}: {
  label: string;
  value: string;
  onCommit: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="text"
        className={inputClass}
        defaultValue={value}
        key={value}
        onBlur={(e) => onCommit(e.target.value)}
      />
    </Field>
  );
}

function KeysField({
  value,
  onCommit,
}: {
  value: string[];
  onCommit: (v: string[]) => void;
}) {
  return (
    <Field label="Allowed keys">
      <div className="flex flex-wrap gap-1.5">
        {value.map((key, i) => (
          <span
            key={i}
            className="flex items-center gap-1 rounded border border-line bg-paper px-2 py-1 font-mono text-xs"
          >
            {key.toUpperCase()}
            <button
              type="button"
              className="text-ink-soft hover:text-ink"
              onClick={() => onCommit(value.filter((_, idx) => idx !== i))}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <button
          type="button"
          className="rounded border border-dashed border-line px-2 py-1 text-xs text-ink-soft hover:border-signal hover:text-signal"
          onClick={() => {
            const key = window.prompt("Add a key (e.g. F, J, ArrowLeft)");
            if (key) onCommit([...value, key]);
          }}
        >
          + Add key
        </button>
      </div>
    </Field>
  );
}

export default function PropertiesPanel({ node, onChange, onDeselect }: PropertiesPanelProps) {
  if (!node) {
    return (
      <aside className="flex h-full w-72 shrink-0 flex-col border-l border-line bg-white">
        <div className="border-b border-line px-4 py-3">
          <h2 className="font-display text-sm font-semibold">Properties</h2>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-ink-soft">
          Select a node on the canvas to edit its properties.
        </div>
      </aside>
    );
  }

  const definition = getBlockDefinition(node.type);
  const config = node.config ?? {};

  if (!definition) {
    return (
      <aside className="flex h-full w-72 shrink-0 flex-col border-l border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <div>
            <h2 className="font-display text-sm font-semibold">Unknown block</h2>
            <p className="text-xs text-ink-soft">Unsupported block type: {node.type}</p>
          </div>
          <button
            className="text-ink-soft hover:text-ink"
            onClick={onDeselect}
            aria-label="Deselect node"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 py-4 text-sm text-ink-soft">
          This node cannot be edited because its block type is not registered.
        </div>
      </aside>
    );
  }

  const blockType = node.type;
  const label = node.label || definition.label;
  const commit = (patch: BlockConfig) => onChange(node.id, patch);

  return (
    <aside className="flex h-full w-72 shrink-0 flex-col border-l border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div>
          <h2 className="font-display text-sm font-semibold">{label}</h2>
          <p className="text-xs text-ink-soft">{definition?.description}</p>
        </div>
        <button
          className="text-ink-soft hover:text-ink"
          onClick={onDeselect}
          aria-label="Deselect node"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {(blockType === "stimulus-text" ||
          blockType === "stimulus-image" ||
          blockType === "stimulus-audio" ||
          blockType === "stimulus-video") && (
          <>
            <Field label="Type">
              <select
                className={inputClass}
                value={String(config.stimulusType ?? "")}
                onChange={(e) => commit({ stimulusType: e.target.value })}
              >
                <option value="text">Text</option>
                <option value="image">Image</option>
                <option value="audio">Audio</option>
                <option value="video">Video</option>
              </select>
            </Field>
            {blockType === "stimulus-text" && (
              <TextField
                label="Content"
                value={String(config.content ?? "")}
                onCommit={(v) => commit({ content: v })}
              />
            )}
            <NumberField
              label="Duration"
              suffix="ms"
              value={Number(config.duration ?? 0)}
              onCommit={(v) => commit({ duration: v })}
            />
          </>
        )}

        {blockType === "wait" && (
          <NumberField
            label="Duration"
            suffix="ms"
            value={Number(config.duration ?? 0)}
            onCommit={(v) => commit({ duration: v })}
          />
        )}

        {blockType === "timer" && (
          <>
            <TextField
              label="Timer name"
              value={String(config.timerName ?? "")}
              onCommit={(v) => commit({ timerName: v })}
            />
            <NumberField
              label="Duration"
              suffix="ms"
              value={Number(config.duration ?? 0)}
              onCommit={(v) => commit({ duration: v })}
            />
          </>
        )}

        {blockType === "keyboard-response" && (
          <>
            <KeysField
              value={Array.isArray(config.allowedKeys) ? (config.allowedKeys as string[]) : []}
              onCommit={(v) => commit({ allowedKeys: v })}
            />
            <NumberField
              label="Timeout"
              suffix="ms"
              value={Number(config.timeoutMs ?? 0)}
              onCommit={(v) => commit({ timeoutMs: v })}
            />
          </>
        )}

        {blockType === "mouse-response" && (
          <>
            <TextField label="Target object ID" value={String(config.targetId ?? "")} onCommit={(v) => commit({ targetId: v })} />
            <Field label="Mouse button">
              <select className={inputClass} value={String(config.allowedButton ?? "left")} onChange={(e) => commit({ allowedButton: e.target.value })}>
                <option value="left">Left</option><option value="middle">Middle</option><option value="right">Right</option>
              </select>
            </Field>
            <NumberField label="Timeout" suffix="ms" value={Number(config.timeoutMs ?? 0)} onCommit={(v) => commit({ timeoutMs: v })} />
          </>
        )}

        {blockType === "multiple-choice" && (
          <Field label="Options">
            <div className="space-y-1.5">
              {(Array.isArray(config.options) ? (config.options as string[]) : []).map(
                (opt, i) => (
                  <input
                    key={i}
                    type="text"
                    className={inputClass}
                    defaultValue={opt}
                    onBlur={(e) => {
                      const options = [...(config.options as string[])];
                      options[i] = e.target.value;
                      commit({ options });
                    }}
                  />
                )
              )}
              <button
                type="button"
                className="w-full rounded border border-dashed border-line px-2 py-1.5 text-xs text-ink-soft hover:border-signal hover:text-signal"
                onClick={() =>
                  commit({
                    options: [...(Array.isArray(config.options) ? config.options as string[] : []), `Option ${(Array.isArray(config.options) ? config.options.length : 0) + 1}`],
                  })
                }
              >
                + Add option
              </button>
            </div>
          </Field>
        )}

        {blockType === "shape" && (
          <>
            <Field label="Shape">
              <select className={inputClass} value={String(config.shape ?? "circle")} onChange={(e) => commit({ shape: e.target.value })}>
                <option value="circle">Circle</option><option value="rectangle">Rectangle</option>
              </select>
            </Field>
            <TextField label="Object ID" value={String(config.objectId ?? "")} onCommit={(v) => commit({ objectId: v })} />
            <TextField label="Fill" value={String(config.fill ?? "")} onCommit={(v) => commit({ fill: v })} />
            <NumberField label="X (%)" value={Number((config.position as Record<string,unknown> | undefined)?.x ?? 50)} onCommit={(v) => commit({ position: { ...((config.position as Record<string,unknown>) ?? {}), x: v } })} />
            <NumberField label="Y (%)" value={Number((config.position as Record<string,unknown> | undefined)?.y ?? 50)} onCommit={(v) => commit({ position: { ...((config.position as Record<string,unknown>) ?? {}), y: v } })} />
            <NumberField label="Width" value={Number((config.size as Record<string,unknown> | undefined)?.width ?? 160)} onCommit={(v) => commit({ size: { ...((config.size as Record<string,unknown>) ?? {}), width: v } })} />
            <NumberField label="Height" value={Number((config.size as Record<string,unknown> | undefined)?.height ?? 160)} onCommit={(v) => commit({ size: { ...((config.size as Record<string,unknown>) ?? {}), height: v } })} />
            <NumberField label="Duration" suffix="ms" value={Number(config.duration ?? 0)} onCommit={(v) => commit({ duration: v })} />
          </>
        )}

        {blockType === "fixation" && <NumberField label="Duration" suffix="ms" value={Number(config.duration ?? 500)} onCommit={(v) => commit({ duration: v })} />}

        {blockType === "text-input" && (
          <>
            <TextField label="Prompt" value={String(config.prompt ?? "")} onCommit={(v) => commit({ prompt: v })} />
            <TextField label="Placeholder" value={String(config.placeholder ?? "")} onCommit={(v) => commit({ placeholder: v })} />
            <NumberField label="Maximum length" value={Number(config.maxLength ?? 200)} onCommit={(v) => commit({ maxLength: v })} />
            <NumberField label="Timeout" suffix="ms" value={Number(config.timeoutMs ?? 0)} onCommit={(v) => commit({ timeoutMs: v })} />
          </>
        )}

        {blockType === "slider-response" && (
          <>
            <NumberField label="Minimum" value={Number(config.min ?? 0)} onCommit={(v) => commit({ min: v })} />
            <NumberField label="Maximum" value={Number(config.max ?? 100)} onCommit={(v) => commit({ max: v })} />
            <NumberField label="Step" value={Number(config.step ?? 1)} onCommit={(v) => commit({ step: v })} />
            <NumberField label="Initial value" value={Number(config.initialValue ?? 50)} onCommit={(v) => commit({ initialValue: v })} />
          </>
        )}

        {blockType === "set-variable" && (
          <>
            <TextField label="Variable name" value={String(config.variableName ?? "")} onCommit={(v) => commit({ variableName: v })} />
            <Field label="Operation">
              <select className={inputClass} value={String(config.operation ?? "set")} onChange={(e) => commit({ operation: e.target.value })}>
                <option value="set">Set</option><option value="calculate">Calculate</option>
                <option value="increment">Increment</option><option value="decrement">Decrement</option><option value="copy">Copy</option>
              </select>
            </Field>
            {config.operation === "copy" ? (
              <TextField label="Source variable" value={String(config.sourceVariable ?? "")} onCommit={(v) => commit({ sourceVariable: v })} />
            ) : (
              <TextField label="Value (literal)" value={String((config.value as Record<string,unknown> | undefined)?.value ?? config.value ?? "")} onCommit={(v) => commit({ value: { op: "literal", value: v } })} />
            )}
          </>
        )}

        {blockType === "randomize" && (
          <>
            <TextField label="Output variable" value={String(config.outputVariable ?? "")} onCommit={(v) => commit({ outputVariable: v })} />
            <Field label="Mode">
              <select className={inputClass} value={String(config.mode ?? "shuffle")} onChange={(e) => commit({ mode: e.target.value })}>
                <option value="shuffle">Shuffle</option><option value="choice">Random choice</option>
              </select>
            </Field>
          </>
        )}

        {blockType === "record-data" && (
          <TextField
            label="Field name"
            value={String(config.fieldName ?? "")}
            onCommit={(v) => commit({ fieldName: v })}
          />
        )}

        {blockType === "variable" && (
          <>
            <TextField
              label="Variable name"
              value={String(config.variableName ?? "")}
              onCommit={(v) => commit({ variableName: v })}
            />
            <TextField
              label="Initial value"
              value={String(config.initialValue ?? "")}
              onCommit={(v) => commit({ initialValue: v })}
            />
          </>
        )}

        {blockType === "loop" && (
          <NumberField
            label="Iterations"
            value={Number(config.iterations ?? 1)}
            onCommit={(v) => commit({ iterations: v })}
          />
        )}

        {blockType === "if-else" && (
          <TextField
            label="Condition"
            value={String(config.condition ?? "")}
            onCommit={(v) => commit({ condition: v })}
          />
        )}

        {blockType === "randomize" && (
          <TextField
            label="Seed (optional)"
            value={String(config.seed ?? "")}
            onCommit={(v) => commit({ seed: v })}
          />
        )}

        {blockType === "custom-function" && (
          <>
            <TextField
              label="Custom block definition ID"
              value={String(config.definitionId ?? "")}
              onCommit={(v) => commit({ definitionId: v })}
            />
            <p className="rounded-md border border-line bg-paper p-2.5 text-xs text-ink-soft">
              Custom blocks are reusable no-code groups. Arbitrary JavaScript is intentionally not supported.
            </p>
          </>
        )}

        {(blockType === "start" || blockType === "end") && (
          <p className="text-sm text-ink-soft">
            This block has no configurable properties.
          </p>
        )}
      </div>
    </aside>
  );
}
