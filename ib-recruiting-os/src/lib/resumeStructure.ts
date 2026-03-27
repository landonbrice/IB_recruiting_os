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
  type: "blank" | "section-header" | "bullet" | "name" | "contact" | "company-line" | "role-line" | "other";
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
  // Pattern: line ends with a number, next line is "st", "nd", "rd", "th" (possibly with more text)
  const ordinalSuffix = /^(st|nd|rd|th)\b/i;
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const next = lines[i + 1]?.trim() ?? "";

    // Check if this line ends with a digit and next starts with ordinal suffix
    if (/\d\s*$/.test(line.trim()) && ordinalSuffix.test(next)) {
      result.push(line.trimEnd() + next);
      i++; // skip the suffix line
      continue;
    }

    result.push(line);
  }

  lines = result;

  // Pass 2: Rejoin bullet continuation lines
  // A continuation is a non-blank, non-bullet, non-header line that follows a bullet
  // and starts with lowercase or is clearly a sentence fragment
  const rejoined: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      rejoined.push(line);
      continue;
    }

    // If previous line was a bullet and this line is a continuation
    const prevIdx = rejoined.length - 1;
    const prevLine = prevIdx >= 0 ? rejoined[prevIdx].trim() : "";
    const prevIsBullet = /^[▪•\-·]/.test(prevLine);

    if (
      prevIsBullet &&
      !isResumeHeader(trimmed) &&
      !/^[▪•\-·]/.test(trimmed) &&
      !isLikelyEntryLine(trimmed) &&
      isContinuation(trimmed)
    ) {
      // Append to previous bullet
      rejoined[prevIdx] = rejoined[prevIdx].trimEnd() + " " + trimmed;
      continue;
    }

    // Also rejoin if previous was already a continuation-appended bullet
    // and this line is still a continuation
    if (
      prevIdx >= 0 &&
      /^[▪•\-·]/.test(rejoined[prevIdx].trim()) &&
      !isResumeHeader(trimmed) &&
      !/^[▪•\-·]/.test(trimmed) &&
      !isLikelyEntryLine(trimmed) &&
      isContinuation(trimmed)
    ) {
      rejoined[prevIdx] = rejoined[prevIdx].trimEnd() + " " + trimmed;
      continue;
    }

    rejoined.push(line);
  }

  return rejoined.join("\n");
}

/** Check if a line looks like a continuation (starts lowercase, or is a fragment) */
function isContinuation(trimmed: string): boolean {
  // Starts with lowercase letter — very likely a continuation
  if (/^[a-z]/.test(trimmed)) return true;
  // Short fragment without ending punctuation that doesn't look like a header
  if (trimmed.length < 30 && !/[.!?]$/.test(trimmed) && trimmed !== trimmed.toUpperCase()) return true;
  // Starts with common continuation patterns
  if (/^(and|or|with|for|to|in|of|the|a|an|by|from|at|on|into|through|including|consisting|using)\b/i.test(trimmed)) return true;
  return false;
}

/** Check if a line looks like an experience entry line (company or role) */
function isLikelyEntryLine(trimmed: string): boolean {
  // Contains a date pattern
  if (hasDatePattern(trimmed)) return true;
  // Contains a city/state pattern
  if (/[A-Z][a-z]+,\s*[A-Z]{2}\b/.test(trimmed)) return true;
  // Looks like a company/org name (starts with capital, moderate length)
  if (/^[A-Z][A-Za-z\s&''.,-]+$/.test(trimmed) && trimmed.length < 60 && trimmed.length > 5) return true;
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
 * Returns [leftText, dateText] or null if no date found.
 * Handles: "Company Name  Summer 2025", "Title  Spring 2022 – Spring 2024"
 */
function splitDateFromLine(text: string): [string, string] | null {
  // Match date patterns at the end of the line
  const datePatterns = [
    // "Summer 2025", "Fall 2024 – Present", "Spring 2022 – Spring 2024"
    /\s{2,}((Spring|Summer|Fall|Winter|January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}(?:\s*[-–—]\s*(?:Present|\d{4}|(?:Spring|Summer|Fall|Winter|January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}))?)$/i,
    // "Expected Spring 2028", "Expected 2028"
    /\s{2,}(Expected\s+(?:(?:Spring|Summer|Fall|Winter)\s+)?\d{4})$/i,
    // Just a year range at end: "2022 – 2024"
    /\s{2,}(\d{4}\s*[-–—]\s*(?:Present|\d{4}))$/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const dateStart = text.lastIndexOf(match[1]);
      return [text.slice(0, dateStart).trim(), match[1].trim()];
    }
  }

  // Also try single space separator if the date is clearly at the end
  const simpleDate = text.match(/\s((?:Spring|Summer|Fall|Winter|Expected)\s+\d{4}(?:\s*[-–—]\s*(?:Present|\d{4}))?)$/i);
  if (simpleDate) {
    const dateStart = text.lastIndexOf(simpleDate[1]);
    return [text.slice(0, dateStart).trim(), simpleDate[1].trim()];
  }

  return null;
}

