import { useCallback, useMemo, useRef, useState, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, Save, Eye, Rocket, Check, AlertTriangle } from "lucide-react";
import Button from "../components/ui/Button";
import BlockLibrary, { BLOCK_DRAG_MIME } from "../components/builder/BlockLibrary";
import PropertiesPanel from "../components/builder/PropertiesPanel";
import ExperimentNodeComponent from "../components/builder/nodes/ExperimentNode";
import { getBlockDefinition } from "../data/blockLibrary";
import { useExperimentBuilder } from "../hooks/useExperimentBuilder";
import AIAssistant from "../components/builder/AIAssistant";
import { validateExperiment } from "../utils/experimentValidation";

const nodeTypes: NodeTypes = { experimentNode: ExperimentNodeComponent };

function BuilderCanvas() {
  const navigate = useNavigate();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [justSaved, setJustSaved] = useState(false);

  const {
    experiment,
    nodes,
    edges,
    selectedNode,
    setSelectedNodeId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNodeFromDefinition,
    updateNodeConfig,
    setExperimentName,
    save,
    replaceExperiment,
  } = useExperimentBuilder();

  const validation = useMemo(() => validateExperiment(experiment), [experiment]);

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const blockType = event.dataTransfer.getData(BLOCK_DRAG_MIME);
      if (!blockType) return;
      const definition = getBlockDefinition(blockType);
      if (!definition) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      addNodeFromDefinition(definition, position);
    },
    [addNodeFromDefinition, screenToFlowPosition]
  );

  const handleSave = useCallback(() => {
    save();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1800);
  }, [save]);

  const proOptions = useMemo(() => ({ hideAttribution: true }), []);

  return (
    <div className="flex h-screen flex-col">
      {/* TOP BAR */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-white px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1 text-sm text-ink-soft hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <input
            className="font-display text-sm font-semibold tracking-tight focus:outline-none"
            value={experiment.name}
            onChange={(e) => setExperimentName(e.target.value)}
            aria-label="Experiment name"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleSave}>
            {justSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
            {justSaved ? "Saved" : "Save"}
          </Button>
          <Button variant="secondary" onClick={() => { save(); navigate("/preview"); }}>
            <Eye className="h-4 w-4" />
            Preview
          </Button>
          <Button variant="primary">
            <Rocket className="h-4 w-4" />
            Publish
          </Button>
        </div>
      </header>

      {/* THREE PANEL LAYOUT */}
      <div className="flex min-h-0 flex-1">
        <BlockLibrary />

        <div className="relative flex-1" ref={wrapperRef} onDragOver={handleDragOver} onDrop={handleDrop}>
          <ReactFlow
            className="xlab-flow"
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onPaneClick={() => setSelectedNodeId(null)}
            proOptions={proOptions}
            fitView
            deleteKeyCode={["Backspace", "Delete"]}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#D8D5CC" />
            <Controls showInteractive={false} />
            <MiniMap
              pannable
              zoomable
              nodeColor="#E3E1DA"
              maskColor="rgba(250, 250, 248, 0.6)"
            />
          </ReactFlow>
          <AIAssistant onGenerate={replaceExperiment} />
          {!validation.valid && (
            <div className="absolute left-4 top-4 z-10 flex max-w-sm items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow-sm">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{validation.errors[0]}</span>
            </div>
          )}
        </div>

        <PropertiesPanel
          node={selectedNode}
          onChange={updateNodeConfig}
          onDeselect={() => setSelectedNodeId(null)}
        />
      </div>
    </div>
  );
}

export default function Builder() {
  return (
    <ReactFlowProvider>
      <BuilderCanvas />
    </ReactFlowProvider>
  );
}
