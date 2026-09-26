import type { Experiment } from "../types/experiment";

/**
 * Local mock data standing in for what Phase 4 (Supabase) will eventually
 * fetch from a real backend. Shape matches `Experiment` so swapping the
 * data source later doesn't require touching the dashboard UI.
 */
export const mockExperiments: Experiment[] = [
  {
    id: "exp-visual-memory",
    name: "Visual Memory Study",
    description: "Mock visual memory experiment",
    schemaVersion: "1.0",
    version: 1,
    settings: { participantMode: "anonymous", allowResume: false },
    variables: [],
    dataCollection: { saveReactionTime: true, saveResponses: true, saveAccuracy: true },
    nodes: [],
    edges: [],
    metadata: {
      status: "draft",
      createdAt: "2026-09-02T09:00:00Z",
      updatedAt: "2026-09-18T14:32:00Z",
      participantCount: 0,
    },
  },
  {
    id: "exp-reaction-time",
    name: "Reaction Time Experiment",
    description: "Mock reaction time experiment",
    schemaVersion: "1.0",
    version: 1,
    settings: { participantMode: "anonymous", allowResume: false },
    variables: [],
    dataCollection: { saveReactionTime: true, saveResponses: true, saveAccuracy: true },
    nodes: [],
    edges: [],
    metadata: {
      status: "published",
      createdAt: "2026-08-11T09:00:00Z",
      updatedAt: "2026-09-20T11:05:00Z",
      participantCount: 142,
    },
  },
  {
    id: "exp-attention-task",
    name: "Attention Task",
    description: "Mock attention experiment",
    schemaVersion: "1.0",
    version: 1,
    settings: { participantMode: "anonymous", allowResume: false },
    variables: [],
    dataCollection: { saveReactionTime: true, saveResponses: true, saveAccuracy: true },
    nodes: [],
    edges: [],
    metadata: {
      status: "published",
      createdAt: "2026-07-28T09:00:00Z",
      updatedAt: "2026-09-15T08:47:00Z",
      participantCount: 89,
    },
  },
];

export function formatRelativeDate(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.round(diffDays / 30);
  if (diffMonths === 1) return "1 month ago";
  return `${diffMonths} months ago`;
}
