/**
 * protocolParser.ts
 *
 * Strict, safe parsers for Claude protocol blocks embedded in chat output.
 * All functions return null / [] on any failure — no exceptions thrown.
 *
 * Supported block types: resume-update, resume-score, profile-update,
 * cover-letter, feasibility-score
 */

import type { ResumeUpdate, ResumeScore, CandidateProfile, FeasibilityScore } from "./types";

// ── Generic block extraction ────────────────────────────────────────────────

/**
 * Extract and JSON-parse the first matching code-fence block of `blockType`.
 * Returns null if the block is missing or malformed.
 */
export function parseBlock<T>(content: string, blockType: string): T | null {
  const regex = new RegExp("```" + blockType + "\\n([\\s\\S]*?)```");
  const match = regex.exec(content);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim()) as T;
  } catch {
    return null;
  }
}

/**
 * Extract and JSON-parse ALL matching code-fence blocks of `blockType`.
 * Skips individual malformed blocks rather than failing entirely.
 */
export function parseAllBlocks<T>(content: string, blockType: string): T[] {
  const results: T[] = [];
  const regex = new RegExp("```" + blockType + "\\n([\\s\\S]*?)```", "g");
  let match;
  while ((match = regex.exec(content)) !== null) {
    try {
      results.push(JSON.parse(match[1].trim()) as T);
    } catch {
      // skip malformed block
    }
  }
  return results;
}

// ── Type-safe validators ────────────────────────────────────────────────────

/** Validate that an unknown value conforms to ResumeUpdate. */
export function validateResumeUpdate(u: unknown): u is ResumeUpdate {
  if (!u || typeof u !== "object") return false;
  const obj = u as Record<string, unknown>;
  return (
    typeof obj.section === "string" &&
    typeof obj.newText === "string" &&
    (obj.company === undefined || typeof obj.company === "string") &&
    (obj.bulletIndex === undefined || typeof obj.bulletIndex === "number")
  );
}

/** Validate that an unknown value conforms to ResumeScore. */
export function validateResumeScore(s: unknown): s is ResumeScore {
  if (!s || typeof s !== "object") return false;
  const obj = s as Record<string, unknown>;

  const categories = obj.categories;
  const categoriesOk =
    Array.isArray(categories) &&
    categories.length === 5 &&
    categories.every((c) => {
      if (!c || typeof c !== "object") return false;
      const cc = c as Record<string, unknown>;
      return (
        typeof cc.name === "string" &&
        typeof cc.weight === "number" &&
        typeof cc.score === "number" &&
        typeof cc.weighted === "number"
      );
    });

  const listOfStrings = (v: unknown) =>
    Array.isArray(v) && v.every((x) => typeof x === "string");

  return (
    typeof obj.total === "number" &&
    categoriesOk &&
    listOfStrings(obj.working) &&
    listOfStrings(obj.hurting) &&
    typeof obj.nextStep === "string"
  );
}

const SCHOOL_TIERS = new Set(["target", "semi-target", "non-target"]);
const STAGES = new Set(["freshman", "sophomore", "junior", "senior", "mba", "career-switcher"]);
const BANK_TIERS = new Set(["bulge-bracket", "elite-boutique", "middle-market", "regional"]);
const NETWORKING = new Set(["cold", "some-contact", "internal-champion"]);

/** Validate that an unknown value is a partial CandidateProfile. */
export function validateProfileUpdate(
  p: unknown
): p is Partial<CandidateProfile> {
  if (!p || typeof p !== "object" || Array.isArray(p)) return false;
  const obj = p as Record<string, unknown>;

  const stringOpt = (v: unknown) => v === undefined || typeof v === "string";

  if (!stringOpt(obj.background)) return false;
  if (!stringOpt(obj.experienceLevel)) return false;
  if (!stringOpt(obj.targetGroup)) return false;
  if (!stringOpt(obj.targetBank)) return false;

  if (obj.schoolTier !== undefined && !SCHOOL_TIERS.has(String(obj.schoolTier))) return false;
  if (obj.stage !== undefined && !STAGES.has(String(obj.stage))) return false;
  if (obj.targetBankTier !== undefined && !BANK_TIERS.has(String(obj.targetBankTier))) return false;
  if (obj.networkingPosture !== undefined && !NETWORKING.has(String(obj.networkingPosture))) return false;

  return true;
}

// ── Convenience typed parsers ───────────────────────────────────────────────

/** Parse a resume-score block, returning null if missing or invalid. */
export function parseResumeScore(content: string): ResumeScore | null {
  const raw = parseBlock<unknown>(content, "resume-score");
  return raw && validateResumeScore(raw) ? raw : null;
}

/** Parse a profile-update block, returning null if missing or invalid. */
export function parseProfileUpdate(
  content: string
): Partial<CandidateProfile> | null {
  const raw = parseBlock<unknown>(content, "profile-update");
  return raw && validateProfileUpdate(raw) ? raw : null;
}

/** Parse all resume-update blocks, filtering out invalid entries. */
export function parseResumeUpdates(content: string): ResumeUpdate[] {
  return parseAllBlocks<unknown>(content, "resume-update").filter(
    validateResumeUpdate
  ) as ResumeUpdate[];
}

/** Parse a cover-letter block, returning the raw string or null. */
export function parseCoverLetter(content: string): string | null {
  const regex = /```cover-letter\n([\s\S]*?)```/;
  const match = regex.exec(content);
  return match ? match[1].trim() : null;
}

/** Parse a story-output block. */
export function parseStoryOutput(
  content: string
): { whyIB?: string; thread?: string; crystallizingMoment?: string } | null {
  return parseBlock<{ whyIB?: string; thread?: string; crystallizingMoment?: string }>(
    content,
    "story-output"
  );
}

/** Parse a networking-actions block. */
export function parseNetworkingActions(
  content: string
): { actions: string[]; template?: string } | null {
  return parseBlock<{ actions: string[]; template?: string }>(content, "networking-actions");
}

/** Validate that an unknown value conforms to FeasibilityScore. */
export function validateFeasibilityScore(s: unknown): s is FeasibilityScore {
  if (!s || typeof s !== "object") return false;
  const obj = s as Record<string, unknown>;
  const listOfStrings = (v: unknown) =>
    Array.isArray(v) && v.every((x) => typeof x === "string");
  return (
    typeof obj.score === "number" &&
    typeof obj.assessment === "string" &&
    typeof obj.biggestLeverage === "string" &&
    listOfStrings(obj.controllables) &&
    listOfStrings(obj.uncontrollables)
  );
}

/** Parse a feasibility-score block, returning null if missing or invalid. */
export function parseFeasibilityScore(content: string): FeasibilityScore | null {
  const raw = parseBlock<unknown>(content, "feasibility-score");
  return raw && validateFeasibilityScore(raw) ? raw : null;
}

/** Detect mode shift signals from assistant content. */
export function detectMode(
  content: string
): "diagnostic" | "editing" | "story" | "targeting" | "feasibility" | null {
  const lower = content.toLowerCase();
  if (lower.includes("```feasibility-score")) return "feasibility";
  if (lower.includes("```resume-update")) return "editing";
  if (
    lower.includes("why ib") ||
    lower.includes("your story") ||
    lower.includes("narrative")
  )
    return "story";
  if (lower.includes("targeting") && lower.includes("bank")) return "targeting";
  return null;
}