/**
 * Try to split a line into left part and location part.
 * Returns [leftText, locationText] or null if no location found.
 * Handles: "Company Name  City, ST", "University  Chicago, IL"
 */
function splitLocationFromLine(text: string): [string, string] | null {
  // Match "City, ST" or "City, State" at end with multi-space separator
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
    // Only split if left side is substantial
    if (left.length > 10) {
      return [left, simpleMatch[1].trim()];
    }
  }

  return null;
}

// ── Line Enrichment ──────────────────────────────────────────────────────────

export function enrichResumeLines(text: string): EnrichedLine[] {
  // Normalize first to fix PDF artifacts
  const normalized = normalizeResumeText(text);
  const raw = normalized.split("\n");
  const result: EnrichedLine[] = [];

  let currentSection = "";
  let currentCompany = "";
  let currentRoleTitle = "";
  let bulletIndexInCompany = 0;
  let lastWasBullet = false;
  let lineCount = 0; // count non-blank lines for name/contact detection

  for (let i = 0; i < raw.length; i++) {
    const line = raw[i];
    const trimmed = line.trim();

    if (!trimmed) {
      result.push({
        text: line,
        rawIndex: i,
        type: "blank",
        section: currentSection,
        company: currentCompany,
        roleTitle: currentRoleTitle,
        bulletIndex: -1,
      });
      lastWasBullet = false;
      continue;
    }

    lineCount++;

    // Name (first non-blank line, typically centered, often all-caps or Title Case)
    if (lineCount === 1 && !currentSection) {
      result.push({
        text: trimmed,
        rawIndex: i,
        type: "name",
        section: "",
        company: "",
        roleTitle: "",
        bulletIndex: -1,
      });
      lastWasBullet = false;
      continue;
    }

    // Contact info (lines 2-3 before first section, contain email/phone/address)
    if (lineCount <= 3 && !currentSection && isContactLine(trimmed)) {
      result.push({
        text: trimmed,
        rawIndex: i,
        type: "contact",
        section: "",
        company: "",
        roleTitle: "",
        bulletIndex: -1,
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
        text: trimmed,
        rawIndex: i,
        type: "section-header",
        section: currentSection,
        company: "",
        roleTitle: "",
        bulletIndex: -1,
      });
      continue;
    }

    // Bullet
    if (/^[▪•\-·]/.test(trimmed)) {
      if (!lastWasBullet) bulletIndexInCompany = 0;
      result.push({
        text: trimmed,
        rawIndex: i,
        type: "bullet",
        section: currentSection,
        company: currentCompany,
        roleTitle: currentRoleTitle,
        bulletIndex: bulletIndexInCompany,
      });
      bulletIndexInCompany++;
      lastWasBullet = true;
      continue;
    }

    // Non-bullet lines in a section: company or role
    if (currentSection && !lastWasBullet) {
      if (!currentCompany) {
        currentCompany = trimmed;
        bulletIndexInCompany = 0;
        result.push({
          text: trimmed,
          rawIndex: i,
          type: "company-line",
          section: currentSection,
          company: currentCompany,
          roleTitle: "",
          bulletIndex: -1,
        });
        lastWasBullet = false;
        continue;
      } else if (!currentRoleTitle) {
        currentRoleTitle = trimmed;
        result.push({
          text: trimmed,
          rawIndex: i,
          type: "role-line",
          section: currentSection,
          company: currentCompany,
          roleTitle: currentRoleTitle,
          bulletIndex: -1,
        });
        lastWasBullet = false;
        continue;
      } else {
        // New company
        currentCompany = trimmed;
        currentRoleTitle = "";
        bulletIndexInCompany = 0;
        result.push({
          text: trimmed,
          rawIndex: i,
          type: "company-line",
          section: currentSection,
          company: currentCompany,
          roleTitle: "",
          bulletIndex: -1,
        });
        lastWasBullet = false;
        continue;
      }
    }

    // After bullets, a non-bullet line is likely a new company
    if (currentSection && lastWasBullet) {
      currentCompany = trimmed;
      currentRoleTitle = "";
      bulletIndexInCompany = 0;
      result.push({
        text: trimmed,
        rawIndex: i,
        type: "company-line",
        section: currentSection,
        company: currentCompany,
        roleTitle: "",
        bulletIndex: -1,
      });
      lastWasBullet = false;
      continue;
    }

    // Fallback
    result.push({
      text: trimmed,
      rawIndex: i,
      type: "other",
      section: currentSection,
      company: currentCompany,
      roleTitle: currentRoleTitle,
      bulletIndex: -1,
    });
    lastWasBullet = false;
  }

  return result;
}

function isContactLine(text: string): boolean {
  return /(@|\.edu|\.com|\.org|\d{3}[-.)]\s?\d{3}|\|)/.test(text);
}

// Export split helpers for use in rendering
export { splitDateFromLine, splitLocationFromLine };
