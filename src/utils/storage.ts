import type { ExperimentDefinition } from "../types/experiment";

const STORAGE_PREFIX = "experimentlab:experiment:";
const DEFAULT_KEY = `${STORAGE_PREFIX}current`;

export function saveExperiment(experiment: ExperimentDefinition, key: string = DEFAULT_KEY): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(experiment));
  } catch (err) {
    console.error("Failed to save experiment to localStorage", err);
  }
}

export function loadExperiment(key: string = DEFAULT_KEY): ExperimentDefinition | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as ExperimentDefinition;
  } catch (err) {
    console.error("Failed to load experiment from localStorage", err);
    return null;
  }
}
