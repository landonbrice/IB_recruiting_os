/**
 * plausibilityCheck.ts — Lightweight heuristic validator for rewritten bullets.
 *
 * Runs client-side with zero latency. Advisory only — never blocks apply.
 */

import type { CandidateProfile } from "./types";

export interface PlausibilityResult {
  plausible: boolean;
  warnings: string[];
  riskLevel: "safe" | "caution" | "flag";
}

export function checkPlausibility(
  originalBullet: string,
  rewrittenBullet: string,
  roleTitle: string,
  candidateProfile: CandidateProfile
): PlausibilityResult {
  const warnings: string[] = [];
  let maxRisk = "safe" as string;

  const raise = (level: "caution" | "flag", msg: string) => {
    warnings.push(msg);
    if (level === "flag" || (level === "caution" && maxRisk === "safe")) {
      maxRisk = level;
    }
  };

  // 1. Dollar amount inflation
  const origDollars = originalBullet.match(/\$[\d,.]+\s*[mbkMBK]?/g) ?? [];
  const rewriteDollars = rewrittenBullet.match(/\$[\d,.]+\s*[mbkMBK]?/g) ?? [];
  if (rewriteDollars.length > 0 && origDollars.length === 0) {
    raise("caution", "New dollar figure added — make sure you can defend this number");
  }

  // 2. Title inflation for junior candidates
  const juniorStages = new Set(["freshman", "sophomore"]);
  const isJunior = candidateProfile.stage && juniorStages.has(candidateProfile.stage);
  const seniorityWords = /\b(led|directed|managed team of|oversaw|spearheaded a team)\b/i;
  if (isJunior && seniorityWords.test(rewrittenBullet) && !seniorityWords.test(originalBullet)) {
    raise("caution", "Leadership language added — may not match your experience level");
  }

  // 3. Specificity fabrication — new proper nouns / company names
  const properNounPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/g;
  const origNames = new Set((originalBullet.match(properNounPattern) ?? []).map(n => n.toLowerCase()));
  const rewriteNames = (rewrittenBullet.match(properNounPattern) ?? []).map(n => n.toLowerCase());
  const newNames = rewriteNames.filter(n => !origNames.has(n) && !isCommonPhrase(n));
  if (newNames.length > 0) {
    raise("flag", "Specific names added — verify these are real");
  }

  // 4. Extreme metric claims
  const pctMatch = rewrittenBullet.match(/(\d+)%/g) ?? [];
  for (const m of pctMatch) {
    const num = parseInt(m.replace("%", ""), 10);
    if (num > 200) {
      raise("flag", `${num}% is an unusually large claim — make sure it's defensible`);
      break;
    }
  }

  const internAnalyst = isJunior || candidateProfile.stage === "junior" ||
    /\b(intern|analyst)\b/i.test(roleTitle);
  const billionMatch = rewrittenBullet.match(/\$[\d,.]+\s*[bB]/g);
  if (internAnalyst && billionMatch) {
    const numStr = billionMatch[0].replace(/[$,bB\s]/g, "");
    const num = parseFloat(numStr);
    if (num >= 1) {
      raise("flag", "Revenue figure above $1B is unusual for intern/analyst roles");
    }
  }

  // 5. Safe — shorter rewrite with no new factual claims
  if (
    maxRisk === "safe" &&
    rewrittenBullet.length <= originalBullet.length &&
    rewriteDollars.length <= origDollars.length &&
    newNames.length === 0
  ) {
    // Confirmed safe — no changes needed
  }

  const level = maxRisk as PlausibilityResult["riskLevel"];
  return {
    plausible: level !== "flag",
    warnings,
    riskLevel: level,
  };
}

/** Filter out common English phrases that look like proper nouns */
function isCommonPhrase(name: string): boolean {
  const common = new Set([
    "new york", "united states", "wall street", "private equity",
    "capital markets", "investment banking", "due diligence",
    "senior secured", "fixed income", "real estate",
  ]);
  return common.has(name);
}
