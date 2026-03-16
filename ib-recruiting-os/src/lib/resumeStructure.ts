export interface EnrichedLine {
  text: string;
  rawIndex: number;
  type: "blank" | "section-header" | "bullet" | "other";
  section: string;
  company: string;
  roleTitle: string;
  bulletIndex: number;
}

export function isResumeHeader(trimmed: string): boolean {
  return (
    trimmed.length < 60 &&
    (trimmed === trimmed.toUpperCase() ||
      /^(Education|Experience|Skills|Activities|Leadership|Projects|Summary|Objective|Work Experience|Extracurriculars)/i.test(
        trimmed
      ))
  );
}

export function enrichResumeLines(text: string): EnrichedLine[] {
  const raw = text.split("\n");
  const result: EnrichedLine[] = [];

  let currentSection = "";
  let currentCompany = "";
  let currentRoleTitle = "";
  let bulletIndexInCompany = 0;
  let lastWasBullet = false;

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

    if (isResumeHeader(trimmed)) {
      currentSection = trimmed;
      currentCompany = "";
      currentRoleTitle = "";
      bulletIndexInCompany = 0;
      lastWasBullet = false;
      result.push({
        text: line,
        rawIndex: i,
        type: "section-header",
        section: currentSection,
        company: currentCompany,
        roleTitle: currentRoleTitle,
        bulletIndex: -1,
      });
      continue;
    }

    if (/^[▪•\-·]/.test(trimmed)) {
      if (!lastWasBullet) bulletIndexInCompany = 0;
      result.push({
        text: line,
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

    if (!lastWasBullet) {
      if (!currentCompany) {
        currentCompany = trimmed;
        bulletIndexInCompany = 0;
      } else if (!currentRoleTitle) {
        currentRoleTitle = trimmed;
      } else {
        currentCompany = trimmed;
        currentRoleTitle = "";
        bulletIndexInCompany = 0;
      }
    }

    result.push({
      text: line,
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
