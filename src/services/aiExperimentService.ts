import type { ExperimentDefinition, ExperimentEdge, ExperimentNode } from "../types/experiment";

/**
 * AI generation boundary.
 *
 * AIAssistant.tsx never builds experiments itself — it only calls
 * `generateExperimentFromPrompt` and hands the result to
 * `validateExperiment()` / `replaceExperiment()`. This file is the only
 * place that knows whether a real provider is configured, and the only
 * place allowed to talk to it.
 *
 * REAL AI VS MOCK
 * ----------------
 * This project has no server/backend of its own — it's a static Vite SPA
 * (see package.json: no server folder, no API routes). That means there is
 * nowhere to hide a provider secret; any key used here is necessarily
 * readable by anyone who opens devtools on the deployed site. Given that
 * constraint, this file:
 *
 *   - Looks for VITE_ANTHROPIC_API_KEY (see `getAIProviderStatus`). If it is
 *     set, it calls the real Anthropic API directly from the browser and
 *     ALWAYS surfaces a warning (both in `getAIProviderStatus().warning` and
 *     in a console.warn) that this is unsafe for a public deployment.
 *   - If it is NOT set, it falls back to a deterministic, clearly-labeled
 *     mock so the rest of the pipeline (validation, builder, save/load) is
 *     still exercisable. The mock is never presented as real AI — callers
 *     should use `getAIProviderStatus()` to show the user which mode is
 *     active.
 *
 * For a production deployment, replace the direct `fetch` below with a call
 * to your own backend endpoint that holds the API key server-side, and
 * delete the client-side key path entirely.
 */

const AI_PROVIDER_ENV_VAR = "VITE_ANTHROPIC_API_KEY";
// Verify against https://docs.claude.com/en/docs/about-claude/models before
// shipping — model identifiers change over time and are not tracked by
// this codebase.
const AI_MODEL = "claude-sonnet-4-5";

export interface AIProviderStatus {
  configured: boolean;
  envVar: string;
  /** Non-null only when configured=true; always show this to the user. */
  warning: string | null;
}

export function getAIProviderStatus(): AIProviderStatus {
  const apiKey = (import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined)?.trim();
  if (apiKey) {
    return {
      configured: true,
      envVar: AI_PROVIDER_ENV_VAR,
      warning:
        "Using a browser-visible API key (no backend is configured in this project). Anyone who loads this page can read the key in devtools/network tab — fine for local development only.",
    };
  }
  return { configured: false, envVar: AI_PROVIDER_ENV_VAR, warning: null };
}

export async function generateExperimentFromPrompt(prompt: string): Promise<ExperimentDefinition> {
  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt) {
    throw new Error("Please describe the experiment you want to generate.");
  }

  const status = getAIProviderStatus();
  if (status.configured) {
    const apiKey = (import.meta.env.VITE_ANTHROPIC_API_KEY as string).trim();
    return callAnthropicProvider(trimmedPrompt, apiKey);
  }

  // No provider configured: deterministic mock fallback. Kept asynchronous
  // so the UI exercises the same loading/error lifecycle a real provider
  // would use.
  await new Promise((resolve) => setTimeout(resolve, 450));
  return createMockExperiment(trimmedPrompt);
}

// ---------------------------------------------------------------------------
// Real provider
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You generate psychology-experiment graphs for ExperimentLab.

Respond with ONLY a single JSON object — no prose, no markdown code fences,
no explanation before or after. The JSON must match this shape exactly:

{
  "schemaVersion": "1.0",
  "id": string,
  "name": string,
  "description": string,
  "version": 1,
  "settings": { "participantMode": "anonymous", "allowResume": false },
  "variables": [],
  "nodes": [
    {
      "id": string,
      "type": one of "start" | "end" | "if-else" | "loop" | "stimulus-text" |
        "stimulus-image" | "stimulus-audio" | "stimulus-video" | "shape" |
        "fixation" | "clear-screen" | "wait" | "timer" | "keyboard-response" |
        "mouse-response" | "multiple-choice" | "text-input" | "slider-response" |
        "record-data" | "variable" | "set-variable" | "randomize" | "custom-function",
      "label": string,
      "category": one of "flow" | "stimulus" | "timing" | "response" | "data" |
        "randomization" | "functions",
      "config": object (block-specific; use {} for start/end),
      "position": { "x": number, "y": number }
    }
  ],
  "edges": [ { "id": string, "source": nodeId, "target": nodeId } ],
  "dataCollection": { "saveReactionTime": true, "saveResponses": true, "saveAccuracy": true },
  "metadata": { "status": "draft", "createdAt": ISOString, "updatedAt": ISOString, "participantCount": 0 }
}

