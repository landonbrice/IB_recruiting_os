"use client";

import { useEffect, useMemo, useState } from "react";
import ScoreCard from "./ScoreCard";
import BulletModal, { type SelectedBullet } from "./BulletModal";
import type { ResumeScore, CandidateProfile } from "@/lib/types";

interface ResumePanelProps {
  resumeText: string | null;
  fileName: string | null;
  resumeFile: File | null;
  resumeHtml: string | null;
  updateCount: number;
  resumeScore: ResumeScore | null;
  candidateProfile: CandidateProfile;
  onApplyBullet: (bulletIndex: number, company: string, newText: string) => void;
  onRequestScore: () => void;
}

// ── Enriched line types ───────────────────────────────────────────────────────

interface EnrichedLine {
  text: string;
  rawIndex: number;
  type: "blank" | "section-header" | "bullet" | "other";
  section: string;
  company: string;
  roleTitle: string;
  bulletIndex: number; // -1 for non-bullets
}

function isHeader(trimmed: string): boolean {
  return (
    trimmed.length < 60 &&
    (trimmed === trimmed.toUpperCase() ||
      /^(Education|Experience|Skills|Activities|Leadership|Projects|Summary|Objective|Work Experience|Extracurriculars)/i.test(
        trimmed
      ))
  );
}

