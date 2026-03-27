/**
 * resumeStructure.ts
 *
 * Resume text normalization and structural enrichment.
 * Handles PDF parsing artifacts (broken ordinals, split lines)
 * and identifies document structure (sections, companies, roles, bullets).
 */

export interface EnrichedLine {
  text: string;
  rawIndex: number;
  type: "blank" | "section-header" | "bullet" | "name" | "contact" | "company-line" | "role-line" | "sub-header" | "other";
  section: string;
  company: string;
  roleTitle: string;
  bulletIndex: number;
}

// ── Text Normalization ───────────────────────────────────────────────────────

/**
 * Fix common PDF parsing artifacts before structural analysis.
 * - Rejoin broken ordinals: "2\nnd" → "2nd", "1\nst" → "1st"
 * - Rejoin bullet continuation lines (non-bullet text after a bullet)
 * - Collapse orphan fragments (very short lines that are mid-sentence)
 */
export function normalizeResumeText(text: string): string {
  let lines = text.split("\n");

  // Pass 1: Rejoin broken ordinals/superscripts
  const ordinalSuffix = /^(st|nd|rd|th)\b/i;
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1]?.trim() ?? "";

    if (/\d\s*$/.test(line.trim()) && ordinalSuffix.test(next)) {
      result.push(line.trimEnd() + next);
      i++;
      continue;
    }

    result.push(line);
  }

  lines = result;

  // Pass 2: Rejoin continuation lines (after bullets OR after other continuations)
  // A continuation is a non-blank, non-bullet, non-header line that:
  // - starts with lowercase, OR
  // - starts with a common continuation word, OR
  // - is a short fragment
  // AND the previous line was a bullet or already-continued bullet
  const rejoined: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      rejoined.push(line);
      continue;
    }

    const prevIdx = rejoined.length - 1;
    if (prevIdx < 0) {
      rejoined.push(line);
      continue;
    }

    const prevLine = rejoined[prevIdx].trim();
    const prevIsBullet = /^[▪•\-·]/.test(prevLine);

    // Should this line be joined to the previous bullet?
    if (
      prevIsBullet &&
      !isResumeHeader(trimmed) &&
      !/^[▪•\-·]/.test(trimmed) &&
      isBulletContinuation(trimmed)
    ) {
      rejoined[prevIdx] = rejoined[prevIdx].trimEnd() + " " + trimmed;
      continue;
    }

    rejoined.push(line);
  }

  return rejoined.join("\n");
}

/**
 * Check if a line is a continuation of a bullet.
 * More aggressive than general continuation — if a line follows a bullet
 * and starts with lowercase or a continuation word, it's almost certainly
 * part of the same bullet (PDF wrapped it).
 */
function isBulletContinuation(trimmed: string): boolean {
  // Starts with lowercase — overwhelmingly a continuation
  if (/^[a-z]/.test(trimmed)) return true;
  // Starts with common continuation words (even capitalized after line break)
  if (/^(and|or|with|for|to|in|of|the|a|an|by|from|at|on|into|through|including|consisting|using|ending|resulting|averaging|securing|retaining|collaborating|justifying|translating)\b/i.test(trimmed)) return true;
  // Very short fragments that aren't headers or entry lines
  if (trimmed.length < 20 && !/[A-Z]{2,}/.test(trimmed) && !hasDatePattern(trimmed)) return true;
  return false;
}

// ── Header Detection ─────────────────────────────────────────────────────────

export function isResumeHeader(trimmed: string): boolean {
  return (
    trimmed.length < 60 &&
    (trimmed === trimmed.toUpperCase() ||
      /^(Education|Experience|Skills|Activities|Leadership|Projects|Summary|Objective|Work Experience|Extracurriculars)/i.test(
        trimmed
      ))
  );
}

// ── Date Pattern Detection ───────────────────────────────────────────────────

