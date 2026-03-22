"use client";

import { useState, useEffect } from "react";
import type { ResumeScore, FeasibilityScore, Message } from "@/lib/types";
import FeasibilityCard from "@/components/FeasibilityCard";

// ── Types ────────────────────────────────────────────────────────────────────

interface ActionSidebarProps {
  resumeScore: ResumeScore | null;
  feasibilityScore?: FeasibilityScore | null;
  resumeText: string | null;
  currentResumeText: string | null;
  isStreaming: boolean;
  mode: string;
  messages: Message[];
  onAction: (action: string) => void;
  scoreHistory?: { total: number; createdAt: number }[];
  onNewSession?: () => void;
  onExport?: () => void;
}

// ── Gauge helpers ─────────────────────────────────────────────────────────────

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function gaugeColor(total: number): string {
  if (total >= 80) return "#10b981"; // emerald
  if (total >= 60) return "#f59e0b"; // amber
  return "#ef4444"; // red
}

function scoreLabel(total: number): string {
  if (total >= 85) return "Strong";
  if (total >= 70) return "Solid";
  if (total >= 55) return "Developing";
  return "Needs Work";
}

// ── Guided outcomes helpers ───────────────────────────────────────────────────

const OUTCOMES_KEY = "ib_coach_outcomes_v1";