function enrichLines(text: string): EnrichedLine[] {
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
      result.push({ text: line, rawIndex: i, type: "blank", section: currentSection, company: currentCompany, roleTitle: currentRoleTitle, bulletIndex: -1 });
      lastWasBullet = false;
      continue;
    }

    if (isHeader(trimmed)) {
      currentSection = trimmed;
      currentCompany = "";
      currentRoleTitle = "";
      bulletIndexInCompany = 0;
      lastWasBullet = false;
      result.push({ text: line, rawIndex: i, type: "section-header", section: currentSection, company: currentCompany, roleTitle: currentRoleTitle, bulletIndex: -1 });
      continue;
    }

    if (/^[▪•\-·]/.test(trimmed)) {
      if (!lastWasBullet) {
        // First bullet under a new company block — reset counter
        bulletIndexInCompany = 0;
      }
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

    // Non-bullet, non-header: treat as role title or company line
    // Heuristic: if previous line was a header or another role line and not bullet, it's probably a company/role line
    if (!lastWasBullet) {
      // Could be company name or role title — alternate assignment
      if (!currentCompany) {
        currentCompany = trimmed;
        bulletIndexInCompany = 0;
      } else if (!currentRoleTitle) {
        currentRoleTitle = trimmed;
      } else {
        // Likely a new company block
        currentCompany = trimmed;
        currentRoleTitle = "";
        bulletIndexInCompany = 0;
      }
    }

    result.push({ text: line, rawIndex: i, type: "other", section: currentSection, company: currentCompany, roleTitle: currentRoleTitle, bulletIndex: -1 });
    lastWasBullet = false;
  }

  return result;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ResumePanel({
  resumeText,
  fileName,
  resumeFile,
  resumeHtml,
  updateCount,
  resumeScore,
  candidateProfile,
  onApplyBullet,
  onRequestScore,
}: ResumePanelProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [liveMode, setLiveMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"resume" | "score">("resume");
  const [selectedBullet, setSelectedBullet] = useState<SelectedBullet | null>(null);

  // Create/revoke blob URL for PDFs
  useEffect(() => {
    if (resumeFile && resumeFile.name.toLowerCase().endsWith(".pdf")) {
      const url = URL.createObjectURL(resumeFile);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPdfUrl(null);
    }
  }, [resumeFile]);

  const enrichedLines = useMemo(
    () => (resumeText ? enrichLines(resumeText) : []),
    [resumeText]
  );

  if (!resumeText) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-stone-600">Resume will appear here</p>
      </div>
    );
  }

  // Determine which view to render in resume tab
  const showPdf = !!pdfUrl && !liveMode;
  const showHtml = !!resumeHtml && !liveMode;
  const showText = !showPdf && !showHtml;

  function handleBulletClick(el: EnrichedLine) {
    if (el.type !== "bullet" || !el.company) return;
    setSelectedBullet({
      text: el.text.trim(),
      section: el.section,
      company: el.company,
      roleTitle: el.roleTitle,
      bulletIndex: el.bulletIndex,
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* Panel header */}
      <div className="border-b border-stone-800 px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Tabs */}
            <button
              onClick={() => setActiveTab("resume")}
              className={`flex items-center gap-1.5 text-xs font-medium transition ${
                activeTab === "resume" ? "text-stone-200" : "text-stone-500 hover:text-stone-300"
              }`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Resume
            </button>
            <button
              onClick={() => setActiveTab("score")}
              className={`flex items-center gap-1.5 text-xs font-medium transition ${
                activeTab === "score" ? "text-stone-200" : "text-stone-500 hover:text-stone-300"
              }`}
            >
              Score
              {resumeScore !== null && (
                <span className="rounded-full bg-amber-900/50 px-1.5 py-0.5 text-xs font-semibold text-amber-400">
                  {resumeScore.total}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "resume" && (
              <>
                {updateCount > 0 && (
                  <span className="rounded-full bg-amber-900/40 px-2 py-0.5 text-xs text-amber-400">
                    {updateCount} edit{updateCount !== 1 ? "s" : ""} applied
                  </span>
                )}
                {fileName && (
                  <span className="truncate max-w-[140px] text-xs text-stone-600">{fileName}</span>
                )}
                {updateCount > 0 && (
                  <button
                    onClick={() => setLiveMode((v) => !v)}
                    className="text-xs text-stone-500 underline-offset-2 hover:text-stone-300 hover:underline"
                  >
                    {liveMode ? "View original" : "View edits"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      {activeTab === "resume" && (
        <div className="flex items-center gap-2 border-b border-stone-800 px-5 py-1.5">
          <button
            onClick={onRequestScore}
            className="rounded border border-amber-700/50 px-2.5 py-1 text-[11px] font-medium text-amber-400 transition hover:bg-amber-900/20"
          >
            Re-score
          </button>
          <button
            onClick={() => {
              if (!resumeText) return;
              const blob = new Blob([resumeText], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "resume.txt";
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="rounded border border-stone-700 px-2.5 py-1 text-[11px] font-medium text-stone-400 transition hover:bg-stone-800/60"
          >
            Export
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === "score" ? (
          resumeScore ? (
            <ScoreCard score={resumeScore} />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-stone-600">Ask Claude to score your resume to see results here.</p>
            </div>
          )
        ) : (
          <>
            {showPdf && (
              <iframe
                src={pdfUrl!}
                title="Resume"
                className="h-full w-full border-none"
              />
            )}

            {showHtml && (
              <div className="scrollable h-full bg-white px-10 py-8">
                <div
                  className="resume-html mx-auto max-w-[680px]"
                  dangerouslySetInnerHTML={{ __html: resumeHtml! }}
                />
              </div>
            )}

            {showText && (
              <div className="scrollable h-full bg-white px-8 py-8">
                <div className="resume-document mx-auto max-w-[680px]">
                  {enrichedLines.map((el) => renderEnrichedLine(el, handleBulletClick))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bullet editor modal */}
      {selectedBullet && (
        <BulletModal
          bullet={selectedBullet}
          candidateProfile={candidateProfile}
          resumeText={resumeText}
          onApply={onApplyBullet}
          onClose={() => setSelectedBullet(null)}
        />
      )}
    </div>
  );
}

// ── Enriched line renderer ────────────────────────────────────────────────────

function renderEnrichedLine(
  el: EnrichedLine,
  onBulletClick: (el: EnrichedLine) => void
) {
  const key = el.rawIndex;
  const trimmed = el.text.trim();

  if (el.type === "blank") {
    return <div key={key} className="h-2" />;
  }

  if (el.type === "section-header") {
    return (
      <h2
        key={key}
        className="mt-3 mb-1 border-b border-stone-300 pb-0.5 text-[10pt] font-bold uppercase tracking-wide text-stone-900"
      >
        {trimmed}
      </h2>
    );
  }

  if (el.type === "bullet") {
    const clickable = !!el.company;
    return (
      <p
        key={key}
        onClick={clickable ? () => onBulletClick(el) : undefined}
        title={clickable ? "Click to rewrite this bullet" : undefined}
        className={`mb-0.5 pl-4 text-[10pt] leading-snug text-stone-800 ${
          clickable
            ? "cursor-pointer rounded hover:bg-amber-100/60 transition-colors"
            : ""
        }`}
      >
        {trimmed}
      </p>
    );
  }

  // "other" lines — company/role/contact/header lines
  if (el.rawIndex === 0 || (el.rawIndex <= 2 && trimmed.length < 40)) {
    return (
      <p
        key={key}
        className={`text-center font-bold ${el.rawIndex === 0 ? "text-[14pt]" : "text-[10pt]"} text-stone-900`}
      >
        {trimmed}
      </p>
    );
  }

  return (
    <p key={key} className="mb-0.5 text-[10pt] leading-snug text-stone-800">
      {trimmed}
    </p>
  );
}