function hasDatePattern(text: string): boolean {
  return /\b(Spring|Summer|Fall|Winter|January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b/i.test(text)
    || /\b\d{4}\s*[-–—]\s*(Present|\d{4})\b/i.test(text)
    || /\b(Present|Current)\b/i.test(text);
}

/**
 * Try to split a line into left part and date part.
 */
function splitDateFromLine(text: string): [string, string] | null {
  const datePatterns = [
    /\s{2,}((Spring|Summer|Fall|Winter|January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}(?:\s*[-–—]\s*(?:Present|\d{4}|(?:Spring|Summer|Fall|Winter|January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}))?)$/i,
    /\s{2,}(Expected\s+(?:(?:Spring|Summer|Fall|Winter)\s+)?\d{4})$/i,
    /\s{2,}(\d{4}\s*[-–—]\s*(?:Present|\d{4}))$/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const dateStart = text.lastIndexOf(match[1]);
      return [text.slice(0, dateStart).trim(), match[1].trim()];
    }
  }

  const simpleDate = text.match(/\s((?:Spring|Summer|Fall|Winter|Expected)\s+\d{4}(?:\s*[-–—]\s*(?:Present|\d{4}))?)$/i);
  if (simpleDate) {
    const dateStart = text.lastIndexOf(simpleDate[1]);
    return [text.slice(0, dateStart).trim(), simpleDate[1].trim()];
  }

  // September 2025 – Present (month name with single space)
  const monthDate = text.match(/\s((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}(?:\s*[-–—]\s*(?:Present|\d{4}))?)$/i);
  if (monthDate) {
    const dateStart = text.lastIndexOf(monthDate[1]);
    const left = text.slice(0, dateStart).trim();
    if (left.length > 5) return [left, monthDate[1].trim()];
  }

  return null;
}

/**
 * Try to split a line into left part and location part.
 */
function splitLocationFromLine(text: string): [string, string] | null {
  // Match "City, ST" at end with multi-space separator
  const match = text.match(/\s{2,}([A-Z][a-zA-Z\s.]+,\s*[A-Z]{2})\s*$/);
  if (match) {
    const locStart = text.lastIndexOf(match[1]);
    return [text.slice(0, locStart).trim(), match[1].trim()];
  }

  // Single space before city if it's clearly "Name City, ST"
  const simpleMatch = text.match(/\s([A-Z][a-z]+(?:\s[A-Z][a-z]+)?,\s*[A-Z]{2})\s*$/);
  if (simpleMatch) {
    const locStart = text.lastIndexOf(simpleMatch[1]);
    const left = text.slice(0, locStart).trim();
    if (left.length > 10) return [left, simpleMatch[1].trim()];
  }

  return null;
}

// ── Smart Entry Detection ────────────────────────────────────────────────────

/**
 * Determine if a non-bullet line after bullets is actually a new company/entry
 * vs. a sub-header, continuation, or other non-structural text.
 *
 * A real company/entry line typically:
 * - Contains a location (City, ST) or date
 * - Is short-to-moderate length (not a full sentence)
 * - Doesn't end with sentence-like punctuation
 * - Doesn't start with lowercase
 */
function isNewEntryLine(trimmed: string): boolean {
  // Contains City, ST pattern — very likely an entry line
  if (/[A-Z][a-z]+,\s*[A-Z]{2}\b/.test(trimmed)) return true;
  // Contains a date pattern — very likely an entry line
  if (hasDatePattern(trimmed)) return true;
  // Short capitalized line that looks like an org name (no sentence punctuation)
  if (
    trimmed.length < 50 &&
    /^[A-Z]/.test(trimmed) &&
    !/[.!?;]$/.test(trimmed) &&
    !/^(and|or|with|for|to|in|of|the|by|from|at|on)\b/i.test(trimmed)
  ) {
    return true;
  }
  return false;
}

/**
 * Detect sub-headers like "Selected Companies:", "Brand Properties", etc.
 * These are indented sub-entries under a parent company (e.g., IDP program).
 */
function isSubHeader(trimmed: string): boolean {
  // Ends with colon — "Selected Companies:"
  if (/:\s*$/.test(trimmed)) return true;
  return false;
}

// ── Line Enrichment ──────────────────────────────────────────────────────────

