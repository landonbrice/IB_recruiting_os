"use client";

import type { ResumeScore } from "@/lib/types";

interface ActionSidebarProps {
  resumeScore: ResumeScore | null;
  resumeText: string | null;
  currentResumeText: string | null;
  isStreaming: boolean;
  onAction: (action: string) => void;
}

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function gaugeColor(total: number): string {
  if (total >= 80) return "#10b981";
  if (total >= 60) return "#f59e0b";
  return "#ef4444";
}

export default function ActionSidebar({
  resumeScore,
  currentResumeText,
  isStreaming,
  onAction,
}: ActionSidebarProps) {
  function handleExport() {
    if (!currentResumeText) return;
    const blob = new Blob([currentResumeText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "resume.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full w-56 shrink-0 flex-col border-r border-stone-800 bg-stone-950">
      {/* Score Summary */}
      <div className="border-b border-stone-800 px-4 py-5">
        {resumeScore ? (
          <div className="flex flex-col items-center gap-1">
            <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
              <circle cx="50" cy="50" r={RADIUS} fill="none" stroke="#292524" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r={RADIUS}
                fill="none"
                stroke={gaugeColor(resumeScore.total)}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={CIRCUMFERENCE * (1 - resumeScore.total / 100)}
                style={{ transition: "stroke-dashoffset 0.6s ease" }}
              />
            </svg>
            <div className="-mt-[66px] flex flex-col items-center">
              <span className="text-2xl font-bold text-stone-100">{resumeScore.total}</span>
              <span className="text-[10px] text-stone-500">/ 100</span>
            </div>
            <p className="mt-8 text-center text-[11px] text-stone-400">
              Your resume scored <span className="font-semibold text-stone-200">{resumeScore.total}</span> out of 100
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-stone-700">
              <span className="text-lg text-stone-600">?</span>
            </div>
            <p className="text-center text-[11px] text-stone-500">Score coming after intake...</p>
          </div>
        )}
      </div>

      {/* Scrollable middle: fixes + working */}
      <div className="sidebar-scrollable flex-1 overflow-y-auto">
        {/* Top Fixes */}
        {resumeScore && resumeScore.hurting.length > 0 && (
          <div className="border-b border-stone-800 px-4 py-4">
            <h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-stone-500">Top Fixes</h3>
            <ul className="space-y-1">
              {resumeScore.hurting.map((item, i) => (
                <li key={i}>
                  <button
                    onClick={() => onAction(`Let's work on improving: ${item}`)}
                    disabled={isStreaming}
                    className="flex w-full items-start gap-2 rounded px-1.5 py-1.5 text-left text-[11px] text-stone-300 transition hover:bg-stone-800/60 disabled:opacity-50"
                  >
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* What's Working */}
        {resumeScore && resumeScore.working.length > 0 && (
          <div className="border-b border-stone-800 px-4 py-4">
            <h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-stone-500">Working Well</h3>
            <ul className="space-y-1.5">
              {resumeScore.working.map((item, i) => (
                <li key={i} className="flex items-start gap-2 px-1.5 text-[11px] text-stone-400">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Tools — pinned to bottom */}
      <div className="border-t border-stone-800 px-3 py-3 space-y-1.5">
        <button
          onClick={() => onAction("Score my resume")}
          disabled={isStreaming}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-amber-400 transition hover:bg-amber-900/20 disabled:opacity-40"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Score Resume
        </button>
        <button
          onClick={() => onAction("Scan my resume for weak verbs and suggest replacements")}
          disabled={isStreaming}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-stone-300 transition hover:bg-stone-800/60 disabled:opacity-40"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          Weak Verb Scan
        </button>
        <button
          onClick={() => onAction("Generate a cover letter based on everything we've discussed")}
          disabled={isStreaming}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-stone-300 transition hover:bg-stone-800/60 disabled:opacity-40"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Cover Letter
        </button>
        <button
          onClick={handleExport}
          disabled={!currentResumeText}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-stone-300 transition hover:bg-stone-800/60 disabled:opacity-40"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Resume
        </button>
      </div>
    </div>
  );
}