function loadChecked(): Set<string> {
  try {
    const raw = localStorage.getItem(OUTCOMES_KEY);
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

function saveChecked(items: Set<string>) {
  try {
    localStorage.setItem(OUTCOMES_KEY, JSON.stringify(Array.from(items)));
  } catch {/* */}
}

// Derive a "done criteria" readiness signal from mode history
function getReadinessSignal(
  mode: string,
  score: ResumeScore | null,
  messages: Message[]
): { label: string; color: string } {
  const hasScore = score !== null;
  const hasStory = messages.some((m) =>
    m.role === "assistant" &&
    (m.content.toLowerCase().includes("why ib") || m.content.includes("story-output"))
  );
  const hasNetworking = messages.some((m) =>
    m.role === "assistant" && m.content.includes("networking-actions")
  );

  if (hasScore && hasStory && hasNetworking) {
    return { label: "Ready for beta", color: "text-emerald-400" };
  }
  if (hasScore && (hasStory || hasNetworking)) {
    return { label: "Good progress", color: "text-amber-400" };
  }
  if (hasScore || mode !== "diagnostic") {
    return { label: "Getting there", color: "text-stone-400" };
  }
  return { label: "Just started", color: "text-stone-600" };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ActionSidebar({
  resumeScore,
  feasibilityScore,
  currentResumeText,
  isStreaming,
  mode,
  messages,
  onAction,
  scoreHistory = [],
  onNewSession,
  onExport,
}: ActionSidebarProps) {
  const [checkedIssues, setCheckedIssues] = useState<Set<string>>(() => loadChecked());
  const [showShareToast, setShowShareToast] = useState(false);

  // Persist checked issues
  useEffect(() => {
    saveChecked(checkedIssues);
  }, [checkedIssues]);

  function toggleIssue(issue: string) {
    setCheckedIssues((prev) => {
      const next = new Set(prev);
      if (next.has(issue)) next.delete(issue);
      else next.add(issue);
      return next;
    });
  }

  function handleShare() {
    if (!resumeScore) return;
    const text = [
      `IB Resume Score: ${resumeScore.total}/100 — ${scoreLabel(resumeScore.total)}`,
      `Top issue: ${resumeScore.hurting[0] ?? "N/A"}`,
      `Next step: ${resumeScore.nextStep}`,
      ``,
      `Built with IB Resume Coach`,
    ].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setShowShareToast(true);
      setTimeout(() => setShowShareToast(false), 2200);
    }).catch(() => {/* clipboard API unavailable */});
  }

  const readiness = getReadinessSignal(mode, resumeScore, messages);

  // Top 3 issues from score for guided outcomes
  const topIssues = resumeScore?.hurting.slice(0, 3) ?? [];
  const addressedCount = topIssues.filter((i) => checkedIssues.has(i)).length;

  return (
    <div className="flex h-full w-56 shrink-0 flex-col border-r border-stone-800 bg-stone-950">

      {/* ── Score Summary ───────────────────────────────────────────────── */}
      <div className="border-b border-stone-800 px-4 py-5">
        {resumeScore ? (
          <div className="flex flex-col items-center gap-1">
            <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
              <circle
                cx="50" cy="50" r={RADIUS}
                fill="none" stroke="#292524" strokeWidth="8"
              />
              <circle
                cx="50" cy="50" r={RADIUS}
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
              <span className="text-2xl font-bold text-stone-100">
                {resumeScore.total}
              </span>
              <span className="text-[10px] text-stone-500">/ 100</span>
            </div>
            <p className="mt-8 text-center text-[11px] font-medium" style={{ color: gaugeColor(resumeScore.total) }}>
              {scoreLabel(resumeScore.total)}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-stone-700">
              <span className="text-lg text-stone-600">?</span>
            </div>
            <p className="text-center text-[11px] text-stone-500">
              Score coming after intake…
            </p>
          </div>
        )}
      </div>

      {/* ── Score Trend ─────────────────────────────────────────────────── */}
      {scoreHistory.length > 1 && (
        <div className="border-b border-stone-800 px-4 py-3">
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
            Score Trend
          </h3>
          <div className="flex h-10 items-end gap-1">
            {scoreHistory.slice(-8).map((p, i, arr) => {
              const h = Math.max(8, Math.round((p.total / 100) * 36));
              const up = i > 0 && p.total > arr[i - 1].total;
              return (
                <div key={`${p.createdAt}-${i}`} className={`flex-1 rounded-t ${up ? "bg-emerald-500" : "bg-stone-600"}`} style={{ height: h }} />
              );
            })}
          </div>
          <p className="mt-1 text-[10px] text-stone-500">
            {scoreHistory[0]?.total} → {scoreHistory[scoreHistory.length - 1]?.total}
          </p>
        </div>
      )}

      {/* ── Guided Outcomes ─────────────────────────────────────────────── */}
      {topIssues.length > 0 && (
        <div className="border-b border-stone-800 px-4 py-4">
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
              Top Fixes
            </h3>
            {addressedCount > 0 && (
              <span className="text-[10px] text-emerald-500">
                {addressedCount}/{topIssues.length} done
              </span>
            )}
          </div>
          <ul className="space-y-1.5">
            {topIssues.map((issue) => {
              const done = checkedIssues.has(issue);
              return (
                <li key={issue}>
                  <button
                    onClick={() => {
                      toggleIssue(issue);
                      if (!done) onAction(`Let's work on improving: ${issue}`);
                    }}
                    disabled={isStreaming}
                    className={`flex w-full items-start gap-2 rounded px-1.5 py-1.5 text-left text-[11px] transition hover:bg-stone-800/60 disabled:opacity-50 ${
                      done ? "text-stone-600 line-through" : "text-stone-300"
                    }`}
                  >
                    <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                      done ? "bg-emerald-600" : "bg-red-500"
                    }`} />
                    {issue}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── What's Working ──────────────────────────────────────────────── */}
      {resumeScore && resumeScore.working.length > 0 && (
        <div className="border-b border-stone-800 px-4 py-4">
          <h3 className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
            Working Well
          </h3>
          <ul className="space-y-1.5">
            {resumeScore.working.map((item) => (
              <li key={item} className="flex items-start gap-2 px-1.5 text-[11px] text-stone-400">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Readiness / Done Criteria ────────────────────────────────────── */}
      <div className="border-b border-stone-800 px-4 py-3">
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-stone-500">
          Session Progress
        </h3>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-medium ${readiness.color}`}>
            {readiness.label}
          </span>
        </div>
        <div className="mt-2 space-y-1">
          <ReadinessItem
            label="Resume scored"
            done={resumeScore !== null}
          />
          <ReadinessItem
            label="Story developed"
            done={messages.some((m) => m.role === "assistant" &&
              (m.content.includes("story-output") ||
               m.content.toLowerCase().includes("crystallizing moment")))}
          />
          <ReadinessItem
            label="Networking plan"
            done={messages.some((m) => m.role === "assistant" &&
              m.content.includes("networking-actions"))}
          />
        </div>
      </div>

      {/* ── Feasibility Score ────────────────────────────────────────── */}
      {(feasibilityScore || resumeScore) && (
        <div className="border-b border-stone-800">
          <FeasibilityCard feasibilityScore={feasibilityScore ?? null} />
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* ── Tools ───────────────────────────────────────────────────────── */}
      <div className="border-t border-stone-800 px-3 py-3 space-y-1">
        <ToolButton
          onClick={() => onAction("Score my resume")}
          disabled={isStreaming}
          accent
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          }
        >
          Score Resume
        </ToolButton>

        <ToolButton
          onClick={() => onAction("Scan my resume for weak verbs and suggest replacements")}
          disabled={isStreaming}
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          }
        >
          Weak Verb Scan
        </ToolButton>

        <ToolButton
          onClick={() => onAction("Let's develop my Why-IB story — ask me one question at a time")}
          disabled={isStreaming}
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          }
        >
          Develop Story
        </ToolButton>

        <ToolButton
          onClick={() => onAction("Generate a cover letter based on everything we've discussed")}
          disabled={isStreaming}
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          }
        >
          Cover Letter
        </ToolButton>

        <ToolButton
          onClick={() => onAction("Give me a concrete networking action plan for this week — specific steps, not general advice")}
          disabled={isStreaming}
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          }
        >
          Networking Plan
        </ToolButton>

        {resumeScore && (
          <div className="relative">
            <ToolButton
              onClick={handleShare}
              icon={
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              }
            >
              Share Score
            </ToolButton>
            {showShareToast && (
              <div className="absolute bottom-full left-0 right-0 mb-1 rounded-md bg-emerald-900/80 px-2 py-1 text-center text-[10px] text-emerald-300">
                Copied to clipboard!
              </div>
            )}
          </div>
        )}

        <ToolButton
          onClick={onExport}
          disabled={!currentResumeText}
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          }
        >
          Export Pack
        </ToolButton>

        <ToolButton
          onClick={onNewSession}
          muted
          icon={
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          }
        >
          New Session
        </ToolButton>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ReadinessItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${done ? "bg-emerald-500" : "bg-stone-700"}`} />
      <span className={`text-[10px] ${done ? "text-stone-400" : "text-stone-700"}`}>
        {label}
      </span>
    </div>
  );
}

function ToolButton({
  children,
  onClick,
  disabled,
  icon,
  accent = false,
  muted = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  icon: React.ReactNode;
  accent?: boolean;
  muted?: boolean;
}) {
  const colorClass = accent
    ? "text-amber-400 hover:bg-amber-900/20"
    : muted
    ? "text-stone-600 hover:bg-stone-800/40 hover:text-stone-400"
    : "text-stone-300 hover:bg-stone-800/60";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition disabled:opacity-40 ${colorClass}`}
    >
      <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        {icon}
      </svg>
      {children}
    </button>
  );
}
