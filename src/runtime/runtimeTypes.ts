import type { ExperimentDefinition, ExperimentNode } from "../types/experiment";

export interface RuntimeObject {
  id: string;
  type: string;
  bounds?: { x:number; y:number; width:number; height:number };
  position?: { x:number; y:number };
  dimensions?: { width:number; height:number };
  visible: boolean;
  properties: Record<string, unknown>;
}

export interface TrialRecord {
  id: string;
  experimentId: string;
  sessionId: string;
  trialIndex: number;
  trialType?: "practice" | "main";
  condition?: string;
  startTime?: number;
  endTime?: number;
  stimulusNodeId?: string;
  responseNodeId?: string;
  stimulusShownAt?: number;
  responseAt?: number;
  reactionTimeMs?: number;
  response?: unknown;
  responseType?: string;
  correct?: boolean;
  timedOut?: boolean;
  completedAt: string;
  variables?: Record<string, unknown>;
  responses?: unknown[];
  data?: Record<string, unknown>;
}

export interface TrialStore {
  saveTrial(trial: TrialRecord): Promise<void> | void;
  getTrials(): Promise<TrialRecord[]> | TrialRecord[];
}

export interface RuntimeState {
  status: "idle"|"running"|"waiting-response"|"complete"|"error";
  currentNodeId: string|null;
  trial: TrialRecord|null;
  error?: string;
}

export interface RuntimeHost {
  showNode(node: ExperimentNode, object?: RuntimeObject): void;
  clearScreen?(): void;
  waitForResponse(
    node: ExperimentNode,
    context: { objects: RuntimeObject[]; onset?: number },
    onResponse: (response: unknown) => void,
    onTimeout: () => void
  ): void;
  finish(): void;
}

export interface RuntimeDefinition {
  experiment: ExperimentDefinition;
  store: TrialStore;
}
