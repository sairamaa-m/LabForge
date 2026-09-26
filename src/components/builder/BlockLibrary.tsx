import { useState, type DragEvent } from "react";
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { categoryLabels, categoryOrder, blockDefinitions } from "../../data/blockLibrary";
import { blockIcons, categoryAccent } from "./nodeVisuals";

export const BLOCK_DRAG_MIME = "application/experimentlab-block";

export default function BlockLibrary() {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const handleDragStart = (event: DragEvent<HTMLDivElement>, blockType: string) => {
    event.dataTransfer.setData(BLOCK_DRAG_MIME, blockType);
    event.dataTransfer.effectAllowed = "move";
  };

  if (!open) {
    return (
      <aside className="flex w-11 shrink-0 flex-col items-center border-r border-line bg-white py-3">
        <button onClick={() => setOpen(true)} className="rounded-md p-2 text-ink-soft hover:bg-paper hover:text-ink" aria-label="Open block library" title="Block Library">
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col overflow-y-auto border-r border-line bg-white">
      <div className="flex items-center justify-between border-b border-line px-3 py-3">
        <div>
          <h2 className="font-display text-sm font-semibold">Blocks</h2>
          <p className="mt-0.5 text-xs text-ink-soft">Drag onto canvas</p>
        </div>
        <button onClick={() => setOpen(false)} className="rounded-md p-1.5 text-ink-soft hover:bg-paper hover:text-ink" aria-label="Collapse block library" title="Collapse">
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 px-2.5 py-3">
        {categoryOrder.map((category) => {
          const blocks = blockDefinitions.filter((b) => b.category === category);
          const accent = categoryAccent[category];
          const isExpanded = expanded[category] ?? true;
          return (
            <div key={category} className="mb-2">
              <button onClick={() => setExpanded((prev) => ({ ...prev, [category]: !isExpanded }))} className="flex w-full items-center justify-between rounded px-1.5 py-1 text-left text-xs font-medium text-ink-soft hover:bg-paper">
                <span>{categoryLabels[category]}</span>
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
              {isExpanded && (
                <div className="mt-1 space-y-1">
                  {blocks.map((block) => {
                    const Icon = blockIcons[block.blockType];
                    return (
                      <div key={block.blockType} draggable onDragStart={(e) => handleDragStart(e, block.blockType)} className={`flex cursor-grab items-center gap-2 rounded-md border ${accent.border} ${accent.bg} px-2.5 py-2 active:cursor-grabbing`} title={block.description}>
                        <Icon className={`h-3.5 w-3.5 shrink-0 ${accent.text}`} strokeWidth={2} />
                        <span className={`text-xs font-medium ${accent.text}`}>{block.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
