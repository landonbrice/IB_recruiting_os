/**
 * resumeTypes.ts
 *
 * Types, scoring, and builders for the Resume tab.
 * Bullet-level data model + rules-based heuristic scoring.
 */

import type { EnrichedLine } from "./resumeStructure";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ResumeBullet {
  id: string;
  text: string;
  originalText: string;
  score: BulletScore | null;
  linkedStoryId: string | null;
  rewrites: BulletRewrite[];
  coachThread: BulletCoachMessage[];
  status: "untouched" | "reviewed" | "rewritten";
  // Location metadata from EnrichedLine
  section: string;
  company: string;
  roleTitle: string;
  bulletIndex: number;
  rawIndex: number;
}

export interface BulletScore {
  verb: "strong" | "moderate" | "weak";
  quantification: boolean;
  specificity: "high" | "medium" | "low";
  length: "good" | "too-long" | "too-short";
  overall: "strong" | "needs-work" | "weak";
}

export interface BulletRewrite {
  id: string;
  text: string;
  confidence?: "High" | "Medium" | "Low";
  risk?: "Low" | "Medium" | "High";
  source: "instant" | "coach";
  createdAt: number;
}

export interface BulletCoachMessage {
  role: "user" | "assistant";
  content: string;
  rewriteSuggestion?: string;
  stateUpdates?: StateUpdate[];
  timestamp: number;
}

export interface StateUpdate {
  target: string; // dot-path like "decisionArc.nodes.krg.positives"
  action: "add" | "update" | "remove";
  value: unknown;
}

// ── Verb Lists ───────────────────────────────────────────────────────────────

export const STRONG_VERBS = new Set([
  "executed", "structured", "originated", "mandated", "closed", "sourced",
  "diligenced", "led", "spearheaded", "analyzed", "quantified", "synthesized",
  "valued", "modeled", "generated", "delivered", "achieved", "negotiated",
  "built", "drove", "developed", "managed", "launched", "implemented",
  "designed", "created", "identified", "optimized", "reduced", "increased",
  "secured", "pitched", "underwrote", "evaluated", "orchestrated",
]);

export const WEAK_VERBS = new Set([
  "assisted", "helped", "supported", "participated", "worked",
  "contributed", "was", "were", "responsible", "involved",
  "aided", "attended", "observed", "shadowed",
]);

// IB-specific keywords that signal specificity
const IB_KEYWORDS = /\b(DCF|LBO|M&A|EBITDA|IRR|MOIC|comps|precedent\s+transactions?|pitch\s*book|due\s+diligence|capital\s+structure|accretion|dilution|enterprise\s+value|EV|TEV|CIM|IOI|LOI|EOI)\b/i;

// ── Scoring ──────────────────────────────────────────────────────────────────

export function scoreBulletRules(text: string): BulletScore {
  const trimmed = text.replace(/^[▪•\-·]\s*/, "").trim();
  const firstWord = trimmed.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "";

  // Verb strength
  let verb: BulletScore["verb"] = "moderate";
  if (STRONG_VERBS.has(firstWord)) verb = "strong";
  else if (WEAK_VERBS.has(firstWord)) verb = "weak";

  // Quantification: numbers, $, %, x multiples
  const quantification = /\b\d[\d,]*(?:\.\d+)?(?:\s*[%xX]|\s*(?:million|billion|thousand|mn|bn|k|mm|bps))?\b|\$\d/.test(trimmed);

  // Specificity: proper nouns, IB keywords, named tools/systems
  let specificity: BulletScore["specificity"] = "low";
  const hasIBKeyword = IB_KEYWORDS.test(trimmed);
  const hasProperNoun = /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/.test(trimmed.slice(firstWord.length));
  if (hasIBKeyword && hasProperNoun) specificity = "high";
  else if (hasIBKeyword || hasProperNoun || quantification) specificity = "medium";

  // Length
  let length: BulletScore["length"] = "good";
  if (trimmed.length > 180) length = "too-long";
  else if (trimmed.length < 50) length = "too-short";

  // Overall composite
  let overall: BulletScore["overall"] = "needs-work";
  if (verb === "strong" && (quantification || specificity === "high")) overall = "strong";
  else if (verb === "weak" && !quantification) overall = "weak";

  return { verb, quantification, specificity, length, overall };
}

// ── Builders ─────────────────────────────────────────────────────────────────

export function buildBulletsFromEnrichedLines(lines: EnrichedLine[]): ResumeBullet[] {
  return lines
    .filter((el) => el.type === "bullet")
    .map((el) => {
      const cleanText = el.text.replace(/^[▪•\-·]\s*/, "").trim();
      return {
        id: crypto.randomUUID(),
        text: cleanText,
        originalText: cleanText,
        score: scoreBulletRules(cleanText),
        linkedStoryId: null,
        rewrites: [],
        coachThread: [],
        status: "untouched" as const,
        section: el.section,
        company: el.company,
        roleTitle: el.roleTitle,
        bulletIndex: el.bulletIndex,
        rawIndex: el.rawIndex,
      };
    });
}

// ── Parse Bullet Variants (extracted from BulletModal) ───────────────────────

export interface ParsedVariant {
  text: string;
  confidence?: "High" | "Medium" | "Low";
  risk?: "Low" | "Medium" | "High";
}

export function parseBulletVariants(raw: string): ParsedVariant[] {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const out: ParsedVariant[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith("BULLET: ")) continue;
    const text = lines[i].replace(/^BULLET:\s*/, "").trim();
    let confidence: ParsedVariant["confidence"];
    let risk: ParsedVariant["risk"];

    const cLine = lines[i + 1] ?? "";
    const rLine = lines[i + 2] ?? "";

    if (/^CONFIDENCE:/i.test(cLine)) {
      const v = cLine.replace(/^CONFIDENCE:\s*/i, "").trim().toLowerCase();
      confidence = v === "high" ? "High" : v === "medium" ? "Medium" : v === "low" ? "Low" : undefined;
    }
    if (/^RISK:/i.test(rLine)) {
      const v = rLine.replace(/^RISK:\s*/i, "").trim().toLowerCase();
      risk = v === "high" ? "High" : v === "medium" ? "Medium" : v === "low" ? "Low" : undefined;
    }

    out.push({ text, confidence, risk });
  }

  return out;
}