Rules:
- Exactly one "start" node and at least one "end" node, reachable from start.
- Space nodes left-to-right with position.x increasing by ~250-280 per step, position.y around 200-260.
- Do not invent block types outside the list above.
- Do not produce React components, HTML, or executable code — only this JSON shape.
- If the request cannot be represented with the available block types, still
  return your best-effort valid JSON graph rather than refusing, but keep the
  description field honest about what was approximated.`;

async function callAnthropicProvider(prompt: string, apiKey: string): Promise<ExperimentDefinition> {
  console.warn(
    "[aiExperimentService] Calling Anthropic API directly from the browser with a client-visible API key. " +
      "Do not ship this to a public deployment — add a backend proxy instead."
  );

  let response: Response;
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });
  } catch (err) {
    throw new Error(
      `Could not reach the AI provider (network error). ${err instanceof Error ? err.message : String(err)}`
    );
  }

  if (!response.ok) {
    const bodyText = await response.text().catch(() => "");
    throw new Error(`AI provider request failed (HTTP ${response.status}). ${bodyText}`.trim());
  }

  const data: unknown = await response.json();
  const textBlock =
    typeof data === "object" && data !== null && "content" in data
      ? (data as { content: Array<{ type: string; text?: string }> }).content.find((b) => b.type === "text")
      : undefined;

  if (!textBlock?.text) {
    throw new Error("AI provider returned no text content to parse.");
  }

  const cleaned = textBlock.text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI provider response was not valid JSON — could not parse an experiment from it.");
  }

  if (typeof parsed !== "object" || parsed === null || !Array.isArray((parsed as ExperimentDefinition).nodes)) {
    throw new Error("AI provider response was valid JSON but not a recognizable ExperimentDefinition.");
  }

  return parsed as ExperimentDefinition;
}

// ---------------------------------------------------------------------------
// Deterministic mock (fallback / demo only — not real AI)
// ---------------------------------------------------------------------------

/** Extracts "<key> for <condition>" pairs, e.g. "press F for RED and J for BLUE". */
function parseKeyConditionPairs(prompt: string): { key: string; condition: string }[] {
  const pairs: { key: string; condition: string }[] = [];
  const regex = /\b([a-zA-Z0-9]{1,3})\s+for\s+([a-zA-Z]+)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(prompt))) {
    pairs.push({ key: match[1].toUpperCase(), condition: match[2].toUpperCase() });
  }
  // De-duplicate by condition, keep first occurrence.
  const seen = new Set<string>();
  return pairs.filter((p) => (seen.has(p.condition) ? false : (seen.add(p.condition), true)));
}

function createMockExperiment(prompt: string): ExperimentDefinition {
  const now = new Date().toISOString();
  const id = `ai-experiment-${Date.now()}`;
  const pairs = parseKeyConditionPairs(prompt);

  if (pairs.length >= 2) {
    return createBranchingMockExperiment(id, now, prompt, pairs);
  }
  return createLinearMockExperiment(id, now, prompt, pairs[0]);
}

/** Best-effort single-word stimulus label when no explicit "<key> for <word>" pair was found. */
function detectSingleStimulusWord(prompt: string): string | undefined {
  const match = prompt.match(/\b(red|blue|green|yellow|black|white|circle|square|triangle)\b/i);
  return match ? match[1].toUpperCase() : undefined;
}

function createLinearMockExperiment(
  id: string,
  now: string,
  prompt: string,
  pair?: { key: string; condition: string }
): ExperimentDefinition {
  const key = pair?.key ?? "F";
  const stimulusContent = pair?.condition ?? detectSingleStimulusWord(prompt) ?? "READY";

  const nodes: ExperimentNode[] = [
    { id: "start-ai", type: "start", label: "Start", category: "flow", config: {}, position: { x: 80, y: 220 } },
    {
      id: "stimulus-ai",
      type: "stimulus-text",
      label: "Stimulus",
      category: "stimulus",
      config: { stimulusType: "text", content: stimulusContent, duration: 0 },
      position: { x: 350, y: 220 },
    },
    {
      id: "response-ai",
      type: "keyboard-response",
      label: "Keyboard Response",
      category: "response",
      config: { allowedKeys: [key], timeoutMs: 3000 },
      position: { x: 650, y: 220 },
    },
    {
      id: "data-ai",
      type: "record-data",
      label: "Record Response",
      category: "data",
      config: { fieldName: "response" },
      position: { x: 950, y: 220 },
    },
    { id: "end-ai", type: "end", label: "End", category: "flow", config: {}, position: { x: 1220, y: 220 } },
  ];

  const edges: ExperimentEdge[] = [
    { id: "e-start-stimulus", source: "start-ai", target: "stimulus-ai" },
    { id: "e-stimulus-response", source: "stimulus-ai", target: "response-ai" },
    { id: "e-response-data", source: "response-ai", target: "data-ai" },
    { id: "e-data-end", source: "data-ai", target: "end-ai" },
  ];

  return buildDefinition(id, now, prompt, nodes, edges, false);
}

/**
 * Handles a genuine two-(or more-)condition request by producing a graph
 * that branches: one stimulus, an if-else per extra condition, and a
 * separate keyboard-response per condition, converging on a shared
 * record-data/end. This is a best-effort STRUCTURAL representation — it
 * does NOT wire up conditional runtime execution (out of scope here; see
 * runtimeEngine.ts), so the "correct key per condition" logic is visible in
 * the graph but not enforced at runtime. This is called out in the
 * returned experiment's description rather than glossed over.
 */
function createBranchingMockExperiment(
  id: string,
  now: string,
  prompt: string,
  pairs: { key: string; condition: string }[]
): ExperimentDefinition {
  const stimulusContent = pairs.map((p) => p.condition).join(" or ");
  const nodes: ExperimentNode[] = [
    { id: "start-ai", type: "start", label: "Start", category: "flow", config: {}, position: { x: 80, y: 260 } },
    {
      id: "stimulus-ai",
      type: "stimulus-text",
      label: "Stimulus",
      category: "stimulus",
      config: { stimulusType: "text", content: stimulusContent, duration: 0 },
      position: { x: 340, y: 260 },
    },
    {
      id: "branch-ai",
      type: "if-else",
      label: "Condition",
      category: "flow",
      config: { condition: { op: "equals", left: { op: "literal", value: pairs[0].condition }, right: { op: "literal", value: pairs[0].condition } } },
      position: { x: 600, y: 260 },
    },
  ];
  const edges: ExperimentEdge[] = [
    { id: "e-start-stimulus", source: "start-ai", target: "stimulus-ai" },
    { id: "e-stimulus-branch", source: "stimulus-ai", target: "branch-ai" },
  ];

  pairs.forEach((pair, i) => {
    const responseId = `response-ai-${i}`;
    nodes.push({
      id: responseId,
      type: "keyboard-response",
      label: `Response (${pair.condition})`,
      category: "response",
      config: { allowedKeys: [pair.key], timeoutMs: 3000 },
      position: { x: 900, y: 160 + i * 200 },
    });
    edges.push({ id: `e-branch-response-${i}`, source: "branch-ai", target: responseId, sourceHandle: i === 0 ? "true" : "false" });
    edges.push({ id: `e-response-data-${i}`, source: responseId, target: "data-ai" });
  });

  nodes.push(
    {
      id: "data-ai",
      type: "record-data",
      label: "Record Response",
      category: "data",
      config: { fieldName: "response" },
      position: { x: 1200, y: 260 },
    },
    { id: "end-ai", type: "end", label: "End", category: "flow", config: {}, position: { x: 1480, y: 260 } }
  );
  edges.push({ id: "e-data-end", source: "data-ai", target: "end-ai" });

  return buildDefinition(id, now, prompt, nodes, edges, true);
}

function buildDefinition(
  id: string,
  now: string,
  prompt: string,
  nodes: ExperimentNode[],
  edges: ExperimentEdge[],
  isBranching: boolean
): ExperimentDefinition {
  const mockNotice = isBranching
    ? " [Mock AI: structural graph only — the per-condition correct-key logic is not wired into the runtime engine. Configure VITE_ANTHROPIC_API_KEY for a real, fully-modeled generation.]"
    : " [Mock AI: no provider configured — set VITE_ANTHROPIC_API_KEY for real generation.]";

  return {
    schemaVersion: "1.0",
    id,
    name: "AI Generated Experiment",
    description: prompt + mockNotice,
    version: 1,
    settings: { participantMode: "anonymous", allowResume: false },
    variables: [],
    nodes,
    edges,
    dataCollection: { saveReactionTime: true, saveResponses: true, saveAccuracy: true },
    metadata: { status: "draft", createdAt: now, updatedAt: now, participantCount: 0 },
  };
}
