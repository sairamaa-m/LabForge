export interface PresetSummary {
  id: string;
  name: string;
  description: string;
  blockCount: number;
}

/**
 * Placeholder catalogue only — Phase 5 will turn these into real,
 * loadable experiment graphs. For now they exist so the "Start from
 * a preset" path in New Experiment doesn't feel empty.
 */
export const mockPresets: PresetSummary[] = [
  {
    id: "preset-stroop",
    name: "Stroop Task",
    description: "Classic color–word interference paradigm with congruent and incongruent trials.",
    blockCount: 9,
  },
  {
    id: "preset-n-back",
    name: "N-Back Task",
    description: "Working memory task with configurable sequence length and match probability.",
    blockCount: 11,
  },
  {
    id: "preset-visual-search",
    name: "Visual Search",
    description: "Target detection among distractors, measuring reaction time by set size.",
    blockCount: 8,
  },
];