export function enrichResumeLines(text: string): EnrichedLine[] {
  const normalized = normalizeResumeText(text);
  const raw = normalized.split("\n");
  const result: EnrichedLine[] = [];

  let currentSection = "";
  let currentCompany = "";
  let currentRoleTitle = "";
  let bulletIndexInCompany = 0;
  let lastWasBullet = false;
  let lineCount = 0;

  for (let i = 0; i < raw.length; i++) {
    const line = raw[i];
    const trimmed = line.trim();

    if (!trimmed) {
      result.push({
        text: line, rawIndex: i, type: "blank",
        section: currentSection, company: currentCompany,
        roleTitle: currentRoleTitle, bulletIndex: -1,
      });
      lastWasBullet = false;
      continue;
    }

    lineCount++;

    // Name (first non-blank line)
    if (lineCount === 1 && !currentSection) {
      result.push({
        text: trimmed, rawIndex: i, type: "name",
        section: "", company: "", roleTitle: "", bulletIndex: -1,
      });
      lastWasBullet = false;
      continue;
    }

    // Contact info (lines 2-3 before first section)
    if (lineCount <= 3 && !currentSection && isContactLine(trimmed)) {
      result.push({
        text: trimmed, rawIndex: i, type: "contact",
        section: "", company: "", roleTitle: "", bulletIndex: -1,
      });
      lastWasBullet = false;
      continue;
    }

    // Section header
    if (isResumeHeader(trimmed)) {
      currentSection = trimmed;
      currentCompany = "";
      currentRoleTitle = "";
      bulletIndexInCompany = 0;
      lastWasBullet = false;
      result.push({
        text: trimmed, rawIndex: i, type: "section-header",
        section: currentSection, company: "", roleTitle: "", bulletIndex: -1,
      });
      continue;
    }

    // Bullet
    if (/^[▪•\-·]/.test(trimmed)) {
      if (!lastWasBullet) bulletIndexInCompany = 0;
      result.push({
        text: trimmed, rawIndex: i, type: "bullet",
        section: currentSection, company: currentCompany,
        roleTitle: currentRoleTitle, bulletIndex: bulletIndexInCompany,
      });
      bulletIndexInCompany++;
      lastWasBullet = true;
      continue;
    }

    // ── Non-bullet lines after bullets ──
    // This is where the tricky cases live. Not every line after bullets is a new company.
    if (currentSection && lastWasBullet) {
      // Sub-header like "Selected Companies:"
      if (isSubHeader(trimmed)) {
        result.push({
          text: trimmed, rawIndex: i, type: "sub-header",
          section: currentSection, company: currentCompany,
          roleTitle: currentRoleTitle, bulletIndex: -1,
        });
        lastWasBullet = false;
        continue;
      }

      // Looks like a real new entry (has location, date, or is a short org name)
      if (isNewEntryLine(trimmed)) {
        currentCompany = trimmed;
        currentRoleTitle = "";
        bulletIndexInCompany = 0;
        result.push({
          text: trimmed, rawIndex: i, type: "company-line",
          section: currentSection, company: currentCompany,
          roleTitle: "", bulletIndex: -1,
        });
        lastWasBullet = false;
        continue;
      }

      // Otherwise it's probably a sub-entry name (like "Brand Properties" under IDP)
      // or a descriptive line — render as sub-header (not bold company)
      result.push({
        text: trimmed, rawIndex: i, type: "sub-header",
        section: currentSection, company: currentCompany,
        roleTitle: currentRoleTitle, bulletIndex: -1,
      });
      lastWasBullet = false;
      continue;
    }

    // ── Non-bullet lines NOT after bullets (company/role detection) ──
    if (currentSection) {
      if (!currentCompany) {
        currentCompany = trimmed;
        bulletIndexInCompany = 0;
        result.push({
          text: trimmed, rawIndex: i, type: "company-line",
          section: currentSection, company: currentCompany,
          roleTitle: "", bulletIndex: -1,
        });
      } else if (!currentRoleTitle) {
        currentRoleTitle = trimmed;
        result.push({
          text: trimmed, rawIndex: i, type: "role-line",
          section: currentSection, company: currentCompany,
          roleTitle: currentRoleTitle, bulletIndex: -1,
        });
      } else {
        // New company
        currentCompany = trimmed;
        currentRoleTitle = "";
        bulletIndexInCompany = 0;
        result.push({
          text: trimmed, rawIndex: i, type: "company-line",
          section: currentSection, company: currentCompany,
          roleTitle: "", bulletIndex: -1,
        });
      }
      lastWasBullet = false;
      continue;
    }

    // Fallback
    result.push({
      text: trimmed, rawIndex: i, type: "other",
      section: currentSection, company: currentCompany,
      roleTitle: currentRoleTitle, bulletIndex: -1,
    });
    lastWasBullet = false;
  }

  return result;
}

function isContactLine(text: string): boolean {
  return /(@|\.edu|\.com|\.org|\d{3}[-.)]\s?\d{3}|\|)/.test(text);
}

export { splitDateFromLine, splitLocationFromLine };
