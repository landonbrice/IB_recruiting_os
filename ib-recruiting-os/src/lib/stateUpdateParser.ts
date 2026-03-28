/**
 * stateUpdateParser.ts
 *
 * THE BIDIRECTIONAL DATA FLOW ENGINE.
 *
 * Parses structured JSON from coach responses (alongside conversational text)
 * and applies state updates across resumeState and decisionArc simultaneously.
 *
 * Coach responses can include a ```coach-response fenced block containing:
 *   { message: string, rewriteSuggestion?: string, stateUpdates?: StateUpdate[] }
 *
 * The stateUpdates use dot-path targets to address any part of storyState:
 *   "decisionArc.nodes.krg.positives"        → find node by ID, push to array
 *   "decisionArc.nodes.krg.impactStories.s1"  → find node, find/create story by ID
 *   "decisionArc.crystallizingMoment"          → set scalar
 */

import { parseBlock } from "./protocolParser";
import type { StoryState, ArcNode, ImpactStory } from "./storyState";
import type { StateUpdate } from "./resumeTypes";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ParsedCoachResponse {
  message: string;
  rewriteSuggestion?: string;
  stateUpdates: StateUpdate[];
}

interface CoachResponseBlock {
  message: string;
  rewriteSuggestion?: string;
  stateUpdates?: unknown[];
}

// ── Validation ───────────────────────────────────────────────────────────────

export function validateStateUpdate(u: unknown): u is StateUpdate {
  if (!u || typeof u !== "object") return false;
  const obj = u as Record<string, unknown>;
  return (
    typeof obj.target === "string" &&
    obj.target.length > 0 &&
    typeof obj.action === "string" &&
    ["add", "update", "remove"].includes(obj.action) &&
    "value" in obj
  );
}

// ── Parser ───────────────────────────────────────────────────────────────────

/**
 * Parse a coach response that may contain a ```coach-response JSON block.
 * Returns the conversational message (for display), any rewrite suggestion,
 * and validated state updates. If no block is found, the entire content
 * is treated as the message (backward compatible).
 */
export function parseCoachResponse(rawContent: string): ParsedCoachResponse {
  const block = parseBlock<CoachResponseBlock>(rawContent, "coach-response");

  if (!block || typeof block.message !== "string") {
    // No structured block — treat entire content as message, strip any other protocol blocks
    return {
      message: stripKnownBlocks(rawContent),
      stateUpdates: [],
    };
  }

  // Validate stateUpdates
  const validUpdates: StateUpdate[] = [];
  if (Array.isArray(block.stateUpdates)) {
    for (const u of block.stateUpdates) {
      if (validateStateUpdate(u)) validUpdates.push(u);
    }
  }

  return {
    message: block.message,
    rewriteSuggestion: typeof block.rewriteSuggestion === "string" ? block.rewriteSuggestion : undefined,
    stateUpdates: validUpdates,
  };
}

// ── State Applier ────────────────────────────────────────────────────────────

/**
 * Apply state updates to a StoryState, returning a new immutable copy.
 *
 * Dot-path resolution rules:
 * - "decisionArc.nodes.{nodeId}.field" → finds node by .id, not array index
 * - "decisionArc.nodes.{nodeId}.impactStories.{storyId}" → finds story by .id
 * - All other segments are treated as object keys
 *
 * Actions:
 * - "add": push value onto array target, or set if scalar
 * - "update": replace/merge at target path
 * - "remove": filter value out of array, or null-out scalar
 */
export function applyStateUpdates(
  current: StoryState,
  updates: StateUpdate[]
): StoryState {
  if (updates.length === 0) return current;

  // Deep clone to avoid mutation
  let state = structuredClone(current);

  for (const update of updates) {
    try {
      state = applySingleUpdate(state, update);
    } catch (err) {
      console.warn(`[stateUpdateParser] Failed to apply update to "${update.target}":`, err);
    }
  }

  return state;
}

