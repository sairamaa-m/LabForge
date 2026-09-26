import type { Edge, Node } from "@xyflow/react";
import type { ExperimentDefinition, ExperimentEdge, ExperimentNode, ExperimentNodeData } from "../types/experiment";

export type FlowExperimentNode = Node<ExperimentNodeData, "experimentNode">;
export type FlowExperimentEdge = Edge;

/**
 * Single-item converters.
 *
 * These exist so callers can convert ONE node/edge at a time (e.g. when
 * adding a single block, or patching a single node's config) instead of
 * regenerating the entire nodes/edges array from the canonical model.
 *
 * This matters: React Flow's controlled `nodes`/`edges` arrays must keep
 * stable object identity for anything that isn't actually changing, or
 * React Flow loses track of its own internal per-node bookkeeping
 * (measured dimensions, drag state, etc.) between renders. Rebuilding the
 * whole array from `ExperimentDefinition` on every render is what caused
 * the "trying to drag a node that is not initialized" warning and the
 * broken connections — see useExperimentBuilder.ts for how these are used.
 */
export function experimentNodeToFlowNode(node: ExperimentNode): FlowExperimentNode {
  return {
    id: node.id,
    type: "experimentNode",
    position: node.position ?? { x: 0, y: 0 },
    data: {
      label: node.label,
      category: node.category,
      blockType: node.type,
      config: node.config,
    },
  };
}

export function experimentEdgeToFlowEdge(edge: ExperimentEdge): FlowExperimentEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    ...(edge.sourceHandle ? { sourceHandle: edge.sourceHandle } : {}),
  };
}

export function flowNodeToExperimentNode(node: FlowExperimentNode): ExperimentNode {
  return {
    id: node.id,
    type: node.data.blockType,
    label: node.data.label,
    category: node.data.category,
    config: node.data.config,
    position: { x: node.position.x, y: node.position.y },
  };
}

export function flowEdgeToExperimentEdge(edge: FlowExperimentEdge): ExperimentEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    ...(edge.sourceHandle ? { sourceHandle: edge.sourceHandle } : {}),
  };
}

/**
 * Full-array converters. Only use these for discrete, structural
 * replacements of the whole graph: initial load from storage, and
 * replaceExperiment() (AI generation / undo-to-snapshot). Never call these
 * on every render or on every incremental change — that reintroduces the
 * node-identity churn described above.
 */
export function experimentToReactFlow(experiment: ExperimentDefinition): {
  nodes: FlowExperimentNode[];
  edges: FlowExperimentEdge[];
} {
  return {
    nodes: experiment.nodes.map(experimentNodeToFlowNode),
    edges: experiment.edges.map(experimentEdgeToFlowEdge),
  };
}

export function reactFlowToExperiment(
  experiment: ExperimentDefinition,
  nodes: FlowExperimentNode[],
  edges: FlowExperimentEdge[]
): ExperimentDefinition {
  return {
    ...experiment,
    nodes: nodes.map(flowNodeToExperimentNode),
    edges: edges.map(flowEdgeToExperimentEdge),
  };
}
