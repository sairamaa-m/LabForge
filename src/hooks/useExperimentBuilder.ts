import { useCallback, useMemo, useState } from "react";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import type {
  BlockConfig,
  BlockDefinition,
  ExperimentDefinition,
  ExperimentNode,
} from "../types/experiment";
import { loadExperiment, saveExperiment } from "../utils/storage";
import {
  experimentNodeToFlowNode,
  experimentToReactFlow,
  flowNodeToExperimentNode,
  flowEdgeToExperimentEdge,
  type FlowExperimentEdge,
  type FlowExperimentNode,
} from "../utils/experimentFlowAdapter";

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

function buildInitialGraph(): Pick<ExperimentDefinition, "nodes" | "edges"> {
  const nodes: ExperimentNode[] = [
    { id: "start-1", type: "start", label: "Start", category: "flow", config: {}, position: { x: 60, y: 200 } },
    { id: "stimulus-1", type: "stimulus-text", label: "Stimulus", category: "stimulus", config: { stimulusType: "text", content: "RED", duration: 0 }, position: { x: 340, y: 200 } },
    { id: "response-1", type: "keyboard-response", label: "Keyboard Response", category: "response", config: { allowedKeys: ["F", "J"], timeoutMs: 3000 }, position: { x: 620, y: 200 } },
    { id: "end-1", type: "end", label: "End", category: "flow", config: {}, position: { x: 900, y: 200 } },
  ];
  const edges = [
    { id: "e-start-stimulus", source: "start-1", target: "stimulus-1" },
    { id: "e-stimulus-response", source: "stimulus-1", target: "response-1" },
    { id: "e-response-end", source: "response-1", target: "end-1" },
  ];
  return { nodes, edges };
}

function createExperimentShell(): ExperimentDefinition {
  const { nodes, edges } = buildInitialGraph();
  const now = new Date().toISOString();
  return {
    schemaVersion: "1.0",
    id: nextId("experiment"),
    name: "Untitled Experiment",
    description: "",
    version: 1,
    settings: { participantMode: "anonymous", allowResume: false },
    variables: [],
    nodes,
    edges,
    dataCollection: { saveReactionTime: true, saveResponses: true, saveAccuracy: true },
    metadata: { status: "draft", createdAt: now, updatedAt: now, participantCount: 0 },
  };
}

/**
 * Everything about the experiment EXCEPT the graph (nodes/edges). The graph
 * lives in its own state below because it is what React Flow controls
 * directly; keeping it separate means normal metadata edits (name, save
 * timestamps, etc.) never touch the node/edge array identities that React
 * Flow is tracking mid-drag/mid-connect.
 */
type ExperimentMeta = Omit<ExperimentDefinition, "nodes" | "edges">;

function splitExperiment(experiment: ExperimentDefinition): {
  meta: ExperimentMeta;
  nodes: FlowExperimentNode[];
  edges: FlowExperimentEdge[];
} {
  const meta: ExperimentMeta = {
    schemaVersion: experiment.schemaVersion,
    id: experiment.id,
    name: experiment.name,
    description: experiment.description,
    version: experiment.version,
    settings: experiment.settings,
    variables: experiment.variables,
    dataCollection: experiment.dataCollection,
    metadata: experiment.metadata,
  };
  const flow = experimentToReactFlow(experiment);
  return { meta, nodes: flow.nodes, edges: flow.edges };
}

export function useExperimentBuilder() {
  const initial = useMemo(() => splitExperiment(loadExperiment() ?? createExperimentShell()), []);

  const [meta, setMeta] = useState<ExperimentMeta>(initial.meta);
  // `nodes`/`edges` are the single source of truth for the live graph while
  // editing. They are React-Flow-native state, mutated ONLY via
  // applyNodeChanges/applyEdgeChanges/addEdge (or a targeted single-item
  // update), never regenerated wholesale from the canonical model except on
  // discrete structural replacements (load, AI replace, add block).
  const [nodes, setNodes] = useState<FlowExperimentNode[]>(initial.nodes);
  const [edges, setEdges] = useState<FlowExperimentEdge[]>(initial.edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const onNodesChange = useCallback((changes: NodeChange<FlowExperimentNode>[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange = useCallback((changes: EdgeChange<FlowExperimentEdge>[]) => {
    setEdges((eds) => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => {
      const isDuplicate = eds.some(
        (e) =>
          e.source === connection.source &&
          e.target === connection.target &&
          (e.sourceHandle ?? null) === (connection.sourceHandle ?? null) &&
          (e.targetHandle ?? null) === (connection.targetHandle ?? null)
      );
      if (isDuplicate) return eds;
      return addEdge({ ...connection, id: nextId("edge") }, eds);
    });
  }, []);

  const addNodeFromDefinition = useCallback((definition: BlockDefinition, position: { x: number; y: number }) => {
    const newNode: ExperimentNode = {
      id: nextId(definition.blockType),
      type: definition.blockType,
      label: definition.label,
      category: definition.category,
      config: { ...definition.defaultConfig },
      position,
    };
    setNodes((nds) => [...nds, experimentNodeToFlowNode(newNode)]);
    setSelectedNodeId(newNode.id);
  }, []);

  const updateNodeConfig = useCallback((nodeId: string, patch: BlockConfig) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, config: { ...node.data.config, ...patch } } }
          : node
      )
    );
  }, []);

  const setExperimentName = useCallback((name: string) => setMeta((prev) => ({ ...prev, name })), []);

  const replaceExperiment = useCallback((next: ExperimentDefinition) => {
    const split = splitExperiment(next);
    setMeta(split.meta);
    setNodes(split.nodes);
    setEdges(split.edges);
    setSelectedNodeId(null);
    setLastSavedAt(null);
  }, []);

  // Derived, read-only view of the full canonical experiment. Safe to
  // recompute every render because it is only consumed by things that
  // don't feed back into React Flow's controlled props (validation, save,
  // the properties panel's selected-node lookup) — never passed as the
  // `nodes`/`edges` prop on <ReactFlow>.
  const experiment = useMemo<ExperimentDefinition>(
    () => ({
      ...meta,
      nodes: nodes.map(flowNodeToExperimentNode),
      edges: edges.map(flowEdgeToExperimentEdge),
    }),
    [meta, nodes, edges]
  );

  const save = useCallback(() => {
    const now = new Date().toISOString();
    setMeta((prev) => {
      const updatedMeta = { ...prev, metadata: { ...prev.metadata, updatedAt: now } };
      const full: ExperimentDefinition = {
        ...updatedMeta,
        nodes: nodes.map(flowNodeToExperimentNode),
        edges: edges.map(flowEdgeToExperimentEdge),
      };
      saveExperiment(full);
      return updatedMeta;
    });
    setLastSavedAt(now);
  }, [nodes, edges]);

  const selectedNode = useMemo(
    () => experiment.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [experiment.nodes, selectedNodeId]
  );

  return {
    experiment,
    nodes,
    edges,
    selectedNode,
    selectedNodeId,
    setSelectedNodeId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNodeFromDefinition,
    updateNodeConfig,
    setExperimentName,
    replaceExperiment,
    save,
    lastSavedAt,
  };
}