function applySingleUpdate(state: StoryState, update: StateUpdate): StoryState {
  const segments = update.target.split(".");
  if (segments.length === 0) return state;

  // Navigate to parent, resolving special segments along the way
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parent: any = state;
  const lastSegment = segments[segments.length - 1];

  for (let i = 0; i < segments.length - 1; i++) {
    const seg = segments[i];
    const nextSeg = segments[i + 1];

    // Special handling: "nodes" segment followed by a nodeId
    if (seg === "nodes" && Array.isArray(parent.nodes)) {
      const node = parent.nodes.find((n: ArcNode) => n.id === nextSeg);
      if (!node) {
        // Node doesn't exist — skip this update
        console.warn(`[stateUpdateParser] Node "${nextSeg}" not found`);
        return state;
      }
      parent = node;
      i++; // skip the nodeId segment
      continue;
    }

    // Special handling: "impactStories" segment followed by a storyId
    if (seg === "impactStories" && Array.isArray(parent.impactStories)) {
      const story = parent.impactStories.find((s: ImpactStory) => s.id === nextSeg);
      if (story) {
        parent = story;
      } else if (update.action === "add" || update.action === "update") {
        // Create the story shell if it doesn't exist
        const newStory: ImpactStory = {
          id: nextSeg,
          type: "I",
          status: "draft",
          nickname: "",
          steppingStone: { answerFirst: "", actions: [], tension: "", resolution: "" },
          ibConnection: "",
          valueAdd: { category: "", past: "", future: "" },
          ...(typeof update.value === "object" && update.value !== null ? update.value as Partial<ImpactStory> : {}),
        };
        parent.impactStories.push(newStory);
        // If we're updating the entire story, we've already applied it
        if (i === segments.length - 2) return state;
        parent = parent.impactStories[parent.impactStories.length - 1];
      } else {
        console.warn(`[stateUpdateParser] Story "${nextSeg}" not found for remove`);
        return state;
      }
      i++; // skip the storyId segment
      continue;
    }

    // Regular object key traversal
    if (parent[seg] === undefined || parent[seg] === null) {
      parent[seg] = {};
    }
    parent = parent[seg];
  }

  // Apply the action at the final segment
  switch (update.action) {
    case "add":
      if (Array.isArray(parent[lastSegment])) {
        parent[lastSegment].push(update.value);
      } else {
        parent[lastSegment] = update.value;
      }
      break;

    case "update":
      if (
        typeof parent[lastSegment] === "object" &&
        parent[lastSegment] !== null &&
        !Array.isArray(parent[lastSegment]) &&
        typeof update.value === "object" &&
        update.value !== null
      ) {
        // Deep merge for objects
        parent[lastSegment] = { ...parent[lastSegment], ...update.value };
      } else {
        parent[lastSegment] = update.value;
      }
      break;

    case "remove":
      if (Array.isArray(parent[lastSegment])) {
        // Remove by value equality (string match) or by id
        parent[lastSegment] = parent[lastSegment].filter((item: unknown) => {
          if (typeof item === "string") return item !== update.value;
          if (typeof item === "object" && item !== null && "id" in item) {
            return (item as { id: string }).id !== update.value;
          }
          return true;
        });
      } else {
        parent[lastSegment] = null;
      }
      break;
  }

  return state;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function stripKnownBlocks(text: string): string {
  const blockTypes = [
    "coach-response", "resume-update", "resume-score",
    "profile-update", "cover-letter", "feasibility-score",
  ];
  let result = text;
  for (const bt of blockTypes) {
    // Strip complete fenced blocks
    result = result.replace(new RegExp("```" + bt + "[\\s\\S]*?```", "g"), "");
    // Strip incomplete/unclosed fenced blocks (LLM didn't close the fence)
    result = result.replace(new RegExp("```" + bt + "[\\s\\S]*$", "g"), "");
  }
  // Strip any remaining orphan JSON blocks that look like protocol output
  result = result.replace(/```\s*\{[\s\S]*$/g, "");
  return result.trim();
}
