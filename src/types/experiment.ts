/** Canonical ExperimentLab model. This file intentionally has no React Flow imports. */
export type BlockCategory =
  | "flow"
  | "stimulus"
  | "timing"
  | "response"
  | "data"
  | "randomization"
  | "functions";

export type BlockType =
  | "start"
  | "end"
  | "if-else"
  | "loop"
  | "stimulus-text"
  | "stimulus-image"
  | "stimulus-audio"
  | "stimulus-video"
  | "wait"
  | "timer"
  | "keyboard-response"
  | "mouse-response"
  | "multiple-choice"
  | "record-data"
  | "variable"
  | "randomize"
  | "custom-function"
  | "shape"
  | "fixation"
  | "clear-screen"
  | "text-input"
  | "slider-response"
  | "set-variable";

export type BlockConfig = Record<string, unknown>;

export interface ExperimentNodeData extends Record<string, unknown> {
  label: string;
  category: BlockCategory;
  blockType: BlockType;
  config: BlockConfig;
}

export interface ExperimentNode {
  id: string;
  type: BlockType;
  label: string;
  category: BlockCategory;
  config: BlockConfig;
  position?: { x: number; y: number };
}

export interface ExperimentEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

export type ExperimentStatus = "draft" | "published";

export interface ExperimentMetadata {
  status: ExperimentStatus;
  createdAt: string;
  updatedAt: string;
  participantCount: number;
}

export interface ExperimentVariable {
  name: string;
  value: unknown;
}

export interface ExperimentDefinition {
  schemaVersion: "1.0";
  id: string;
  name: string;
  description: string;
  version: number;
  settings: {
    participantMode: "anonymous";
    allowResume: boolean;
  };
  variables: ExperimentVariable[];
  nodes: ExperimentNode[];
  edges: ExperimentEdge[];
  dataCollection: {
    saveReactionTime: boolean;
    saveResponses: boolean;
    saveAccuracy: boolean;
  };
  metadata: ExperimentMetadata;
}

/** Backward-compatible alias while the rest of the app migrates to the canonical model. */
export type Experiment = ExperimentDefinition;

export interface BlockPort {
  name: string;
  label: string;
  kind: "control" | "data";
  required?: boolean;
}

export interface BlockDefinition {
  blockType: BlockType;
  category: BlockCategory;
  label: string;
  description: string;
  defaultConfig: BlockConfig;
  inputs?: BlockPort[];
  outputs?: BlockPort[];
  configSchema?: Record<string, string>;
  participantVisible?: boolean;
  producesData?: boolean;
  timing?: "none" | "duration" | "response" | "trial";
  execution?: { kind: "control"|"stimulus"|"response"|"data"|"timing"; description: string };
  timeoutBehavior?: "continue"|"record-timeout"|"error";
  errorBehavior?: "error"|"skip"|"continue";
  allowedSourceHandles?: string[];
  allowedTargetTypes?: BlockType[];
}
